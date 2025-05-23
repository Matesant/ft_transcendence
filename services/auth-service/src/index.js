import Fastify from 'fastify'
import fastifyJWT from '@fastify/jwt'
import cors from '@fastify/cors'
import dotenv from 'dotenv'
import dbPlugin from './plugins/db.js'
import authRoutes from './routes/auth.js'
import playersRoutes from './routes/players.js'

dotenv.config()

const fastify = Fastify({ logger: true })

fastify.decorate("authenticate", async function (request, reply) {
  try {
    await request.jwtVerify()
  } catch (err) {
    reply.send(err)
  }
})

await fastify.register(cors)
await fastify.register(dbPlugin)
await fastify.register(fastifyJWT, {
  secret: process.env.JWT_SECRET || 'default-secret'
})
await fastify.register(authRoutes, { prefix: '/auth' })
await fastify.register(playersRoutes, { prefix: '/players' })

fastify.listen({ port: 3000, host: '0.0.0.0' })