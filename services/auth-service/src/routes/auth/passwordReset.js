import { send2FACode } from '../../utils/mailer.js'

export default async function passwordResetRoutes(fastify, opts) {
  // Solicitar reset de senha
  fastify.post('/password/request-reset', async (request, reply) => {
    const { alias } = request.body
    
    if (!alias) {
      return reply.status(400).send({ error: 'Alias is required' })
    }

    const player = await fastify.db.get('SELECT * FROM players WHERE alias = ?', [alias])

    if (!player) {
      // Por segurança, sempre retornamos sucesso mesmo se o usuário não existir
      return { success: true, message: 'If the user exists, a reset code has been sent to the email' }
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 minutos

    // Limpar códigos antigos do usuário
    await fastify.db.run(
      'DELETE FROM password_reset_codes WHERE alias = ?',
      [alias]
    )

    // Inserir novo código
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

  // Verificar código de reset
  fastify.post('/password/verify-reset-code', async (request, reply) => {
    const { alias, code } = request.body

    if (!alias || !code) {
      return reply.status(400).send({ error: 'Alias and code are required' })
    }

    const record = await fastify.db.get(
      'SELECT * FROM password_reset_codes WHERE alias = ? AND code = ? ORDER BY created_at DESC LIMIT 1',
      [alias, code]
    )

    if (!record || new Date(record.expires_at) < new Date()) {
      return reply.status(401).send({ error: 'Invalid or expired reset code' })
    }

    // Gerar token temporário para reset de senha
    const resetToken = fastify.jwt.sign(
      { alias, type: 'password_reset', codeId: record.id }, 
      { expiresIn: '15m' }
    )

    return { success: true, message: 'Code verified', resetToken }
  })

  // Redefinir senha
  fastify.post('/password/reset', async (request, reply) => {
    const { resetToken, newPassword } = request.body

    if (!resetToken || !newPassword) {
      return reply.status(400).send({ error: 'Reset token and new password are required' })
    }

    if (newPassword.length < 6) {
      return reply.status(400).send({ error: 'Password must be at least 6 characters long' })
    }

    try {
      // Verificar token de reset
      const decoded = fastify.jwt.verify(resetToken)
      
      if (decoded.type !== 'password_reset') {
        return reply.status(401).send({ error: 'Invalid reset token' })
      }

      // Verificar se o código ainda existe
      const record = await fastify.db.get(
        'SELECT * FROM password_reset_codes WHERE id = ? AND alias = ?',
        [decoded.codeId, decoded.alias]
      )

      if (!record) {
        return reply.status(401).send({ error: 'Reset code has been used or expired' })
      }

      // Hash da nova senha
      const bcrypt = await import('bcrypt')
      const hashedPassword = await bcrypt.hash(newPassword, 10)

      // Atualizar senha do usuário
      await fastify.db.run(
        'UPDATE players SET password = ? WHERE alias = ?',
        [hashedPassword, decoded.alias]
      )

      // Remover código usado
      await fastify.db.run(
        'DELETE FROM password_reset_codes WHERE id = ?',
        [decoded.codeId]
      )

      return { success: true, message: 'Password updated successfully' }
    } catch (err) {
      if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
        return reply.status(401).send({ error: 'Invalid or expired reset token' })
      }
      console.error('Error resetting password:', err)
      return reply.status(500).send({ error: 'Error resetting password' })
    }
  })
}
