// services/user-service/src/routes/users/friends.js
import { getUserIdByAlias } from '../../utils/get_user.js';

export default async function (fastify, opts) {
	// --- Friend Management ---
	fastify.post('/friends/add', { preValidation: [fastify.authenticate] }, async (request, reply) => {
		const { alias } = request.user;
		const { friend } = request.body;

		if (!friend || friend === alias) {
			return reply.status(400).send({ error: 'Invalid friend alias' });
		}

		const userId = await getUserIdByAlias(fastify, alias);
		const friendId = await getUserIdByAlias(fastify, friend);

		if (!friendId) return reply.status(404).send({ error: 'Friend not found' });

		await fastify.db.run(`
			INSERT INTO friends (user_id, friend_id, status) 
			VALUES (?, ?, 'pending')
		`, [userId, friendId]);

		return { success: true, message: `Friend request sent to ${friend}` };
	});

	fastify.post('/friends/accept', { preValidation: [fastify.authenticate] }, async (request, reply) => {
		const { alias } = request.user;
		const { from } = request.body;

		const myId = await getUserIdByAlias(fastify, alias);
		const fromId = await getUserIdByAlias(fastify, from);

		if (!fromId) return reply.status(404).send({ error: 'User not found' });

		const existing = await fastify.db.get(`
			SELECT * FROM friends 
			WHERE user_id = ? AND friend_id = ? AND status = 'pending'
		`, [fromId, myId]);

		if (!existing) return reply.status(400).send({ error: 'No pending request from this user' });

		// Update the original request
		await fastify.db.run(`
			UPDATE friends SET status = 'accepted' 
			WHERE user_id = ? AND friend_id = ?
		`, [fromId, myId]);

		// Create reciprocal friendship
		await fastify.db.run(`
			INSERT INTO friends (user_id, friend_id, status) 
			VALUES (?, ?, 'accepted')
		`, [myId, fromId]);

		return { success: true, message: 'Friend request accepted' };
	});

	fastify.get('/friends', { preValidation: [fastify.authenticate] }, async (request, reply) => {
		const { alias } = request.user;
		const myId = await getUserIdByAlias(fastify, alias);

		const rows = await fastify.db.all(`
			SELECT u.alias, f.status
			FROM friends f
			JOIN user_profiles u ON u.id = f.friend_id
			WHERE f.user_id = ?
		`, [myId]);

		return { friends: rows };
	});
	
	fastify.post('/friends/reject', { preValidation: [fastify.authenticate] }, async (request, reply) => {
		const { alias } = request.user;
		const { from } = request.body;

		const myId = await getUserIdByAlias(fastify, alias);
		const fromId = await getUserIdByAlias(fastify, from);

		if (!fromId) {
			return reply.status(404).send({ error: 'User not found' });
		}

		const existing = await fastify.db.get(`
			SELECT * FROM friends 
			WHERE user_id = ? AND friend_id = ? AND status = 'pending'
		`, [fromId, myId]);

		if (!existing) {
			return reply.status(400).send({ error: 'No pending request from this user' });
		}

		await fastify.db.run(`
			DELETE FROM friends WHERE user_id = ? AND friend_id = ?
		`, [fromId, myId]);

		return { success: true, message: `Friend request from ${from} rejected.` };
	});

	fastify.post('/friends/remove', { preValidation: [fastify.authenticate] }, async (request, reply) => {
		const { alias } = request.user;
		const { friend } = request.body;

		const myId = await getUserIdByAlias(fastify, alias);
		const friendId = await getUserIdByAlias(fastify, friend);

		if (!friendId) return reply.status(404).send({ error: 'User not found' });

		await fastify.db.run(`
			DELETE FROM friends 
			WHERE (user_id = ? AND friend_id = ?)
			OR (user_id = ? AND friend_id = ?)
		`, [myId, friendId, friendId, myId]);

		return { success: true, message: `Friendship with ${friend} removed.` };
	});

	fastify.get('/friends/pending', { preValidation: [fastify.authenticate] }, async (request, reply) => {
		const { alias } = request.user;
		const myId = await getUserIdByAlias(fastify, alias);

		const rows = await fastify.db.all(`
			SELECT u.alias
			FROM friends f
			JOIN user_profiles u ON u.id = f.user_id
			WHERE f.friend_id = ? AND f.status = 'pending'
		`, [myId]);

		return { pending: rows };
	});
}
