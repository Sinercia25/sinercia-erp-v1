// add-empresa-cols.js
require('dotenv').config();
const { Pool } = require('pg');

// Conexión via DATABASE_URL + pgbouncer
const pool = new Pool({
  connectionString: process.env.DATABASE_URL + '&pgbouncer=true',
  ssl: { rejectUnauthorized: false }
});

(async () => {
  try {
    await pool.query(`
      ALTER TABLE empresas
      ADD COLUMN IF NOT EXISTS "supabaseId" TEXT,
      ADD COLUMN IF NOT EXISTS "dataWarehouseId" TEXT,
      ADD COLUMN IF NOT EXISTS "sector" TEXT;
    `);
    console.log('✅ Columnas añadidas (o ya existían) en empresas');
  } catch (err) {
    console.error('❌ Error al alterar tabla empresas:', err.message);
  } finally {
    await pool.end();
  }
})();

