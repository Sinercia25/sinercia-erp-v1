/**
 * 🧪 Script de diagnóstico para comparar Supabase vs DWH.
 * Evalúa sincronización y presencia de tablas. Útil para auditar la integridad.
 * Ejecutar con: node scripts/diagnostico/sync/verificarTablasSync.js
 */

const { Client } = require('pg');

// CONFIGURACIÓN SUPABASE (SSL CORREGIDO)
const supabaseConfig = {
  connectionString: 'postgresql://postgres.uypkyjjjeochnsuhrhjp:Password12345contra12345@aws-0-us-east-2.pooler.supabase.com:6543/postgres?sslmode=require',
  ssl: {
    rejectUnauthorized: false
  }
};

// CONFIGURACIÓN DATA WAREHOUSE
const warehouseConfig = {
  host: '207.154.218.252',
  port: 5432,
  database: 'erp_datawarehouse',
  user: 'erpuser',
  password: 'ERP2025!DataBase#Prod',
  ssl: false
};

async function obtenerTodasLasTablas() {
  const supabase = new Client(supabaseConfig);
  const warehouse = new Client(warehouseConfig);
  
  try {
    console.log('🔗 Conectando a Supabase...');
    await supabase.connect();
    console.log('✅ Conectado a Supabase');
    
    console.log('🔗 Conectando a Data Warehouse...');
    await warehouse.connect();
    console.log('✅ Conectado a Data Warehouse');
    
    console.log('\n📊 ANÁLISIS COMPLETO: TODAS LAS TABLAS DE SUPABASE');
    console.log('=' .repeat(80));
    
    // 📋 OBTENER LISTA COMPLETA DE TABLAS EN SUPABASE
    console.log('🔍 Obteniendo lista de tablas...');
    const tablasSupabase = await supabase.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      AND table_name NOT LIKE 'pg_%'
      AND table_name NOT LIKE 'sql_%'
      AND table_name NOT IN ('spatial_ref_sys', 'geography_columns', 'geometry_columns', 'raster_columns', 'raster_overviews')
      ORDER BY table_name
    `);
    
    console.log(`🎯 TOTAL TABLAS EN SUPABASE: ${tablasSupabase.rows.length}`);
    console.log('\n📋 VERIFICANDO TABLA POR TABLA:');
    console.log('Formato: TABLA | Supabase | DWH | Estado');
    console.log('-'.repeat(80));
    
    let tablasSincronizadas = 0;
    let tablasFaltantes = [];
    let totalRegistrosSupabase = 0;
    let totalRegistrosDWH = 0;
    
    // 🔍 VERIFICAR CADA TABLA
    for (const tabla of tablasSupabase.rows) {
      const nombreTabla = tabla.table_name;
      
      try {
        // 📊 CONTAR REGISTROS EN SUPABASE
        let querySupabase = `SELECT COUNT(*) as total FROM "${nombreTabla}"`;
        
        // Verificar si tiene columna empresaId
        const tieneEmpresaId = await supabase.query(`
          SELECT COUNT(*) 
          FROM information_schema.columns 
          WHERE table_name = '${nombreTabla}' 
          AND column_name = 'empresaId'
        `);
        
        if (parseInt(tieneEmpresaId.rows[0].count) > 0) {
          querySupabase = `SELECT COUNT(*) as total FROM "${nombreTabla}" WHERE "empresaId" = 'laramada'`;
        }
        
        const countSupabase = await supabase.query(querySupabase);
        const registrosSupabase = parseInt(countSupabase.rows[0].total);
        totalRegistrosSupabase += registrosSupabase;
        
        // 📉 VERIFICAR SI EXISTE EN DWH
        let registrosDWH = 0;
        let existeEnDWH = false;
        
        try {
          let queryDWH = `SELECT COUNT(*) as total FROM ${nombreTabla}`;
          
          // Verificar si tiene columna empresaId en DWH
          const tieneEmpresaIdDWH = await warehouse.query(`
            SELECT COUNT(*) 
            FROM information_schema.columns 
            WHERE table_name = '${nombreTabla}' 
            AND column_name = 'empresaId'
          `);
          
          if (parseInt(tieneEmpresaIdDWH.rows[0].count) > 0) {
            queryDWH = `SELECT COUNT(*) as total FROM ${nombreTabla} WHERE "empresaId" = 'laramada'`;
          }
          
          const countDWH = await warehouse.query(queryDWH);
          registrosDWH = parseInt(countDWH.rows[0].total);
          totalRegistrosDWH += registrosDWH;
          existeEnDWH = true;
          tablasSincronizadas++;
        } catch (error) {
          // Tabla no existe en DWH
          existeEnDWH = false;
          tablasFaltantes.push({
            nombre: nombreTabla,
            registros: registrosSupabase
          });
        }
        
        // 📋 MOSTRAR RESULTADO
        const diferencia = registrosSupabase - registrosDWH;
        let estado;
        
        if (!existeEnDWH) {
          estado = '❌ NO EXISTE';
        } else if (diferencia === 0) {
          estado = '✅ OK';
        } else if (diferencia > 0) {
          estado = `⚠️ -${diferencia}`;
        } else {
          estado = `🚨 +${Math.abs(diferencia)}`;
        }
        
        console.log(`📋 ${nombreTabla.padEnd(25)} | ${registrosSupabase.toString().padStart(3)} | ${registrosDWH.toString().padStart(3)} | ${estado}`);
        
      } catch (error) {
        console.log(`❌ ${nombreTabla.padEnd(25)} | ERR | ERR | ERROR`);
      }
    }
    
    // 📊 RESUMEN FINAL
    console.log('\n' + '=' .repeat(80));
    console.log(`📈 RESUMEN COMPLETO:`);
    console.log(`   • Total tablas Supabase: ${tablasSupabase.rows.length}`);
    console.log(`   • Tablas sincronizadas: ${tablasSincronizadas}`);
    console.log(`   • Tablas faltantes en DWH: ${tablasFaltantes.length}`);
    console.log(`   • Total registros Supabase: ${totalRegistrosSupabase.toLocaleString()}`);
    console.log(`   • Total registros DWH: ${totalRegistrosDWH.toLocaleString()}`);
    console.log(`   • Registros pendientes: ${(totalRegistrosSupabase - totalRegistrosDWH).toLocaleString()}`);
    
    // 🚨 MOSTRAR TABLAS FALTANTES MÁS IMPORTANTES
    if (tablasFaltantes.length > 0) {
      console.log(`\n🚨 TABLAS FALTANTES EN DWH:`);
      
      const tablasCriticas = tablasFaltantes.filter(t => 
        ['facturas', 'cobranzas', 'facturas_compras', 'pagos', 'clientes', 'proveedores', 'empleados'].includes(t.nombre)
      );
      
      if (tablasCriticas.length > 0) {
        console.log(`\n💰 CRÍTICAS (Sistema financiero):`);
        tablasCriticas.forEach(tabla => {
          console.log(`   ❌ ${tabla.nombre} (${tabla.registros} registros)`);
        });
      }
      
      const tablasSecundarias = tablasFaltantes.filter(t => 
        !['facturas', 'cobranzas', 'facturas_compras', 'pagos', 'clientes', 'proveedores', 'empleados'].includes(t.nombre)
      );
      
      if (tablasSecundarias.length > 0) {
        console.log(`\n📋 OTRAS (${tablasSecundarias.length} tablas):`);
        tablasSecundarias.slice(0, 5).forEach(tabla => {
          console.log(`   ⚠️ ${tabla.nombre} (${tabla.registros} registros)`);
        });
        if (tablasSecundarias.length > 5) {
          console.log(`   ... y ${tablasSecundarias.length - 5} más`);
        }
      }
    }
    
    console.log('\n🎉 ANÁLISIS COMPLETADO');
    
  } catch (error) {
    console.error('❌ Error en análisis:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    try {
      await supabase.end();
      await warehouse.end();
    } catch (e) {
      // Ignorar errores de desconexión
    }
  }
}

obtenerTodasLasTablas();