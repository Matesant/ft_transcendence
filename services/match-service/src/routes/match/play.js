// services/match-service/src/routes/match/play.js
import { badRequest, notFound } from '../../utils/errors.js';

//#TODO validar o ganhador da partida pelo jogador perdedor(se fizermos websocket)

export default async function (fastify, opts) {
	fastify.get('/next', { preValidation: [fastify.authenticate] }, async (request, reply) => {
		const { alias } = request.user;
		request.log.info({ action: 'next_match_get_attempt', alias }, 'User requesting next match')
		
		try {
			const match = await fastify.db.get(`
				SELECT * FROM matches
				WHERE status = 'pending' AND player2 IS NOT NULL
				ORDER BY created_at ASC LIMIT 1
			`);

			if (!match) {
				request.log.info({ action: 'next_match_get_success', alias, result: 'no_matches' }, 'No more matches available')
				return { match: null, message: 'No more matches available' };
			}
			
			request.log.info({ action: 'next_match_get_success', alias, match_id: match.id, player1: match.player1, player2: match.player2 }, 'Next match retrieved successfully')
			return { match };
		} catch (err) {
			request.log.error({ action: 'next_match_get_failed', alias, error: err.message }, 'Failed to get next match')
			return reply.status(500).send({ error: 'Failed to get next match' });
		}
	});

	fastify.post('/score', { preValidation: [fastify.authenticate] }, async (request, reply) => {
		const { matchId, winner } = request.body;
		const { alias } = request.user;
		request.log.info({ action: 'match_score_attempt', scorer: alias, match_id: matchId, winner }, 'User attempting to score match')

		if (!matchId || !winner) {
			request.log.warn({ action: 'match_score_failed', scorer: alias, reason: 'missing_fields' }, 'Missing required fields for match scoring')
			return badRequest(reply, 'Fields "matchId" and "winner" are required.');
		}

		try {
			const match = await fastify.db.get('SELECT * FROM matches WHERE id = ?', [matchId]);

			if (!match) {
				request.log.warn({ action: 'match_score_failed', scorer: alias, match_id: matchId, reason: 'match_not_found' }, 'Match not found')
				return notFound(reply, 'Match not found.');
			}

			if (match.status !== 'pending') {
				request.log.warn({ action: 'match_score_failed', scorer: alias, match_id: matchId, reason: 'match_not_active', status: match.status }, 'Match is not active for scoring')
				return badRequest(reply, 'This match is not active for scoring.');
			}

			if (match.player1 !== winner && match.player2 !== winner) {
				request.log.warn({ action: 'match_score_failed', scorer: alias, match_id: matchId, winner, player1: match.player1, player2: match.player2, reason: 'invalid_winner' }, 'Winner must be one of the players')
				return badRequest(reply, 'Winner must be one of the players in this match.');
			}

			await fastify.db.run(`
				UPDATE matches SET winner = ?, status = 'done' WHERE id = ?
			`, [winner, matchId]);

			const opponent = (match.player1 === winner) ? match.player2 : match.player1

			try {
				await fetch('http://user-service:3003/users/history', {
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
					await fetch('http://user-service:3003/users/history', {
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
				request.log.error({ action: 'match_score_history_notification_failed', scorer: alias, match_id: matchId, error: err.message }, 'Failed to notify user-service')
			}

			request.log.info({ action: 'match_score_success', scorer: alias, match_id: matchId, winner, opponent }, 'Match scored successfully')
			return { success: true, matchId, winner };
		} catch (err) {
			request.log.error({ action: 'match_score_failed', scorer: alias, match_id: matchId, error: err.message }, 'Failed to score match')
			return reply.status(500).send({ error: 'Failed to score match' });
		}
	});
}
