import fs from 'fs'
import path from 'path'
import { getUserIdByAlias } from '../utils/get_user.js'

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

		fastify.post('/friends/add', { preValidation: [fastify.authenticate] }, async (request, reply) => {
			const { alias } = request.user
			const { friend } = request.body

			if (!friend || friend === alias) {
				return reply.status(400).send({ error: 'Invalid friend alias' })
			}

			const userId = await getUserIdByAlias(fastify, alias)
			const friendId = await getUserIdByAlias(fastify, friend)

			if (!friendId) return reply.status(404).send({ error: 'Friend not found' })

			await fastify.db.run(`
				INSERT INTO friends (user_id, friend_id, status) 
				VALUES (?, ?, 'pending')
			`, [userId, friendId])

			return { success: true, message: `Friend request sent to ${friend}` }
			})

		fastify.post('/friends/accept', { preValidation: [fastify.authenticate] }, async (request, reply) => {
			const { alias } = request.user
			const { from } = request.body

			const myId = await getUserIdByAlias(fastify, alias)
			const fromId = await getUserIdByAlias(fastify, from)

			if (!fromId) return reply.status(404).send({ error: 'User not found' })

			const existing = await fastify.db.get(`
				SELECT * FROM friends 
				WHERE user_id = ? AND friend_id = ? AND status = 'pending'
			`, [fromId, myId])

			if (!existing) return reply.status(400).send({ error: 'No pending request from this user' })

			// Atualiza a solicitação original
		await fastify.db.run(`
				UPDATE friends SET status = 'accepted' 
				WHERE user_id = ? AND friend_id = ?
			`, [fromId, myId])

			// Cria amizade recíproca
			await fastify.db.run(`
				INSERT INTO friends (user_id, friend_id, status) 
				VALUES (?, ?, 'accepted')
			`, [myId, fromId])

			return { success: true, message: 'Friend request accepted' }
			})

		fastify.get('/friends', { preValidation: [fastify.authenticate] }, async (request, reply) => {
			const { alias } = request.user
			const myId = await getUserIdByAlias(fastify, alias)

			const rows = await fastify.db.all(`
				SELECT u.alias, f.status
				FROM friends f
				JOIN user_profiles u ON u.id = f.friend_id
				WHERE f.user_id = ?
			`, [myId])

			return { friends: rows }
			})


}
