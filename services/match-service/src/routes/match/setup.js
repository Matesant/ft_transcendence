// services/match-service/src/routes/match/setup.js
import { badRequest } from '../../utils/errors.js';

export default async function (fastify, opts) {
	// Test route for logging
	fastify.get('/test-log', async (request, reply) => {
		request.log.info({ test: true, timestamp: new Date().toISOString() }, 'Test log message for match-service')
		return { 
			success: true, 
			message: 'Test log sent',
			timestamp: new Date().toISOString(),
			service: 'match-service'
		}
	})

	fastify.post('/', { preValidation: [fastify.authenticate] }, async (request, reply) => {
		const players = [...request.body.players]; // creates safe copy
		const { alias } = request.user;
		request.log.info({ action: 'match_setup_attempt', organizer: alias, player_count: players.length }, 'User attempting to setup matches')
		
		// Shuffle players array
		for (let i = players.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[players[i], players[j]] = [players[j], players[i]];
		}

		if (!Array.isArray(players) || players.length < 2) {
			request.log.warn({ action: 'match_setup_failed', organizer: alias, reason: 'invalid_players_array', player_count: players?.length || 0 }, 'Invalid players array')
			return badRequest(reply, 'Field "players" must be an array with at least 2 items.', 'Example: { "players": ["ana", "lucas"] }');
		}

		try {
			await fastify.db.run('DELETE FROM matches');
			const matches = [];

			for (let i = 0; i < players.length - 1; i += 2) {
				const p1 = players[i];
				const p2 = players[i + 1];
				await fastify.db.run(
					'INSERT INTO matches (player1, player2, round, status) VALUES (?, ?, ?, ?)',
					[p1, p2, 1, 'pending']
				);
				matches.push({ player1: p1, player2: p2 });
			}

			if (players.length % 2 !== 0) {
				const wo = players.at(-1);
				await fastify.db.run(
					'INSERT INTO matches (player1, status, winner, round) VALUES (?, ?, ?, ?)',
					[wo, 'wo', wo, 1]
				);
				matches.push({ wo });
			}

			request.log.info({ action: 'match_setup_success', organizer: alias, matches_created: matches.length, player_count: players.length }, 'Match setup completed successfully')
			return { matches };
		} catch (err) {
			request.log.error({ action: 'match_setup_failed', organizer: alias, error: err.message }, 'Failed to setup matches')
			return reply.status(500).send({ error: 'Failed to setup matches' })
		}
	});
}
