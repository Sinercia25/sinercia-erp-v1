// populate-empresa.js
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL + '&pgbouncer=true',
  ssl: { rejectUnauthorized: false }
});

(async () => {
  try {
    // Ajusta estos valores según tu ID real
    const id = 'emp_001';
    const supabaseId = 'emp_001';
    const dataWarehouseId = 'laramada';
    const sector = 'agro';

    const res = await pool.query(
      `UPDATE empresas
       SET
         "supabaseId"      = $1,
         "dataWarehouseId" = $2,
         "sector"          = $3
       WHERE id = $4
       RETURNING *;`,
      [supabaseId, dataWarehouseId, sector, id]
    );
    if (res.rowCount === 0) {
      console.log('⚠️ No existe empresa con id =', id);
    } else {
      console.log('✅ Empresa actualizada:', res.rows[0]);
    }
  } catch (err) {
    console.error('❌ Error populando empresa:', err.message);
  } finally {
    await pool.end();
  }
})();
