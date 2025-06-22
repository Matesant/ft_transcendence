// services/user-service/src/routes/users/public.js
import fs from 'fs';
import path from 'path';
import { getUserIdByAlias } from '../../utils/get_user.js';

export default async function (fastify, opts) {
	// --- Public Avatar Listing ---
	fastify.get('/avatars', async (request, reply) => {
		request.log.info({ action: 'avatars_list_attempt' }, 'Requesting available avatars list')
		
		try {
			const dir = path.join(process.cwd(), 'uploads');
			if (!fs.existsSync(dir)) {
				request.log.info({ action: 'avatars_list_success', count: 0, reason: 'uploads_dir_not_exists' }, 'No uploads directory found')
				return reply.send([]);
			}

			const files = fs.readdirSync(dir);
			const imageFiles = files.filter(f => /\.(png|jpe?g|gif)$/i.test(f));
			
			request.log.info({ action: 'avatars_list_success', count: imageFiles.length }, 'Available avatars list retrieved')
			return imageFiles;
		} catch (err) {
			request.log.error({ action: 'avatars_list_failed', error: err.message }, 'Failed to get avatars list')
			return reply.status(500).send({ error: 'Failed to get avatars list' });
		}
	});

	fastify.get('/:alias', { preValidation: [fastify.authenticate] }, async (request, reply) => {
		const targetAlias = request.params.alias
		const { alias: requesterAlias } = request.user
		request.log.info({ action: 'public_profile_get_attempt', requester: requesterAlias, target_alias: targetAlias }, 'User requesting public profile')

		try {
			// Search for profile
			const profile = await fastify.db.get(`
			SELECT alias, display_name, avatar
			FROM user_profiles
			WHERE alias = ?
			`, [targetAlias])

			if (!profile) {
				request.log.warn({ action: 'public_profile_get_failed', requester: requesterAlias, target_alias: targetAlias, reason: 'user_not_found' }, 'User not found for public profile')
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

			request.log.info({ action: 'public_profile_get_success', requester: requesterAlias, target_alias: targetAlias, history_count: history.length }, 'Public profile retrieved successfully')
			return {
				profile,
				history
			}
		} catch (err) {
			request.log.error({ action: 'public_profile_get_failed', requester: requesterAlias, target_alias: targetAlias, error: err.message }, 'Failed to get public profile')
			return reply.status(500).send({ error: 'Failed to retrieve public profile' });
		}
	})
}
