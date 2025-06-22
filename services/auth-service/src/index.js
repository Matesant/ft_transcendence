import Fastify from 'fastify'
import fastifyJWT from '@fastify/jwt'
import cors from '@fastify/cors'
import dotenv from 'dotenv'
import dbPlugin from './plugins/db.js'
import authRoutes from './routes/auth.js'
import playersRoutes from './routes/players.js'
import crypto from 'node:crypto'

dotenv.config()

// 1) Configura o Fastify para usar Pino com timestamp ISO e nível 'info'
const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    // coloco o tempo no campo "time" para facilitar o Logstash
    timestamp: () => `,"time":"${new Date().toISOString()}"`
  }
})

// 2) Hook para gerar request_id e tornar disponível em request.log
fastify.addHook('onRequest', async (request, reply) => {
  const reqId = request.headers['x-request-id'] || crypto.randomUUID()
  // child logger com o request_id
  request.id = reqId
  request.log = request.log.child({ request_id: reqId })
})

fastify.addHook('onResponse', (request, reply, done) => {
  request.log.info({
    method:   request.raw.method,
    url:      request.raw.url,
    status:   reply.statusCode,
    duration: reply.getResponseTime(),   // in ms
    request_id: request.id               // from your onRequest hook
  }, 'request completed')
  done()
})

// 3) JWT Auth decorator
fastify.decorate("authenticate", async function (request, reply) {
  try {
    await request.jwtVerify()
  } catch (err) {
    // já vai para o error handler global
    reply.send(err)
  }
})

// 4) CORS
await fastify.register(cors, {
  origin: true,
  credentials: true
})

// 5) Plugins
await fastify.register(dbPlugin)
await fastify.register(fastifyJWT, {
  secret: process.env.JWT_SECRET || 'default-secret'
})

// 6) Rotas
await fastify.register(authRoutes, { prefix: '/auth' })
await fastify.register(playersRoutes, { prefix: '/players' })

// 7) Global Error Handler
fastify.setErrorHandler((error, request, reply) => {
  request.log.error({ stack: error.stack, message: error.message }, 'Error caught')
  reply.status(error.statusCode || 500).send({
    status: error.statusCode || 500,
    error: error.name || 'InternalServerError',
    message: error.message || 'Something went wrong.',
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
  })
})

// 8) Inicia servidor
await fastify.listen({ port: 3000, host: '0.0.0.0' })
