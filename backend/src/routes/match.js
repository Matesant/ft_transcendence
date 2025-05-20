export default async function (fastify, opts) {
	fastify.post('/', { preValidation: [fastify.authenticate] }, async (request, reply) => {
		const db = fastify.db

		await db.run('DELETE FROM matches')

		const rows = await db.all('SELECT alias FROM players ORDER BY created_at ASC')
		const players = rows.map(row => row.alias)

		if (players.length < 2) {
			return reply.status(400).send({ error: 'Not enough players to create a match' })
		}
		
		const matches = []

		if (players.length % 2 !== 0) {
			const wo = players.at(-1)
			await db.run(`
				INSERT INTO matches (player1, player2, winner, status)
				VALUES (?, NULL, ?, 'done')
			`, [wo, wo])
			matches.push({ winner: wo, status: 'walkover' })
		}


		for (let i = 0; i < players.length - 1; i += 2) {
			const player1 = players[i]
			const player2 = players[i + 1]

			await db.run('INSERT INTO matches (player1, player2) VALUES (?, ?)', [player1, player2])
			matches.push({ player1, player2 })
		}

		return { matches }
	})

	fastify.get('/next', {
	preValidation: [fastify.authenticate]
	}, async (request, reply) => {
	const db = fastify.db

	const next = await db.get(`
		SELECT * FROM matches
		WHERE status = 'pending'
		ORDER BY created_at ASC
		LIMIT 1
	`)

	if (!next) {
		return { match: null, message: 'No more matches available' }
	}

	await db.run(`UPDATE matches SET status = 'playing' WHERE id = ?`, [next.id])

	return {
		match: {
		id: next.id,
		player1: next.player1,
		player2: next.player2
		}
	}
	})

		// POST /match/score
	fastify.post('/score', {
	preValidation: [fastify.authenticate]
	}, async (request, reply) => {
	const db = fastify.db
	const { matchId, winner } = request.body

	if (!matchId || !winner) {
		return reply.status(400).send({ error: 'matchId and winner are required' })
	}

	const match = await db.get('SELECT * FROM matches WHERE id = ?', [matchId])

	if (!match) {
		return reply.status(404).send({ error: 'Match not found' })
	}

	if (match.status === 'done') {
		return reply.status(400).send({ error: 'Match already completed' })
	}

	if (winner !== match.player1 && winner !== match.player2) {
		return reply.status(400).send({ error: 'Winner must be one of the players' })
	}

	await db.run('UPDATE matches SET status = ?, winner = ? WHERE id = ?', ['done', winner, matchId])

	return { success: true, matchId, winner }
	})


}