	function shuffle(array) {
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1))
		;[array[i], array[j]] = [array[j], array[i]]
	}
	}

export default async function (fastify, opts) {
	fastify.post('/', { preValidation: [fastify.authenticate] }, async (request, reply) => {
		const db = fastify.db

		await db.run('DELETE FROM matches')

		const rows = await db.all('SELECT alias FROM players ORDER BY created_at ASC')
		const players = rows.map(row => row.alias)

		if (players.length < 2) {
			return reply.status(400).send({ error: 'Not enough players to create a match' })
		}
		
		shuffle(players)

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

	fastify.post('/advance', {
		preValidation: [fastify.authenticate]
	}, async (request, reply) => {
		
		const db = fastify.db

		const lastRound = await db.get(`SELECT MAX(round) as round FROM matches`)
		const currentRound = lastRound?.round || 1
		const nextRound = currentRound + 1

		// Get winners
		const winnerData = await db.all(`
			SELECT winner FROM matches
			WHERE round = ? AND status = 'done' AND winner IS NOT NULL
		`, [currentRound])

		const winners = winnerData.map(row => row.winner)

		if (winners.length < 2) {
			return reply.status(400).send({ error: 'Not enough winners to create next round' })
		}

		const matches = []

		// Shuffle winners
		shuffle(winners)

		//WO if odd number of winners
		if (winners.length % 2 !== 0) {
			const wo = winners.pop()
			await db.run(`
				INSERT INTO matches (player1, winner, status, round)
				VALUES (?, NULL, ?, 'done', ?)
			`, [wo, wo, nextRound])
			matches.push({ winner: wo, status: 'walkover' })
		}

		// even number of winners
		for (let i = 0; i < winners.length; i += 2) {
			const p1 = winners[i]
			const p2 = winners[i + 1]
			await db.run(`
				INSERT INTO matches (player1, player2, status, round)
				VALUES (?, ?, 'pending', ?)
			`, [p1, p2, nextRound])
			matches.push({ player1: p1, player2: p2 })
		}

		return { matches, round: nextRound }
})

	fastify.get('/tournament', async (request, reply) => {
	const db = fastify.db

	const allMatches = await db.all(`
		SELECT id, player1, player2, winner, status, round
		FROM matches
		ORDER BY round ASC, created_at ASC
	`)

	const grouped = {}
	for (const match of allMatches) {
		if (!grouped[match.round]) {
			grouped[match.round] = []
		}
		grouped[match.round].push(match)
	}

	const rounds = Object.keys(grouped).map(round => ({
		round: Number(round),
		matches: grouped[round]
	}))

		return { rounds }
	})
}