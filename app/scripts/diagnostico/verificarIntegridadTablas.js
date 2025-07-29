const { Client } = require('pg');

// CONFIGURACIÓN SUPABASE (para obtener lista completa de tablas)
const supabaseConfig = {
  host: 'aws-0-us-east-2.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.uypkyjjjeochnsuhrhjp',
  password: 'Password12345contra12345',
  ssl: true
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
    // 🔗 CONECTAR A AMBAS BASES
    await supabase.connect();
    await warehouse.connect();
    
    console.log('✅ Conectado a Supabase y Data Warehouse');
    console.log('\n📊 ANÁLISIS COMPLETO: TODAS LAS TABLAS DE SUPABASE');
    console.log('=' .repeat(80));
    
    // 📋 OBTENER LISTA COMPLETA DE TABLAS EN SUPABASE
    const tablasSupabase = await supabase.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      AND table_name NOT LIKE 'pg_%'
      AND table_name NOT LIKE 'sql_%'
      ORDER BY table_name
    `);
    
    console.log(`🎯 TOTAL TABLAS EN SUPABASE: ${tablasSupabase.rows.length}`);
    console.log('\n📋 LISTADO COMPLETO DE TABLAS:');
    
    let tablasSincronizadas = 0;
    let tablasFaltantes = [];
    let totalRegistrosSupabase = 0;
    let totalRegistrosDWH = 0;
    
    // 🔍 VERIFICAR CADA TABLA
    for (const tabla of tablasSupabase.rows) {
      const nombreTabla = tabla.table_name;
      
      try {
        // 📊 CONTAR REGISTROS EN SUPABASE
        const countSupabase = await supabase.query(`
          SELECT COUNT(*) as total 
          FROM "${nombreTabla}" 
          WHERE CASE 
            WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = '${nombreTabla}' AND column_name = 'empresaId') 
            THEN "empresaId" = 'laramada'
            ELSE TRUE
          END
        `);
        const registrosSupabase = parseInt(countSupabase.rows[0].total);
        totalRegistrosSupabase += registrosSupabase;
        
        // 📉 VERIFICAR SI EXISTE EN DWH
        let registrosDWH = 0;
        let existeEnDWH = false;
        
        try {
          const countDWH = await warehouse.query(`
            SELECT COUNT(*) as total 
            FROM ${nombreTabla} 
            WHERE CASE 
              WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = '${nombreTabla}' AND column_name = 'empresaId') 
              THEN "empresaId" = 'laramada'
              ELSE TRUE
            END
          `);
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
          estado = '❌ NO EXISTE EN DWH';
        } else if (diferencia === 0) {
          estado = '✅ SINCRONIZADO';
        } else if (diferencia > 0) {
          estado = `⚠️ FALTAN ${diferencia} REG`;
        } else {
          estado = `🚨 DWH TIENE +${Math.abs(diferencia)}`;
        }
        
        console.log(`📋 ${nombreTabla.padEnd(25)} | S:${registrosSupabase.toString().padStart(3)} | D:${registrosDWH.toString().padStart(3)} | ${estado}`);
        
        // 🔍 MOSTRAR MUESTRA DE DATOS IMPORTANTES
        if (registrosSupabase > 0 && ['facturas', 'cobranzas', 'facturas_compras', 'pagos', 'clientes', 'proveedores', 'empleados'].includes(nombreTabla)) {
          try {
            const muestra = await supabase.query(`SELECT * FROM "${nombreTabla}" WHERE "empresaId" = 'laramada' LIMIT 1`);
            if (muestra.rows.length > 0) {
              const keys = Object.keys(muestra.rows[0]).slice(0, 4);
              console.log(`    💡 Campos: ${keys.join(', ')}...`);
            }
          } catch (e) {
            // Sin filtro empresaId
            try {
              const muestra = await supabase.query(`SELECT * FROM "${nombreTabla}" LIMIT 1`);
              if (muestra.rows.length > 0) {
                const keys = Object.keys(muestra.rows[0]).slice(0, 4);
                console.log(`    💡 Campos: ${keys.join(', ')}...`);
              }
            } catch (e2) {
              // Error accediendo a la tabla
            }
          }
        }
        
      } catch (error) {
        console.log(`❌ ${nombreTabla.padEnd(25)} | ERROR: ${error.message.substring(0, 50)}...`);
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
    
    // 🚨 MOSTRAR TABLAS CRÍTICAS FALTANTES
    if (tablasFaltantes.length > 0) {
      console.log(`\n🚨 TABLAS CRÍTICAS QUE FALTAN EN DWH:`);
      
      const tablasCriticas = tablasFaltantes.filter(t => 
        ['facturas', 'cobranzas', 'facturas_compras', 'pagos', 'clientes', 'proveedores', 'empleados'].includes(t.nombre)
      );
      
      const tablasSecundarias = tablasFaltantes.filter(t => 
        !['facturas', 'cobranzas', 'facturas_compras', 'pagos', 'clientes', 'proveedores', 'empleados'].includes(t.nombre)
      );
      
      if (tablasCriticas.length > 0) {
        console.log(`\n💰 CRÍTICAS (Sistema financiero y operativo):`);
        tablasCriticas.forEach(tabla => {
          console.log(`   ❌ ${tabla.nombre} (${tabla.registros} registros)`);
        });
      }
      
      if (tablasSecundarias.length > 0) {
        console.log(`\n📋 SECUNDARIAS (Sistema adicional):`);
        tablasSecundarias.slice(0, 10).forEach(tabla => {
          console.log(`   ⚠️ ${tabla.nombre} (${tabla.registros} registros)`);
        });
        if (tablasSecundarias.length > 10) {
          console.log(`   ... y ${tablasSecundarias.length - 10} tablas más`);
        }
      }
      
      console.log(`\n📝 PRÓXIMO PASO: Crear script de sincronización para ${tablasCriticas.length} tablas críticas`);
    } else {
      console.log(`\n🎉 ¡PERFECTO! Todas las tablas están sincronizadas`);
    }
    
    console.log('\n🎉 ANÁLISIS COMPLETADO');
    
  } catch (error) {
    console.error('❌ Error en análisis:', error.message);
  } finally {
    await supabase.end();
    await warehouse.end();
  }
}

obtenerTodasLasTablas();