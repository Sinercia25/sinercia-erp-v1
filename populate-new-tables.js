const { Client } = require('pg');

const warehouseConfig = {
  host: '207.154.218.252',
  port: 5432,
  database: 'erp_datawarehouse',
  user: 'erpuser',
  password: 'ERP2025!DataBase#Prod',
  ssl: false
};

const DATOS_NUEVAS_TABLAS = {
  productos: [
    { id: 'prod_001', empresaId: 'laramada', codigo: 'COMB-001', nombre: 'Gasoil YPF Eurodiesel', categoria: 'Combustible', unidadMedida: 'litros', precioCosto: 850.50, stockMinimo: 2000, activo: true, createdAt: new Date('2024-01-15') },
    { id: 'prod_002', empresaId: 'laramada', codigo: 'FERT-001', nombre: 'Urea Granulada 46% N', categoria: 'Fertilizante', unidadMedida: 'kg', precioCosto: 420.80, stockMinimo: 5000, activo: true, createdAt: new Date('2024-02-01') },
    { id: 'prod_003', empresaId: 'laramada', codigo: 'AGRO-001', nombre: 'Herbicida Glifosato 74.7%', categoria: 'Herbicida', unidadMedida: 'litros', precioCosto: 1850.00, stockMinimo: 500, activo: true, createdAt: new Date('2024-02-15') },
    { id: 'prod_004', empresaId: 'laramada', codigo: 'SEM-001', nombre: 'Semilla Caña LCP 85-384', categoria: 'Semilla', unidadMedida: 'metros', precioCosto: 12.50, stockMinimo: 10000, activo: true, createdAt: new Date('2024-03-01') },
    { id: 'prod_005', empresaId: 'laramada', codigo: 'REP-001', nombre: 'Filtro Aceite Motor John Deere', categoria: 'Repuesto', unidadMedida: 'unidad', precioCosto: 3450.00, stockMinimo: 10, activo: true, createdAt: new Date('2024-03-15') }
  ],

  usuarios: [
    { id: 'usr_001', empresaId: 'laramada', email: 'gerente@laramada.com.ar', nombre: 'Carlos', apellido: 'Mendoza', rol: 'Gerente General', activo: true, ultimoLogin: new Date('2025-07-03'), createdAt: new Date('2020-03-15') },
    { id: 'usr_002', empresaId: 'laramada', email: 'admin@laramada.com.ar', nombre: 'María', apellido: 'González', rol: 'Administradora', activo: true, ultimoLogin: new Date('2025-07-03'), createdAt: new Date('2020-03-15') },
    { id: 'usr_003', empresaId: 'laramada', email: 'contador@laramada.com.ar', nombre: 'Roberto', apellido: 'Silva', rol: 'Contador', activo: true, ultimoLogin: new Date('2025-07-02'), createdAt: new Date('2020-06-01') },
    { id: 'usr_004', empresaId: 'laramada', email: 'ingeniero@laramada.com.ar', nombre: 'Ana', apellido: 'Rodríguez', rol: 'Ingeniera Agrónoma', activo: true, ultimoLogin: new Date('2025-07-03'), createdAt: new Date('2021-02-15') },
    { id: 'usr_005', empresaId: 'laramada', email: 'capataz1@laramada.com.ar', nombre: 'José', apellido: 'Fernández', rol: 'Capataz Norte', activo: true, ultimoLogin: new Date('2025-07-03'), createdAt: new Date('2019-05-20') },
    { id: 'usr_006', empresaId: 'laramada', email: 'operario1@laramada.com.ar', nombre: 'Pedro', apellido: 'López', rol: 'Operario Tractor', activo: true, ultimoLogin: new Date('2025-07-02'), createdAt: new Date('2020-08-10') }
  ],

  trabajos_maquina: [
    { id: 'trab_001', empresaId: 'laramada', maquinaId: 'maq_001', loteId: 'lote_001', tipoTrabajo: 'Preparación Suelo', fecha: new Date('2025-07-01'), horaInicio: '07:00', horaFin: '16:30', horasTrabajadas: 8.5, combustibleLitros: 68.0, costoCombustible: 57800, esServicioTerceros: false, observaciones: 'Arado y rastra en Lote Norte 1', createdAt: new Date('2025-07-01') },
    { id: 'trab_002', empresaId: 'laramada', maquinaId: 'maq_004', loteId: 'lote_007', tipoTrabajo: 'Cosecha', fecha: new Date('2025-07-02'), horaInicio: '05:00', horaFin: '18:00', horasTrabajadas: 12.0, combustibleLitros: 150.0, costoCombustible: 127500, esServicioTerceros: false, observaciones: 'Cosecha caña Lote Este 1 - 180 tn', createdAt: new Date('2025-07-02') },
    { id: 'trab_003', empresaId: 'laramada', maquinaId: 'maq_004', loteId: null, tipoTrabajo: 'Cosecha', fecha: new Date('2025-07-01'), horaInicio: '05:00', horaFin: '16:00', horasTrabajadas: 10.0, combustibleLitros: 125.0, costoCombustible: 106250, esServicioTerceros: true, clienteTercero: 'Establecimiento Santa Rosa', tarifaPorHora: 28000, totalFacturado: 280000, observaciones: 'Service cosecha externa', createdAt: new Date('2025-07-01') },
    { id: 'trab_004', empresaId: 'laramada', maquinaId: 'maq_003', loteId: null, tipoTrabajo: 'Mantenimiento', fecha: new Date('2025-07-03'), horaInicio: '08:00', horaFin: '12:00', horasTrabajadas: 4.0, combustibleLitros: 0, costoCombustible: 0, esServicioTerceros: false, observaciones: 'Service programado 250 horas', createdAt: new Date('2025-07-03') }
  ]
};

async function poblarTablasNuevas() {
  const warehouse = new Client(warehouseConfig);
  
  try {
    console.log('🔄 POBLANDO TABLAS NUEVAS...');
    
    await warehouse.connect();
    console.log('✅ Conectado a Data Warehouse');
    
    let totalRegistros = 0;
    
    for (const [tabla, datos] of Object.entries(DATOS_NUEVAS_TABLAS)) {
      console.log(`📋 Poblando tabla: ${tabla}`);
      
      await warehouse.query(`TRUNCATE TABLE ${tabla} CASCADE`);
      
      for (const registro of datos) {
        const columnas = Object.keys(registro);
        const valores = Object.values(registro);
        const placeholders = valores.map((_, i) => `$${i + 1}`).join(', ');
        
        await warehouse.query(
          `INSERT INTO ${tabla} (${columnas.join(', ')}) VALUES (${placeholders})`,
          valores
        );
      }
      
      totalRegistros += datos.length;
      console.log(`✅ ${tabla}: ${datos.length} registros insertados`);
    }
    
    const horasTotales = DATOS_NUEVAS_TABLAS.trabajos_maquina.reduce((sum, t) => sum + (t.horasTrabajadas || 0), 0);
    const combustibleTotal = DATOS_NUEVAS_TABLAS.trabajos_maquina.reduce((sum, t) => sum + (t.combustibleLitros || 0), 0);
    
    console.log('\n🎉 EXPANSIÓN COMPLETADA:');
    console.log(`🛍️ ${DATOS_NUEVAS_TABLAS.productos.length} productos registrados`);
    console.log(`👥 ${DATOS_NUEVAS_TABLAS.usuarios.length} empleados activos`);
    console.log(`🚜 ${DATOS_NUEVAS_TABLAS.trabajos_maquina.length} trabajos de máquina`);
    console.log(`🕒 ${horasTotales} horas trabajadas total`);
    console.log(`⛽ ${combustibleTotal} litros combustible`);
    console.log(`📈 ${totalRegistros} registros nuevos`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await warehouse.end();
  }
}

poblarTablasNuevas();
