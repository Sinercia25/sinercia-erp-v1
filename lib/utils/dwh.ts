// /lib/utils/dwh.ts

import { Pool } from 'pg'
import parseDbUrl from 'parse-database-url'

const config = parseDbUrl(process.env.DWH_URL!)
const dwh = new Pool({
  host: config.host,
  port: config.port,
  user: config.user,
  password: config.password,
  database: config.database,
  ssl: { rejectUnauthorized: false },
})

export async function queryDWH(sql: string, params: any[] = []) {
  const { rows } = await dwh.query(sql, params)
  return rows
}
