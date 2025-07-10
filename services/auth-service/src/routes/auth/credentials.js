import bcrypt from 'bcrypt'

export default async function credentialsRoutes(fastify, opts) {
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
}
