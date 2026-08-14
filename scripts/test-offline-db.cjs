// 验证 sql.js 离线层核心逻辑（DDL + 代表性 CRUD，与 offline/db.ts + handlers 相同 SQL）
const initSqlJs = require('sql.js')
const fs = require('fs')

const DDL = `
CREATE TABLE IF NOT EXISTS Runner (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, age INTEGER, gender TEXT,
  weight REAL, height INTEGER, restingHr INTEGER, maxHr INTEGER, vo2max REAL,
  experience TEXT, targetRace TEXT, targetDate TEXT, targetTime TEXT,
  weeklyMileage INTEGER, notes TEXT, createdAt TEXT, updatedAt TEXT
);
CREATE TABLE IF NOT EXISTS TrainingWeek (
  id TEXT PRIMARY KEY, weekStart TEXT, weekEnd TEXT, weekNumber INTEGER,
  phase TEXT, goal TEXT, summary TEXT, createdAt TEXT, updatedAt TEXT
);
CREATE TABLE IF NOT EXISTS TrainingSession (
  id TEXT PRIMARY KEY, weekId TEXT, date TEXT, dayOfWeek INTEGER, type TEXT,
  plannedDistance REAL, plannedDuration INTEGER, plannedPace TEXT, intensity TEXT,
  description TEXT, status TEXT DEFAULT 'pending', "order" INTEGER DEFAULT 0,
  createdAt TEXT, updatedAt TEXT
);
CREATE INDEX IF NOT EXISTS idx_session_week ON TrainingSession(weekId);
CREATE TABLE IF NOT EXISTS TrainingCompletion (
  id TEXT PRIMARY KEY, sessionId TEXT UNIQUE, distance REAL, duration INTEGER,
  avgPace TEXT, avgPaceSec INTEGER, avgHr INTEGER, maxHr INTEGER, elevation INTEGER,
  cadence INTEGER, calories INTEGER, weather TEXT, temperature REAL,
  rpe INTEGER, feeling INTEGER, feelingNote TEXT, imageDataUrl TEXT,
  rawExtract TEXT, notes TEXT, shoeId TEXT, createdAt TEXT, updatedAt TEXT
);
CREATE TABLE IF NOT EXISTS AIReview (
  id TEXT PRIMARY KEY, weekId TEXT, type TEXT, content TEXT,
  rating INTEGER, suggestions TEXT, createdAt TEXT
);
CREATE TABLE IF NOT EXISTS Shoe (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, brand TEXT, model TEXT,
  type TEXT DEFAULT 'daily', color TEXT, purchasedAt TEXT,
  lifespan INTEGER DEFAULT 800, retired INTEGER DEFAULT 0, notes TEXT,
  createdAt TEXT, updatedAt TEXT
);
CREATE TABLE IF NOT EXISTS ShoeUsage (
  id TEXT PRIMARY KEY, shoeId TEXT, completionId TEXT, distance REAL,
  date TEXT, note TEXT, createdAt TEXT
);
CREATE TABLE IF NOT EXISTS RecoveryLog (
  id TEXT PRIMARY KEY, date TEXT UNIQUE, sleepHours REAL, sleepQuality INTEGER,
  waterIntake REAL, nutrition INTEGER, muscleSoreness INTEGER, fatigue INTEGER,
  mood INTEGER, preRunFuel TEXT, duringFuel TEXT, postRunFuel TEXT,
  notes TEXT, createdAt TEXT, updatedAt TEXT
);
CREATE TABLE IF NOT EXISTS PersonalRecord (
  id TEXT PRIMARY KEY, distance TEXT UNIQUE, distanceKm REAL, timeSec INTEGER,
  date TEXT, location TEXT, raceName TEXT, paceSec INTEGER, notes TEXT,
  createdAt TEXT, updatedAt TEXT
);
`

async function main() {
  const SQL = await initSqlJs({ locateFile: (f) => require('path').join(__dirname, '..', 'node_modules', 'sql.js', 'dist', f) })
  const db = new SQL.Database()
  db.run(DDL)

  // runner
  db.run('INSERT INTO Runner (id, name, age, gender, weight, height, restingHr, maxHr, vo2max, experience, targetRace, targetDate, targetTime, weeklyMileage, notes, createdAt, updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', ['r1', '测试跑者', 28, 'male', 65, 175, 58, 190, 50, 'intermediate', '半马', null, '1:45:00', 40, null, new Date().toISOString(), new Date().toISOString()])
  let runner = db.exec('SELECT * FROM Runner LIMIT 1')[0]
  console.log('RUNNER OK:', JSON.stringify(runner.values[0].slice(0, 3)))

  // week + sessions
  const now = new Date().toISOString()
  db.run('INSERT INTO TrainingWeek (id, weekStart, weekEnd, weekNumber, phase, goal, summary, createdAt, updatedAt) VALUES (?,?,?,?,?,?,?,?,?)', ['w1', now, now, 1, 'base', '测试目标', '测试', now, now])
  db.run('INSERT INTO TrainingSession (id, weekId, date, dayOfWeek, type, plannedDistance, plannedDuration, plannedPace, intensity, description, status, "order", createdAt, updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)', ['s1', 'w1', now, 1, 'easy', 8, 50, '6:00/km', 'Z2', '轻松跑', 'pending', 0, now, now])
  const sessions = db.exec('SELECT * FROM TrainingSession WHERE weekId = ?', ['w1'])
  console.log('WEEK SESSIONS OK:', sessions[0].values.length)

  // completion
  db.run('INSERT INTO TrainingCompletion (id, sessionId, distance, duration, avgPace, avgPaceSec, avgHr, maxHr, elevation, cadence, calories, weather, temperature, rpe, feeling, feelingNote, imageDataUrl, rawExtract, notes, shoeId, createdAt, updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', ['c1', 's1', 8.2, 3000, '5:50/km', 350, 150, 170, 50, 175, 500, '晴', 22, 6, 7, '不错', null, null, null, null, now, now])
  const c = db.exec('SELECT distance, avgPaceSec FROM TrainingCompletion WHERE sessionId = ?', ['s1'])
  console.log('COMPLETION OK:', JSON.stringify(c[0].values[0]))

  // LIKE 搜索
  const search = db.exec("SELECT * FROM TrainingSession WHERE type LIKE ? OR description LIKE ?", ['%轻松%', '%轻松%'])
  console.log('SEARCH OK:', search[0].values.length)

  // ACWR 聚合
  const agg = db.exec('SELECT COALESCE(SUM(plannedDistance),0) as s FROM TrainingSession WHERE weekId = ?', ['w1'])
  console.log('AGG OK:', agg[0].values[0])

  console.log('\n✅ sql.js 离线层核心逻辑验证通过')
  process.exit(0)
}

main().catch((e) => { console.error('FAIL:', e.message); process.exit(1) })
