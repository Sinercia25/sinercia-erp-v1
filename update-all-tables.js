const { Client } = require('pg');

const warehouseConfig = {
  host: '207.154.218.252',
  port: 5432,
  database: 'erp_datawarehouse',
  user: 'erpuser',
  password: 'ERP2025!DataBase#Prod',
  ssl: false
};

const DATOS_COMPLETOS = {
  empresas: [
    {
      id: 'laramada',
      nombre: 'Establecimiento La Ramada S.A.',
      cuit: '30-71234567-8',
      condicionfiscal: 'Responsable Inscripto',
      direccion: 'Ruta Provincial 301 Km 18, Las Talitas, Tucumán',
      telefono: '+54 381 4789012',
      email: 'administracion@laramada.com.ar',
      industria: 'agro',
      createdAt: new Date('2020-03-15'),
      updatedAt: new Date()
    }
  ],

  lotes: [
    { id: 'lote_001', empresaId: 'laramada', numero: 'LN-001', nombre: 'Lote Norte 1', superficie_hectareas: 45.8, ubicacionGps: '-26.8167, -65.2167', activo: true, createdAt: new Date('2020-04-01') },
    { id: 'lote_002', empresaId: 'laramada', numero: 'LN-002', nombre: 'Lote Norte 2', superficie_hectareas: 52.3, ubicacionGps: '-26.8150, -65.2180', activo: true, createdAt: new Date('2020-04-01') },
    { id: 'lote_003', empresaId: 'laramada', numero: 'LN-003', nombre: 'Lote Norte 3', superficie_hectareas: 38.7, ubicacionGps: '-26.8140, -65.2190', activo: true, createdAt: new Date('2020-04-01') },
    { id: 'lote_004', empresaId: 'laramada', numero: 'LS-001', nombre: 'Lote Sur 1', superficie_hectareas: 41.2, ubicacionGps: '-26.8200, -65.2150', activo: true, createdAt: new Date('2020-04-01') },
    { id: 'lote_005', empresaId: 'laramada', numero: 'LS-002', nombre: 'Lote Sur 2', superficie_hectareas: 39.8, ubicacionGps: '-26.8210, -65.2140', activo: true, createdAt: new Date('2020-04-01') },
    { id: 'lote_006', empresaId: 'laramada', numero: 'LS-003', nombre: 'Lote Sur 3', superficie_hectareas: 47.6, ubicacionGps: '-26.8220, -65.2130', activo: true, createdAt: new Date('2020-04-01') },
    { id: 'lote_007', empresaId: 'laramada', numero: 'LE-001', nombre: 'Lote Este 1', superficie_hectareas: 55.4, ubicacionGps: '-26.8170, -65.2100', activo: true, createdAt: new Date('2020-04-01') },
    { id: 'lote_008', empresaId: 'laramada', numero: 'LE-002', nombre: 'Lote Este 2', superficie_hectareas: 43.9, ubicacionGps: '-26.8160, -65.2090', activo: true, createdAt: new Date('2020-04-01') },
    { id: 'lote_009', empresaId: 'laramada', numero: 'LE-003', nombre: 'Lote Este 3', superficie_hectareas: 48.1, ubicacionGps: '-26.8150, -65.2080', activo: true, createdAt: new Date('2020-04-01') },
    { id: 'lote_010', empresaId: 'laramada', numero: 'LO-001', nombre: 'Lote Oeste 1', superficie_hectareas: 51.7, ubicacionGps: '-26.8180, -65.2220', activo: true, createdAt: new Date('2020-04-01') },
    { id: 'lote_011', empresaId: 'laramada', numero: 'LO-002', nombre: 'Lote Oeste 2', superficie_hectareas: 44.3, ubicacionGps: '-26.8190, -65.2230', activo: true, createdAt: new Date('2020-04-01') },
    { id: 'lote_012', empresaId: 'laramada', numero: 'LO-003', nombre: 'Lote Oeste 3', superficie_hectareas: 36.8, ubicacionGps: '-26.8200, -65.2240', activo: true, createdAt: new Date('2020-04-01') },
    { id: 'lote_013', empresaId: 'laramada', numero: 'LC-001', nombre: 'Lote Central 1', superficie_hectareas: 49.2, ubicacionGps: '-26.8175, -65.2175', activo: true, createdAt: new Date('2020-04-01') },
    { id: 'lote_014', empresaId: 'laramada', numero: 'LC-002', nombre: 'Lote Central 2', superficie_hectareas: 42.1, ubicacionGps: '-26.8185, -65.2185', activo: true, createdAt: new Date('2020-04-01') },
    { id: 'lote_015', empresaId: 'laramada', numero: 'LC-003', nombre: 'Lote Central 3', superficie_hectareas: 37.9, ubicacionGps: '-26.8195, -65.2195', activo: true, createdAt: new Date('2020-04-01') },
    { id: 'lote_016', empresaId: 'laramada', numero: 'EX-001', nombre: 'Experimental 1', superficie_hectareas: 15.6, ubicacionGps: '-26.8120, -65.2120', activo: true, createdAt: new Date('2021-05-01') },
    { id: 'lote_017', empresaId: 'laramada', numero: 'EX-002', nombre: 'Experimental 2', superficie_hectareas: 18.3, ubicacionGps: '-26.8130, -65.2110', activo: true, createdAt: new Date('2021-05-01') },
    { id: 'lote_018', empresaId: 'laramada', numero: 'RE-001', nombre: 'Reserva Natural', superficie_hectareas: 12.7, ubicacionGps: '-26.8110, -65.2100', activo: false, createdAt: new Date('2020-04-01') }
  ],

  maquinas: [
    { id: 'maq_001', empresaId: 'laramada', nombre: 'Tractor Principal JD6125R', tipo: 'tractor', marca: 'John Deere', modelo: '6125R', ano: 2020, numeroSerie: 'JD2020001', ubicacionActual: 'Galpón Central', estado: 'Operativa', activa: true, createdAt: new Date('2020-06-15') },
    { id: 'maq_002', empresaId: 'laramada', nombre: 'Tractor Secundario MF7726', tipo: 'tractor', marca: 'Massey Ferguson', modelo: 'MF7726', ano: 2019, numeroSerie: 'MF2019002', ubicacionActual: 'Lote Norte', estado: 'Operativa', activa: true, createdAt: new Date('2019-08-20') },
    { id: 'maq_003', empresaId: 'laramada', nombre: 'Tractor Auxiliar Case IH', tipo: 'tractor', marca: 'Case IH', modelo: 'Farmall 120C', ano: 2018, numeroSerie: 'CI2018003', ubicacionActual: 'Galpón Sur', estado: 'Mantenimiento', activa: true, createdAt: new Date('2018-11-10') },
    { id: 'maq_004', empresaId: 'laramada', nombre: 'Cosechadora Principal AF8240', tipo: 'cosechadora', marca: 'Case IH', modelo: 'AF8240', ano: 2021, numeroSerie: 'AF2021004', ubicacionActual: 'Lote Este', estado: 'Operativa', activa: true, createdAt: new Date('2021-04-05') },
    { id: 'maq_005', empresaId: 'laramada', nombre: 'Cosechadora Secundaria S680', tipo: 'cosechadora', marca: 'John Deere', modelo: 'S680', ano: 2020, numeroSerie: 'JDS2020005', ubicacionActual: 'Galpón Central', estado: 'Operativa', activa: true, createdAt: new Date('2020-09-12') }
  ],

  transacciones: [
    { id: 'trans_001', empresaId: 'laramada', tipo: 'INGRESO', categoria: 'Ventas Azucar', descripcion: 'Venta azúcar crudo - Ingenio La Florida', importe: 12450000, fecha: new Date('2025-07-01'), metodoPago: 'Transferencia', facturaNumero: 'A-0001-00000125', createdAt: new Date('2025-07-01') },
    { id: 'trans_002', empresaId: 'laramada', tipo: 'INGRESO', categoria: 'Ventas Azucar', descripcion: 'Venta azúcar refinado - Ingenio Concepción', importe: 8760000, fecha: new Date('2025-07-03'), metodoPago: 'Cheque', facturaNumero: 'A-0001-00000126', createdAt: new Date('2025-07-03') },
    { id: 'trans_003', empresaId: 'laramada', tipo: 'INGRESO', categoria: 'Ventas Azucar', descripcion: 'Venta azúcar especial - Ingenio San Juan', importe: 15680000, fecha: new Date('2025-07-02'), metodoPago: 'Transferencia', facturaNumero: 'A-0001-00000127', createdAt: new Date('2025-07-02') },
    { id: 'trans_004', empresaId: 'laramada', tipo: 'INGRESO', categoria: 'Servicios Cosecha', descripcion: 'Service cosecha Campo Los Álamos', importe: 3240000, fecha: new Date('2025-07-05'), metodoPago: 'Transferencia', facturaNumero: 'B-0002-00000089', createdAt: new Date('2025-07-05') },
    { id: 'trans_005', empresaId: 'laramada', tipo: 'INGRESO', categoria: 'Servicios Cosecha', descripcion: 'Service cosecha Establecimiento Santa Rosa', importe: 2890000, fecha: new Date('2025-07-01'), metodoPago: 'Cheque', facturaNumero: 'B-0002-00000090', createdAt: new Date('2025-07-01') },
    { id: 'trans_006', empresaId: 'laramada', tipo: 'EGRESO', categoria: 'Combustible', descripcion: 'Gasoil tractores - YPF Las Talitas', importe: 890000, fecha: new Date('2025-07-02'), metodoPago: 'Transferencia', facturaNumero: 'YPF-45678912', createdAt: new Date('2025-07-02') },
    { id: 'trans_007', empresaId: 'laramada', tipo: 'EGRESO', categoria: 'Combustible', descripcion: 'Nafta súper camionetas - Shell Yerba Buena', importe: 125000, fecha: new Date('2025-07-01'), metodoPago: 'Tarjeta', facturaNumero: 'SH-78945612', createdAt: new Date('2025-07-01') },
    { id: 'trans_008', empresaId: 'laramada', tipo: 'EGRESO', categoria: 'Mantenimiento', descripcion: 'Service tractor John Deere 6125R', importe: 340000, fecha: new Date('2025-07-03'), metodoPago: 'Transferencia', facturaNumero: 'JD-SV-001245', createdAt: new Date('2025-07-03') },
    { id: 'trans_009', empresaId: 'laramada', tipo: 'EGRESO', categoria: 'Insumos', descripcion: 'Fertilizante urea - Bunge Argentina', importe: 1250000, fecha: new Date('2025-07-01'), metodoPago: 'Cheque', facturaNumero: 'BG-789456123', createdAt: new Date('2025-07-01') },
    { id: 'trans_010', empresaId: 'laramada', tipo: 'EGRESO', categoria: 'Salarios', descripcion: 'Sueldos personal permanente julio', importe: 2340000, fecha: new Date('2025-07-01'), metodoPago: 'Transferencia', facturaNumero: 'SUE-2025-07', createdAt: new Date('2025-07-01') }
  ],

  cheques: [
    { id: 'cheq_001', empresaId: 'laramada', numero: '12345678', banco: 'Banco Galicia', tipo: 'RECIBIDO', importe: 8760000, fechaEmision: new Date('2025-07-03'), fechaVencimiento: new Date('2025-08-02'), estado: 'Al Día', librador: 'Ingenio Concepción S.A.', beneficiario: 'Establecimiento La Ramada S.A.', concepto: 'Pago Factura A-0001-00000126', numeroCuenta: '4567-123456-8', createdAt: new Date('2025-07-03') },
    { id: 'cheq_002', empresaId: 'laramada', numero: '87654321', banco: 'Banco Macro', tipo: 'RECIBIDO', importe: 2890000, fechaEmision: new Date('2025-07-01'), fechaVencimiento: new Date('2025-07-31'), estado: 'Al Día', librador: 'Establecimiento Santa Rosa', beneficiario: 'Establecimiento La Ramada S.A.', concepto: 'Service cosecha B-0002-00000090', numeroCuenta: '1234-567890-2', createdAt: new Date('2025-07-01') }
  ],

  liquidaciones_ingenio: [
    { id: 'liq_001', empresaId: 'laramada', ingenioNombre: 'Ingenio La Florida', numeroLiquidacion: 'LF-2025-07-001', fechaLiquidacion: new Date('2025-07-05'), periodoInicio: new Date('2025-07-01'), periodoFin: new Date('2025-07-05'), toneladasLiquidadas: 248.5, precioPorTonelada: 50100, totalBruto: 12449850, deducciones: 436745, totalNeto: 12013105, estado: 'Pagada', observaciones: 'Calidad premium - 18.2% sacarosa', createdAt: new Date('2025-07-05') },
    { id: 'liq_002', empresaId: 'laramada', ingenioNombre: 'Ingenio Concepción', numeroLiquidacion: 'CON-2025-07-002', fechaLiquidacion: new Date('2025-07-03'), periodoInicio: new Date('2025-07-02'), periodoFin: new Date('2025-07-03'), toneladasLiquidadas: 175.2, precioPorTonelada: 49800, totalBruto: 8724960, deducciones: 305374, totalNeto: 8419586, estado: 'Pagada', observaciones: 'Calidad estándar - 17.8% sacarosa', createdAt: new Date('2025-07-03') }
  ]
};

async function actualizarTodasLasTablas() {
  const warehouse = new Client(warehouseConfig);
  
  try {
    console.log('🔄 INICIANDO ACTUALIZACIÓN COMPLETA...');
    
    await warehouse.connect();
    console.log('✅ Conectado a Data Warehouse');
    
    let totalRegistros = 0;
    
    for (const [tabla, datos] of Object.entries(DATOS_COMPLETOS)) {
      console.log(`📋 Actualizando tabla: ${tabla}`);
      
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
    
    const superficieTotal = DATOS_COMPLETOS.lotes.reduce((sum, l) => sum + l.superficie_hectareas, 0);
    const ingresosJulio = DATOS_COMPLETOS.transacciones
      .filter(t => t.tipo === 'INGRESO')
      .reduce((sum, t) => sum + t.importe, 0);
    
    console.log('\n🎉 ACTUALIZACIÓN COMPLETADA:');
    console.log(`🌾 ${DATOS_COMPLETOS.lotes.length} lotes (${superficieTotal.toFixed(1)} hectáreas)`);
    console.log(`🚜 ${DATOS_COMPLETOS.maquinas.length} máquinas`);
    console.log(`💰 ${DATOS_COMPLETOS.transacciones.length} transacciones`);
    console.log(`💵 Ingresos: $${(ingresosJulio / 1000000).toFixed(1)}M`);
    console.log(`📈 Total registros: ${totalRegistros}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await warehouse.end();
  }
}

actualizarTodasLasTablas();
