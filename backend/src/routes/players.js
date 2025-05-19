export default async function (fastify, opts) {
  fastify.get('/', async () => {
    const players = await fastify.db.all('SELECT alias, created_at FROM players ORDER BY created_at DESC')
    return players
  })
}
