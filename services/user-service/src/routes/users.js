import fs from 'fs'
import path from 'path'

export default async function (fastify, opts) {
	fastify.post('/sync', async (request, reply) => {
		const { alias } = request.body
		
		if (!alias) {
			return reply.status(400).send({ error: 'Alias is required' })
		}
		
		await fastify.db.run(
			'INSERT OR IGNORE INTO user_profiles (alias) VALUES (?)',
			[alias]
		)
		
		return { success: true, message: `User profile created for ${alias}` }
	})
	
	fastify.get('/me', { preValidation: [fastify.authenticate] }, async (request, reply) => {
		const { alias } = request.user

		const profile = await fastify.db.get('SELECT * FROM user_profiles WHERE alias = ?', [alias])
		if (!profile) {
			return reply.status(404).send({ error: 'User profile not found' })
		}

		return profile
	})

	fastify.patch('/me', { preValidation: [fastify.authenticate] }, async (request, reply) => {
		const { alias } = request.user
		const { display_name } = request.body

		if (!display_name || display_name.length < 2) {
			return reply.status(400).send({ error: 'Invalid display name' })
		}

		await fastify.db.run(
			'UPDATE user_profiles SET display_name = ? WHERE alias = ?',
			[display_name, alias]
		)

		return { success: true, message: 'Display name updated' }
	})

	fastify.patch('/avatar', { preValidation: [fastify.authenticate] }, async (request, reply) => {
		const { alias } = request.user
		const { avatar } = request.body

		if (!avatar || typeof avatar !== 'string') {
			return reply.status(400).send({ error: 'Invalid avatar' })
		}

		await fastify.db.run(
			'UPDATE user_profiles SET avatar = ? WHERE alias = ?',
			[avatar, alias]
		)

		return { success: true, message: 'Avatar updated' }
	})


	fastify.post('/avatar', { preValidation: [fastify.authenticate] }, async (request, reply) => {
		const { alias } = request.user

		const data = await request.file()

		// Validação básica
		const allowedTypes = ['image/jpeg', 'image/png']
		if (!allowedTypes.includes(data.mimetype)) {
			return reply.status(400).send({ error: 'Only JPG or PNG files allowed' })
		}

		// Gera nome único para o arquivo
		const timestamp = Date.now()
		const ext = path.extname(data.filename)
		const filename = `${alias}-${timestamp}${ext}`
		const filepath = path.join('uploads', filename)

		// Cria pasta uploads se não existir
		if (!fs.existsSync('uploads')) fs.mkdirSync('uploads')

		// Salva o arquivo
		const stream = fs.createWriteStream(filepath)

		await new Promise((resolve, reject) => {
		data.file.pipe(stream)
			.on('finish', resolve)
			.on('error', reject)
		})


		// Atualiza caminho do avatar no banco
		await fastify.db.run(
			'UPDATE user_profiles SET avatar = ? WHERE alias = ?',
			[filepath, alias]
		)

		return { success: true, message: 'Avatar uploaded', path: filepath }
		})


}
