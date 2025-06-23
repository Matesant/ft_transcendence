// services/user-service/src/routes/users/avatar.js
import fs from 'fs';
import path from 'path';

export default async function (fastify, opts) {
	// --- Avatar Management ---
	fastify.patch('/avatar', { preValidation: [fastify.authenticate] }, async (request, reply) => {
		const { alias } = request.user;
		const { avatar } = request.body;
		request.log.info({ action: 'avatar_update_attempt', alias, avatar_name: avatar }, 'User attempting to update avatar')

		if (!avatar || typeof avatar !== 'string') {
			request.log.warn({ action: 'avatar_update_failed', alias, reason: 'invalid_avatar_name' }, 'Invalid avatar name provided')
			return reply.status(400).send({ error: 'Invalid avatar name' });
		}

		try {
			const avatarPath = `uploads/${avatar}`;

			await fastify.db.run(
				'UPDATE user_profiles SET avatar = ? WHERE alias = ?',
				[avatarPath, alias]
			);

			request.log.info({ action: 'avatar_update_success', alias, avatar_path: avatarPath }, 'Avatar updated successfully')
			return { success: true, message: 'Avatar updated', path: avatarPath };
		} catch (err) {
			request.log.error({ action: 'avatar_update_failed', alias, error: err.message }, 'Failed to update avatar')
			return reply.status(500).send({ error: 'Failed to update avatar' });
		}
	});

	fastify.post('/avatar', { preValidation: [fastify.authenticate] }, async (request, reply) => {
		const { alias } = request.user;
		request.log.info({ action: 'avatar_upload_attempt', alias }, 'User attempting to upload avatar')

		try {
			const data = await request.file();

			// Basic validation
			const allowedTypes = ['image/jpeg', 'image/png'];
			if (!allowedTypes.includes(data.mimetype)) {
				request.log.warn({ action: 'avatar_upload_failed', alias, reason: 'invalid_file_type', mimetype: data.mimetype }, 'Invalid file type for avatar upload')
				return reply.status(400).send({ error: 'Only JPG or PNG files allowed' });
			}

			// Generate unique filename
			const timestamp = Date.now();
			const ext = path.extname(data.filename);
			const filename = `${alias}-${timestamp}${ext}`;
			const filepath = path.join('uploads', filename);

			// Create uploads folder if it doesn't exist
			if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');

			// Save the file
			const stream = fs.createWriteStream(filepath);

			await new Promise((resolve, reject) => {
				data.file.pipe(stream)
					.on('finish', resolve)
					.on('error', reject);
			});

			// Update avatar path in the database
			await fastify.db.run(
				'UPDATE user_profiles SET avatar = ? WHERE alias = ?',
				[filepath, alias]
			);

			request.log.info({ action: 'avatar_upload_success', alias, filepath, filename }, 'Avatar uploaded successfully')
			return { success: true, message: 'Avatar uploaded', path: filepath };
		} catch (err) {
			request.log.error({ action: 'avatar_upload_failed', alias, error: err.message }, 'Failed to upload avatar')
			return reply.status(500).send({ error: 'Failed to upload avatar' });
		}
	});
}
