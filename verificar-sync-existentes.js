const { Client } = require('pg');
const https = require('https');

// CONFIGURACIÓN DATA WAREHOUSE
const warehouseConfig = {
  host: '207.154.218.252',
  port: 5432,
  database: 'erp_datawarehouse',
  user: 'erpuser',
  password: 'ERP2025!DataBase#Prod',
  ssl: false
};

// 📋 TABLAS QUE YA EXISTEN EN DWH (del reporte anterior)
const TABLAS_EXISTENTES = [
  'empresas',           // 1 registro
  'liquidaciones_ingenio', // 2 registros
  'usuarios',           // 120 registros  
  'sync_logs',          // 12 registros
  'depositos',          // 0 registros (vacía)
  'company_documents',  // 0 registros (vacía)
  'document_categories', // 0 registros (vacía)
  'document_content',   // 0 registros (vacía)
  'companies'           // 0 registros (vacía)
];

// FUNCIÓN PARA CONSULTAR SUPABASE VIA HTTP (evita SSL)
async function consultarSupabase(tabla, empresaId = 'laramada') {
  return new Promise((resolve, reject) => {
    // Construir URL para contar registros
    let url = `https://uypkyjjjeochnsuhrhjp.supabase.co/rest/v1/${tabla}?select=count&count=exact`;
    
    // Filtrar por empresaId si la tabla lo requiere
    const tablasConEmpresa = ['usuarios', 'depositos'];
    if (tablasConEmpresa.includes(tabla)) {
      url += `&empresaId=eq.${empresaId}`;
    }
    
    const options = {
      method: 'GET',
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5cGt5ampqZW9jaG5zdWhyaGpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3MzMyMzYsImV4cCI6MjA2NjMwOTIzNn0.PhAMsrhvT4ckbPlajiLISJPh-vazSfJO-2uRu5VBUkI', // ← NECESITAS PONER TU CLAVE AQUÍ
        'Authorization': 'Bearer TU_SUPABASE_ANON_KEY_AQUI',
        'Content-Type': 'application/json',
        'Prefer': 'count=exact'
      }
    };
    
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const count = res.headers['content-range'] ? 
            parseInt(res.headers['content-range'].split('/')[1]) : 0;
          resolve(count);
        } catch (error) {
          resolve(0);
        }
      });
    });
    
    req.on('error', () => resolve(0));
    req.setTimeout(10000, () => {
      req.destroy();
      resolve(0);
    });
    
    req.end();
  });
}

async function verificarSincronizacionExistentes() {
  const warehouse = new Client(warehouseConfig);
  
  try {
    await warehouse.connect();
    console.log('✅ Conectado a Data Warehouse');
    console.log('\n📊 VERIFICACIÓN DE SINCRONIZACIÓN: TABLAS EXISTENTES');
    console.log('=' .repeat(70));
    console.log('Formato: TABLA | DWH | SUPABASE | DIFERENCIA | ESTADO');
    console.log('-'.repeat(70));
    
    let totalTablas = 0;
    let tablasSincronizadas = 0;
    let tablasConDiferencias = 0;
    let totalDWH = 0;
    let totalSupabase = 0;
    
    for (const nombreTabla of TABLAS_EXISTENTES) {
      try {
        totalTablas++;
        
        // 📊 CONTAR EN DWH
        let queryDWH = `SELECT COUNT(*) as total FROM ${nombreTabla}`;
        
        // Para tablas con empresaId, filtrar por La Ramada
        const tablasConEmpresa = ['usuarios', 'depositos'];
        if (tablasConEmpresa.includes(nombreTabla)) {
          queryDWH = `SELECT COUNT(*) as total FROM ${nombreTabla} WHERE "empresaId" = 'laramada'`;
        }
        
        const resultDWH = await warehouse.query(queryDWH);
        const countDWH = parseInt(resultDWH.rows[0].total);
        totalDWH += countDWH;
        
        // 📊 CONTAR EN SUPABASE (vía HTTP)
        console.log(`🔍 Consultando ${nombreTabla} en Supabase...`);
        const countSupabase = await consultarSupabase(nombreTabla);
        totalSupabase += countSupabase;
        
        // 📈 CALCULAR DIFERENCIA
        const diferencia = countSupabase - countDWH;
        let estado;
        
        if (diferencia === 0) {
          estado = '✅ SINCRONIZADO';
          tablasSincronizadas++;
        } else if (diferencia > 0) {
          estado = `⚠️ FALTAN ${diferencia}`;
          tablasConDiferencias++;
        } else {
          estado = `🚨 SOBRAN ${Math.abs(diferencia)}`;
          tablasConDiferencias++;
        }
        
        console.log(`📋 ${nombreTabla.padEnd(20)} | ${countDWH.toString().padStart(3)} | ${countSupabase.toString().padStart(8)} | ${diferencia.toString().padStart(4)} | ${estado}`);
        
        // 🔍 MOSTRAR DETALLES PARA TABLAS CON DIFERENCIAS IMPORTANTES
        if (Math.abs(diferencia) > 0 && countSupabase > 0) {
          console.log(`    💡 Acción: ${diferencia > 0 ? 'Agregar' : 'Eliminar'} ${Math.abs(diferencia)} registros en DWH`);
        }
        
        // 📅 VERIFICAR FECHA DE ÚLTIMA SINCRONIZACIÓN
        if (nombreTabla === 'sync_logs') {
          try {
            const ultimaSync = await warehouse.query(`
              SELECT MAX(timestamp) as ultima_sync, table_name, operation 
              FROM sync_logs 
              WHERE table_name = '${nombreTabla}'
              GROUP BY table_name, operation
              ORDER BY ultima_sync DESC 
              LIMIT 1
            `);
            
            if (ultimaSync.rows.length > 0) {
              console.log(`    📅 Última sync: ${ultimaSync.rows[0].ultima_sync || 'Nunca'}`);
            }
          } catch (e) {
            // Ignorar errores de sync_logs
          }
        }
        
      } catch (error) {
        console.log(`❌ ${nombreTabla.padEnd(20)} | ERR | ERROR    |  N/A | ERROR: ${error.message.substring(0, 30)}...`);
      }
    }
    
    // 📊 RESUMEN DE SINCRONIZACIÓN
    console.log('\n' + '=' .repeat(70));
    console.log(`📈 RESUMEN DE SINCRONIZACIÓN:`);
    console.log(`   • Tablas verificadas: ${totalTablas}`);
    console.log(`   • Tablas sincronizadas: ${tablasSincronizadas}`);
    console.log(`   • Tablas con diferencias: ${tablasConDiferencias}`);
    console.log(`   • Registros en DWH: ${totalDWH.toLocaleString()}`);
    console.log(`   • Registros en Supabase: ${totalSupabase.toLocaleString()}`);
    console.log(`   • Diferencia total: ${(totalSupabase - totalDWH).toLocaleString()}`);
    console.log(`   • Porcentaje sincronizado: ${Math.round((tablasSincronizadas / totalTablas) * 100)}%`);
    
    // 🎯 RECOMENDACIONES
    console.log(`\n🎯 RECOMENDACIONES:`);
    
    if (tablasSincronizadas === totalTablas) {
      console.log(`✅ ¡PERFECTO! Todas las tablas existentes están sincronizadas`);
      console.log(`📝 Próximo paso: Agregar las 22 tablas faltantes desde Supabase`);
    } else if (tablasConDiferencias > 0) {
      console.log(`⚠️ ${tablasConDiferencias} tablas necesitan resincronización`);
      console.log(`📝 Acciones requeridas:`);
      console.log(`   1. Ejecutar sync para tablas con diferencias`);
      console.log(`   2. Verificar proceso de sincronización automática`);
      console.log(`   3. Revisar logs de sincronización en sync_logs`);
    }
    
    // 📅 VERIFICAR SISTEMA DE SYNC AUTOMÁTICO
    console.log(`\n📅 ESTADO DEL SISTEMA DE SINCRONIZACIÓN:`);
    try {
      const ultimasSync = await warehouse.query(`
        SELECT 
          table_name,
          operation,
          MAX(timestamp) as ultima_sync,
          COUNT(*) as total_syncs
        FROM sync_logs 
        WHERE timestamp >= NOW() - INTERVAL '24 hours'
        GROUP BY table_name, operation
        ORDER BY ultima_sync DESC
        LIMIT 5
      `);
      
      if (ultimasSync.rows.length > 0) {
        console.log(`✅ Sincronizaciones en últimas 24 horas:`);
        ultimasSync.rows.forEach(row => {
          console.log(`   📊 ${row.table_name} (${row.operation}): ${row.total_syncs} veces, última: ${row.ultima_sync}`);
        });
      } else {
        console.log(`⚠️ No hay sincronizaciones registradas en las últimas 24 horas`);
        console.log(`📝 Posible problema: Sistema de sync automático no está funcionando`);
      }
    } catch (e) {
      console.log(`❌ No se pudo verificar el estado del sistema de sincronización`);
    }
    
    console.log('\n🎉 VERIFICACIÓN DE SINCRONIZACIÓN COMPLETADA');
    
  } catch (error) {
    console.error('❌ Error verificando sincronización:', error.message);
  } finally {
    await warehouse.end();
  }
}

// 📝 NOTA IMPORTANTE
console.log('⚠️ IMPORTANTE: Para que funcione la consulta a Supabase,');
console.log('   necesitás reemplazar "TU_SUPABASE_ANON_KEY_AQUI" con tu clave real.');
console.log('   La podés encontrar en tu archivo .env.local\n');

verificarSincronizacionExistentes();