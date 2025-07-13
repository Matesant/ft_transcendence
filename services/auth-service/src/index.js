import Fastify from 'fastify'
import fastifyJWT from '@fastify/jwt'
import fastifyCookie from '@fastify/cookie'
import cors from '@fastify/cors'
import dotenv from 'dotenv'
import dbPlugin from './plugins/db.js'
import playersRoutes from './routes/players.js'
import registerRoutes from './routes/auth/register.js'
import loginRoutes from './routes/auth/login.js'
import twoFactorRoutes from './routes/auth/twoFactor.js'
import credentialsRoutes from './routes/auth/credentials.js'
import sessionRoutes from './routes/auth/session.js'
import crypto from 'node:crypto'

dotenv.config()

// 1) Configure Fastify
const fastify = Fastify({
	logger: false
})

fastify.addHook('onRequest', async (request, reply) => {
  const reqId = request.headers['x-request-id'] || crypto.randomUUID()
  request.id = reqId
})

// 3) JWT Auth decorator
fastify.decorate("authenticate", async function (request, reply) {
  try {
    const token = request.cookies.authToken
    if (!token) {
      return reply.status(401).send({ error: 'No authentication token provided' })
    }
    
    const decoded = fastify.jwt.verify(token)
    request.user = decoded
  } catch (err) {
    return reply.status(401).send({ error: 'Invalid authentication token' })
  }
})

// 4) CORS
await fastify.register(cors, {
  origin: ["http://localhost:8080", "http://127.0.0.1:8080"], // Especifique os domínios permitidos
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
})

// 5) Plugins
await fastify.register(dbPlugin)
await fastify.register(fastifyCookie, {
  secret: process.env.COOKIE_SECRET || 'default-cookie-secret'
})
await fastify.register(fastifyJWT, {
  secret: process.env.JWT_SECRET || 'default-secret'
})

// 6) Routes
await fastify.register(playersRoutes, { prefix: '/players' })
await fastify.register(registerRoutes, { prefix: '/auth' })
await fastify.register(loginRoutes, { prefix: '/auth' })
await fastify.register(twoFactorRoutes, { prefix: '/auth' })
await fastify.register(credentialsRoutes, { prefix: '/auth' })
await fastify.register(sessionRoutes, { prefix: '/auth' })

// 7) Global Error Handler
fastify.setErrorHandler((error, request, reply) => {
  reply.status(error.statusCode || 500).send({
    status: error.statusCode || 500,
    error: error.name || 'InternalServerError',
    message: error.message || 'Something went wrong.',
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
  })
})

await fastify.listen({ port: 3000, host: '0.0.0.0' })
