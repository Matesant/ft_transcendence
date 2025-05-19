export default async function (fastify, opts) {
  fastify.post('/register', async (request, reply) => {
    const { alias } = request.body
    if (!alias) return reply.status(400).send({ error: 'Alias is required' })

    try {
      await fastify.db.run('INSERT INTO players (alias) VALUES (?)', [alias])
      return { success: true, alias }
    } catch {
      return reply.status(409).send({ error: 'Alias already exists' })
    }
  })
}
