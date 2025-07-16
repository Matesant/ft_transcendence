import fp from 'fastify-plugin'
import sqlite3 from 'sqlite3'
import path from 'path'
import fs from 'fs'

export default fp(async (fastify) => {
  const dbPath = process.env.DB_PATH
  if (!dbPath) throw new Error("DB_PATH is not defined in user-service/.env")

  const dbDir = path.dirname(dbPath)
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true })
  }

  const db = new sqlite3.Database(dbPath)

db.serialize(() => {

  db.run(`
    CREATE TABLE IF NOT EXISTS user_profiles (
      id INTEGER PRIMARY KEY,
      alias TEXT UNIQUE NOT NULL,
      display_name TEXT,
      avatar TEXT DEFAULT 'uploads/default.jpeg',
      wins INTEGER DEFAULT 0,
      losses INTEGER DEFAULT 0,
	  is_online INTEGER DEFAULT 0
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS friends (
      id INTEGER PRIMARY KEY,
      user_id INTEGER NOT NULL,
      friend_id INTEGER NOT NULL,
      status TEXT CHECK(status IN ('pending', 'accepted')) DEFAULT 'pending',
      FOREIGN KEY(user_id) REFERENCES user_profiles(id),
      FOREIGN KEY(friend_id) REFERENCES user_profiles(id)
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS match_history (
      id INTEGER PRIMARY KEY,
      user_id INTEGER NOT NULL,
      opponent TEXT,
      result TEXT CHECK(result IN ('win', 'loss', 'wo')) NOT NULL,
      date TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES user_profiles(id)
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
