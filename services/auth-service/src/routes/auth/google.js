import { google } from 'googleapis'
import bcrypt from 'bcrypt'

export default async function googleRoutes(fastify) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `https://${process.env.IP}:3001/auth/google/callback`
  )

  fastify.get('/google', async (request, reply) => {
    try {
      const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: ['profile', 'email'],
        prompt: 'select_account'
      })
      reply.redirect(url)
    } catch (err) {
      reply.status(500).send({ error: 'Erro interno na rota /auth/google' })
    }
  })

  fastify.get('/google/callback', async (request, reply) => {
    try {
      const { code } = request.query
      if (!code) {
        throw new Error('Código de autorização não encontrado na query.')
      }

      const { tokens } = await oauth2Client.getToken(code)
      oauth2Client.setCredentials(tokens)

      const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client })
      const { data: userInfo } = await oauth2.userinfo.get()

      const email = userInfo.email
      const alias = userInfo.name || email

      if (!email) {
        throw new Error('E-mail não retornado pelo Google.')
      }

      let player = await fastify.db.get(
        'SELECT * FROM players WHERE email = ?',
        [email]
      )

      if (!player) {
        const hashedPassword = await bcrypt.hash('GOOGLE_AUTH', 10)

        await fastify.db.run(
          'INSERT INTO players (alias, email, password) VALUES (?, ?, ?)',
          [alias, email, hashedPassword]
        )

        // Faz a sincronização com o serviço externo
        await fetch('https://user-service:3003/users/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ alias })
        })

        player = await fastify.db.get(
          'SELECT * FROM players WHERE email = ?',
          [email]
        )
      }

      const token = fastify.jwt.sign({ alias: player.alias, id: player.id })

      reply.setCookie('authToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 24 * 60 * 60 * 1000
      })

      reply.redirect(`https://${process.env.IP}:8080/dashboard`)
    } catch (err) {
      reply.status(500).send({
        error: 'Erro interno na autenticação com o Google',
        details: err.message
      })
    }
  })
}
