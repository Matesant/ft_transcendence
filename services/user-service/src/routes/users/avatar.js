// services/user-service/src/routes/users/avatar.js
import fs from 'fs';
import path from 'path';

export default async function (fastify, opts) {
	// --- Avatar Management ---
	fastify.patch('/avatar', { preValidation: [fastify.authenticate] }, async (request, reply) => {
		const { alias } = request.user;
		const { avatar } = request.body;

		if (!avatar || typeof avatar !== 'string') {
			return reply.status(400).send({ error: 'Invalid avatar name' });
		}

		const avatarPath = `uploads/${avatar}`;

		await fastify.db.run(
			'UPDATE user_profiles SET avatar = ? WHERE alias = ?',
			[avatarPath, alias]
		);

		return { success: true, message: 'Avatar updated', path: avatarPath };
	});

	fastify.post('/avatar', { preValidation: [fastify.authenticate] }, async (request, reply) => {
		const { alias } = request.user;

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

		return { success: true, message: 'Avatar uploaded', path: filepath };
	});
}
