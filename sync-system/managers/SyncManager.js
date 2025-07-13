// 🚀 SYNC MANAGER PROFESIONAL v2.0
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');

class SyncManager {
  constructor(config) {
    this.config = config;
    this.supabase = new PrismaClient();
    this.warehouse = new Pool(config.DATABASE.warehouse);
    this.lockManager = new Set();
    this.estadisticas = {
      syncsTotales: 0,
      erroresConsecutivos: 0,
      tiempoPromedioSync: 0,
      ultimaSync: null
    };
  }

  // 🔄 SINCRONIZACIÓN INCREMENTAL
  async sincronizarIncremental(tabla, nivel) {
    const lockKey = `sync_${tabla}`;
    
    if (this.lockManager.has(lockKey)) {
      console.log(`⏳ ${tabla}: Sync en progreso, omitiendo`);
      return { success: false, razon: 'EN_PROGRESO' };
    }
    
    this.lockManager.add(lockKey);
    const inicioSync = Date.now();
    
    try {
      const datos = await this.obtenerDatosSupabase(tabla);
      
      if (!datos || datos.length === 0) {
        return { success: true, cambios: 0, metodo: 'INCREMENTAL' };
      }

      await this.verificarTablaDWH(tabla, datos[0]);
      const resultado = await this.aplicarCambios(tabla, datos);
      
      this.actualizarEstadisticas(inicioSync, true);
      
      return {
        success: true,
        cambios: datos.length,
        metodo: 'INCREMENTAL',
        duracion: Date.now() - inicioSync
      };
      
    } catch (error) {
      this.actualizarEstadisticas(inicioSync, false);
      throw error;
      
    } finally {
      this.lockManager.delete(lockKey);
    }
  }

  // 📊 OBTENER DATOS DE SUPABASE (SIN FILTROS)
  async obtenerDatosSupabase(tabla) {
    try {
      const query = `SELECT * FROM "${tabla}"`;
      const datos = await this.supabase.$queryRawUnsafe(query);
      return datos;
      
    } catch (error) {
      if (error.message.includes('does not exist')) {
        return [];
      }
      throw error;
    }
  }

  // 🔍 VERIFICAR/CREAR TABLA EN DWH
  async verificarTablaDWH(tabla, registroMuestra) {
    const client = await this.warehouse.connect();
    
    try {
      const tablaExiste = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = $1
        )
      `, [tabla]);
      
      if (!tablaExiste.rows[0].exists) {
        console.log(`   🆕 Creando tabla nueva: ${tabla}`);
        await this.crearTablaDWH(client, tabla, registroMuestra);
      }
      
    } finally {
      client.release();
    }
  }

  // 🏗️ CREAR TABLA EN DWH
  async crearTablaDWH(client, nombreTabla, registroMuestra) {
    const columnas = Object.entries(registroMuestra).map(([campo, valor]) => {
      let tipo = 'TEXT';
      
      if (typeof valor === 'number') {
        tipo = Number.isInteger(valor) ? 'INTEGER' : 'DECIMAL';
      } else if (typeof valor === 'boolean') {
        tipo = 'BOOLEAN';
      } else if (valor instanceof Date) {
        tipo = 'TIMESTAMP';
      } else if (typeof valor === 'string') {
        tipo = valor.length > 255 ? 'TEXT' : 'VARCHAR(255)';
      }
      
      return `"${campo}" ${tipo}`;
    });
    
    const createSQL = `
      CREATE TABLE "${nombreTabla}" (
        ${columnas.join(',\n        ')}
      )
    `;
    
    await client.query(createSQL);
  }

  // 📝 APLICAR CAMBIOS AL DWH
  async aplicarCambios(tabla, datos) {
    const client = await this.warehouse.connect();
    
    try {
      await client.query(`TRUNCATE TABLE "${tabla}"`);
      
      if (datos.length > 0) {
        await this.insertarRegistros(client, tabla, datos);
      }
      
      return { registrosAfectados: datos.length };
      
    } finally {
      client.release();
    }
  }

  // 📥 INSERTAR REGISTROS
  async insertarRegistros(client, nombreTabla, registros) {
    if (registros.length === 0) return;
    
    const primeraFila = registros[0];
    const campos = Object.keys(primeraFila);
    const camposSQL = campos.map(c => `"${c}"`).join(', ');
    
    const BATCH_SIZE = 100;
    
    for (let i = 0; i < registros.length; i += BATCH_SIZE) {
      const lote = registros.slice(i, i + BATCH_SIZE);
      
      const values = lote.map((registro, idx) => {
        const placeholders = campos.map((_, colIdx) => `$${idx * campos.length + colIdx + 1}`);
        return `(${placeholders.join(', ')})`;
      }).join(', ');
      
      const insertSQL = `INSERT INTO "${nombreTabla}" (${camposSQL}) VALUES ${values}`;
      
      const parametros = lote.flatMap(registro => 
        campos.map(campo => registro[campo])
      );
      
      await client.query(insertSQL, parametros);
    }
  }

  // 📊 ACTUALIZAR ESTADÍSTICAS
  actualizarEstadisticas(inicioSync, exitoso) {
    this.estadisticas.syncsTotales++;
    this.estadisticas.ultimaSync = new Date();
    
    if (exitoso) {
      this.estadisticas.erroresConsecutivos = 0;
      const duracion = Date.now() - inicioSync;
      this.estadisticas.tiempoPromedioSync = 
        (this.estadisticas.tiempoPromedioSync + duracion) / 2;
    } else {
      this.estadisticas.erroresConsecutivos++;
    }
  }

  // 📊 OBTENER ESTADÍSTICAS
  obtenerEstadisticas() {
    return {
      ...this.estadisticas,
      locksActivos: this.lockManager.size
    };
  }

  // 🔍 VERIFICAR CONEXIONES
  async verificarConexiones() {
    await this.supabase.$executeRaw`SELECT 1`;
    const client = await this.warehouse.connect();
    await client.query('SELECT 1');
    client.release();
  }

  // 🛑 CERRAR CONEXIONES
  async cerrar() {
    await this.supabase.$disconnect();
    await this.warehouse.end();
  }
}

module.exports = SyncManager;