// dwh-query.js
const { Pool } = require('pg');

// Ajusta tus credenciales si cambian:
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
    const { rows } = await pool.query(`
      SELECT
        TO_CHAR(DATE_TRUNC('month', fecha), 'YYYY-MM-DD') AS mes,
        SUM(importe) AS total_ventas
      FROM transacciones
      WHERE empresaid = 'laramada'
        AND tipo = 'INGRESO'
      GROUP BY DATE_TRUNC('month', fecha)
      ORDER BY mes DESC;
    `);
    console.table(rows);
  } catch (err) {
    console.error('❌ Error consultando DWH:', err);
  } finally {
    await pool.end();
  }
})();
