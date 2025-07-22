import { getUserIdByAlias } from '../../utils/get_user.js'

export default async function (fastify, opts) {
	// --- User Synchronization ---
	fastify.post('/sync', async (request, reply) => {
		const { alias } = request.body;
		
		if (!alias) {
			return reply.status(400).send({ error: 'Alias is required' });
		}
		
		try {
			await fastify.db.run(
				'INSERT OR IGNORE INTO user_profiles (alias) VALUES (?)',
				[alias]
			);
			
			return { success: true, message: `User profile created for ${alias}` };
		} catch (err) {
			return reply.status(500).send({ error: 'Failed to sync user profile' });
		}
	});

	// --- User Profile Management ---
	fastify.get('/me', { preValidation: [fastify.authenticate] }, async (request, reply) => {
		const { alias } = request.user;

		try {
			const profile = await fastify.db.get('SELECT * FROM user_profiles WHERE alias = ?', [alias]);
			if (!profile) {
				return reply.status(404).send({ error: 'User profile not found' });
			}

			if (profile.avatar) {
				const protocol = request.protocol;
				const host = request.headers.host;
				profile.avatar = `${protocol}://${host}/${profile.avatar}`;
			}

			const userId = await getUserIdByAlias(fastify, alias);
			let history = [];
			
			if (userId) {
				history = await fastify.db.all(`
					SELECT opponent, result, date FROM match_history
					WHERE user_id = ?
					ORDER BY date DESC
				`, [userId]);
			}

			return { profile, history };
		} catch (err) {
			return reply.status(500).send({ error: 'Failed to retrieve profile' });
		}
	});

	fastify.patch('/me', { preValidation: [fastify.authenticate] }, async (request, reply) => {
		const { alias } = request.user;
		const { display_name } = request.body;

		if (!display_name || display_name.length < 2) {
			return reply.status(400).send({ error: 'Invalid display name' });
		}

		try {
			await fastify.db.run(
				'UPDATE user_profiles SET display_name = ? WHERE alias = ?',
				[display_name, alias]
			);

			return { success: true, message: 'Display name updated' };
		} catch (err) {
			return reply.status(500).send({ error: 'Failed to update display name' });
		}
	});
}
