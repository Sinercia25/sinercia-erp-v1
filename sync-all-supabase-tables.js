const { Client } = require('pg');

const warehouseConfig = {
  host: '207.154.218.252',
  port: 5432,
  database: 'erp_datawarehouse',
  user: 'erpuser',
  password: 'ERP2025!DataBase#Prod',
  ssl: false
};

// TODAS LAS TABLAS SEGÚN TU DOCUMENTACIÓN ORIGINAL (21 TABLAS)
const TODAS_LAS_TABLAS = {
  // ERP CORE (12 tablas)
  empresas: `
    CREATE TABLE IF NOT EXISTS empresas (
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
  `,
  
  lotes: `
    CREATE TABLE IF NOT EXISTS lotes (
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
  `,
  
  maquinas: `
    CREATE TABLE IF NOT EXISTS maquinas (
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
  `,
  
  transacciones: `
    CREATE TABLE IF NOT EXISTS transacciones (
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
  `,
  
  productos: `
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
  `,
  
  stock_productos: `
    CREATE TABLE IF NOT EXISTS stock_productos (
      id TEXT PRIMARY KEY,
      empresaId TEXT NOT NULL,
      productoId TEXT NOT NULL,
      depositoId TEXT NOT NULL,
      cantidad DOUBLE PRECISION NOT NULL,
      updatedAt TIMESTAMP DEFAULT NOW()
    )
  `,
  
  movimientos_stock: `
    CREATE TABLE IF NOT EXISTS movimientos_stock (
      id TEXT PRIMARY KEY,
      empresaId TEXT NOT NULL,
      productoId TEXT NOT NULL,
      depositoId TEXT NOT NULL,
      tipoMovimiento TEXT NOT NULL,
      cantidad DOUBLE PRECISION NOT NULL,
      precioUnitario DOUBLE PRECISION,
      motivo TEXT,
      loteId TEXT,
      trabajoMaquinaId TEXT,
      facturaNumero TEXT,
      observaciones TEXT,
      createdAt TIMESTAMP DEFAULT NOW()
    )
  `,
  
  depositos: `
    CREATE TABLE IF NOT EXISTS depositos (
      id TEXT PRIMARY KEY,
      empresaId TEXT NOT NULL,
      nombre TEXT NOT NULL,
      ubicacion TEXT,
      tipo TEXT NOT NULL,
      activo BOOLEAN NOT NULL DEFAULT TRUE,
      createdAt TIMESTAMP DEFAULT NOW()
    )
  `,
  
  cheques: `
    CREATE TABLE IF NOT EXISTS cheques (
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
  `,
  
  campanas: `
    CREATE TABLE IF NOT EXISTS campanas (
      id TEXT PRIMARY KEY,
      empresaId TEXT NOT NULL,
      nombre TEXT NOT NULL,
      fechaInicio TIMESTAMP NOT NULL,
      fechaFin TIMESTAMP,
      activa BOOLEAN NOT NULL DEFAULT TRUE,
      observaciones TEXT,
      createdAt TIMESTAMP DEFAULT NOW()
    )
  `,
  
  cultivos: `
    CREATE TABLE IF NOT EXISTS cultivos (
      id TEXT PRIMARY KEY,
      empresaId TEXT NOT NULL,
      loteId TEXT NOT NULL,
      campanaId TEXT NOT NULL,
      tipoCultivo TEXT NOT NULL,
      variedad TEXT NOT NULL,
      fechaSiembra TIMESTAMP,
      fechaCosechaEstimada TIMESTAMP,
      estado TEXT NOT NULL,
      observaciones TEXT,
      createdAt TIMESTAMP DEFAULT NOW()
    )
  `,
  
  cosechas: `
    CREATE TABLE IF NOT EXISTS cosechas (
      id TEXT PRIMARY KEY,
      empresaId TEXT NOT NULL,
      cultivoId TEXT NOT NULL,
      fecha TIMESTAMP NOT NULL,
      toneladas DOUBLE PRECISION NOT NULL,
      superficieCosechada DOUBLE PRECISION NOT NULL,
      tch DOUBLE PRECISION,
      clienteServicio TEXT,
      precioPorTonelada DOUBLE PRECISION,
      totalFacturado DOUBLE PRECISION,
      observaciones TEXT,
      createdAt TIMESTAMP DEFAULT NOW()
    )
  `,
  
  // TABLAS OPERATIVAS ADICIONALES
  liquidaciones_ingenio: `
    CREATE TABLE IF NOT EXISTS liquidaciones_ingenio (
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
  `,
  
  entregas_ingenio: `
    CREATE TABLE IF NOT EXISTS entregas_ingenio (
      id TEXT PRIMARY KEY,
      empresaId TEXT NOT NULL,
      liquidacionId TEXT,
      cosechaId TEXT NOT NULL,
      fechaEntrega TIMESTAMP NOT NULL,
      toneladasEntregadas DOUBLE PRECISION NOT NULL,
      numeroGuia TEXT,
      conciliado BOOLEAN NOT NULL DEFAULT FALSE,
      diferenciaToneladas DOUBLE PRECISION NOT NULL DEFAULT 0,
      observaciones TEXT,
      createdAt TIMESTAMP DEFAULT NOW()
    )
  `,
  
  usuarios: `
    CREATE TABLE IF NOT EXISTS usuarios (
      id TEXT PRIMARY KEY,
      empresaId TEXT NOT NULL,
      email TEXT NOT NULL,
      nombre TEXT NOT NULL,
      apellido TEXT NOT NULL,
      rol TEXT NOT NULL,
      activo BOOLEAN NOT NULL DEFAULT TRUE,
      ultimoLogin TIMESTAMP,
      createdAt TIMESTAMP DEFAULT NOW(),
      category_id TEXT,
      subcategory_id TEXT,
      priority_level INTEGER,
      permissions_override JSONB,
      last_activity TIMESTAMP,
      is_active_session BOOLEAN
    )
  `,
  
  trabajos_maquina: `
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
  `,
  
  // KNOWLEDGE HUB (5 TABLAS ENTERPRISE)
  companies: `
    CREATE TABLE IF NOT EXISTS companies (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      industry_type TEXT NOT NULL,
      plan_type TEXT,
      encryption_key TEXT,
      security_level TEXT,
      audit_enabled BOOLEAN,
      data_retention_days INTEGER,
      industry_config JSONB,
      active BOOLEAN,
      created_at TIMESTAMP DEFAULT NOW(),
      created_by TEXT,
      last_access TIMESTAMP,
      ip_whitelist TEXT[],
      gdpr_compliant BOOLEAN,
      soc2_compliant BOOLEAN,
      iso27001_compliant BOOLEAN
    )
  `,
  
  document_categories: `
    CREATE TABLE IF NOT EXISTS document_categories (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      display_name TEXT NOT NULL,
      description TEXT,
      icon TEXT,
      color TEXT,
      industry_focus TEXT,
      industry_specific_config JSONB,
      requires_encryption BOOLEAN,
      audit_level TEXT,
      retention_policy TEXT,
      active BOOLEAN DEFAULT TRUE,
      sort_order INTEGER,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `,
  
  company_documents: `
    CREATE TABLE IF NOT EXISTS company_documents (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      client_id TEXT NOT NULL,
      category_id UUID,
      document_name TEXT NOT NULL,
      original_filename TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_type TEXT NOT NULL,
      file_size BIGINT,
      mime_type TEXT,
      processing_status TEXT,
      processing_error TEXT,
      extraction_result JSONB,
      tags TEXT[],
      description TEXT,
      auto_detected_type TEXT,
      confidence_score DOUBLE PRECISION,
      is_sensitive BOOLEAN,
      encryption_level TEXT,
      access_level TEXT,
      retention_policy TEXT,
      upload_date TIMESTAMP DEFAULT NOW(),
      last_accessed TIMESTAMP,
      access_count INTEGER DEFAULT 0,
      created_by TEXT,
      modified_by TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `,
  
  document_content: `
    CREATE TABLE IF NOT EXISTS document_content (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      document_id UUID,
      client_id TEXT NOT NULL,
      content_type TEXT NOT NULL,
      extracted_text TEXT,
      structured_data JSONB,
      page_number INTEGER,
      section_title TEXT,
      section_order INTEGER,
      embeddings VECTOR,
      confidence_score DOUBLE PRECISION,
      language TEXT,
      word_count INTEGER,
      char_count INTEGER,
      is_encrypted BOOLEAN,
      contains_pii BOOLEAN,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `,
  
  security_audit_log: `
    CREATE TABLE IF NOT EXISTS security_audit_log (
      id SERIAL PRIMARY KEY,
      client_id TEXT,
      user_id TEXT,
      session_id TEXT,
      action TEXT,
      table_name TEXT,
      record_id TEXT,
      affected_columns TEXT,
      ip_address TEXT,
      user_agent TEXT,
      country TEXT,
      query_fingerprint TEXT,
      execution_time_ms INTEGER,
      success BOOLEAN,
      error_message TEXT,
      risk_score INTEGER,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `
};

async function crearTodasLasTablas() {
  const warehouse = new Client(warehouseConfig);
  
  try {
    console.log('🔄 CREANDO TODAS LAS TABLAS DE SUPABASE EN DATA WAREHOUSE...');
    console.log('📊 Total tablas a crear: 21 tablas');
    console.log('=' .repeat(70));
    
    await warehouse.connect();
    console.log('✅ Conectado a Data Warehouse');
    
    let tablasCreadas = 0;
    
    for (const [nombreTabla, sqlCreate] of Object.entries(TODAS_LAS_TABLAS)) {
      try {
        await warehouse.query(sqlCreate);
        console.log(`✅ ${nombreTabla.padEnd(25)} | Creada/Verificada`);
        tablasCreadas++;
      } catch (error) {
        console.log(`❌ ${nombreTabla.padEnd(25)} | Error: ${error.message.substring(0, 50)}...`);
      }
    }
    
    console.log('=' .repeat(70));
    console.log(`📈 TABLAS PROCESADAS: ${tablasCreadas}/${Object.keys(TODAS_LAS_TABLAS).length}`);
    
    // Verificar qué tablas existen ahora
    const verificacion = await warehouse.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    console.log('\n📋 TABLAS EXISTENTES EN DATA WAREHOUSE:');
    verificacion.rows.forEach((tabla, index) => {
      console.log(`${(index + 1).toString().padStart(2)}. ${tabla.table_name}`);
    });
    
    console.log(`\n🎉 TOTAL TABLAS EXISTENTES: ${verificacion.rows.length}`);
    console.log('💎 Data Warehouse sincronizado con estructura Supabase');
    
  } catch (error) {
    console.error('❌ Error general:', error.message);
  } finally {
    await warehouse.end();
  }
}

crearTodasLasTablas();
