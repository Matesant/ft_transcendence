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

		try {
			const userId = await getUserIdByAlias(fastify, alias);
			const friendId = await getUserIdByAlias(fastify, friend);

			if (!friendId) {
				return reply.status(404).send({ error: 'Friend not found' });
			}

			// Check if friendship already exists (in any direction)
			const existingFriendship = await fastify.db.get(`
				SELECT * FROM friends 
				WHERE (user_id = ? AND friend_id = ?) 
				OR (user_id = ? AND friend_id = ?)
			`, [userId, friendId, friendId, userId]);

			if (existingFriendship) {
				if (existingFriendship.status === 'accepted') {
					return reply.status(400).send({ error: 'You are already friends with this user' });
				} else if (existingFriendship.status === 'pending') {
					return reply.status(400).send({ error: 'Friend request already pending' });
				}
			}

			await fastify.db.run(`
				INSERT INTO friends (user_id, friend_id, status) 
				VALUES (?, ?, 'pending')
			`, [userId, friendId]);

			return { success: true, message: `Friend request sent to ${friend}` };
		} catch (err) {
			return reply.status(500).send({ error: 'Failed to send friend request' })
		}
	});

	fastify.post('/friends/accept', { preValidation: [fastify.authenticate] }, async (request, reply) => {
		const { alias } = request.user;
		const { from } = request.body;

		try {
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
		} catch (err) {
			return reply.status(500).send({ error: 'Failed to accept friend request' });
		}
	});

	fastify.get('/friends', { preValidation: [fastify.authenticate] }, async (request, reply) => {
		const { alias } = request.user;
		
		try {
			const myId = await getUserIdByAlias(fastify, alias);

			const rows = await fastify.db.all(`
				SELECT u.alias, f.status, u.is_online
				FROM friends f
				JOIN user_profiles u ON u.id = f.friend_id
				WHERE f.user_id = ?
			`, [myId]);

			return { friends: rows };
		} catch (err) {
			return reply.status(500).send({ error: 'Failed to retrieve friends list' });
		}
	});
	
	fastify.post('/friends/reject', { preValidation: [fastify.authenticate] }, async (request, reply) => {
		const { alias } = request.user;
		const { from } = request.body;

		try {
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
		} catch (err) {
			return reply.status(500).send({ error: 'Failed to reject friend request' });
		}
	});

	fastify.post('/friends/remove', { preValidation: [fastify.authenticate] }, async (request, reply) => {
		const { alias } = request.user;
		const { friend } = request.body;

		try {
			const myId = await getUserIdByAlias(fastify, alias);
			const friendId = await getUserIdByAlias(fastify, friend);

			if (!friendId) {
				return reply.status(404).send({ error: 'User not found' });
			}

			await fastify.db.run(`
				DELETE FROM friends 
				WHERE (user_id = ? AND friend_id = ?)
				OR (user_id = ? AND friend_id = ?)
			`, [myId, friendId, friendId, myId]);

			return { success: true, message: `Friendship with ${friend} removed.` };
		} catch (err) {
			return reply.status(500).send({ error: 'Failed to remove friend' });
		}
	});

	fastify.get('/friends/pending', { preValidation: [fastify.authenticate] }, async (request, reply) => {
		const { alias } = request.user;
		
		try {
			const myId = await getUserIdByAlias(fastify, alias);

			const rows = await fastify.db.all(`
				SELECT u.alias
				FROM friends f
				JOIN user_profiles u ON u.id = f.user_id
				WHERE f.friend_id = ? AND f.status = 'pending'
			`, [myId]);

			return { pending: rows };
		} catch (err) {
			return reply.status(500).send({ error: 'Failed to retrieve pending friend requests' });
		}
	});
}
