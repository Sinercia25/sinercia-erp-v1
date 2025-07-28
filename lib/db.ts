// 🔹 lib/db.ts
// Conexión al Data Warehouse (PostgreSQL en DigitalOcean)

import { Pool } from 'pg'

export const db = new Pool({
  connectionString: process.env.DWH_URL,
  ssl: { rejectUnauthorized: false }
})
