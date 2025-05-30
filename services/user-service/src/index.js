import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import dotenv from 'dotenv'
import dbPlugin from '../plugins/db.js'
import userRoutes from './routes/users.js'
import multipart from '@fastify/multipart'

dotenv.config()

const fastify = Fastify({ logger: true })

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
await fastify.register(userRoutes, { prefix: '/users' })

await fastify.listen({ port: 3000, host: '0.0.0.0' })
