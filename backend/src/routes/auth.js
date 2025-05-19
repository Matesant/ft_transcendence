import bcrypt from 'bcrypt'

export default async function (fastify, opts) {
  // REGISTRO
	fastify.post('/register', async (request, reply) => {
    const { alias, password } = request.body
    if (!alias || !password) {
      return reply.status(400).send({ error: 'Alias and password are required' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    try {
      await fastify.db.run(
        'INSERT INTO players (alias, password) VALUES (?, ?)',
        [alias, hashedPassword]
      )
      return { success: true, alias }
    } catch {
      return reply.status(409).send({ error: 'Alias already exists' })
    }
  })

  // LOGIN
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

    const token = fastify.jwt.sign({ alias: player.alias, id: player.id })
    return { token }
  })
}
