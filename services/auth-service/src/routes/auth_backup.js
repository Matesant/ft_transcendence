import bcrypt from 'bcrypt'
import { send2FACode } from '../utils/mailer.js'

export default async function (fastify, opts) {
  fastify.post('/register', async (request, reply) => {
    request.log.info({ action: 'register_attempt', alias: request.body.alias }, 'User registration attempt')
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
		request.log.info({ action: 'register_success', alias, email }, 'User registration successful')
		return { success: true, alias }
    } catch (err) {
      request.log.error({ action: 'register_failed', alias, email, error: err.message }, 'User registration failed')
      return reply.status(409).send({ error: 'Alias or email already exists' })
    }
  })

  fastify.post('/2fa/request', async (request, reply) => {
    const { alias } = request.body
    request.log.info({ action: '2fa_request_attempt', alias }, 'User requesting 2FA code')
    
    const player = await fastify.db.get('SELECT * FROM players WHERE alias = ?', [alias])

    if (!player) {
      request.log.warn({ action: '2fa_request_failed', alias, reason: 'invalid_alias' }, 'Invalid alias for 2FA request')
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
      request.log.info({ action: '2fa_code_sent', alias, email: player.email }, '2FA code sent successfully')
      return { success: true, message: 'Code sent by email' }
    } catch (err) {
      request.log.error({ action: '2fa_code_send_failed', alias, error: err.message }, 'Failed to send 2FA code')
      return reply.status(500).send({ error: 'Error sending authentication code' })
    }
  })

  fastify.post('/2fa/verify', async (request, reply) => {
    const { alias, code } = request.body
    request.log.info({ action: '2fa_verify_attempt', alias }, 'User attempting 2FA verification')

    const record = await fastify.db.get(
      'SELECT * FROM two_factor_codes WHERE alias = ? AND code = ? ORDER BY created_at DESC LIMIT 1',
      [alias, code]
    )

    if (!record || new Date(record.expires_at) < new Date()) {
      request.log.warn({ action: '2fa_verify_failed', alias, reason: 'invalid_or_expired_code' }, 'Invalid or expired 2FA code')
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

    request.log.info({ action: '2fa_verify_success', alias, player_id: player.id }, '2FA verification successful')
    return { success: true, message: 'Authentication successful' }
  })

	fastify.post('/login', async (request, reply) => {
		const { alias, password } = request.body
		request.log.info({ action: 'login_attempt', alias }, 'User login attempt')
		
		if (!alias || !password) {
			request.log.warn({ action: 'login_failed', alias, reason: 'missing_credentials' }, 'Login failed: missing credentials')
			return reply.status(400).send({ error: 'Alias and password are required' })
		}

		const player = await fastify.db.get(
			'SELECT * FROM players WHERE alias = ?',
			[alias]
		)

		if (!player) {
			request.log.warn({ action: 'login_failed', alias, reason: 'invalid_alias' }, 'Login failed: invalid alias')
			return reply.status(401).send({ error: 'Invalid alias or password' })
		}

		if (player.is_2fa_enabled) {
			request.log.info({ action: 'login_2fa_required', alias, player_id: player.id }, 'Login requires 2FA')
			return { require2FA: true, message: '2FA required' }
		}

		const match = await bcrypt.compare(password, player.password)

		if (!match) {
			request.log.warn({ action: 'login_failed', alias, reason: 'invalid_password' }, 'Login failed: invalid password')
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

		request.log.info({ action: 'login_success', alias, player_id: player.id }, 'User login successful')
		return { success: true, message: 'Login successful' }
  })

    fastify.post('/2fa/enable', { preValidation: [fastify.authenticate] }, async (request, reply) => {
	  const { alias } = request.body
	  request.log.info({ action: '2fa_enable_attempt', alias, user_alias: request.user.alias }, 'User attempting to enable 2FA')

	  if (request.user.alias !== alias) {
		request.log.warn({ action: '2fa_enable_failed', alias, user_alias: request.user.alias, reason: 'unauthorized' }, 'Unauthorized 2FA enable attempt')
		return reply.status(403).send({ error: 'Not authorized' })
	}

	  await fastify.db.run(
		'UPDATE players SET is_2fa_enabled = 1 WHERE alias = ?',
		[alias]
	)

	  request.log.info({ action: '2fa_enable_success', alias }, '2FA enabled successfully')
	  return { success: true, message: '2FA enabled successfully.' }
	})


	fastify.post('/2fa/disable', { preValidation: [fastify.authenticate] }, async (request, reply) => {
	const { alias } = request.body
	request.log.info({ action: '2fa_disable_attempt', alias, user_alias: request.user.alias }, 'User attempting to disable 2FA')

	if (request.user.alias !== alias) {
		request.log.warn({ action: '2fa_disable_failed', alias, user_alias: request.user.alias, reason: 'unauthorized' }, 'Unauthorized 2FA disable attempt')
		return reply.status(403).send({ error: 'Not authorized' })
	}

	await fastify.db.run(
		'UPDATE players SET is_2fa_enabled = 0 WHERE alias = ?',
		[alias]
	)
	
	request.log.info({ action: '2fa_disable_success', alias }, '2FA disabled successfully')
	return { success: true, message: '2FA disabled successfully.' }
	})

	fastify.patch('/update-credentials', { preValidation: [fastify.authenticate] }, async (request, reply) => {
	const { alias } = request.user
	const { currentPassword, newPassword, newEmail } = request.body
	request.log.info({ action: 'update_credentials_attempt', alias, has_new_password: !!newPassword, has_new_email: !!newEmail }, 'User attempting to update credentials')

	if (!currentPassword) {
		request.log.warn({ action: 'update_credentials_failed', alias, reason: 'missing_current_password' }, 'Missing current password')
		return reply.status(400).send({ error: 'Current password is required' })
	}

	// Busca usuário
	const player = await fastify.db.get('SELECT * FROM players WHERE alias = ?', [alias])
	if (!player) {
		request.log.error({ action: 'update_credentials_failed', alias, reason: 'user_not_found' }, 'User not found during credential update')
		return reply.status(404).send({ error: 'User not found' })
	}

	// Confirma senha atual
	const isValid = await bcrypt.compare(currentPassword, player.password)
	if (!isValid) {
		request.log.warn({ action: 'update_credentials_failed', alias, reason: 'invalid_current_password' }, 'Invalid current password')
		return reply.status(401).send({ error: 'Invalid current password' })
	}

	// Verifica campos a atualizar
	const updates = []
	const values = []

	if (newPassword) {
		if (newPassword.length < 4) {
			request.log.warn({ action: 'update_credentials_failed', alias, reason: 'password_too_short' }, 'New password too short')
			return reply.status(400).send({ error: 'New password is too short' })
		}
		const hashed = await bcrypt.hash(newPassword, 10)
		updates.push('password = ?')
		values.push(hashed)
	}

	if (newEmail) {
		if (!newEmail.includes('@')) {
			request.log.warn({ action: 'update_credentials_failed', alias, reason: 'invalid_email' }, 'Invalid email format')
			return reply.status(400).send({ error: 'Invalid email' })
		}
		updates.push('email = ?')
		values.push(newEmail)
	}

	if (updates.length === 0) {
		request.log.warn({ action: 'update_credentials_failed', alias, reason: 'no_fields_to_update' }, 'No fields to update')
		return reply.status(400).send({ error: 'No fields to update' })
	}

	values.push(alias)

	// Executa update
	await fastify.db.run(
		`UPDATE players SET ${updates.join(', ')} WHERE alias = ?`,
		values
	)

	request.log.info({ action: 'update_credentials_success', alias, updated_fields: updates.map(u => u.split(' ')[0]) }, 'Credentials updated successfully')
	return { success: true, message: 'Credentials updated' }
	})

	fastify.get('/verify', async (request, reply) => {
		const token = request.cookies.authToken
		request.log.info({ action: 'verify_attempt', has_token: !!token }, 'User attempting to verify authentication')
		
		if (!token) {
			request.log.warn({ action: 'verify_failed', reason: 'no_token' }, 'No auth token provided')
			return reply.status(401).send({ authenticated: false, error: 'No authentication token' })
		}

		try {
			const decoded = fastify.jwt.verify(token)
			const player = await fastify.db.get('SELECT id, alias, email, is_2fa_enabled FROM players WHERE alias = ?', [decoded.alias])
			
			if (!player) {
				request.log.warn({ action: 'verify_failed', alias: decoded.alias, reason: 'user_not_found' }, 'User not found during verification')
				return reply.status(401).send({ authenticated: false, error: 'User not found' })
			}

			request.log.info({ action: 'verify_success', alias: decoded.alias, player_id: player.id }, 'Authentication verification successful')
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
			request.log.warn({ action: 'verify_failed', reason: 'invalid_token', error: err.message }, 'Invalid token during verification')
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
		
		request.log.info({ action: 'logout_attempt', alias }, 'User attempting to logout')
		
		reply.clearCookie('authToken', {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'strict',
			path: '/'
		})
		
		request.log.info({ action: 'logout_success', alias }, 'User logout successful')
		return { success: true, message: 'Logged out successfully' }
	})

}
