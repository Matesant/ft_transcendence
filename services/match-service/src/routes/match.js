import { badRequest, notFound} from '../utils/errors.js'

export default async function (fastify, opts) {
  fastify.post('/', { preValidation: [fastify.authenticate] }, async (request, reply) => {
    const players = request.body.players

    if (!Array.isArray(players) || players.length < 2) {
      return badRequest(reply, 'Field "players" must be an array with at least 2 items.', 'Example: { "players": ["ana", "lucas"] }')
    }

    await fastify.db.run('DELETE FROM matches')
    const matches = []

    for (let i = 0; i < players.length - 1; i += 2) {
      const p1 = players[i]
      const p2 = players[i + 1]
      await fastify.db.run(
        'INSERT INTO matches (player1, player2, round, status) VALUES (?, ?, ?, ?)',
        [p1, p2, 1, 'pending']
      )
      matches.push({ player1: p1, player2: p2 })
    }

    if (players.length % 2 !== 0) {
      const wo = players.at(-1)
      await fastify.db.run(
        'INSERT INTO matches (player1, status, winner, round) VALUES (?, ?, ?, ?)',
        [wo, 'wo', wo, 1]
      )
      matches.push({ wo })
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
      return badRequest(reply, 'Fields "matchId" and "winner" are required.')
    }

    const match = await fastify.db.get('SELECT * FROM matches WHERE id = ?', [matchId])

    if (!match) {
      return notFound(reply, 'Match not found.')
    }

    if (match.status !== 'pending') {
      return badRequest(reply, 'This match is not active for scoring.')
    }

    if (match.player1 !== winner && match.player2 !== winner) {
      return badRequest(reply, 'Winner must be one of the players in this match.')
    }

    await fastify.db.run(`
      UPDATE matches SET winner = ?, status = 'done' WHERE id = ?
    `, [winner, matchId])

    return { success: true, matchId, winner }
  })

  fastify.post('/advance', { preValidation: [fastify.authenticate] }, async (request, reply) => {
    const winners = await fastify.db.all(`
      SELECT winner FROM matches
      WHERE (status = 'done' OR status = 'wo') AND winner IS NOT NULL
      ORDER BY created_at ASC
    `)

    if (winners.length < 2) {
      return reply.send({ message: 'Not enough winners to advance' })
    }

    const { r } = await fastify.db.get(`SELECT MAX(round) as r FROM matches`)
    const round = (r || 0) + 1
    const matches = []

    for (let i = 0; i < winners.length - 1; i += 2) {
      const p1 = winners[i].winner
      const p2 = winners[i + 1].winner
      await fastify.db.run('INSERT INTO matches (player1, player2, round, status) VALUES (?, ?, ?, ?)',
        [p1, p2, round, 'pending'])
      matches.push({ player1: p1, player2: p2 })
    }

    if (winners.length % 2 !== 0) {
      const wo = winners.at(-1).winner
      await fastify.db.run(
        'INSERT INTO matches (player1, status, winner, round) VALUES (?, ?, ?, ?)',
        [wo, 'wo', wo, round]
      )
      matches.push({ wo })
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
