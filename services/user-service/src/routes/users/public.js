// services/user-service/src/routes/users/public.js
import fs from 'fs';
import path from 'path';
import { getUserIdByAlias } from '../../utils/get_user.js';

export default async function (fastify, opts) {
	// --- Public Avatar Listing ---
	fastify.get('/avatars', async (_, reply) => {
		const dir = path.join(process.cwd(), 'uploads');
		if (!fs.existsSync(dir)) return reply.send([]);

		const files = fs.readdirSync(dir);
		const imageFiles = files.filter(f => /\.(png|jpe?g|gif)$/i.test(f));
		return imageFiles;
	});

	fastify.get('/:alias', { preValidation: [fastify.authenticate] }, async (request, reply) => {
		const targetAlias = request.params.alias

		// Busca o perfil
		const profile = await fastify.db.get(`
		SELECT alias, display_name, avatar
		FROM user_profiles
		WHERE alias = ?
		`, [targetAlias])

		if (!profile) {
		return reply.status(404).send({ error: 'User not found' })
		}

		// Busca histórico de partidas
		const userId = await getUserIdByAlias(fastify, targetAlias)

		const history = await fastify.db.all(`
		SELECT opponent, result, date
		FROM match_history
		WHERE user_id = ?
		ORDER BY date DESC
		LIMIT 10
		`, [userId])

		return {
		profile,
		history
		}
	})
}
