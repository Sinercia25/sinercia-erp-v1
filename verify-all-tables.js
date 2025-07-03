const { Client } = require('pg');

const warehouseConfig = {
  host: '207.154.218.252',
  port: 5432,
  database: 'erp_datawarehouse',
  user: 'erpuser',
  password: 'ERP2025!DataBase#Prod',
  ssl: false
};

async function verificarTodasLasTablas() {
  const warehouse = new Client(warehouseConfig);
  
  try {
    await warehouse.connect();
    console.log('✅ Conectado a Data Warehouse');
    console.log('\n📊 VERIFICACIÓN COMPLETA DE TODAS LAS TABLAS:');
    console.log('=' .repeat(60));
    
    const tablas = ['empresas', 'lotes', 'maquinas', 'transacciones', 'cheques', 'liquidaciones_ingenio', 'sync_logs'];
    
    let totalRegistros = 0;
    
    for (const tabla of tablas) {
      try {
        const resultado = await warehouse.query(`SELECT COUNT(*) as total FROM ${tabla}`);
        const count = parseInt(resultado.rows[0].total);
        totalRegistros += count;
        
        console.log(`📋 ${tabla.padEnd(20)} | ${count.toString().padStart(3)} registros | ${count > 0 ? '✅' : '❌'}`);
        
        // Mostrar muestra de datos para tablas principales
        if (count > 0 && ['lotes', 'maquinas', 'transacciones'].includes(tabla)) {
          const muestra = await warehouse.query(`SELECT * FROM ${tabla} LIMIT 2`);
          muestra.rows.forEach((row, i) => {
            if (i === 0) console.log(`    Muestra: ${JSON.stringify(row).substring(0, 100)}...`);
          });
        }
        
      } catch (error) {
        console.log(`❌ ${tabla.padEnd(20)} | ERROR: ${error.message}`);
      }
    }
    
    console.log('=' .repeat(60));
    console.log(`📈 TOTAL REGISTROS: ${totalRegistros}`);
    
    // Verificar algunos datos específicos
    console.log('\n🎯 MÉTRICAS ESPECÍFICAS:');
    
    const lotes = await warehouse.query('SELECT COUNT(*) as total, SUM(superficie_hectareas) as superficie FROM lotes WHERE activo = true');
    console.log(`🌾 Lotes activos: ${lotes.rows[0].total} | Superficie: ${parseFloat(lotes.rows[0].superficie || 0).toFixed(1)} ha`);
    
    const transacciones = await warehouse.query(`
      SELECT 
        SUM(CASE WHEN tipo = 'INGRESO' THEN importe ELSE 0 END) as ingresos,
        SUM(CASE WHEN tipo = 'EGRESO' THEN importe ELSE 0 END) as egresos,
        COUNT(*) as total
      FROM transacciones
    `);
    console.log(`💰 Transacciones: ${transacciones.rows[0].total} | Ingresos: $${(parseFloat(transacciones.rows[0].ingresos || 0) / 1000000).toFixed(1)}M | Egresos: $${(parseFloat(transacciones.rows[0].egresos || 0) / 1000000).toFixed(1)}M`);
    
    const maquinas = await warehouse.query("SELECT COUNT(*) as total, COUNT(CASE WHEN estado = 'Operativa' THEN 1 END) as operativas FROM maquinas WHERE activa = true");
    console.log(`🚜 Máquinas: ${maquinas.rows[0].total} total | ${maquinas.rows[0].operativas} operativas`);
    
    console.log('\n🎉 VERIFICACIÓN COMPLETADA');
    
  } catch (error) {
    console.error('❌ Error verificando:', error.message);
  } finally {
    await warehouse.end();
  }
}

verificarTodasLasTablas();
