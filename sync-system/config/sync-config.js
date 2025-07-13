module.exports = {
  NIVELES_SYNC: {
    CRITICO: {
      intervalo: 30000,
      metodo: 'INCREMENTAL',
      timeout: 10000,
      reintentos: 3
    },
    IMPORTANTE: {
      intervalo: 120000,
      metodo: 'INCREMENTAL', 
      timeout: 30000,
      reintentos: 2
    },
    NORMAL: {
      intervalo: 300000,
      metodo: 'FULL_REFRESH',
      timeout: 60000,
      reintentos: 1
    }
  },

  CLASIFICACION_TABLAS: {
    CRITICO: ['facturas', 'cobranzas', 'pagos', 'facturas_compras'],
    IMPORTANTE: ['clientes', 'proveedores', 'empleados', 'productos'],
    NORMAL: ['lotes', 'maquinas', 'cultivos', 'cosechas']
  },

  DATABASE: {
    warehouse: {
      host: '207.154.218.252',
      port: 5432,
      database: 'erp_datawarehouse',
      user: 'erpuser',
      password: 'ERP2025!DataBase#Prod'
    }
  }
};
