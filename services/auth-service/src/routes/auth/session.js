export default async function sessionRoutes(fastify, opts) {
  fastify.get('/verify', async (request, reply) => {
    const token = request.cookies.authToken
    
    if (!token) {
      return reply.status(401).send({ authenticated: false, error: 'No authentication token' })
    }

    try {
      const decoded = fastify.jwt.verify(token)
      const player = await fastify.db.get('SELECT id, alias, email, is_2fa_enabled FROM players WHERE alias = ?', [decoded.alias])
      
      if (!player) {
        return reply.status(401).send({ authenticated: false, error: 'User not found' })
      }

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
    
    reply.clearCookie('authToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/'
    })
    
    return { success: true, message: 'Logged out successfully' }
  })
}
