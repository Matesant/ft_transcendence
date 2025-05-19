import fp from 'fastify-plugin'
import sqlite3 from 'sqlite3'
import { open } from 'sqlite'

export default fp(async (fastify) => {
  const db = await open({
    filename: './data/players.db',
    driver: sqlite3.Database
  })

  await db.exec(`
    CREATE TABLE IF NOT EXISTS players (
      id INTEGER PRIMARY KEY,
      alias TEXT UNIQUE NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  fastify.decorate('db', db)
})
