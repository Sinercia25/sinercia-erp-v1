const { Client } = require('pg');
const https = require('https');

// CONFIGURACIONES
const supabaseConfig = {
  connectionString: 'postgresql://postgres.uypkyjjjeochnsuhrhjp:Password12345contra12345@aws-0-us-east-2.pooler.supabase.com:6543/postgres?sslmode=require',
  ssl: { rejectUnauthorized: false }
};

const warehouseConfig = {
  host: '207.154.218.252',
  port: 5432,
  database: 'erp_datawarehouse',
  user: 'erpuser',
  password: 'ERP2025!DataBase#Prod',
  ssl: false
};

// 📋 TABLAS A SINCRONIZAR (TODAS LAS DE SUPABASE)
const TABLAS_PRIORITARIAS = [
  // 💰 CRÍTICAS - Sistema financiero
  'empresas',
  'facturas',
  'cobranzas', 
  'facturas_compras',
  'pagos',
  'clientes',
  'proveedores',
  'empleados',
  
  // 📊 IMPORTANTES - Operativas
  'lotes',
  'maquinas', 
  'transacciones',
  'cheques',
  'usuarios',
  
  // 📦 SECUNDARIAS - Inventario
  'productos',
  'stock_productos',
  'movimientos_stock',
  'depositos',
  'categorias_productos',
  
  // 🌾 PRODUCCIÓN
  'cultivos',
  'cosechas',
  'trabajos_maquina',
  'liquidaciones_ingenio',
  
  // 🔧 SISTEMA
  'sync_logs',
  'audit_logs'
];

async function sincronizacionCompleta() {
  const supabase = new Client(supabaseConfig);
  const warehouse = new Client(warehouseConfig);
  
  console.log('🚀 INICIANDO SINCRONIZACIÓN COMPLETA: SUPABASE → DWH');
  console.log('=' .repeat(60));
  console.log('📝 Estrategia: DWH = Copia exacta de Supabase');
  console.log('🎯 Objetivo: Eliminar diferencias y sincronizar todo\n');
  
  try {
    // 🔗 CONECTAR A AMBAS BASES
    console.log('🔗 Conectando a Supabase...');
    await supabase.connect();
    console.log('✅ Conectado a Supabase');
    
    console.log('🔗 Conectando a DWH...');
    await warehouse.connect();
    console.log('✅ Conectado a DWH\n');
    
    // 📋 PASO 1: OBTENER LISTA REAL DE TABLAS EN SUPABASE
    console.log('📋 PASO 1: Identificando tablas en Supabase...');
    const tablasSupabase = await supabase.query(`
      SELECT table_name, 
             (SELECT COUNT(*) FROM information_schema.columns 
              WHERE table_name = t.table_name AND column_name = 'empresaId') as tiene_empresa_id
      FROM information_schema.tables t
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      AND table_name NOT LIKE 'pg_%'
      AND table_name NOT LIKE 'sql_%'
      AND table_name NOT IN ('spatial_ref_sys', 'geography_columns', 'geometry_columns')
      ORDER BY table_name
    `);
    
    console.log(`✅ Encontradas ${tablasSupabase.rows.length} tablas en Supabase\n`);
    
    let tablasCreadas = 0;
    let tablasSincronizadas = 0;
    let registrosSincronizados = 0;
    let errores = [];
    
    // 🔄 SINCRONIZAR CADA TABLA
    for (const tablaInfo of tablasSupabase.rows) {
      const nombreTabla = tablaInfo.table_name;
      const tieneEmpresaId = parseInt(tablaInfo.tiene_empresa_id) > 0;
      
      console.log(`🔄 Procesando tabla: ${nombreTabla}`);
      
      try {
        // 📊 PASO 2: CONTAR REGISTROS EN SUPABASE
        let queryCount = `SELECT COUNT(*) as total FROM "${nombreTabla}"`;
        if (tieneEmpresaId) {
          queryCount = `SELECT COUNT(*) as total FROM "${nombreTabla}" WHERE "empresaId" = 'laramada'`;
        }
        
        const countResult = await supabase.query(queryCount);
        const totalRegistros = parseInt(countResult.rows[0].total);
        
        console.log(`   📊 Registros en Supabase: ${totalRegistros}`);
        
        if (totalRegistros === 0) {
          console.log(`   ⏭️ Tabla vacía, omitiendo...\n`);
          continue;
        }
        
        // 🗑️ PASO 3: ELIMINAR TABLA EN DWH SI EXISTE
        try {
          await warehouse.query(`DROP TABLE IF EXISTS ${nombreTabla} CASCADE`);
          console.log(`   🗑️ Tabla eliminada del DWH`);
        } catch (e) {
          console.log(`   ⚠️ Tabla no existía en DWH`);
        }
        
        // 🏗️ PASO 4: OBTENER ESTRUCTURA DE TABLA
        const estructuraResult = await supabase.query(`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_name = '${nombreTabla}' 
          ORDER BY ordinal_position
        `);
        
        // 🔨 PASO 5: CREAR TABLA EN DWH
        let createSQL = `CREATE TABLE ${nombreTabla} (`;
        const columnas = estructuraResult.rows.map(col => {
          let tipo = col.data_type;
          
          // Mapear tipos de PostgreSQL
          if (tipo === 'character varying') tipo = 'VARCHAR(255)';
          if (tipo === 'timestamp without time zone') tipo = 'TIMESTAMP';
          if (tipo === 'timestamp with time zone') tipo = 'TIMESTAMPTZ';
          if (tipo === 'double precision') tipo = 'DOUBLE PRECISION';
          if (tipo === 'USER-DEFINED') tipo = 'TEXT'; // Para tipos custom
          
          const nullable = col.is_nullable === 'YES' ? '' : ' NOT NULL';
          const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
          
          return `"${col.column_name}" ${tipo}${nullable}${defaultVal}`;
        });
        
        createSQL += columnas.join(', ') + ')';
        
        await warehouse.query(createSQL);
        console.log(`   🏗️ Tabla creada en DWH`);
        tablasCreadas++;
        
        // 📥 PASO 6: COPIAR DATOS
        let querySelect = `SELECT * FROM "${nombreTabla}"`;
        if (tieneEmpresaId) {
          querySelect = `SELECT * FROM "${nombreTabla}" WHERE "empresaId" = 'laramada'`;
        }
        
        const datosResult = await supabase.query(querySelect);
        console.log(`   📥 Obtenidos ${datosResult.rows.length} registros`);
        
        if (datosResult.rows.length > 0) {
          // Preparar INSERT
          const primeraFila = datosResult.rows[0];
          const columnas = Object.keys(primeraFila);
          const placeholders = columnas.map((_, i) => `$${i + 1}`).join(', ');
          const columnNames = columnas.map(c => `"${c}"`).join(', ');
          
          const insertSQL = `INSERT INTO ${nombreTabla} (${columnNames}) VALUES (${placeholders})`;
          
          // Insertar fila por fila
          for (const fila of datosResult.rows) {
            const valores = columnas.map(col => fila[col]);
            await warehouse.query(insertSQL, valores);
          }
          
          console.log(`   ✅ ${datosResult.rows.length} registros copiados`);
          registrosSincronizados += datosResult.rows.length;
        }
        
        tablasSincronizadas++;
        console.log(`   ✅ Tabla ${nombreTabla} sincronizada completamente\n`);
        
      } catch (error) {
        console.log(`   ❌ Error con tabla ${nombreTabla}: ${error.message}\n`);
        errores.push({ tabla: nombreTabla, error: error.message });
      }
    }
    
    // 📊 RESUMEN FINAL
    console.log('=' .repeat(60));
    console.log('📊 RESUMEN DE SINCRONIZACIÓN COMPLETA:');
    console.log(`   • Tablas procesadas: ${tablasSupabase.rows.length}`);
    console.log(`   • Tablas creadas: ${tablasCreadas}`);
    console.log(`   • Tablas sincronizadas: ${tablasSincronizadas}`);
    console.log(`   • Registros copiados: ${registrosSincronizados.toLocaleString()}`);
    console.log(`   • Errores: ${errores.length}`);
    
    if (errores.length > 0) {
      console.log(`\n❌ ERRORES ENCONTRADOS:`);
      errores.forEach(err => {
        console.log(`   • ${err.tabla}: ${err.error.substring(0, 80)}...`);
      });
    }
    
    // ✅ ESTADO FINAL
    if (errores.length === 0) {
      console.log(`\n🎉 ¡SINCRONIZACIÓN COMPLETA EXITOSA!`);
      console.log(`✅ DWH ahora es una copia exacta de Supabase`);
      console.log(`📊 ${registrosSincronizados} registros sincronizados`);
      
      // 📝 REGISTRAR SINCRONIZACIÓN
      try {
        await warehouse.query(`
          INSERT INTO sync_logs (table_name, operation, records_affected, timestamp, status)
          VALUES ('ALL_TABLES', 'FULL_SYNC', $1, NOW(), 'SUCCESS')
        `, [registrosSincronizados]);
        console.log(`📝 Sincronización registrada en logs`);
      } catch (e) {
        console.log(`⚠️ No se pudo registrar en logs: ${e.message}`);
      }
    } else {
      console.log(`\n⚠️ Sincronización completada con ${errores.length} errores`);
      console.log(`📝 Revisar errores antes de continuar`);
    }
    
    console.log('\n🎉 PROCESO COMPLETADO');
    
  } catch (error) {
    console.error('❌ Error general en sincronización:', error.message);
  } finally {
    await supabase.end();
    await warehouse.end();
  }
}

// 🚀 EJECUTAR
console.log('⚠️ ADVERTENCIA: Este script va a ELIMINAR y RECREAR todas las tablas en DWH');
console.log('📝 Solo continuar si estás seguro de que querés hacer DWH = Supabase\n');

sincronizacionCompleta();