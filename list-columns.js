// list-columns.js
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL + '&pgbouncer=true',
  ssl: {
    rejectUnauthorized: false
  }
});

(async () => {
  try {
    const { rows } = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'empresas'
      ORDER BY ordinal_position;
    `);
    console.log(rows.map(r => r.column_name).join('\n'));
  } catch (err) {
    console.error('❌ Error al consultar columnas:', err.message);
  } finally {
    await pool.end();
  }
})();
