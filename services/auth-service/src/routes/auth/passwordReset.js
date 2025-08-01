import { send2FACode } from '../../utils/mailer.js'

export default async function passwordResetRoutes(fastify, opts) {
  fastify.post('/password/request-reset', async (request, reply) => {
    const { alias } = request.body
    
    if (!alias) {
      return reply.status(400).send({ error: 'Alias is required' })
    }

    const player = await fastify.db.get('SELECT * FROM players WHERE alias = ?', [alias])

    if (!player) {
      return { success: true, message: 'If the user exists, a reset code has been sent to the email' }
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 minutos

    await fastify.db.run(
      'DELETE FROM password_reset_codes WHERE alias = ?',
      [alias]
    )

    await fastify.db.run(
      'INSERT INTO password_reset_codes (alias, code, expires_at) VALUES (?, ?, ?)',
      [alias, code, expiresAt]
    )

    try {
      await send2FACode(player.email, code, 'Password Reset Code')
      return { success: true, message: 'Reset code sent to your email' }
    } catch (err) {
      console.error('Error sending reset code:', err)
      return reply.status(500).send({ error: 'Error sending reset code' })
    }
  })

  fastify.post('/password/reset', async (request, reply) => {
    const { alias, code, newPassword, confirmPassword } = request.body

    if (!alias || !code || !newPassword || !confirmPassword) {
      return reply.status(400).send({ error: 'Alias, code, new password and confirm password are required' })
    }

    if (newPassword !== confirmPassword) {
      return reply.status(400).send({ error: 'Passwords do not match' })
    }

    if (!validatePassword(newPassword)) {
      return reply.status(400).send({ error: 'Invalid password format' })
    }

    const record = await fastify.db.get(
      'SELECT * FROM password_reset_codes WHERE alias = ? AND code = ? ORDER BY created_at DESC LIMIT 1',
      [alias, code]
    )

    if (!record || new Date(record.expires_at) < new Date()) {
      return reply.status(401).send({ error: 'Invalid or expired reset code' })
    }

    try {
      const bcrypt = await import('bcrypt')
      const hashedPassword = await bcrypt.hash(newPassword, 10)

      await fastify.db.run(
        'UPDATE players SET password = ? WHERE alias = ?',
        [hashedPassword, alias]
      )

      await fastify.db.run(
        'DELETE FROM password_reset_codes WHERE id = ?',
        [record.id]
      )

      return { success: true, message: 'Password updated successfully' }
    } catch (err) {
      console.error('Error resetting password:', err)
      return reply.status(500).send({ error: 'Error resetting password' })
    }
  })
}


function validatePassword(password) {
  const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/

  return re.test(String(password))
}
