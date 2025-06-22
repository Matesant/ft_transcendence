// services/user-service/src/routes/users/friends.js
import { getUserIdByAlias } from '../../utils/get_user.js';

export default async function (fastify, opts) {
	// --- Friend Management ---
	fastify.post('/friends/add', { preValidation: [fastify.authenticate] }, async (request, reply) => {
		const { alias } = request.user;
		const { friend } = request.body;
		request.log.info({ action: 'friend_add_attempt', alias, friend_alias: friend }, 'User attempting to add friend')

		if (!friend || friend === alias) {
			request.log.warn({ action: 'friend_add_failed', alias, friend_alias: friend, reason: 'invalid_friend_alias' }, 'Invalid friend alias')
			return reply.status(400).send({ error: 'Invalid friend alias' });
		}

		try {
			const userId = await getUserIdByAlias(fastify, alias);
			const friendId = await getUserIdByAlias(fastify, friend);

			if (!friendId) {
				request.log.warn({ action: 'friend_add_failed', alias, friend_alias: friend, reason: 'friend_not_found' }, 'Friend not found')
				return reply.status(404).send({ error: 'Friend not found' });
			}

			await fastify.db.run(`
				INSERT INTO friends (user_id, friend_id, status) 
				VALUES (?, ?, 'pending')
			`, [userId, friendId]);

			request.log.info({ action: 'friend_add_success', alias, friend_alias: friend }, 'Friend request sent successfully')
			return { success: true, message: `Friend request sent to ${friend}` };
		} catch (err) {
			request.log.error({ action: 'friend_add_failed', alias, friend_alias: friend, error: err.message }, 'Failed to add friend')
			return reply.status(500).send({ error: 'Failed to send friend request' })
		}
	});

	fastify.post('/friends/accept', { preValidation: [fastify.authenticate] }, async (request, reply) => {
		const { alias } = request.user;
		const { from } = request.body;
		request.log.info({ action: 'friend_accept_attempt', alias, from_alias: from }, 'User attempting to accept friend request')

		try {
			const myId = await getUserIdByAlias(fastify, alias);
			const fromId = await getUserIdByAlias(fastify, from);

			if (!fromId) {
				request.log.warn({ action: 'friend_accept_failed', alias, from_alias: from, reason: 'user_not_found' }, 'User not found for friend accept')
				return reply.status(404).send({ error: 'User not found' });
			}

			const existing = await fastify.db.get(`
				SELECT * FROM friends 
				WHERE user_id = ? AND friend_id = ? AND status = 'pending'
			`, [fromId, myId]);

			if (!existing) {
				request.log.warn({ action: 'friend_accept_failed', alias, from_alias: from, reason: 'no_pending_request' }, 'No pending request from this user')
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

			request.log.info({ action: 'friend_accept_success', alias, from_alias: from }, 'Friend request accepted successfully')
			return { success: true, message: 'Friend request accepted' };
		} catch (err) {
			request.log.error({ action: 'friend_accept_failed', alias, from_alias: from, error: err.message }, 'Failed to accept friend request')
			return reply.status(500).send({ error: 'Failed to accept friend request' });
		}
	});

	fastify.get('/friends', { preValidation: [fastify.authenticate] }, async (request, reply) => {
		const { alias } = request.user;
		request.log.info({ action: 'friends_list_attempt', alias }, 'User requesting friends list')
		
		try {
			const myId = await getUserIdByAlias(fastify, alias);

			const rows = await fastify.db.all(`
				SELECT u.alias, f.status
				FROM friends f
				JOIN user_profiles u ON u.id = f.friend_id
				WHERE f.user_id = ?
			`, [myId]);

			request.log.info({ action: 'friends_list_success', alias, friends_count: rows.length }, 'Friends list retrieved successfully')
			return { friends: rows };
		} catch (err) {
			request.log.error({ action: 'friends_list_failed', alias, error: err.message }, 'Failed to get friends list')
			return reply.status(500).send({ error: 'Failed to retrieve friends list' });
		}
	});
	
	fastify.post('/friends/reject', { preValidation: [fastify.authenticate] }, async (request, reply) => {
		const { alias } = request.user;
		const { from } = request.body;
		request.log.info({ action: 'friend_reject_attempt', alias, from_alias: from }, 'User attempting to reject friend request')

		try {
			const myId = await getUserIdByAlias(fastify, alias);
			const fromId = await getUserIdByAlias(fastify, from);

			if (!fromId) {
				request.log.warn({ action: 'friend_reject_failed', alias, from_alias: from, reason: 'user_not_found' }, 'User not found for friend reject')
				return reply.status(404).send({ error: 'User not found' });
			}

			const existing = await fastify.db.get(`
				SELECT * FROM friends 
				WHERE user_id = ? AND friend_id = ? AND status = 'pending'
			`, [fromId, myId]);

			if (!existing) {
				request.log.warn({ action: 'friend_reject_failed', alias, from_alias: from, reason: 'no_pending_request' }, 'No pending request from this user')
				return reply.status(400).send({ error: 'No pending request from this user' });
			}

			await fastify.db.run(`
				DELETE FROM friends WHERE user_id = ? AND friend_id = ?
			`, [fromId, myId]);

			request.log.info({ action: 'friend_reject_success', alias, from_alias: from }, 'Friend request rejected successfully')
			return { success: true, message: `Friend request from ${from} rejected.` };
		} catch (err) {
			request.log.error({ action: 'friend_reject_failed', alias, from_alias: from, error: err.message }, 'Failed to reject friend request')
			return reply.status(500).send({ error: 'Failed to reject friend request' });
		}
	});

	fastify.post('/friends/remove', { preValidation: [fastify.authenticate] }, async (request, reply) => {
		const { alias } = request.user;
		const { friend } = request.body;
		request.log.info({ action: 'friend_remove_attempt', alias, friend_alias: friend }, 'User attempting to remove friend')

		try {
			const myId = await getUserIdByAlias(fastify, alias);
			const friendId = await getUserIdByAlias(fastify, friend);

			if (!friendId) {
				request.log.warn({ action: 'friend_remove_failed', alias, friend_alias: friend, reason: 'user_not_found' }, 'User not found for friend removal')
				return reply.status(404).send({ error: 'User not found' });
			}

			await fastify.db.run(`
				DELETE FROM friends 
				WHERE (user_id = ? AND friend_id = ?)
				OR (user_id = ? AND friend_id = ?)
			`, [myId, friendId, friendId, myId]);

			request.log.info({ action: 'friend_remove_success', alias, friend_alias: friend }, 'Friend removed successfully')
			return { success: true, message: `Friendship with ${friend} removed.` };
		} catch (err) {
			request.log.error({ action: 'friend_remove_failed', alias, friend_alias: friend, error: err.message }, 'Failed to remove friend')
			return reply.status(500).send({ error: 'Failed to remove friend' });
		}
	});

	fastify.get('/friends/pending', { preValidation: [fastify.authenticate] }, async (request, reply) => {
		const { alias } = request.user;
		request.log.info({ action: 'friends_pending_get_attempt', alias }, 'User requesting pending friend requests')
		
		try {
			const myId = await getUserIdByAlias(fastify, alias);

			const rows = await fastify.db.all(`
				SELECT u.alias
				FROM friends f
				JOIN user_profiles u ON u.id = f.user_id
				WHERE f.friend_id = ? AND f.status = 'pending'
			`, [myId]);

			request.log.info({ action: 'friends_pending_get_success', alias, pending_count: rows.length }, 'Pending friend requests retrieved successfully')
			return { pending: rows };
		} catch (err) {
			request.log.error({ action: 'friends_pending_get_failed', alias, error: err.message }, 'Failed to get pending friend requests')
			return reply.status(500).send({ error: 'Failed to retrieve pending friend requests' });
		}
	});
}
