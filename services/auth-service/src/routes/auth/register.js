import bcrypt from 'bcrypt'

export default async function registerRoutes(fastify, opts) {
  fastify.post('/register', async (request, reply) => {
    const { alias, password, email } = request.body

    if (!alias || !password || !email) {
      return reply.status(400).send({ error: 'Alias, email and password are required' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    try {
      await fastify.db.run(
        'INSERT INTO players (alias, email, password) VALUES (?, ?, ?)',
        [alias, email, hashedPassword]
      )
      await fetch('http://user-service:3003/users/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alias })
      })
      return { success: true, alias }
    } catch (err) {
      return reply.status(409).send({ error: 'Alias or email already exists' })
    }
  })
}
