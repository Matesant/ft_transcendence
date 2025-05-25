import Fastify from 'fastify'
import fastifyJWT from '@fastify/jwt'
import cors from '@fastify/cors'
import dotenv from 'dotenv'
import dbPlugin from './plugins/db.js'
import authRoutes from './routes/auth.js'
import playersRoutes from './routes/players.js'

dotenv.config()

const fastify = Fastify({ logger: true })

// JWT Auth decorator
fastify.decorate("authenticate", async function (request, reply) {
  try {
    await request.jwtVerify()
  } catch (err) {
    reply.send(err)
  }
})

// CORS config
await fastify.register(cors, {
  origin: true,
  credentials: true
})

// Plugins
await fastify.register(dbPlugin)
await fastify.register(fastifyJWT, {
  secret: process.env.JWT_SECRET || 'default-secret'
})

// Rotas
await fastify.register(authRoutes, { prefix: '/auth' })
await fastify.register(playersRoutes, { prefix: '/players' })

// ✅ Global Error Handler
fastify.setErrorHandler((error, request, reply) => {
  request.log.error(error)

  reply.status(error.statusCode || 500).send({
    status: error.statusCode || 500,
    error: error.name || 'InternalServerError',
    message: error.message || 'Something went wrong.',
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
  })
})

// Inicia servidor
await fastify.listen({ port: 3000, host: '0.0.0.0' })
