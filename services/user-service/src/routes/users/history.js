import { getUserIdByAlias } from '../../utils/get_user.js'

export default async function (fastify) {
  fastify.post('/history', async (request, reply) => {
    const { alias, opponent, result, date } = request.body

    if (!alias || !opponent || !['win', 'loss', 'wo'].includes(result)) {
      return reply.status(400).send({ error: 'Invalid data for match history' })
    }

    try {
      const userId = await getUserIdByAlias(fastify, alias)
      if (!userId) {
        return reply.send({ success: false, skipped: true, message: `User ${alias} not found, match not recorded` })
      }

      const matchDate = date || new Date().toISOString()

      // Insert match history
      await fastify.db.run(`
        INSERT INTO match_history (user_id, opponent, result, date)
        VALUES (?, ?, ?, ?)
      `, [userId, opponent, result, matchDate])

      // Update user profile statistics
      if (result === 'win') {
        await fastify.db.run(`
          UPDATE user_profiles 
          SET wins = wins + 1 
          WHERE id = ?
        `, [userId])
      } else if (result === 'loss') {
        await fastify.db.run(`
          UPDATE user_profiles 
          SET losses = losses + 1 
          WHERE id = ?
        `, [userId])
      }

      return { success: true, message: 'Match recorded' }
    } catch (err) {
      return reply.status(500).send({ error: 'Failed to record match history' })
    }
  })
  
  fastify.get('/history', { preValidation: [fastify.authenticate] }, async (request, reply) => {
    const { alias } = request.user
    
    try {
      const userId = await getUserIdByAlias(fastify, alias)
      
      const history = await fastify.db.all(`
        SELECT opponent, result, date FROM match_history
        WHERE user_id = ?
        ORDER BY date DESC
        `, [userId])
        
      return { alias, history }
    } catch (err) {
      return reply.status(500).send({ error: 'Failed to retrieve match history' })
    }
  })

  // Rota para sincronizar estatísticas (recalcular wins/losses baseado no histórico)
  fastify.post('/sync-stats', async (request, reply) => {
    try {
      const users = await fastify.db.all('SELECT id, alias FROM user_profiles')
      
      for (const user of users) {
        const wins = await fastify.db.get(
          'SELECT COUNT(*) as count FROM match_history WHERE user_id = ? AND result = ?',
          [user.id, 'win']
        )
        
        const losses = await fastify.db.get(
          'SELECT COUNT(*) as count FROM match_history WHERE user_id = ? AND result = ?',
          [user.id, 'loss']
        )
        
        await fastify.db.run(`
          UPDATE user_profiles 
          SET wins = ?, losses = ? 
          WHERE id = ?
        `, [wins?.count || 0, losses?.count || 0, user.id])
      }
      
      return { success: true, message: 'Statistics synchronized for all users' }
    } catch (err) {
      return reply.status(500).send({ error: 'Failed to sync statistics' })
    }
  })
}