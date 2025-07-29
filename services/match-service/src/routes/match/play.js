// services/match-service/src/routes/match/play.js
import { badRequest, notFound } from '../../utils/errors.js';
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

//#TODO validar o ganhador da partida pelo jogador perdedor(se fizermos websocket)

export default async function (fastify, opts) {
	fastify.get('/next', { preValidation: [fastify.authenticate] }, async (request, reply) => {
		const { alias } = request.user;
		
		try {
			// 1. Primeiro, verificar se há partidas pendentes disponíveis
			let match = await fastify.db.get(`
				SELECT * FROM matches
				WHERE status = 'pending' AND player2 IS NOT NULL
				ORDER BY created_at ASC LIMIT 1
			`);

			// 2. Se há partida disponível, retornar
			if (match) {
				return { match, message: 'Match ready to play' };
			}

			// 3. Se não há partidas, tentar avançar o torneio automaticamente
			console.log('No pending matches found. Attempting to advance tournament...');

			// 3.1. Encontrar a última rodada que existe
			const { maxRound } = await fastify.db.get(`
				SELECT MAX(round) as maxRound FROM matches
			`);

			if (!maxRound) {
				return { match: null, message: 'No matches exist yet. Tournament not started.' };
			}

			// 3.2. Verificar se TODAS as partidas da última rodada estão completas
			const roundMatches = await fastify.db.all(`
				SELECT * FROM matches
				WHERE round = ?
				ORDER BY created_at ASC
			`, [maxRound]);

			const pendingMatches = roundMatches.filter(m => m.status === 'pending');
			
			if (pendingMatches.length > 0) {
				return { 
					match: null, 
					message: `Round ${maxRound} is not complete yet. ${pendingMatches.length} matches pending.`,
					pendingMatches: pendingMatches.map(m => ({
						id: m.id,
						player1: m.player1,
						player2: m.player2
					}))
				};
			}

			// 3.3. Verificar se a próxima rodada já foi criada
			const nextRound = maxRound + 1;
			const { existingNextRound } = await fastify.db.get(`
				SELECT COUNT(*) as existingNextRound FROM matches
				WHERE round = ?
			`, [nextRound]);

			if (existingNextRound > 0) {
				// Próxima rodada já existe, mas não há partidas pendentes
				// Isso significa que todas as partidas da próxima rodada já foram jogadas
				return { 
					match: null, 
					message: `Round ${nextRound} already exists but no pending matches found.` 
				};
			}

			// 3.4. Buscar vencedores da última rodada
			const winners = await fastify.db.all(`
				SELECT winner FROM matches
				WHERE round = ? AND status IN ('done', 'wo') AND winner IS NOT NULL
				ORDER BY created_at ASC
			`, [maxRound]);

			if (winners.length === 0) {
				return { match: null, message: 'No winners found in the last round' };
			}

			// 3.5. Verificar se o torneio terminou (apenas 1 vencedor)
			if (winners.length === 1) {
				const champion = winners[0].winner;
				return {
					match: null,
					message: `🏆 Tournament complete! Champion: ${champion}`,
					champion: champion,
					finalRound: maxRound,
					tournamentComplete: true
				};
			}

			// 3.6. Criar partidas da próxima rodada automaticamente
			const newMatches = [];

			// Emparelhar vencedores de dois em dois
			for (let i = 0; i < winners.length - 1; i += 2) {
				const p1 = winners[i].winner;
				const p2 = winners[i + 1].winner;
				
				await fastify.db.run('INSERT INTO matches (player1, player2, round, status) VALUES (?, ?, ?, ?)',
					[p1, p2, nextRound, 'pending']);
				newMatches.push({ player1: p1, player2: p2 });
			}

			// 3.7. Se número ímpar de vencedores, último passa automaticamente (walkover)
			if (winners.length % 2 !== 0) {
				const wo = winners.at(-1).winner;
				await fastify.db.run(
					'INSERT INTO matches (player1, status, winner, round) VALUES (?, ?, ?, ?)',
					[wo, 'wo', wo, nextRound]
				);
				newMatches.push({ walkover: wo });
			}

			// 3.8. Agora tentar buscar a próxima partida disponível
			match = await fastify.db.get(`
				SELECT * FROM matches
				WHERE status = 'pending' AND player2 IS NOT NULL
				ORDER BY created_at ASC LIMIT 1
			`);

			if (match) {
				return { 
					match, 
					message: `🎾 Tournament advanced to round ${nextRound}! Next match ready.`,
					autoAdvanced: true,
					round: nextRound,
					newMatches: newMatches
				};
			} else {
				return { 
					match: null, 
					message: `🎾 Tournament advanced to round ${nextRound}, but no playable matches created.`,
					autoAdvanced: true,
					round: nextRound,
					newMatches: newMatches
				};
			}

		} catch (err) {
			console.error('Error in /next route:', err);
			return reply.status(500).send({ error: 'Failed to get next match or advance tournament' });
		}
	});

	fastify.post('/score', { preValidation: [fastify.authenticate] }, async (request, reply) => {
		const { matchId, winner } = request.body;
		const { alias } = request.user;

		if (!matchId || !winner) {
			return badRequest(reply, 'Fields "matchId" and "winner" are required.');
		}

		try {
			const match = await fastify.db.get('SELECT * FROM matches WHERE id = ?', [matchId]);

			if (!match) {
				return notFound(reply, 'Match not found.');
			}

			if (match.status !== 'pending') {
				return badRequest(reply, 'This match is not active for scoring.');
			}

			if (match.player1 !== winner && match.player2 !== winner) {
				return badRequest(reply, 'Winner must be one of the players in this match.');
			}

			await fastify.db.run(`
				UPDATE matches SET winner = ?, status = 'done' WHERE id = ?
			`, [winner, matchId]);

			const opponent = (match.player1 === winner) ? match.player2 : match.player1

			try {
				await fetch('https://user-service:3003/users/history', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						alias: winner,
						opponent,
						result: match.status === 'wo' ? 'wo' : 'win',
						date: new Date().toISOString()
					})
				})

				if (match.status !== 'wo' && opponent) {
					await fetch('https://user-service:3003/users/history', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							alias: opponent,
							opponent: winner,
							result: 'loss',
							date: new Date().toISOString()
						})
					})
				}
			} catch (err) {
			}

			return { success: true, matchId, winner };
		} catch (err) {
			return reply.status(500).send({ error: 'Failed to score match' });
		}
	});
}
