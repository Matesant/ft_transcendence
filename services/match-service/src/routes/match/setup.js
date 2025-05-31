// services/match-service/src/routes/match/setup.js
import { badRequest } from '../../utils/errors.js';

export default async function (fastify, opts) {
	fastify.post('/', { preValidation: [fastify.authenticate] }, async (request, reply) => {
		const players = [...request.body.players]; // cria cópia segura
		for (let i = players.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[players[i], players[j]] = [players[j], players[i]];
		}

		if (!Array.isArray(players) || players.length < 2) {
			return badRequest(reply, 'Field "players" must be an array with at least 2 items.', 'Example: { "players": ["ana", "lucas"] }');
		}

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

		return { matches };
	});
}
