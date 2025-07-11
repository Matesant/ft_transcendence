// services/match-service/src/routes/match/play.js
import { badRequest, notFound } from '../../utils/errors.js';

//#TODO validar o ganhador da partida pelo jogador perdedor(se fizermos websocket)

export default async function (fastify, opts) {
	fastify.get('/next', { preValidation: [fastify.authenticate] }, async (request, reply) => {
		const { alias } = request.user;
		
		try {
			const match = await fastify.db.get(`
				SELECT * FROM matches
				WHERE status = 'pending' AND player2 IS NOT NULL
				ORDER BY created_at ASC LIMIT 1
			`);

			if (!match) {
				return { match: null, message: 'No more matches available' };
			}
			
			return { match };
		} catch (err) {
			return reply.status(500).send({ error: 'Failed to get next match' });
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
				await fetch('http://user-service:3000/users/history', {
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
					await fetch('http://user-service:3000/users/history', {
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
