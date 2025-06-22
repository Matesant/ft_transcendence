import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import dotenv from 'dotenv'
import dbPlugin from './plugins/db.js'
import setupRoutes from './routes/match/setup.js';
import playRoutes from './routes/match/play.js';
import tournamentRoutes from './routes/match/tournament.js';
import crypto from 'node:crypto'

dotenv.config()

// Configure Fastify with structured logging
const fastify = Fastify({
	logger: {
		level: process.env.LOG_LEVEL || 'info'
	},
	disableRequestLogging: true
})

// Hook to generate request_id and make it available in request.log
fastify.addHook('onRequest', async (request, reply) => {
  const reqId = request.headers['x-request-id'] || crypto.randomUUID()
  request.id = reqId
  request.log = request.log.child({ request_id: reqId })
})

fastify.decorate("authenticate", async function (request, reply) {
  try {
    await request.jwtVerify()
  } catch (err) {
    reply.status(401).send({
      status: 401,
      error: 'Unauthorized',
      message: 'Invalid or missing token.'
    })
  }
})

fastify.setErrorHandler((error, request, reply) => {
  request.log.error(error)

  reply.status(error.statusCode || 500).send({
    status: error.statusCode || 500,
    error: error.name || 'InternalServerError',
    message: error.message || 'Something went wrong.',
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
  })
})

// #TODO: Replace `origin: true` with specific URL before delivery
await fastify.register(cors, {
  origin: true,
  credentials: true
})

await fastify.register(setupRoutes, { prefix: '/match' });
await fastify.register(playRoutes, { prefix: '/match' });
await fastify.register(tournamentRoutes, { prefix: '/match' });
await fastify.register(dbPlugin)
await fastify.register(jwt, { secret: process.env.JWT_SECRET })

await fastify.listen({ port: 3000, host: '0.0.0.0' })
