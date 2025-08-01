import bcrypt from 'bcrypt'

process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

export default async function registerRoutes(fastify, opts) {
  fastify.post('/register', async (request, reply) => {
    const { alias, password, email } = request.body

    if (!alias || !password || !email) {
      return reply.status(400).send({ error: 'Alias, email and password are required' })
    }

    if (!validateEmail(email)) {
      return reply.status(400).send({ error: 'Invalid email format' })
    }

    if (!validateAlias(alias)) {
      return reply.status(400).send({ error: 'Invalid alias format' })
    }

    if (!validatePassword(password)) {
      return reply.status(400).send({ error: 'Invalid password format' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    try {

      await fastify.db.run(
        'INSERT INTO players (alias, email, password) VALUES (?, ?, ?)',
        [alias, email, hashedPassword]
      )
      await fetch('https://user-service:3003/users/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alias }),
      })
      return { success: true, alias }
    } catch (err) {
      return reply.status(409).send({ error: 'Alias or email already exists' })
    }
  })
}

function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@][^\s@]+$/
  return re.test(String(email).toLowerCase())
}

function validateAlias(alias) {
  const re = /^[a-zA-Z0-9_]{3,20}$/
  return re.test(String(alias))
}

function validatePassword(password) {
  const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{6,20}$/;

  return re.test(String(password))
}
