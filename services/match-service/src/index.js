import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import dotenv from 'dotenv'
import dbPlugin from './plugins/db.js'
import matchRoutes from './routes/match.js'

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
await fastify.register(jwt, { secret: process.env.JWT_SECRET })
await fastify.register(matchRoutes, { prefix: '/match' })

fastify.listen({ port: 3000, host: '0.0.0.0' })
