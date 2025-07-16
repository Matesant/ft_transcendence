export default async function (fastify, opts) {
  fastify.get(
    '/',
    { preValidation: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const players = await fastify.db.all(
          'SELECT alias, created_at FROM players ORDER BY created_at DESC'
        )

        return players
      } catch (err) {
        return reply
          .status(500)
          .send({ error: 'Failed to retrieve players list' })
      }
    }
  )
}