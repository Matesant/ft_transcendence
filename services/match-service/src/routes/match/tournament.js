// services/match-service/src/routes/match/tournament.js

export default async function (fastify, opts) {
	fastify.get('/tournament', { preValidation: [fastify.authenticate] }, async (request, reply) => {
		const { alias } = request.user;
		
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

			return { rounds };
		} catch (err) {
			return reply.status(500).send({ error: 'Failed to retrieve tournament data' });
		}
	});
}
