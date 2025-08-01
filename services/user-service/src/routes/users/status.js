// services/user-service/src/routes/users/status.js
import { getUserIdByAlias } from '../../utils/get_user.js';

export default async function (fastify, opts) {
	// Set user as online
	fastify.post('/status/online', { preValidation: [fastify.authenticate] }, async (request, reply) => {
		const { alias } = request.user;

		try {
			const userId = await getUserIdByAlias(fastify, alias);
			console.log(`Setting user ${alias} (ID: ${userId}) as online`);
			
			await fastify.db.run(`
				UPDATE user_profiles 
				SET is_online = 1 
				WHERE id = ?
			`, [userId]);

			// Verificar se a atualização funcionou
			const updatedUser = await fastify.db.get(`
				SELECT alias, is_online FROM user_profiles WHERE id = ?
			`, [userId]);
			console.log(`User updated:`, updatedUser);

			return { success: true, message: 'Status updated to online', user: updatedUser };
		} catch (err) {
			console.error('Error setting user online:', err);
			return reply.status(500).send({ error: 'Failed to update online status' });
		}
	});

	// Set user as offline
	fastify.post('/status/offline', { preValidation: [fastify.authenticate] }, async (request, reply) => {
		const { alias } = request.user;

		try {
			const userId = await getUserIdByAlias(fastify, alias);
			console.log(`Setting user ${alias} (ID: ${userId}) as offline`);
			
			await fastify.db.run(`
				UPDATE user_profiles 
				SET is_online = 0 
				WHERE id = ?
			`, [userId]);

			// Verificar se a atualização funcionou
			const updatedUser = await fastify.db.get(`
				SELECT alias, is_online FROM user_profiles WHERE id = ?
			`, [userId]);
			console.log(`User updated:`, updatedUser);

			return { success: true, message: 'Status updated to offline', user: updatedUser };
		} catch (err) {
			console.error('Error setting user offline:', err);
			return reply.status(500).send({ error: 'Failed to update offline status' });
		}
	});
}
