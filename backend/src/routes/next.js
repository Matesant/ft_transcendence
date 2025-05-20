export default async function (fastify, opts) {
  fastify.get('/next', {
    preValidation: [fastify.authenticate]
  }, async (request, reply) => {
    const db = fastify.db

    // Busca a próxima partida ainda não jogada
    const next = await db.get(`
      SELECT * FROM matches
      WHERE status = 'pending'
      ORDER BY created_at ASC
      LIMIT 1
    `)

    if (!next) {
      return { match: null, message: 'No more matches available' }
    }

    // Marca como "playing"
    await db.run(`UPDATE matches SET status = 'playing' WHERE id = ?`, [next.id])

    return {
      match: {
        id: next.id,
        player1: next.player1,
        player2: next.player2
      }
    }
  })
}
