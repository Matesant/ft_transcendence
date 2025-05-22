// filepath: backend/src/plugins/db.js
import fp from 'fastify-plugin'
import sqlite3 from 'sqlite3'
import { open } from 'sqlite'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

export default fp(async (fastify) => {
  const __dirname = path.dirname(fileURLToPath(import.meta.url))
  const rootDir = path.resolve(__dirname, '../../')

  // Usa caminho do .env ou padrão ./data/players.db
  const dbPath = process.env.DB_PATH || path.join(rootDir, 'data', 'players.db')

  // Garante que o diretório exista
  const dbDir = path.dirname(dbPath)
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true })
  }

  console.log('Using database at:', dbPath)

  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  })

  await db.exec(`
    CREATE TABLE IF NOT EXISTS players (
      id INTEGER PRIMARY KEY,
      alias TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  await db.exec(`
    CREATE TABLE IF NOT EXISTS matches (
      id INTEGER PRIMARY KEY,
      player1 TEXT NOT NULL,
      player2 TEXT,
      winner TEXT,
      status TEXT DEFAULT 'pending',
      round INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  await db.exec(`
    CREATE TABLE IF NOT EXISTS two_factor_codes (
      id INTEGER PRIMARY KEY,
      alias TEXT NOT NULL,
      code TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  fastify.decorate('db', db)
})
