const { Client } = require('pg');

const warehouseConfig = {
  host: '207.154.218.252',
  port: 5432,
  database: 'erp_datawarehouse',
  user: 'erpuser',
  password: 'ERP2025!DataBase#Prod',
  ssl: false
};

async function crearTablasFaltantes() {
  const warehouse = new Client(warehouseConfig);
  
  try {
    await warehouse.connect();
    console.log('✅ Conectado a Data Warehouse');
    console.log('🔄 Creando todas las tablas faltantes...');
    
    // PRODUCTOS
    await warehouse.query(`
      CREATE TABLE IF NOT EXISTS productos (
        id TEXT PRIMARY KEY,
        empresaId TEXT NOT NULL,
        codigo TEXT,
        nombre TEXT NOT NULL,
        categoria TEXT NOT NULL,
        unidadMedida TEXT NOT NULL,
        precioCosto DOUBLE PRECISION,
        stockMinimo DOUBLE PRECISION,
        activo BOOLEAN NOT NULL DEFAULT TRUE,
        createdAt TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ productos creada');
    
    // USUARIOS
    await warehouse.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id TEXT PRIMARY KEY,
        empresaId TEXT NOT NULL,
        email TEXT NOT NULL,
        nombre TEXT NOT NULL,
        apellido TEXT NOT NULL,
        rol TEXT NOT NULL,
        activo BOOLEAN NOT NULL DEFAULT TRUE,
        ultimoLogin TIMESTAMP,
        createdAt TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ usuarios creada');
    
    // TRABAJOS_MAQUINA
    await warehouse.query(`
      CREATE TABLE IF NOT EXISTS trabajos_maquina (
        id TEXT PRIMARY KEY,
        empresaId TEXT NOT NULL,
        maquinaId TEXT NOT NULL,
        loteId TEXT,
        tipoTrabajo TEXT NOT NULL,
        fecha TIMESTAMP NOT NULL,
        horaInicio TEXT,
        horaFin TEXT,
        horasTrabajadas DOUBLE PRECISION,
        combustibleLitros DOUBLE PRECISION,
        costoCombustible DOUBLE PRECISION,
        esServicioTerceros BOOLEAN NOT NULL DEFAULT FALSE,
        clienteTercero TEXT,
        tarifaPorHora DOUBLE PRECISION,
        totalFacturado DOUBLE PRECISION,
        observaciones TEXT,
        createdAt TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ trabajos_maquina creada');
    
    console.log('🎉 Tablas principales creadas');
    console.log('📊 Data Warehouse expandido exitosamente');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await warehouse.end();
  }
}

crearTablasFaltantes();
