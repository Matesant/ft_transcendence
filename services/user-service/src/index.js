import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import dotenv from 'dotenv'
import dbPlugin from './plugins/db.js'
import multipart from '@fastify/multipart'
import profileRoutes from './routes/users/profile.js';
import avatarRoutes from './routes/users/avatar.js';
import friendsRoutes from './routes/users/friends.js';
import publicRoutes from './routes/users/public.js';
import historyRoutes from './routes/users/history.js';
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
    reply.status(401).send({ error: 'Unauthorized' })
  }
})

await fastify.register(cors, { origin: true, credentials: true })
await fastify.register(jwt, { secret: process.env.JWT_SECRET })
await fastify.register(dbPlugin)
await fastify.register(multipart, {
  limits: {
	fileSize: 10 * 1024 * 1024 // 10 MB
  }
})
await fastify.register(profileRoutes, { prefix: '/users' });
await fastify.register(avatarRoutes, { prefix: '/users' });
await fastify.register(friendsRoutes, { prefix: '/users' });
await fastify.register(publicRoutes, { prefix: '/users' });
await fastify.register(historyRoutes, { prefix: '/users' });

await fastify.listen({ port: 3000, host: '0.0.0.0' })
