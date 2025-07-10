import { send2FACode } from '../../utils/mailer.js'

export default async function twoFactorRoutes(fastify, opts) {
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
}
