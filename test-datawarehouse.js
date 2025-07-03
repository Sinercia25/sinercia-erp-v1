const { Pool } = require('pg');

const dataWarehousePool = new Pool({
  host: '207.154.218.252',
  port: 5432,
  database: 'erp_datawarehouse',
  user: 'erpuser',
  password: 'ERP2025!DataBase#Prod',
  ssl: false
});

async function testConnection() {
  try {
    console.log('🔄 Probando conexión al Data Warehouse...');
    
    const client = await dataWarehousePool.connect();
    console.log('✅ Conexión exitosa!');
    
    const result = await client.query('SELECT NOW() as current_time, version() as postgres_version');
    console.log('📊 Datos del servidor:');
    console.log('   Hora:', result.rows[0].current_time);
    console.log('   Versión:', result.rows[0].postgres_version);
    
    client.release();
    console.log('🎉 Data Warehouse funcionando correctamente!');
    
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Solución: Configurar firewall en droplet');
    }
  } finally {
    await dataWarehousePool.end();
  }
}

testConnection();