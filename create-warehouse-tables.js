const { Client } = require('pg');

const warehouseConfig = {
  host: '207.154.218.252',
  port: 5432,
  database: 'erp_datawarehouse',
  user: 'erpuser',
  password: 'ERP2025!DataBase#Prod',
  ssl: false
};

async function crearTablasWarehouse() {
  const warehouse = new Client(warehouseConfig);
  
  try {
    await warehouse.connect();
    console.log('✅ Conectado a Data Warehouse');
    
    // 1. EMPRESAS
    console.log('📋 Creando tabla: empresas');
    await warehouse.query(`DROP TABLE IF EXISTS empresas CASCADE`);
    await warehouse.query(`
      CREATE TABLE empresas (
        id TEXT PRIMARY KEY,
        nombre TEXT NOT NULL,
        cuit TEXT NOT NULL,
        condicionfiscal TEXT NOT NULL,
        direccion TEXT,
        telefono TEXT,
        email TEXT,
        industria TEXT NOT NULL,
        createdAt TIMESTAMP DEFAULT NOW(),
        updatedAt TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ empresas creada');
    
    // 2. LOTES
    console.log('📋 Creando tabla: lotes');
    await warehouse.query(`DROP TABLE IF EXISTS lotes CASCADE`);
    await warehouse.query(`
      CREATE TABLE lotes (
        id TEXT PRIMARY KEY,
        empresaId TEXT NOT NULL,
        numero TEXT NOT NULL,
        nombre TEXT,
        superficie_hectareas DOUBLE PRECISION NOT NULL,
        ubicacionGps TEXT,
        tipoSuelo TEXT,
        descripcion TEXT,
        activo BOOLEAN NOT NULL DEFAULT TRUE,
        createdAt TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ lotes creada');
    
    // 3. MAQUINAS
    console.log('📋 Creando tabla: maquinas');
    await warehouse.query(`DROP TABLE IF EXISTS maquinas CASCADE`);
    await warehouse.query(`
      CREATE TABLE maquinas (
        id TEXT PRIMARY KEY,
        empresaId TEXT NOT NULL,
        nombre TEXT NOT NULL,
        tipo TEXT NOT NULL,
        marca TEXT,
        modelo TEXT,
        ano INTEGER,
        numeroSerie TEXT,
        ubicacionActual TEXT,
        estado TEXT NOT NULL,
        activa BOOLEAN NOT NULL DEFAULT TRUE,
        createdAt TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ maquinas creada');
    
    // 4. TRANSACCIONES
    console.log('📋 Creando tabla: transacciones');
    await warehouse.query(`DROP TABLE IF EXISTS transacciones CASCADE`);
    await warehouse.query(`
      CREATE TABLE transacciones (
        id TEXT PRIMARY KEY,
        empresaId TEXT NOT NULL,
        tipo TEXT NOT NULL,
        categoria TEXT NOT NULL,
        descripcion TEXT NOT NULL,
        importe DOUBLE PRECISION NOT NULL,
        fecha TIMESTAMP NOT NULL,
        metodoPago TEXT,
        chequeId TEXT,
        cosechaId TEXT,
        trabajoMaquinaId TEXT,
        facturaNumero TEXT,
        comprobanteAfip TEXT,
        observaciones TEXT,
        createdAt TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ transacciones creada');
    
    // 5. CHEQUES
    console.log('📋 Creando tabla: cheques');
    await warehouse.query(`DROP TABLE IF EXISTS cheques CASCADE`);
    await warehouse.query(`
      CREATE TABLE cheques (
        id TEXT PRIMARY KEY,
        empresaId TEXT NOT NULL,
        numero TEXT NOT NULL,
        banco TEXT NOT NULL,
        tipo TEXT NOT NULL,
        importe DOUBLE PRECISION NOT NULL,
        fechaEmision TIMESTAMP NOT NULL,
        fechaVencimiento TIMESTAMP NOT NULL,
        estado TEXT NOT NULL,
        librador TEXT,
        beneficiario TEXT,
        concepto TEXT,
        numeroCuenta TEXT,
        fechaDeposito TIMESTAMP,
        observaciones TEXT,
        createdAt TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ cheques creada');
    
    // 6. LIQUIDACIONES_INGENIO
    console.log('📋 Creando tabla: liquidaciones_ingenio');
    await warehouse.query(`DROP TABLE IF EXISTS liquidaciones_ingenio CASCADE`);
    await warehouse.query(`
      CREATE TABLE liquidaciones_ingenio (
        id TEXT PRIMARY KEY,
        empresaId TEXT NOT NULL,
        ingenioNombre TEXT NOT NULL,
        numeroLiquidacion TEXT,
        fechaLiquidacion TIMESTAMP NOT NULL,
        periodoInicio TIMESTAMP NOT NULL,
        periodoFin TIMESTAMP NOT NULL,
        toneladasLiquidadas DOUBLE PRECISION NOT NULL,
        precioPorTonelada DOUBLE PRECISION NOT NULL,
        totalBruto DOUBLE PRECISION NOT NULL,
        deducciones DOUBLE PRECISION NOT NULL,
        totalNeto DOUBLE PRECISION NOT NULL,
        estado TEXT NOT NULL,
        observaciones TEXT,
        createdAt TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ liquidaciones_ingenio creada');
    
    console.log('🎯 Todas las 6 tablas críticas creadas exitosamente');
    console.log('📊 Data Warehouse listo para sincronización');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await warehouse.end();
  }
}

crearTablasWarehouse();
