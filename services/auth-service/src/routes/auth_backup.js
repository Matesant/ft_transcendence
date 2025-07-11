import bcrypt from 'bcrypt'
import { send2FACode } from '../utils/mailer.js'

export default async function (fastify, opts) {
  fastify.post('/register', async (request, reply) => {
    const { alias, password, email } = request.body

    if (!alias || !password || !email) {
      return reply.status(400).send({ error: 'Alias, email and password are required' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    try {
		await fastify.db.run(
			'INSERT INTO players (alias, email, password) VALUES (?, ?, ?)',
			[alias, email, hashedPassword]
		)
		await fetch('http://user-service:3000/users/sync', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ alias })
		})
		return { success: true, alias }
    } catch (err) {
      return reply.status(409).send({ error: 'Alias or email already exists' })
    }
  })

  fastify.post('/2fa/request', async (request, reply) => {
    const { alias } = request.body
    
    const player = await fastify.db.get('SELECT * FROM players WHERE alias = ?', [alias])

    if (!player) {
      return reply.status(401).send({ error: 'Invalid alias' })
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString()

    await fastify.db.run(
      'INSERT INTO two_factor_codes (alias, code, expires_at) VALUES (?, ?, ?)',
      [alias, code, expiresAt]
    )

    try {
      await send2FACode(player.email, code)
      return { success: true, message: 'Code sent by email' }
    } catch (err) {
      return reply.status(500).send({ error: 'Error sending authentication code' })
    }
  })

  fastify.post('/2fa/verify', async (request, reply) => {
    const { alias, code } = request.body

    const record = await fastify.db.get(
      'SELECT * FROM two_factor_codes WHERE alias = ? AND code = ? ORDER BY created_at DESC LIMIT 1',
      [alias, code]
    )

    if (!record || new Date(record.expires_at) < new Date()) {
      return reply.status(401).send({ error: 'Invalid or expired code' })
    }

    await fastify.db.run('DELETE FROM two_factor_codes WHERE id = ?', [record.id])

    const player = await fastify.db.get('SELECT id FROM players WHERE alias = ?', [alias])
    const token = fastify.jwt.sign({ alias, id: player.id })

    reply.setCookie('authToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    })

    return { success: true, message: 'Authentication successful' }
  })

	fastify.post('/login', async (request, reply) => {
		const { alias, password } = request.body
		
		if (!alias || !password) {
			return reply.status(400).send({ error: 'Alias and password are required' })
		}

		const player = await fastify.db.get(
			'SELECT * FROM players WHERE alias = ?',
			[alias]
		)

		if (!player) {
			return reply.status(401).send({ error: 'Invalid alias or password' })
		}

		if (player.is_2fa_enabled) {
			return { require2FA: true, message: '2FA required' }
		}

		const match = await bcrypt.compare(password, player.password)

		if (!match) {
			return reply.status(401).send({ error: 'Invalid alias or password' })
		}

		const token = fastify.jwt.sign({ alias: player.alias, id: player.id })
		
		reply.setCookie('authToken', token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'strict',
			path: '/',
			maxAge: 24 * 60 * 60 * 1000 // 24 hours
		})

		return { success: true, message: 'Login successful' }
  })

    fastify.post('/2fa/enable', { preValidation: [fastify.authenticate] }, async (request, reply) => {
	  const { alias } = request.body

	  if (request.user.alias !== alias) {
		return reply.status(403).send({ error: 'Not authorized' })
	}

	  await fastify.db.run(
		'UPDATE players SET is_2fa_enabled = 1 WHERE alias = ?',
		[alias]
	)

	  return { success: true, message: '2FA enabled successfully.' }
	})


	fastify.post('/2fa/disable', { preValidation: [fastify.authenticate] }, async (request, reply) => {
	const { alias } = request.body

	if (request.user.alias !== alias) {
		return reply.status(403).send({ error: 'Not authorized' })
	}

	await fastify.db.run(
		'UPDATE players SET is_2fa_enabled = 0 WHERE alias = ?',
		[alias]
	)
	
	return { success: true, message: '2FA disabled successfully.' }
	})

	fastify.patch('/update-credentials', { preValidation: [fastify.authenticate] }, async (request, reply) => {
	const { alias } = request.user
	const { currentPassword, newPassword, newEmail } = request.body

	if (!currentPassword) {
		return reply.status(400).send({ error: 'Current password is required' })
	}

	// Busca usuário
	const player = await fastify.db.get('SELECT * FROM players WHERE alias = ?', [alias])
	if (!player) {
		return reply.status(404).send({ error: 'User not found' })
	}

	// Confirma senha atual
	const isValid = await bcrypt.compare(currentPassword, player.password)
	if (!isValid) {
		return reply.status(401).send({ error: 'Invalid current password' })
	}

	// Verifica campos a atualizar
	const updates = []
	const values = []

	if (newPassword) {
		if (newPassword.length < 4) {
			return reply.status(400).send({ error: 'New password is too short' })
		}
		const hashed = await bcrypt.hash(newPassword, 10)
		updates.push('password = ?')
		values.push(hashed)
	}

	if (newEmail) {
		if (!newEmail.includes('@')) {
			return reply.status(400).send({ error: 'Invalid email' })
		}
		updates.push('email = ?')
		values.push(newEmail)
	}

	if (updates.length === 0) {
		return reply.status(400).send({ error: 'No fields to update' })
	}

	values.push(alias)

	// Executa update
	await fastify.db.run(
		`UPDATE players SET ${updates.join(', ')} WHERE alias = ?`,
		values
	)

	return { success: true, message: 'Credentials updated' }
	})

	fastify.get('/verify', async (request, reply) => {
		const token = request.cookies.authToken
		
		if (!token) {
			return reply.status(401).send({ authenticated: false, error: 'No authentication token' })
		}

		try {
			const decoded = fastify.jwt.verify(token)
			const player = await fastify.db.get('SELECT id, alias, email, is_2fa_enabled FROM players WHERE alias = ?', [decoded.alias])
			
			if (!player) {
				return reply.status(401).send({ authenticated: false, error: 'User not found' })
			}

			return { 
				authenticated: true, 
				user: { 
					id: player.id, 
					alias: player.alias, 
					email: player.email, 
					is_2fa_enabled: player.is_2fa_enabled 
				} 
			}
		} catch (err) {
			return reply.status(401).send({ authenticated: false, error: 'Invalid token' })
		}
	})

	fastify.post('/logout', async (request, reply) => {
		const token = request.cookies.authToken
		const alias = token ? (() => {
			try {
				return fastify.jwt.verify(token).alias
			} catch {
				return 'unknown'
			}
		})() : 'unknown'
		
		
		reply.clearCookie('authToken', {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'strict',
			path: '/'
		})
		
		return { success: true, message: 'Logged out successfully' }
	})

}
