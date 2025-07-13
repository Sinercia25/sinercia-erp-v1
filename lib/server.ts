import parseDbUrl from 'parse-database-url'
import { Pool as PgPool } from 'pg'
import { OpenAI } from 'openai'

// 📥 CARGA Y VALIDACIÓN DE VARIABLES DE ENTORNO
const { DWH_URL, DATABASE_URL, OPENAI_API_KEY } = process.env
if (!DWH_URL || !DATABASE_URL || !OPENAI_API_KEY) {
  throw new Error('Faltan variables de entorno: DWH_URL, DATABASE_URL o OPENAI_API_KEY')
}

// lib/server.ts (continúa)

// 🌐 POOL DE CONEXIÓN AL DATA WAREHOUSE
const dwhConfig = parseDbUrl(DWH_URL)
export const dwhPool = new PgPool({
  host:               dwhConfig.host,
  port:               dwhConfig.port,
  user:               dwhConfig.user,
  password:           dwhConfig.password,
  database:           dwhConfig.database,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30_000
})

// 🏭 POOL DE CONEXIÓN A LA BD PRINCIPAL
const mainDbConfig = parseDbUrl(DATABASE_URL)
export const mainDbPool = new PgPool({
  host:              mainDbConfig.host,
  port:              mainDbConfig.port,
  user:              mainDbConfig.user,
  password:          mainDbConfig.password,
  database:          mainDbConfig.database,
  ssl: { rejectUnauthorized: false },
  statement_timeout: 5_000
})


// lib/server.ts (continúa)

// 🤖 CLIENTE DE OPENAI
export const openai = new OpenAI({ apiKey: OPENAI_API_KEY })
