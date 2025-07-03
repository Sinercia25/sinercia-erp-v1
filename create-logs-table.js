// 📋 CREAR TABLA DE LOGS - Data Warehouse
const { Client } = require('pg');

const warehouseConfig = {
  host: '207.154.218.252',
  port: 5432,
  database: 'erp_datawarehouse',
  user: 'erpuser',
  password: 'ERP2025!DataBase#Prod',
  ssl: false
};

async function crearTablaLogs() {
  const cliente = new Client(warehouseConfig);
  
  try {
    await cliente.connect();
    console.log('✅ Conectado al Data Warehouse');
    
    const sqlCrearTabla = `
      CREATE TABLE IF NOT EXISTS sync_logs (
        id SERIAL PRIMARY KEY,
        timestamp TIMESTAMP DEFAULT NOW(),
        estado VARCHAR(20) NOT NULL,
        tiempo_ms INTEGER,
        tablas_sincronizadas INTEGER,
        registros_totales INTEGER DEFAULT 0,
        error_mensaje TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;
    
    await cliente.query(sqlCrearTabla);
    console.log('✅ Tabla sync_logs creada exitosamente');
    
    const sqlLogInicial = `
      INSERT INTO sync_logs (estado, tiempo_ms, tablas_sincronizadas, error_mensaje)
      VALUES ('SETUP', 0, 0, 'Tabla de logs creada - Sistema inicializado');
    `;
    
    await cliente.query(sqlLogInicial);
    console.log('✅ Log inicial creado');
    
    console.log('🎯 Tabla de logs lista para monitorear sincronizaciones');
    
  } catch (error) {
    console.error('❌ Error creando tabla de logs:', error.message);
  } finally {
    await cliente.end();
  }
}

crearTablaLogs();
