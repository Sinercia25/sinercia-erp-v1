// Sincronización automática Supabase -> Data Warehouse
const { PrismaClient } = require('@prisma/client')
const { Pool } = require('pg')

// Conexión a Supabase (origen)
const supabase = new PrismaClient()

// Conexión a Data Warehouse (destino)
const warehouse = new Pool({
  host: '207.154.218.252',
  port: 5432,
  database: 'erp_datawarehouse',
  user: 'erpuser',
  password: 'ERP2025!DataBase#Prod',
  ssl: false
})

async function syncData() {
  console.log('🔄 Iniciando sincronización...')
  
  try {
    // Aquí implementaremos la sincronización
    console.log('✅ Sincronización completada')
  } catch (error) {
    console.error('❌ Error sincronización:', error)
  }
}

// Ejecutar cada 30 segundos
setInterval(syncData, 30000)
console.log('🚀 Sistema de sincronización iniciado - cada 30 segundos')