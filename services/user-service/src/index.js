import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import cookie from '@fastify/cookie'
import dotenv from 'dotenv'
import dbPlugin from './plugins/db.js'
import multipart from '@fastify/multipart'
import profileRoutes from './routes/users/profile.js';
import avatarRoutes from './routes/users/avatar.js';
import friendsRoutes from './routes/users/friends.js';
import publicRoutes from './routes/users/public.js';
import historyRoutes from './routes/users/history.js';
import playersRoutes from './routes/users/players.js';
import crypto from 'node:crypto'
import path from 'node:path'
import fastifyStatic from '@fastify/static'

dotenv.config()

// Configure Fastify
const fastify = Fastify({
	logger: false
})

fastify.addHook('onRequest', async (request, reply) => {
  const reqId = request.headers['x-request-id'] || crypto.randomUUID()
  request.id = reqId
})

fastify.decorate("authenticate", async function (request, reply) {
  try {
    const token = request.cookies.authToken
    if (!token) {
      return reply.status(401).send({ error: 'No authentication token' })
    }
    
    const decoded = this.jwt.verify(token)
    request.user = decoded
  } catch (err) {
    return reply.status(401).send({ error: 'Invalid token' })
  }
})

await fastify.register(cors, { origin: true, credentials: true })
await fastify.register(jwt, { secret: process.env.JWT_SECRET })
await fastify.register(cookie, { secret: process.env.COOKIE_SECRET })
await fastify.register(dbPlugin)
await fastify.register(multipart, {
  limits: {
	fileSize: 10 * 1024 * 1024 // 10 MB
  }
})
await fastify.register(fastifyStatic, {
  root: path.join(process.cwd(), 'uploads'),
  prefix: '/uploads/',          
  decorateReply: false          
})
await fastify.register(profileRoutes, { prefix: '/users' });
await fastify.register(avatarRoutes, { prefix: '/users' });
await fastify.register(friendsRoutes, { prefix: '/users' });
await fastify.register(publicRoutes, { prefix: '/users' });
await fastify.register(historyRoutes, { prefix: '/users' });
await fastify.register(playersRoutes, { prefix: '/players' });

await fastify.listen({ port: 3003, host: '0.0.0.0' })
