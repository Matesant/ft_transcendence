export default async function (fastify, opts) {
	// Test route for logging
	fastify.get('/test-log', async (request, reply) => {
		request.log.info({ action: 'test_log', timestamp: new Date().toISOString() }, 'Test log message for user-service')
		return { 
			success: true, 
			message: 'Test log sent',
			timestamp: new Date().toISOString(),
			service: 'user-service'
		}
	})

	// --- User Synchronization ---
	fastify.post('/sync', async (request, reply) => {
		const { alias } = request.body;
		request.log.info({ action: 'user_sync_attempt', alias }, 'User sync attempt')
		
		if (!alias) {
			request.log.warn({ action: 'user_sync_failed', reason: 'missing_alias' }, 'User sync failed: missing alias')
			return reply.status(400).send({ error: 'Alias is required' });
		}
		
		try {
			await fastify.db.run(
				'INSERT OR IGNORE INTO user_profiles (alias) VALUES (?)',
				[alias]
			);
			
			request.log.info({ action: 'user_sync_success', alias }, 'User profile synchronized successfully')
			return { success: true, message: `User profile created for ${alias}` };
		} catch (err) {
			request.log.error({ action: 'user_sync_failed', alias, error: err.message }, 'User sync failed')
			return reply.status(500).send({ error: 'Failed to sync user profile' });
		}
	});

	// --- User Profile Management ---
	fastify.get('/me', { preValidation: [fastify.authenticate] }, async (request, reply) => {
		const { alias } = request.user;
		request.log.info({ action: 'profile_get_attempt', alias }, 'User requesting profile')

		try {
			const profile = await fastify.db.get('SELECT * FROM user_profiles WHERE alias = ?', [alias]);
			if (!profile) {
				request.log.warn({ action: 'profile_get_failed', alias, reason: 'not_found' }, 'User profile not found')
				return reply.status(404).send({ error: 'User profile not found' });
			}

			request.log.info({ action: 'profile_get_success', alias }, 'User profile retrieved successfully')
			return profile;
		} catch (err) {
			request.log.error({ action: 'profile_get_failed', alias, error: err.message }, 'Failed to get user profile')
			return reply.status(500).send({ error: 'Failed to retrieve profile' });
		}
	});

	fastify.patch('/me', { preValidation: [fastify.authenticate] }, async (request, reply) => {
		const { alias } = request.user;
		const { display_name } = request.body;
		request.log.info({ action: 'profile_update_attempt', alias, new_display_name: display_name }, 'User attempting to update profile')

		if (!display_name || display_name.length < 2) {
			request.log.warn({ action: 'profile_update_failed', alias, reason: 'invalid_display_name' }, 'Invalid display name provided')
			return reply.status(400).send({ error: 'Invalid display name' });
		}

		try {
			await fastify.db.run(
				'UPDATE user_profiles SET display_name = ? WHERE alias = ?',
				[display_name, alias]
			);

			request.log.info({ action: 'profile_update_success', alias, display_name }, 'Display name updated successfully')
			return { success: true, message: 'Display name updated' };
		} catch (err) {
			request.log.error({ action: 'profile_update_failed', alias, error: err.message }, 'Failed to update display name')
			return reply.status(500).send({ error: 'Failed to update display name' });
		}
	});
}
