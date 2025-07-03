const { Client } = require('pg');

const warehouseConfig = {
  host: '207.154.218.252',
  port: 5432,
  database: 'erp_datawarehouse',
  user: 'erpuser',
  password: 'ERP2025!DataBase#Prod',
  ssl: false
};

async function verificarUsuarios() {
  const warehouse = new Client(warehouseConfig);
  
  try {
    await warehouse.connect();
    
    const result = await warehouse.query(`
      SELECT COUNT(*) as total, 
             STRING_AGG(DISTINCT rol, ', ') as roles
      FROM usuarios 
      WHERE empresaId = 'laramada' AND activo = true
    `);
    
    console.log(`👥 Total empleados: ${result.rows[0].total}`);
    console.log(`🏢 Roles: ${result.rows[0].roles}`);
    
    // Contar por área
    const porArea = await warehouse.query(`
      SELECT 
        CASE 
          WHEN rol LIKE '%Gerente%' THEN 'Gerencia'
          WHEN rol LIKE '%Admin%' OR rol LIKE '%Contador%' OR rol LIKE '%Tesorero%' THEN 'Administración'
          WHEN rol LIKE '%Ingeniero%' OR rol LIKE '%Capataz%' OR rol LIKE '%Operario%' THEN 'Producción'
          WHEN rol LIKE '%Comercial%' OR rol LIKE '%Vendedor%' THEN 'Comercial'
          ELSE 'Operaciones'
        END as area,
        COUNT(*) as cantidad
      FROM usuarios 
      WHERE empresaId = 'laramada' AND activo = true
      GROUP BY 1
      ORDER BY cantidad DESC
    `);
    
    console.log('\n📊 Por área:');
    porArea.rows.forEach(row => {
      console.log(`${row.area}: ${row.cantidad} personas`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await warehouse.end();
  }
}

verificarUsuarios();
