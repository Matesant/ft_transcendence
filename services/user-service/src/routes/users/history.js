import { getUserIdByAlias } from '../../utils/get_user.js'

export default async function (fastify) {
  fastify.post('/history', async (request, reply) => {
    const { alias, opponent, result, date } = request.body
    request.log.info({ action: 'match_history_record_attempt', alias, opponent, result }, 'Attempting to record match history')

    if (!alias || !opponent || !['win', 'loss', 'wo'].includes(result)) {
      request.log.warn({ action: 'match_history_record_failed', alias, opponent, result, reason: 'invalid_data' }, 'Invalid data for match history')
      return reply.status(400).send({ error: 'Invalid data for match history' })
    }

    try {
      const userId = await getUserIdByAlias(fastify, alias)
      if (!userId) {
        request.log.warn({ action: 'match_history_record_skipped', alias, reason: 'user_not_found' }, 'User not found for match history')
        return reply.send({ success: false, skipped: true, message: `User ${alias} not found, match not recorded` })
      }

      const matchDate = date || new Date().toISOString()

      await fastify.db.run(`
        INSERT INTO match_history (user_id, opponent, result, date)
        VALUES (?, ?, ?, ?)
      `, [userId, opponent, result, matchDate])

      request.log.info({ action: 'match_history_record_success', alias, opponent, result, date: matchDate }, 'Match history recorded successfully')
      return { success: true, message: 'Match recorded' }
    } catch (err) {
      request.log.error({ action: 'match_history_record_failed', alias, opponent, result, error: err.message }, 'Failed to record match history')
      return reply.status(500).send({ error: 'Failed to record match history' })
    }
  })
  
  fastify.get('/history', { preValidation: [fastify.authenticate] }, async (request, reply) => {
    const { alias } = request.user
    request.log.info({ action: 'match_history_get_attempt', alias }, 'User requesting match history')
    
    try {
      const userId = await getUserIdByAlias(fastify, alias)
      
      const history = await fastify.db.all(`
        SELECT opponent, result, date FROM match_history
        WHERE user_id = ?
        ORDER BY date DESC
        `, [userId])
        
      request.log.info({ action: 'match_history_get_success', alias, history_count: history.length }, 'Match history retrieved successfully')
      return { alias, history }
    } catch (err) {
      request.log.error({ action: 'match_history_get_failed', alias, error: err.message }, 'Failed to get match history')
      return reply.status(500).send({ error: 'Failed to retrieve match history' })
    }
  })
}