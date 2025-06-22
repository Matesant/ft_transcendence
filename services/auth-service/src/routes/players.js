export default async function (fastify, opts) {
  fastify.get('/', async (request, reply) => {
    request.log.info({ action: 'players_list_attempt' }, 'Requesting players list')
    
    try {
      const players = await fastify.db.all('SELECT alias, created_at FROM players ORDER BY created_at DESC')
      
      request.log.info({ action: 'players_list_success', count: players.length }, 'Players list retrieved successfully')
      return players
    } catch (err) {
      request.log.error({ action: 'players_list_failed', error: err.message }, 'Failed to get players list')
      return reply.status(500).send({ error: 'Failed to retrieve players list' })
    }
  })
}