import { getUserIdByAlias } from '../../utils/get_user.js'

export default async function (fastify) {
  fastify.post('/history', async (request, reply) => {
    const { alias, opponent, result, date } = request.body

    if (!alias || !opponent || !['win', 'loss', 'wo'].includes(result)) {
      return reply.status(400).send({ error: 'Invalid data for match history' })
    }

    const userId = await getUserIdByAlias(fastify, alias)
    if (!userId) {
		fastify.log.warn(`User not found for match history: ${alias}`)
		return reply.send({ success: false, skipped: true, message: `User ${alias} not found, match not recorded` })
	}

    const matchDate = date || new Date().toISOString()

    await fastify.db.run(`
      INSERT INTO match_history (user_id, opponent, result, date)
      VALUES (?, ?, ?, ?)
    `, [userId, opponent, result, matchDate])

    return { success: true, message: 'Match recorded' }
  })
  
  fastify.get('/history', { preValidation: [fastify.authenticate] }, async (request, reply) => {
	  const { alias } = request.user
	  const userId = await getUserIdByAlias(fastify, alias)
	  
	  const history = await fastify.db.all(`
		SELECT opponent, result, date FROM match_history
		WHERE user_id = ?
		ORDER BY date DESC
		`, [userId])
		
		return { alias, history }
	})
	
}