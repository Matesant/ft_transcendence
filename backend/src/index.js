import Fastify from 'fastify'
import fastifyJWT from '@fastify/jwt'
import cors from '@fastify/cors'
import dotenv from 'dotenv'
import authRoutes from './routes/auth.js'
import playersRoutes from './routes/players.js'
import onlineRoutes from './routes/online.js'
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
await fastify.register(authRoutes, { prefix: '/auth' })
await fastify.register(playersRoutes, { prefix: '/players' })
await fastify.register(onlineRoutes, { prefix: '/' })
await fastify.register(matchRoutes, { prefix: '/match' })
await fastify.register(fastifyJWT, {
	secret: process.env.JWT_SECRET || 'jorge-super-secrets'
})


fastify.listen({ port: process.env.PORT || 3000, host: '0.0.0.0' })
