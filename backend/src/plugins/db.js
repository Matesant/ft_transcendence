// filepath: /home/matesant/ft_transcendence/backend/src/plugins/db.js
import fp from 'fastify-plugin'
import sqlite3 from 'sqlite3'
import { open } from 'sqlite'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

export default fp(async (fastify) => {
  // Create a data directory for our database files
  const dataDir = '/app/data'
  let dbPath;
  
  // Use this for local development without Docker
  if (!fs.existsSync(dataDir)) {
    try {
      // Create data directory in the project root
      const __dirname = path.dirname(fileURLToPath(import.meta.url))
      const projectRoot = path.resolve(__dirname, '../../')
      const localDataDir = path.join(projectRoot, 'data')
      
      if (!fs.existsSync(localDataDir)) {
        fs.mkdirSync(localDataDir, { recursive: true })
      }
      
      dbPath = path.join(localDataDir, 'players.db')
      console.log('Using local database path:', dbPath)
    } catch (err) {
      console.error('Error creating local data directory:', err)
      throw err
    }
  } else {
    dbPath = path.join(dataDir, 'players.db')
    console.log('Using Docker database path:', dbPath)
  }
  
  // Open the database
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  })

  await db.exec(`
    CREATE TABLE IF NOT EXISTS players (
      id INTEGER PRIMARY KEY,
      alias TEXT UNIQUE NOT NULL,
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
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  fastify.decorate('db', db)
})
