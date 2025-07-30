// services/user-service/src/routes/users/avatar.js
import fs from 'fs';
import path from 'path';
import { readdir } from 'fs/promises';

const UPLOAD_DIR = 'uploads';

export default async function (fastify, opts) {
	// --- Avatar Management ---
	fastify.patch('/avatar', { preValidation: [fastify.authenticate] }, async (request, reply) => {
		const { alias } = request.user;
		const { avatar } = request.body;

		if (!avatar || typeof avatar !== 'string') {
			return reply.status(400).send({ error: 'Invalid avatar name' });
		}

		try {
			const avatarPath = `uploads/${avatar}`;

			await fastify.db.run(
				'UPDATE user_profiles SET avatar = ? WHERE alias = ?',
				[avatarPath, alias]
			);

			return { success: true, message: 'Avatar updated', path: avatarPath };
		} catch (err) {
			return reply.status(500).send({ error: 'Failed to update avatar' });
		}
	});

	fastify.post('/avatar', { preValidation: [fastify.authenticate] }, async (request, reply) => {
		const { alias } = request.user;

		try {
			const data = await request.file();

			// Basic validation
			const allowedTypes = ['image/jpeg', 'image/png'];
			if (!allowedTypes.includes(data.mimetype)) {
				return reply.status(400).send({ error: 'Only JPG or PNG files allowed' });
			}

			// Generate unique filename
			const timestamp = Date.now();
			const ext = path.extname(data.filename);
			const filename = `${alias}-${timestamp}${ext}`;
			const filepath = path.join(UPLOAD_DIR, filename);

			// Create uploads folder if it doesn't exist
			if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

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

			return { success: true, message: 'Avatar uploaded', path: filepath };
		} catch (err) {
			return reply.status(500).send({ error: 'Failed to upload avatar' });
		}
	});

	fastify.get('/avatars', async (request, reply) => {
    let files;
    try {
            files = await readdir(UPLOAD_DIR);
    } catch (err) {
            return reply.code(500).send({ error: 'Cannot read uploads directory' });
    }
    const images = files.filter(f => /\.(jpe?g|png)$/i.test(f));
    const urls = images.map(f => `https://${process.env.IP ? `${process.env.IP}:3003` : 'localhost:3003'}/uploads/${f}`);
    return { avatars: urls };
	});
}

