// services/match-service/src/routes/match/tournament.js

export default async function (fastify, opts) {
	fastify.post('/advance', { preValidation: [fastify.authenticate] }, async (request, reply) => {
		const { alias } = request.user;
		request.log.info({ action: 'tournament_advance_attempt', organizer: alias }, 'User attempting to advance tournament')
		
		try {
			const { last } = await fastify.db.get(`
				SELECT MAX(round) as last FROM matches
				WHERE status IN ('done', 'wo')
			`)

			if (!last) {
				request.log.info({ action: 'tournament_advance_failed', organizer: alias, reason: 'no_completed_round' }, 'No completed round yet')
				return reply.send({ message: 'No completed round yet' })
			}

			const winners = await fastify.db.all(`
				SELECT winner FROM matches
				WHERE round = ? AND status IN ('done', 'wo') AND winner IS NOT NULL
				ORDER BY created_at ASC
			`, [last])

			if (winners.length < 2) {
				request.log.info({ action: 'tournament_advance_failed', organizer: alias, reason: 'not_enough_winners', winners_count: winners.length }, 'Not enough winners to advance')
				return reply.send({ message: 'Not enough winners to advance' });
			}

			if (winners.length === 1) {
				const champion = winners[0].winner;
				request.log.info({ action: 'tournament_complete', organizer: alias, champion }, 'Tournament completed')
				return reply.send({
					message: `Tournament complete. Champion: ${champion}`
				})
			}

			const { r } = await fastify.db.get(`SELECT MAX(round) as r FROM matches`);
			const round = (r || 0) + 1;
			const matches = [];

			for (let i = 0; i < winners.length - 1; i += 2) {
				const p1 = winners[i].winner;
				const p2 = winners[i + 1].winner;
				await fastify.db.run('INSERT INTO matches (player1, player2, round, status) VALUES (?, ?, ?, ?)',
					[p1, p2, round, 'pending']);
				matches.push({ player1: p1, player2: p2 });
			}

			if (winners.length % 2 !== 0) {
				const wo = winners.at(-1).winner;
				await fastify.db.run(
					'INSERT INTO matches (player1, status, winner, round) VALUES (?, ?, ?, ?)',
					[wo, 'wo', wo, round]
				);
				matches.push({ wo });
			}

			request.log.info({ action: 'tournament_advance_success', organizer: alias, round, matches_created: matches.length, winners_count: winners.length }, 'Tournament advanced successfully')
			return { round, matches };
		} catch (err) {
			request.log.error({ action: 'tournament_advance_failed', organizer: alias, error: err.message }, 'Failed to advance tournament')
			return reply.status(500).send({ error: 'Failed to advance tournament' });
		}
	});

	fastify.get('/tournament', { preValidation: [fastify.authenticate] }, async (request, reply) => {
		const { alias } = request.user;
		request.log.info({ action: 'tournament_get_attempt', alias }, 'User requesting tournament data')
		
		try {
			const all = await fastify.db.all('SELECT * FROM matches ORDER BY round ASC, created_at ASC');
			const grouped = {};

			for (const m of all) {
				if (!grouped[m.round]) grouped[m.round] = [];
				grouped[m.round].push(m);
			}

			const rounds = Object.entries(grouped).map(([round, matches]) => ({
				round: Number(round),
				matches
			}));

			request.log.info({ action: 'tournament_get_success', alias, rounds_count: rounds.length, total_matches: all.length }, 'Tournament data retrieved successfully')
			return { rounds };
		} catch (err) {
			request.log.error({ action: 'tournament_get_failed', alias, error: err.message }, 'Failed to get tournament data')
			return reply.status(500).send({ error: 'Failed to retrieve tournament data' });
		}
	});
}
