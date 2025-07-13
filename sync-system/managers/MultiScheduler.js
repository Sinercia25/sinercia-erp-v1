// 📅 MULTI SCHEDULER - GESTIÓN DE MÚLTIPLES FRECUENCIAS
const SyncManager = require('./SyncManager');

class MultiScheduler {
  constructor(config) {
    this.config = config;
    this.syncManager = new SyncManager(config);
    this.schedulers = new Map();
    this.estadisticasGlobales = {
      inicioSistema: new Date(),
      ciclosCompletados: 0,
      tablasDetectadas: 0,
      ultimaDeteccion: null
    };
  }

  // 🚀 INICIAR SISTEMA COMPLETO
  async iniciar() {
    console.log('🚀 Iniciando MultiScheduler v2.0...');
    
    try {
      // 🔍 VERIFICAR CONEXIONES
      console.log('🔗 Verificando conexiones...');
      await this.syncManager.verificarConexiones();
      console.log('✅ Conexiones verificadas');
      
      // 🔍 AUTO-DETECTAR TABLAS DISPONIBLES
      console.log('🔍 Auto-detectando tablas...');
      await this.detectarTablas();
      
      // 📅 CONFIGURAR SCHEDULERS POR NIVEL
      this.configurarSchedulers();
      
      // 📊 CONFIGURAR MONITOREO
      this.configurarMonitoreo();
      
      console.log('✅ MultiScheduler iniciado exitosamente');
      this.mostrarResumenInicial();
      
    } catch (error) {
      console.error('❌ Error iniciando MultiScheduler:', error.message);
      throw error;
    }
  }

  // 🔍 AUTO-DETECTAR TABLAS EN SUPABASE
  async detectarTablas() {
    try {
      const tablas = await this.syncManager.supabase.$queryRaw`
        SELECT table_name,
       0 as tiene_empresa_id,
               (SELECT COUNT(*) FROM information_schema.columns 
                WHERE table_name = t.table_name) as total_columnas
        FROM information_schema.tables t
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        AND table_name NOT LIKE 'pg_%'
        AND table_name NOT LIKE 'sql_%'
        AND table_name NOT IN ('spatial_ref_sys', 'geography_columns', 'geometry_columns')
        ORDER BY table_name
      `;
      
      this.estadisticasGlobales.tablasDetectadas = tablas.length;
      this.estadisticasGlobales.ultimaDeteccion = new Date();
      
      console.log(`✅ Detectadas ${tablas.length} tablas en Supabase`);
      
      // 📊 MOSTRAR RESUMEN POR NIVEL
      this.mostrarResumenTablas(tablas);
      
      return tablas;
      
    } catch (error) {
      console.error('❌ Error detectando tablas:', error.message);
      return [];
    }
  }

  // 📊 MOSTRAR RESUMEN DE TABLAS POR NIVEL
  mostrarResumenTablas(tablas) {
    Object.entries(this.config.CLASIFICACION_TABLAS).forEach(([nivel, tablasNivel]) => {
      const tablasEncontradas = tablas.filter(t => tablasNivel.includes(t.table_name));
      const config = this.config.NIVELES_SYNC[nivel];
      
      console.log(`📋 ${nivel}: ${tablasEncontradas.length}/${tablasNivel.length} tablas (cada ${config.intervalo/1000}s)`);
      
      tablasEncontradas.forEach(t => {
        const empresaId = parseInt(t.tiene_empresa_id) > 0 ? ' 🏢' : '';
        console.log(`   • ${t.table_name} (${t.total_columnas} cols)${empresaId}`);
      });
    });
  }

  // 📅 CONFIGURAR SCHEDULERS POR CADA NIVEL
  configurarSchedulers() {
    console.log('\n📅 Configurando schedulers por nivel...');
    
    Object.entries(this.config.CLASIFICACION_TABLAS).forEach(([nivel, tablas]) => {
      const config = this.config.NIVELES_SYNC[nivel];
      
      if (tablas.length > 0) {
        const intervalId = setInterval(async () => {
          await this.ejecutarSyncPorNivel(nivel, tablas, config);
        }, config.intervalo);
        
        this.schedulers.set(nivel, {
          intervalId,
          tablas: tablas.length,
          ultimaEjecucion: null,
          proximaEjecucion: new Date(Date.now() + config.intervalo)
        });
        
        console.log(`✅ ${nivel}: ${tablas.length} tablas cada ${config.intervalo/1000}s`);
      }
    });
  }

  // 🔄 EJECUTAR SINCRONIZACIÓN POR NIVEL
  async ejecutarSyncPorNivel(nivel, tablas, config) {
    const inicioNivel = Date.now();
    console.log(`\n🔄 Ejecutando sync ${nivel} - ${tablas.length} tablas`);
    
    // 📊 ACTUALIZAR ESTADÍSTICAS DEL SCHEDULER
    const schedulerInfo = this.schedulers.get(nivel);
    if (schedulerInfo) {
      schedulerInfo.ultimaEjecucion = new Date();
      schedulerInfo.proximaEjecucion = new Date(Date.now() + config.intervalo);
    }
    
    let exitosos = 0;
    let errores = 0;
    let totalRegistros = 0;
    
    // 🔄 SINCRONIZAR CADA TABLA EN PARALELO (con límite)
    const LIMITE_PARALELO = nivel === 'CRITICO' ? 2 : 4;
    
    for (let i = 0; i < tablas.length; i += LIMITE_PARALELO) {
      const loteTablas = tablas.slice(i, i + LIMITE_PARALELO);
      
      const resultados = await Promise.allSettled(
        loteTablas.map(tabla => this.sincronizarTablaConTimeout(tabla, config))
      );
      
      resultados.forEach((resultado, index) => {
        const tabla = loteTablas[index];
        
        if (resultado.status === 'fulfilled') {
          const res = resultado.value;
          if (res.success) {
            exitosos++;
            totalRegistros += res.cambios || 0;
            
            const cambiosInfo = res.cambios > 0 ? ` (${res.cambios} reg)` : '';
            console.log(`   ✅ ${tabla}${cambiosInfo}`);
          } else {
            console.log(`   ⏳ ${tabla}: ${res.razon}`);
          }
        } else {
          errores++;
          console.log(`   ❌ ${tabla}: ${resultado.reason.message}`);
        }
      });
    }
    
    // 📊 RESUMEN DEL NIVEL
    const duracionNivel = Date.now() - inicioNivel;
    const estadoNivel = errores === 0 ? '✅' : errores < tablas.length / 2 ? '⚠️' : '❌';
    
    console.log(`${estadoNivel} ${nivel} completado: ${exitosos} OK, ${errores} errores, ${totalRegistros} registros (${duracionNivel}ms)`);
    
    this.estadisticasGlobales.ciclosCompletados++;
  }

  // ⏰ SINCRONIZAR TABLA CON TIMEOUT
  async sincronizarTablaConTimeout(tabla, config) {
    return new Promise(async (resolve, reject) => {
      // ⏰ CONFIGURAR TIMEOUT
      const timeout = setTimeout(() => {
        reject(new Error(`Timeout después de ${config.timeout}ms`));
      }, config.timeout);
      
      try {
        const resultado = await this.syncManager.sincronizarIncremental(tabla, config);
        clearTimeout(timeout);
        resolve(resultado);
      } catch (error) {
        clearTimeout(timeout);
        
        // 🔄 IMPLEMENTAR REINTENTOS
        if (config.reintentos > 0) {
          console.log(`   🔄 Reintentando ${tabla} (${config.reintentos} intentos restantes)`);
          config.reintentos--;
          
          // Esperar antes de reintentar
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          try {
            const resultado = await this.syncManager.sincronizarIncremental(tabla, config);
            resolve(resultado);
          } catch (retryError) {
            reject(retryError);
          }
        } else {
          reject(error);
        }
      }
    });
  }

  // 📊 CONFIGURAR MONITOREO CADA 5 MINUTOS
  configurarMonitoreo() {
    setInterval(() => {
      this.mostrarEstadisticasGenerales();
    }, 300000); // 5 minutos
    
    console.log('📊 Monitoreo configurado cada 5 minutos');
  }

  // 📊 MOSTRAR ESTADÍSTICAS GENERALES
  mostrarEstadisticasGenerales() {
    const tiempoEjecucion = Date.now() - this.estadisticasGlobales.inicioSistema;
    const horas = Math.floor(tiempoEjecucion / (1000 * 60 * 60));
    const minutos = Math.floor((tiempoEjecucion % (1000 * 60 * 60)) / (1000 * 60));
    
    console.log(`\n📊 ESTADÍSTICAS DEL SISTEMA:`);
    console.log(`   🕐 Tiempo ejecución: ${horas}h ${minutos}m`);
    console.log(`   🔄 Ciclos completados: ${this.estadisticasGlobales.ciclosCompletados}`);
    console.log(`   📋 Tablas detectadas: ${this.estadisticasGlobales.tablasDetectadas}`);
    
    // 📅 ESTADO DE SCHEDULERS
    this.schedulers.forEach((info, nivel) => {
      const proximaEn = Math.round((info.proximaEjecucion - new Date()) / 1000);
      const estado = proximaEn > 0 ? `próxima en ${proximaEn}s` : 'ejecutando...';
      
      console.log(`   📅 ${nivel}: ${info.tablas} tablas, ${estado}`);
    });
    
    // 📊 ESTADÍSTICAS DEL SYNC MANAGER
    const statsSync = this.syncManager.obtenerEstadisticas();
    console.log(`   🔢 Total syncs: ${statsSync.syncsTotales}`);
    console.log(`   ⚡ Tiempo promedio: ${Math.round(statsSync.tiempoPromedioSync)}ms`);
    console.log(`   🚨 Errores consecutivos: ${statsSync.erroresConsecutivos}`);
    console.log(`   🔒 Locks activos: ${statsSync.locksActivos}`);
  }

  // 📊 MOSTRAR RESUMEN INICIAL
  mostrarResumenInicial() {
    console.log(`\n🎯 SISTEMA CONFIGURADO:`);
    console.log(`   📊 Niveles activos: ${this.schedulers.size}`);
    console.log(`   📋 Total tablas: ${this.estadisticasGlobales.tablasDetectadas}`);
    
    let totalTablasSincronizadas = 0;
    this.schedulers.forEach((info, nivel) => {
      totalTablasSincronizadas += info.tablas;
    });
    
    console.log(`   ✅ Tablas sincronizadas: ${totalTablasSincronizadas}`);
    console.log(`   🚀 Estado: OPERATIVO`);
  }

  // 🛑 DETENER SISTEMA
  async detener() {
    console.log('🛑 Deteniendo MultiScheduler...');
    
    // Detener todos los schedulers
    this.schedulers.forEach((info, nivel) => {
      clearInterval(info.intervalId);
      console.log(`⏹️ Scheduler ${nivel} detenido`);
    });
    
    this.schedulers.clear();
    
    // Cerrar conexiones
    await this.syncManager.cerrar();
    
    console.log('✅ MultiScheduler detenido completamente');
  }

  // 📊 OBTENER ESTADO COMPLETO
  obtenerEstado() {
    return {
      sistema: this.estadisticasGlobales,
      schedulers: Object.fromEntries(this.schedulers),
      syncManager: this.syncManager.obtenerEstadisticas()
    };
  }
}

module.exports = MultiScheduler;