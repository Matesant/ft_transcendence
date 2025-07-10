import registerRoutes from './auth/register.js'
import loginRoutes from './auth/login.js'
import twoFactorRoutes from './auth/twoFactor.js'
import credentialsRoutes from './auth/credentials.js'
import sessionRoutes from './auth/session.js'

export default async function (fastify, opts) {
  // Registra todos os módulos de rotas
  await fastify.register(registerRoutes)
  await fastify.register(loginRoutes)
  await fastify.register(twoFactorRoutes)
  await fastify.register(credentialsRoutes)
  await fastify.register(sessionRoutes)
}
