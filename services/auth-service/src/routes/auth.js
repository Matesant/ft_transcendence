import bcrypt from 'bcrypt'
import { send2FACode } from '../utils/mailer.js'
import { getTestMessageUrl } from 'nodemailer'

export default async function (fastify, opts) {
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
      return { success: true, alias }
    } catch (err) {
      return reply.status(409).send({ error: 'Alias or email already exists' })
    }
  })

  fastify.post('/2fa/request', async (request, reply) => {
    const { alias, password } = request.body
    const player = await fastify.db.get('SELECT * FROM players WHERE alias = ?', [alias])

    if (!player || !(await bcrypt.compare(password, player.password))) {
      return reply.status(401).send({ error: 'Invalid alias or password' })
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString()

    await fastify.db.run(
      'INSERT INTO two_factor_codes (alias, code, expires_at) VALUES (?, ?, ?)',
      [alias, code, expiresAt]
    )

    try {
      await send2FACode(player.email, code)
      return { success: true, message: 'Código enviado por e-mail' }
    } catch (err) {
      return reply.status(500).send({ error: 'Erro ao enviar código de autenticação' })
    }
  })

  fastify.post('/2fa/verify', async (request, reply) => {
    const { alias, code } = request.body

    const record = await fastify.db.get(
      'SELECT * FROM two_factor_codes WHERE alias = ? AND code = ? ORDER BY created_at DESC LIMIT 1',
      [alias, code]
    )

    if (!record || new Date(record.expires_at) < new Date()) {
      return reply.status(401).send({ error: 'Código inválido ou expirado' })
    }

    await fastify.db.run('DELETE FROM two_factor_codes WHERE id = ?', [record.id])

    const player = await fastify.db.get('SELECT id FROM players WHERE alias = ?', [alias])
    const token = fastify.jwt.sign({ alias, id: player.id })

    return { token }
  })


  //#TODO: rota login só pra testes, será removida depois
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
