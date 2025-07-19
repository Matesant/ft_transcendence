// services/user-service/src/routes/users/public.js
import fs from 'fs';
import path from 'path';
import { getUserIdByAlias } from '../../utils/get_user.js';

export default async function (fastify, opts) {
	fastify.get('/:alias', { preValidation: [fastify.authenticate] }, async (request, reply) => {
		const targetAlias = request.params.alias
		const { alias: requesterAlias } = request.user

		try {
			// Search for profile
			const profile = await fastify.db.get(`
			SELECT alias, display_name, avatar
			FROM user_profiles
			WHERE alias = ?
			`, [targetAlias])

			if (!profile) {
				return reply.status(404).send({ error: 'User not found' })
			}

			// Search for match history
			const userId = await getUserIdByAlias(fastify, targetAlias)

			const history = await fastify.db.all(`
			SELECT opponent, result, date
			FROM match_history
			WHERE user_id = ?
			ORDER BY date DESC
			LIMIT 10
			`, [userId])

            const protocol = request.protocol;
            const host = request.headers.host;
            profile.avatar = `${protocol}://${host}/${profile.avatar}`;

			return {
				profile,
				history
			}
		} catch (err) {
			return reply.status(500).send({ error: 'Failed to retrieve public profile' });
		}
	})
}
