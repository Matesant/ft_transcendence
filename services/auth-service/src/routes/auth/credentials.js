import bcrypt from 'bcrypt'

export default async function credentialsRoutes(fastify, opts) {
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
}
