import { send2FACode } from '../../utils/mailer.js'

export default async function twoFactorRoutes(fastify, opts) {
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
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000 // 24 horas
    })

    return { success: true, message: 'Authentication successful' }
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
}
