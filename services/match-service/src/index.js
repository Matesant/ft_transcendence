import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import cookie from '@fastify/cookie'
import dotenv from 'dotenv'
import dbPlugin from './plugins/db.js'
import setupRoutes from './routes/match/setup.js';
import playRoutes from './routes/match/play.js';
import tournamentRoutes from './routes/match/tournament.js';
import crypto from 'node:crypto'
import { readFileSync } from 'node:fs';


dotenv.config()

// Configure Fastify
const fastify = Fastify({
	logger: false,
  https: {
    cert: readFileSync('/app/server.crt'),
    key: readFileSync('/app/server.key')
  }
})

fastify.addHook('onRequest', async (request, reply) => {
  const reqId = request.headers['x-request-id'] || crypto.randomUUID()
  request.id = reqId
})

fastify.decorate("authenticate", async function (request, reply) {
  try {
    const token = request.cookies.authToken
    if (!token) {
      return reply.status(401).send({
        status: 401,
        error: 'Unauthorized',
        message: 'No authentication token.'
      })
    }
    
    const decoded = this.jwt.verify(token)
    request.user = decoded
  } catch (err) {
    return reply.status(401).send({
      status: 401,
      error: 'Unauthorized',
      message: 'Invalid or missing token.'
    })
  }
})

fastify.setErrorHandler((error, request, reply) => {

  reply.status(error.statusCode || 500).send({
    status: error.statusCode || 500,
    error: error.name || 'InternalServerError',
    message: error.message || 'Something went wrong.',
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
  })
})

await fastify.register(cors, {
  origin: `https://${process.env.IP || 'localhost'}:8080`,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'Set-Cookie'],
  exposedHeaders: ['Set-Cookie']
})

await fastify.register(setupRoutes, { prefix: '/match' });
await fastify.register(playRoutes, { prefix: '/match' });
await fastify.register(tournamentRoutes, { prefix: '/match' });
await fastify.register(dbPlugin)
await fastify.register(jwt, { secret: process.env.JWT_SECRET })
await fastify.register(cookie, { secret: process.env.COOKIE_SECRET })

await fastify.listen({ port: 3002, host: '0.0.0.0' })
