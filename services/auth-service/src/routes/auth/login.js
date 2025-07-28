import bcrypt from 'bcrypt'

export default async function loginRoutes(fastify, opts) {
  fastify.post('/login', async (request, reply) => {
    const { alias, password } = request.body
    
    if (!alias || !password) {
      return reply.status(400).send({ error: 'Alias and password are required' })
    }

    const player = await fastify.db.get(
      'SELECT * FROM players WHERE alias = ?',
      [alias]
    )

    if (!player) {
      return reply.status(401).send({ error: 'Invalid alias or password' })
    }

    const match = await bcrypt.compare(password, player.password)

    if (!match) {
      return reply.status(401).send({ error: 'Invalid alias or password' })
    }

    if (player.is_2fa_enabled) {
      return { require2FA: true, message: '2FA required' }
    }

    const token = fastify.jwt.sign({ alias: player.alias, id: player.id })
    
    reply.setCookie('authToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000 // 24 horas
    })

    return { success: true, message: 'Login successful' }
  })
}
