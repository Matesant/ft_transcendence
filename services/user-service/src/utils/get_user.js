export async function getUserIdByAlias(fastify, alias) {
  const user = await fastify.db.get('SELECT id FROM user_profiles WHERE alias = ?', [alias])
  return user?.id
}
