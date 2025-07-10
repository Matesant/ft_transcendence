import bcrypt from 'bcrypt'

export default async function loginRoutes(fastify, opts) {
  fastify.post('/login', async (request, reply) => {
    const { alias, password } = request.body
    request.log.info({ action: 'login_attempt', alias }, 'User login attempt')
    
    if (!alias || !password) {
      request.log.warn({ action: 'login_failed', alias, reason: 'missing_credentials' }, 'Login failed: missing credentials')
      return reply.status(400).send({ error: 'Alias and password are required' })
    }

    const player = await fastify.db.get(
      'SELECT * FROM players WHERE alias = ?',
      [alias]
    )

    if (!player) {
      request.log.warn({ action: 'login_failed', alias, reason: 'invalid_alias' }, 'Login failed: invalid alias')
      return reply.status(401).send({ error: 'Invalid alias or password' })
    }

    if (player.is_2fa_enabled) {
      request.log.info({ action: 'login_2fa_required', alias, player_id: player.id }, 'Login requires 2FA')
      return { require2FA: true, message: '2FA required' }
    }

    const match = await bcrypt.compare(password, player.password)

    if (!match) {
      request.log.warn({ action: 'login_failed', alias, reason: 'invalid_password' }, 'Login failed: invalid password')
      return reply.status(401).send({ error: 'Invalid alias or password' })
    }

    const token = fastify.jwt.sign({ alias: player.alias, id: player.id })
    
    reply.setCookie('authToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    })

    request.log.info({ action: 'login_success', alias, player_id: player.id }, 'User login successful')
    return { success: true, message: 'Login successful' }
  })
}
