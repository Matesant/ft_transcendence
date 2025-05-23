import fp from 'fastify-plugin'
import sqlite3 from 'sqlite3'
import path from 'path'
import fs from 'fs'

export default fp(async (fastify) => {
  const dbPath = process.env.DB_PATH
  if (!dbPath) throw new Error("DB_PATH is not defined in .env")

  const dbDir = path.dirname(dbPath)
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true })
  }

  const db = new sqlite3.Database(dbPath)

  db.serialize(() => {
    db.run(`
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
  })

  fastify.decorate('db', {
    run: (...args) => new Promise((res, rej) => db.run(...args, function (err) {
      if (err) return rej(err)
      res(this)
    })),
    get: (...args) => new Promise((res, rej) => db.get(...args, (err, row) => {
      if (err) return rej(err)
      res(row)
    })),
    all: (...args) => new Promise((res, rej) => db.all(...args, (err, rows) => {
      if (err) return rej(err)
      res(rows)
    }))
  })
})
