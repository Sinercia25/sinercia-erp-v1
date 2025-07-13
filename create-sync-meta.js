// create-sync-meta.js
const { Pool } = require('pg');

// Configuración de la conexión al Data Warehouse
const pool = new Pool({
  host: '207.154.218.252',
  port: 5432,
  database: 'erp_datawarehouse',
  user: 'erpuser',
  password: 'ERP2025!DataBase#Prod',
  ssl: false
});

(async () => {
  try {
    // Crea la tabla sync_meta si no existe
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sync_meta (
        grupo TEXT PRIMARY KEY,
        last_run TIMESTAMPTZ NOT NULL
      );
    `);
    console.log('✅ Tabla sync_meta creada (o ya existía)');
  } catch (err) {
    console.error('❌ Error creando sync_meta:', err.message);
  } finally {
    await pool.end();
  }
})();
