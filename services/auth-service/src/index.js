import Fastify from 'fastify'
import fastifyJWT from '@fastify/jwt'
import fastifyCookie from '@fastify/cookie'
import cors from '@fastify/cors'
import dotenv from 'dotenv'
import dbPlugin from './plugins/db.js'
import authRoutes from './routes/auth.js'
import playersRoutes from './routes/players.js'
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
  origin: true,
  credentials: true
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
await fastify.register(authRoutes, { prefix: '/auth' })
await fastify.register(playersRoutes, { prefix: '/players' })

// 7) Global Error Handler
fastify.setErrorHandler((error, request, reply) => {
  reply.status(error.statusCode || 500).send({
    status: error.statusCode || 500,
    error: error.name || 'InternalServerError',
    message: error.message || 'Something went wrong.',
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
  })
})

// 8) Start server
await fastify.listen({ port: 3000, host: '0.0.0.0' })
