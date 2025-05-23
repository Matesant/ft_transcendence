export default async function (fastify, opts) {
  fastify.post('/', { preValidation: [fastify.authenticate] }, async (request, reply) => {
    const players = request.body.players  // deve receber um array
    if (!Array.isArray(players) || players.length < 2) {
      return reply.status(400).send({ error: 'Pelo menos dois jogadores são necessários' })
    }

    await fastify.db.run('DELETE FROM matches')

    const matches = []

    for (let i = 0; i < players.length - 1; i += 2) {
      const p1 = players[i]
      const p2 = players[i + 1]
      await fastify.db.run('INSERT INTO matches (player1, player2) VALUES (?, ?)', [p1, p2])
      matches.push({ player1: p1, player2: p2 })
    }

    if (players.length % 2 !== 0) {
      const waiting = players.at(-1)
      await fastify.db.run('INSERT INTO matches (player1, status) VALUES (?, ?)', [waiting, 'waiting'])
      matches.push({ waiting })
    }

    return { matches }
  })

  fastify.get('/next', { preValidation: [fastify.authenticate] }, async () => {
    const match = await fastify.db.get(`
      SELECT * FROM matches
      WHERE status = 'pending' AND player2 IS NOT NULL
      ORDER BY created_at ASC LIMIT 1
    `)

    if (!match) return { match: null, message: 'No more matches available' }
    return { match }
  })

  fastify.post('/score', { preValidation: [fastify.authenticate] }, async (request, reply) => {
    const { matchId, winner } = request.body
    if (!matchId || !winner) {
      return reply.status(400).send({ error: 'matchId e winner são obrigatórios' })
    }

    await fastify.db.run(`
      UPDATE matches SET winner = ?, status = 'done' WHERE id = ?
    `, [winner, matchId])

    return { success: true, matchId, winner }
  })

  fastify.post('/advance', { preValidation: [fastify.authenticate] }, async (request, reply) => {
    const winners = await fastify.db.all(`
      SELECT winner FROM matches
      WHERE status = 'done' AND winner IS NOT NULL
      ORDER BY created_at ASC
    `)

    if (winners.length < 2) {
      return reply.send({ message: 'Não há vencedores suficientes para avançar' })
    }

    const round = (await fastify.db.get(`SELECT MAX(round) as r FROM matches`)).r + 1
    const matches = []

    for (let i = 0; i < winners.length - 1; i += 2) {
      const p1 = winners[i].winner
      const p2 = winners[i + 1].winner
      await fastify.db.run('INSERT INTO matches (player1, player2, round) VALUES (?, ?, ?)', [p1, p2, round])
      matches.push({ player1: p1, player2: p2 })
    }

    if (winners.length % 2 !== 0) {
      const waiting = winners.at(-1).winner
      await fastify.db.run('INSERT INTO matches (player1, round, status) VALUES (?, ?, ?)', [waiting, round, 'waiting'])
      matches.push({ waiting })
    }

    return { round, matches }
  })

  fastify.get('/tournament', { preValidation: [fastify.authenticate] }, async () => {
    const all = await fastify.db.all('SELECT * FROM matches ORDER BY round ASC, created_at ASC')
    const grouped = {}

    for (const m of all) {
      if (!grouped[m.round]) grouped[m.round] = []
      grouped[m.round].push(m)
    }

    const rounds = Object.entries(grouped).map(([round, matches]) => ({
      round: Number(round),
      matches
    }))

    return { rounds }
  })
}
