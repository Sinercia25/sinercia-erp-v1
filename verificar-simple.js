const { Client } = require('pg');

// CONFIGURACIÓN DATA WAREHOUSE
const warehouseConfig = {
  host: '207.154.218.252',
  port: 5432,
  database: 'erp_datawarehouse',
  user: 'erpuser',
  password: 'ERP2025!DataBase#Prod',
  ssl: false
};

// 📋 LISTA COMPLETA DE TABLAS QUE DEBERÍAN ESTAR EN DWH
// (Basada en tu documentación de 30+ tablas)
const TABLAS_ESPERADAS = [
  // 🏢 CORE ERP (12 tablas principales)
  'empresas',
  'lotes', 
  'maquinas',
  'transacciones',
  'cheques',
  'liquidaciones_ingenio',
  'usuarios',
  'sync_logs',
  
  // 💰 SISTEMA FINANCIERO (IMPLEMENTADO HOY - 4 tablas)
  'facturas',           // 42 facturas ($409M)
  'cobranzas',          // 19 operaciones ($137M)
  'facturas_compras',   // 18 facturas ($94M)
  'pagos',              // 16 operaciones ($67M)
  
  // 👥 DATOS EMPRESARIALES (3 tablas)
  'clientes',           // 15 clientes sector azucarero
  'proveedores',        // Combustibles, agroquímicos, fertilizantes
  'empleados',          // 43 empleados con DNI/CUIL
  
  // 📦 SISTEMA INVENTARIO Y PRODUCCIÓN (8 tablas)
  'productos',
  'categorias_productos',
  'stock_productos', 
  'movimientos_stock',
  'depositos',
  'cultivos',
  'cosechas',
  'trabajos_maquina',
  
  // 🏢 KNOWLEDGE HUB (4 tablas)
  'company_documents',
  'document_categories', 
  'document_content',
  'companies',
  
  // 🔐 SISTEMA MULTIMEDIA Y SEGURIDAD (4 tablas)
  'audit_logs',
  'user_sessions',
  'system_settings',
  'backup_logs'
];

async function verificarTablasEsperadas() {
  const warehouse = new Client(warehouseConfig);
  
  try {
    await warehouse.connect();
    console.log('✅ Conectado a Data Warehouse');
    console.log('\n📊 VERIFICACIÓN: TODAS LAS TABLAS ESPERADAS EN DWH');
    console.log('=' .repeat(70));
    console.log(`🎯 TOTAL TABLAS ESPERADAS: ${TABLAS_ESPERADAS.length}`);
    console.log('\nFormato: TABLA | REGISTROS | ESTADO');
    console.log('-'.repeat(70));
    
    let tablasExistentes = 0;
    let tablasFaltantes = [];
    let totalRegistros = 0;
    
    // 🔍 VERIFICAR CADA TABLA ESPERADA
    for (const nombreTabla of TABLAS_ESPERADAS) {
      try {
        // 📊 CONTAR REGISTROS
        let query = `SELECT COUNT(*) as total FROM ${nombreTabla}`;
        
        // Para tablas con empresaId, filtrar por La Ramada
        const tablasConEmpresa = ['lotes', 'maquinas', 'transacciones', 'cheques', 'facturas', 'cobranzas', 'facturas_compras', 'pagos', 'clientes', 'proveedores', 'empleados', 'productos', 'stock_productos', 'movimientos_stock', 'cultivos', 'cosechas', 'trabajos_maquina'];
        
        if (tablasConEmpresa.includes(nombreTabla)) {
          query = `SELECT COUNT(*) as total FROM ${nombreTabla} WHERE "empresaId" = 'laramada'`;
        }
        
        const resultado = await warehouse.query(query);
        const count = parseInt(resultado.rows[0].total);
        totalRegistros += count;
        tablasExistentes++;
        
        // Determinar estado
        let estado;
        if (count === 0) {
          estado = '⚠️ VACÍA';
        } else if (count < 5) {
          estado = '🔶 POCOS DATOS';
        } else {
          estado = '✅ OK';
        }
        
        console.log(`📋 ${nombreTabla.padEnd(25)} | ${count.toString().padStart(3)} | ${estado}`);
        
        // Mostrar datos de muestra para tablas críticas
        if (count > 0 && ['facturas', 'cobranzas', 'facturas_compras', 'pagos'].includes(nombreTabla)) {
          try {
            const muestra = await warehouse.query(`SELECT * FROM ${nombreTabla} LIMIT 1`);
            if (muestra.rows.length > 0) {
              const sample = muestra.rows[0];
              const monto = sample.monto_total || sample.monto || 'N/A';
              console.log(`    💡 Ej: ID ${sample.id} | Monto: $${monto}`);
            }
          } catch (e) {
            // Ignorar errores de muestra
          }
        }
        
      } catch (error) {
        // Tabla no existe
        tablasFaltantes.push(nombreTabla);
        console.log(`❌ ${nombreTabla.padEnd(25)} | N/A | NO EXISTE`);
      }
    }
    
    // 📊 ANÁLISIS DE TABLAS EXISTENTES EN DWH (no esperadas)
    console.log('\n🔍 VERIFICANDO TABLAS ADICIONALES EN DWH...');
    try {
      const tablasReales = await warehouse.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `);
      
      const tablasExtra = tablasReales.rows
        .map(r => r.table_name)
        .filter(tabla => !TABLAS_ESPERADAS.includes(tabla));
      
      if (tablasExtra.length > 0) {
        console.log(`📋 Tablas adicionales encontradas: ${tablasExtra.length}`);
        tablasExtra.slice(0, 5).forEach(tabla => {
          console.log(`   🔸 ${tabla}`);
        });
        if (tablasExtra.length > 5) {
          console.log(`   ... y ${tablasExtra.length - 5} más`);
        }
      }
    } catch (e) {
      console.log('⚠️ No se pudieron verificar tablas adicionales');
    }
    
    // 📈 RESUMEN FINAL
    console.log('\n' + '=' .repeat(70));
    console.log(`📈 RESUMEN COMPLETO:`);
    console.log(`   • Tablas esperadas: ${TABLAS_ESPERADAS.length}`);
    console.log(`   • Tablas existentes: ${tablasExistentes}`);
    console.log(`   • Tablas faltantes: ${tablasFaltantes.length}`);
    console.log(`   • Total registros: ${totalRegistros.toLocaleString()}`);
    console.log(`   • Porcentaje sincronizado: ${Math.round((tablasExistentes / TABLAS_ESPERADAS.length) * 100)}%`);
    
    // 🚨 MOSTRAR TABLAS FALTANTES POR CATEGORÍA
    if (tablasFaltantes.length > 0) {
      console.log(`\n🚨 TABLAS FALTANTES POR CATEGORÍA:`);
      
      const financieras = tablasFaltantes.filter(t => 
        ['facturas', 'cobranzas', 'facturas_compras', 'pagos'].includes(t)
      );
      
      const empresariales = tablasFaltantes.filter(t => 
        ['clientes', 'proveedores', 'empleados'].includes(t)
      );
      
      const inventario = tablasFaltantes.filter(t => 
        ['productos', 'categorias_productos', 'stock_productos', 'movimientos_stock', 'depositos', 'cultivos', 'cosechas', 'trabajos_maquina'].includes(t)
      );
      
      const otras = tablasFaltantes.filter(t => 
        !financieras.includes(t) && !empresariales.includes(t) && !inventario.includes(t)
      );
      
      if (financieras.length > 0) {
        console.log(`\n💰 CRÍTICAS - Sistema Financiero (${financieras.length}):`);
        financieras.forEach(tabla => console.log(`   ❌ ${tabla}`));
      }
      
      if (empresariales.length > 0) {
        console.log(`\n👥 IMPORTANTES - Datos Empresariales (${empresariales.length}):`);
        empresariales.forEach(tabla => console.log(`   ❌ ${tabla}`));
      }
      
      if (inventario.length > 0) {
        console.log(`\n📦 SECUNDARIAS - Inventario/Producción (${inventario.length}):`);
        inventario.forEach(tabla => console.log(`   ⚠️ ${tabla}`));
      }
      
      if (otras.length > 0) {
        console.log(`\n🔧 ADICIONALES - Otras (${otras.length}):`);
        otras.forEach(tabla => console.log(`   🔸 ${tabla}`));
      }
      
      console.log(`\n📝 PRÓXIMO PASO: Sincronizar ${financieras.length + empresariales.length} tablas críticas desde Supabase`);
    } else {
      console.log(`\n🎉 ¡PERFECTO! Todas las tablas esperadas están en el DWH`);
    }
    
    console.log('\n🎉 VERIFICACIÓN COMPLETADA');
    
  } catch (error) {
    console.error('❌ Error verificando:', error.message);
  } finally {
    await warehouse.end();
  }
}

verificarTablasEsperadas();