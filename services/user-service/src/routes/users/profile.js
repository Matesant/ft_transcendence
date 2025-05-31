// services/user-service/src/routes/users/profile.js

export default async function (fastify, opts) {
	// --- User Synchronization ---
	fastify.post('/sync', async (request, reply) => {
		const { alias } = request.body;
		
		if (!alias) {
			return reply.status(400).send({ error: 'Alias is required' });
		}
		
		await fastify.db.run(
			'INSERT OR IGNORE INTO user_profiles (alias) VALUES (?)',
			[alias]
		);
		
		return { success: true, message: `User profile created for ${alias}` };
	});

	// --- User Profile Management ---
	fastify.get('/me', { preValidation: [fastify.authenticate] }, async (request, reply) => {
		const { alias } = request.user;

		const profile = await fastify.db.get('SELECT * FROM user_profiles WHERE alias = ?', [alias]);
		if (!profile) {
			return reply.status(404).send({ error: 'User profile not found' });
		}

		return profile;
	});

	fastify.patch('/me', { preValidation: [fastify.authenticate] }, async (request, reply) => {
		const { alias } = request.user;
		const { display_name } = request.body;

		if (!display_name || display_name.length < 2) {
			return reply.status(400).send({ error: 'Invalid display name' });
		}

		await fastify.db.run(
			'UPDATE user_profiles SET display_name = ? WHERE alias = ?',
			[display_name, alias]
		);

		return { success: true, message: 'Display name updated' };
	});
}
