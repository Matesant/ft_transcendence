export default async function sessionRoutes(fastify, opts) {
  fastify.get('/verify', async (request, reply) => {
    const token = request.cookies.authToken
    request.log.info({ action: 'verify_attempt', has_token: !!token }, 'User attempting to verify authentication')
    
    if (!token) {
      request.log.warn({ action: 'verify_failed', reason: 'no_token' }, 'No auth token provided')
      return reply.status(401).send({ authenticated: false, error: 'No authentication token' })
    }

    try {
      const decoded = fastify.jwt.verify(token)
      const player = await fastify.db.get('SELECT id, alias, email, is_2fa_enabled FROM players WHERE alias = ?', [decoded.alias])
      
      if (!player) {
        request.log.warn({ action: 'verify_failed', alias: decoded.alias, reason: 'user_not_found' }, 'User not found during verification')
        return reply.status(401).send({ authenticated: false, error: 'User not found' })
      }

      request.log.info({ action: 'verify_success', alias: decoded.alias, player_id: player.id }, 'Authentication verification successful')
      return { 
        authenticated: true, 
        user: { 
          id: player.id, 
          alias: player.alias, 
          email: player.email, 
          is_2fa_enabled: player.is_2fa_enabled 
        } 
      }
    } catch (err) {
      request.log.warn({ action: 'verify_failed', reason: 'invalid_token', error: err.message }, 'Invalid token during verification')
      return reply.status(401).send({ authenticated: false, error: 'Invalid token' })
    }
  })

  fastify.post('/logout', async (request, reply) => {
    const token = request.cookies.authToken
    const alias = token ? (() => {
      try {
        return fastify.jwt.verify(token).alias
      } catch {
        return 'unknown'
      }
    })() : 'unknown'
    
    request.log.info({ action: 'logout_attempt', alias }, 'User attempting to logout')
    
    reply.clearCookie('authToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/'
    })
    
    request.log.info({ action: 'logout_success', alias }, 'User logout successful')
    return { success: true, message: 'Logged out successfully' }
  })
}
