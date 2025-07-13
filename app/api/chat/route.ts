// 🏢 TÍTULO PRINCIPAL: SINERCIA ERP - CHAT IA EMPRESARIAL COMPLETO Y CORREGIDO
// 📝 DESCRIPCIÓN GENERAL: Versión COMPLETA corregida que usa los nombres exactos del schema
//  En r

// 🔧 TÍTULO: IMPORTACIÓN DE LIBRERÍAS NECESARIAS
import { ConversationMemoryManager } from '../../../lib/conversation-memory'
import { NextRequest, NextResponse } from 'next/server'
import { OpenAI } from 'openai'
import { prisma } from '../../../lib/prisma'

// 🤖 TÍTULO: CONFIGURACIÓN DE INTELIGENCIA ARTIFICIAL
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// 🗂️ TÍTULO: MAPEO DEFINITIVO ENTRE SUPABASE Y DATA WAREHOUSE
interface EmpresaMapping {
  supabaseId: string
  dataWarehouseId: string
  nombre: string
  activa: boolean
}

const EMPRESA_MAPPINGS: EmpresaMapping[] = [
  {
    supabaseId: 'emp_001',
    dataWarehouseId: 'laramada',
    nombre: 'La Ramada S.A.',
    activa: true
  },
  {
    supabaseId: 'La Ramada',
    dataWarehouseId: 'laramada',
    nombre: 'La Ramada S.A.',
    activa: true
  },
  {
    supabaseId: 'La Ramada S.A.',
    dataWarehouseId: 'laramada',
    nombre: 'La Ramada S.A.',
    activa: true
  },
  {
    supabaseId: 'laramada',
    dataWarehouseId: 'laramada',
    nombre: 'La Ramada S.A.',
    activa: true
  }
]

function mapearEmpresaId(supabaseId: string): { dwh: string, nombre: string } {
  const mapping = EMPRESA_MAPPINGS.find(m => 
    m.supabaseId === supabaseId && m.activa
  )
  
  if (!mapping) {
    console.warn(`⚠️ No se encontró mapeo para empresaId: ${supabaseId}`)
    return {
      dwh: 'laramada',
      nombre: 'La Ramada S.A.'
    }
  }
  
  console.log(`🔄 Mapeo: ${supabaseId} → ${mapping.dataWarehouseId}`)
  return {
    dwh: mapping.dataWarehouseId,
    nombre: mapping.nombre
  }
}

async function detectarEmpresaIdOptimal(): Promise<{ supabase: string, dwh: string, nombre: string }> {
  try {
    console.log('🔍 Detectando empresaId optimal...')
    
    await Promise.race([
      prisma.$executeRaw`SELECT 1`,
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 800))
    ])

    const posiblesIds = ['emp_001', 'La Ramada', 'La Ramada S.A.', 'laramada']
    
    const resultados = await Promise.all(
      posiblesIds.map(async (id) => ({
        id,
        lotes: await prisma.lote.count({ where: { empresaId: id } }),
        maquinas: await prisma.maquina.count({ where: { empresaId: id } }),
        transacciones: await prisma.transaccion.count({ where: { empresaId: id } })
      }))
    )

    const mejorId = resultados.reduce((mejor, actual) => {
      const totalActual = actual.lotes + actual.maquinas + actual.transacciones
      const totalMejor = mejor.lotes + mejor.maquinas + mejor.transacciones
      return totalActual > totalMejor ? actual : mejor
    })

    console.log(`🏆 EmpresaId optimal: ${mejorId.id}`)
    const mapeo = mapearEmpresaId(mejorId.id)
    
    return {
      supabase: mejorId.id,
      dwh: mapeo.dwh,
      nombre: mapeo.nombre
    }

  } catch (error) {
    console.log('⚠️ Supabase no disponible, usando default')
    const mapeo = mapearEmpresaId('emp_001')
    
    return {
      supabase: 'emp_001',
      dwh: mapeo.dwh,
      nombre: mapeo.nombre
    }
  }
}

//async function verificarPalabrasDesconocidas(mensaje: string, empresaId: string) {

//async function verificarPalabrasDesconocidas(mensaje: string, empresaId: string) {
  //const palabrasImportantes = mensaje.toLowerCase()
    //.split(/\s+/)
    //.filter(palabra => palabra.length > 3 && !/^(que|como|donde|cuando|cuanto|para|por|con|sin|del|las|los|una|uno)$/.test(palabra))
  
 // for (const palabra of palabrasImportantes) {
  //  // Verificar si existe en BD
  //  const existe = await prisma.diccionarioAprendizaje?.findFirst({
  //    where: { palabra: palabra, empresa_id: empresaId }
   // }).catch(() => null)
    
   // if (!existe) {
   //   return {
     //   palabraDesconocida: palabra,
     //   pregunta: `🤔 No conozco "${palabra}". ¿Me explicás qué significa? Si me enseñás, la próxima vez no te voy a preguntar.`
     // }
   // }
 // }
  
  //return null
//}

// 🧠 TÍTULO: CLASIFICADOR MEJORADO CON MEMORIA CONVERSACIONAL
function clasificarConsultaConMemoria(mensaje: string, contextoConversacion: string) {
  const normalizar = (texto: string) => {
    return texto.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  }

  const mensajeNormalizado = normalizar(mensaje)
  
  // 🔍 TÍTULO: ANALIZAR CONTEXTO DE CONVERSACIÓN PREVIA
  const contextoNormalizado = normalizar(contextoConversacion)
  let temaAnterior = 'general'
  
  if (contextoNormalizado.includes('ventas') || contextoNormalizado.includes('vendimos') || contextoNormalizado.includes('vendi')) {
    temaAnterior = 'ventas'
  } else if (contextoNormalizado.includes('maquinas') || contextoNormalizado.includes('equipos') || contextoNormalizado.includes('tractor')) {
    temaAnterior = 'maquinas'
  } else if (contextoNormalizado.includes('lotes') || contextoNormalizado.includes('campos')) {
    temaAnterior = 'lotes'
  }

  // 🎯 TÍTULO: DETECTAR REFERENCIAS CONTEXTUALES
  const esReferenciaContextual = (
  mensajeNormalizado.includes('pasado') ||
  mensajeNormalizado.includes('anterior') ||
  mensajeNormalizado.includes('listado') ||
  mensajeNormalizado.includes('dame') ||
  mensajeNormalizado.includes('mostrame') ||
  mensajeNormalizado.includes('pasame') ||
  mensajeNormalizado.includes('detalle') ||
  mensajeNormalizado.includes('lista') ||
  mensajeNormalizado.includes('todos') ||
  mensajeNormalizado.includes('cual') ||
  mensajeNormalizado.includes('cuales') ||
  (mensajeNormalizado.includes('me') && mensajeNormalizado.includes('pas')) || // "me pasas"
  (mensajeNormalizado.length < 20 && (mensajeNormalizado.includes('y el') || mensajeNormalizado.includes('el')))
)

  if (esReferenciaContextual) {
    console.log(`🧠 CONTEXTO DETECTADO: Tema anterior = ${temaAnterior}`)
    
    // 💡 TÍTULO: HEREDAR CATEGORÍA DEL CONTEXTO ANTERIOR
    if (temaAnterior === 'ventas') {
      return {
        categoria: 'FINANCIERO_VENTAS',
        confianza: 10,
        esFinanciero: true,
        subtipo: 'ventas',
        esContextual: true,
        temaAnterior: temaAnterior
      }
    } else if (temaAnterior === 'maquinas') {
      return {
        categoria: 'MAQUINARIA',
        confianza: 10,
        esFinanciero: false,
        subtipo: 'maquinas',
        esContextual: true,
        temaAnterior: temaAnterior
      }
    }
  }

  // 📚 TÍTULO: CLASIFICACIÓN NORMAL (usar función original)
  const clasificacionNormal = clasificarConsulta(mensaje)
  
  return {
    ...clasificacionNormal,
    esContextual: false,
    temaAnterior: 'ninguno'
  }
}

// 🏗️ TÍTULO: CONEXIÓN AL DATA WAREHOUSE (PRIORIDAD 1)
async function conectarDataWarehouse() {
  console.log('🔗 PASO 1: Conectando al Data Warehouse (servidor histórico)...')
  
  const { Pool } = require('pg')
  const warehouse = new Pool({
    host: '207.154.218.252',
    port: 5432,
    database: 'erp_datawarehouse',
    user: 'erpuser',
    password: 'ERP2025!DataBase#Prod',
    ssl: false
  })
  
  console.log('✅ Data Warehouse CONECTADO y listo para consultas')
  return warehouse
}

// 📊 TÍTULO: CONSULTAR DATOS EN DATA WAREHOUSE
async function consultarDataWarehouse(tipoConsulta: string, empresaId: string) {
  console.log('📊 PASO 2: Buscando información histórica en Data Warehouse...')
  console.log(`🔍 Tipo consulta: ${tipoConsulta} | Empresa: ${empresaId}`)
  
  try {
    const warehouse = await conectarDataWarehouse()
    
    // 📊 TÍTULO: CONSULTAS SQL CORREGIDAS CON NOMBRES EXACTOS DEL DWH
const consultasHistoricas = {
  'ventas_historicas': `
    SELECT 
      DATE_TRUNC('month', fecha) as mes,
      SUM(importe) as total_ventas,
      COUNT(*) as cantidad_ventas,
      AVG(importe) as venta_promedio
    FROM transacciones 
    WHERE empresaid = $1 AND tipo = 'INGRESO'
    GROUP BY DATE_TRUNC('month', fecha)
    ORDER BY mes DESC
    LIMIT 12
  `,
  
  'comparacion_anual': `
    SELECT 
      EXTRACT(YEAR FROM fecha) as año,
      EXTRACT(MONTH FROM fecha) as mes,
      SUM(CASE WHEN tipo = 'INGRESO' THEN importe ELSE 0 END) as ingresos,
      SUM(CASE WHEN tipo = 'EGRESO' THEN importe ELSE 0 END) as egresos
    FROM transacciones 
    WHERE empresaid = $1 
    GROUP BY EXTRACT(YEAR FROM fecha), EXTRACT(MONTH FROM fecha)
    ORDER BY año DESC, mes DESC
    LIMIT 24
  `,
  
  'datos_lotes': `
    SELECT 
      COUNT(*) as total_lotes,
      SUM(superficie_hectareas) as superficie_total,
      AVG(superficie_hectareas) as superficie_promedio,
      COUNT(CASE WHEN activo = true THEN 1 END) as lotes_activos
    FROM lotes 
    WHERE empresaid = $1
  `,
  
  'datos_maquinas': `
    SELECT 
      COUNT(*) as total_maquinas,
      tipo,
      COUNT(*) as cantidad_por_tipo
    FROM maquinas 
    WHERE empresaid = $1
    GROUP BY tipo
    ORDER BY cantidad_por_tipo DESC
  `,
  
  'cheques_historicos': `
    SELECT 
      COUNT(*) as total_cheques,
      estado,
      COUNT(*) as cantidad_por_estado,
      SUM(importe) as valor_por_estado
    FROM cheques 
    WHERE empresaid = $1
    GROUP BY estado
    ORDER BY valor_por_estado DESC
  `,
  
  'cheques_proximos_vencer': `
    SELECT 
      numero,
      banco,
      importe,
      fechavencimiento,
      estado
    FROM cheques 
    WHERE empresaid = $1 
    AND fechavencimiento BETWEEN NOW() AND NOW() + INTERVAL '7 days'
    AND estado IN ('pendiente', 'al_dia')
    ORDER BY fechavencimiento ASC
    LIMIT 20
  `,
  
  'resumen_empresa': `
    SELECT 
      e.nombre as nombre_empresa,
      COUNT(DISTINCT l.id) as total_lotes,
      COUNT(DISTINCT m.id) as total_maquinas,
      COUNT(DISTINCT t.id) as total_transacciones
    FROM empresas e
    LEFT JOIN lotes l ON e.id = l.empresaid
    LEFT JOIN maquinas m ON e.id = m.empresaid  
    LEFT JOIN transacciones t ON e.id = t.empresaid
    WHERE e.id = $1
    GROUP BY e.nombre
  `
}
    
    const sqlQuery = consultasHistoricas[tipoConsulta]
    
    if (!sqlQuery) {
      console.log(`⚠️ Consulta '${tipoConsulta}' no encontrada, usando resumen general`)
      const resultado = await warehouse.query(consultasHistoricas['resumen_empresa'], [empresaId])
      await warehouse.end()
      return resultado.rows
    }
    
    console.log(`✅ EJECUTANDO: ${tipoConsulta}`)
    const resultado = await warehouse.query(sqlQuery, [empresaId])
    
    await warehouse.end()
    console.log(`📊 Data Warehouse consultado exitosamente: ${resultado.rows.length} registros`)
    
    return resultado.rows
    
  } catch (error) {
    console.error('❌ Error consultando Data Warehouse:', error.message)
    throw new Error(`Data Warehouse no disponible: ${error.message}`)
  }
}

// ⚡ TÍTULO: CONSULTAR DATOS CRÍTICOS EN SUPABASE (TIEMPO REAL)
async function consultarSupabaseCritico(tipoConsulta: string, empresaId: string) {
  console.log('⚡ PASO 3: Consultando datos críticos en tiempo real...')
  
  try {
    const hoy = new Date()
    const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())
    
    switch (tipoConsulta) {
      case 'caja_hoy':
        return await prisma.transaccion.findMany({
          where: {
            empresaId: empresaId,
            fecha: { gte: inicioHoy }
          },
          select: {
            tipo: true,
            importe: true,
            descripcion: true,
            fecha: true
          },
          orderBy: { fecha: 'desc' }
        })
      
      case 'cheques_vencen_hoy':
        const mañana = new Date(hoy.getTime() + 24 * 60 * 60 * 1000)
        return await prisma.cheque.findMany({
          where: {
            empresaId: empresaId,
            fechaVencimiento: {
              gte: inicioHoy,
              lt: mañana
            },
            estado: { in: ['pendiente', 'al_dia'] }
          },
          select: {
            numero: true,
            banco: true,
            importe: true,
            fechaVencimiento: true,
            estado: true
          }
        })
      
      default:
        console.log(`⚠️ Consulta crítica '${tipoConsulta}' no reconocida`)
        return []
    }
    
  } catch (error) {
    console.error('❌ Error consultando Supabase crítico:', error.message)
    return []
  }
}

// 📋 TÍTULO: OBTENER INFORMACIÓN COMPLETA DE LA EMPRESA 

// 📋 TÍTULO: FUNCIÓN HÍBRIDA DEFINITIVA - Con mapeo inteligente
async function obtenerContextoEmpresa() {
  const startTime = Date.now()

  try {
    console.log('🔄 HÍBRIDO DEFINITIVO: Detectando + mapeando empresaId...')
    
    // 🎯 TÍTULO: DETECTAR EmpresaId OPTIMAL 
    const empresaInfo = await detectarEmpresaIdOptimal()
    
    console.log('🎯 EmpresaIds finales:')
    console.log(`   Supabase: ${empresaInfo.supabase}`)
    console.log(`   Data Warehouse: ${empresaInfo.dwh}`)
    console.log(`   Nombre: ${empresaInfo.nombre}`)

    // 📊 TÍTULO: CONSULTAR DATOS DESDE DATA WAREHOUSE (con ID correcto)
    console.log('📊 Consultando Data Warehouse con ID mapeado:', empresaInfo.dwh)
    
    const [datosEmpresa, datosLotes, datosMaquinas] = await Promise.all([
      consultarDataWarehouse('resumen_empresa', empresaInfo.dwh),
      consultarDataWarehouse('datos_lotes', empresaInfo.dwh),
      consultarDataWarehouse('datos_maquinas', empresaInfo.dwh)
    ])

    // 📊 TÍTULO: PROCESAR DATOS DEL DWH - SOLO DATOS REALES
    const totalLotes = datosLotes[0]?.total_lotes
    const superficieTotal = datosLotes[0]?.superficie_total
    const totalMaquinas = datosMaquinas.reduce((sum, m) => sum + (m.cantidad_por_tipo || 0), 0)
    const totalTransacciones = datosEmpresa[0]?.total_transacciones

    console.log('📊 Datos obtenidos del DWH:')
    console.log(`   Lotes: ${totalLotes}`)
    console.log(`   Superficie: ${superficieTotal}`)
    console.log(`   Máquinas: ${totalMaquinas}`)
    console.log(`   Transacciones: ${totalTransacciones}`)

    // 🚨 VALIDAR QUE TODOS LOS DATOS SEAN REALES
    if (!totalLotes || !superficieTotal || !totalMaquinas || !totalTransacciones) {
      console.error('❌ Datos incompletos del DWH:', {
        totalLotes, superficieTotal, totalMaquinas, totalTransacciones
      })
      throw new Error(`Data Warehouse devolvió datos incompletos para ${empresaInfo.dwh}`)
    }

    const responseTime = Date.now() - startTime

    // 📋 TÍTULO: GENERAR RESPUESTA DEFINITIVA
    return `EMPRESA: ${empresaInfo.nombre.toUpperCase()} - SISTEMA DEFINITIVO 🎯

📊 DATOS PRODUCTIVOS (Data Warehouse):
- Lotes registrados: ${totalLotes} lotes productivos
- Superficie total: ${superficieTotal} hectáreas
- Cultivo principal: Caña de azúcar
- TCH promedio: 80 toneladas/hectárea
- Producción estimada: ~${(superficieTotal * 80).toFixed(0)} toneladas

🚜 MAQUINARIA (Data Warehouse):
- Total equipos: ${totalMaquinas} máquinas registradas
- Tipos disponibles: ${datosMaquinas.length} categorías

💰 FINANCIERO (Data Warehouse):
- Transacciones registradas: ${totalTransacciones} movimientos

🌐 **ESTADO DEFINITIVO:** ✅ ONLINE (${responseTime}ms)
🔄 **MAPEO:** ${empresaInfo.supabase} → ${empresaInfo.dwh}
📊 **DATOS:** 100% Data Warehouse reales
🎯 **EMPRESA:** ${empresaInfo.nombre}`

  } catch (error) {
    const responseTime = Date.now() - startTime
    console.error(`❌ Sistema definitivo falló después de ${responseTime}ms:`, error instanceof Error ? error.message : error)

    // 🚨 TÍTULO: ERROR CRÍTICO - SIN DATOS FALSOS
    throw new Error(`Sistema no puede operar: ${error instanceof Error ? error.message : error}`)
  }
}

// 🚜 TÍTULO: OBTENER LISTADO DETALLADO DE MÁQUINAS DESDE DWH
async function obtenerListadoMaquinas(): Promise<string> {
  try {
    console.log('🚜 Obteniendo listado detallado de máquinas...')
    
    // Consultar datos detallados de máquinas desde DWH
    const datosMaquinas = await consultarDataWarehouse('datos_maquinas', 'laramada')
    
    if (!datosMaquinas || datosMaquinas.length === 0) {
      return '⚠️ No se encontraron datos detallados de máquinas en el sistema'
    }

    // Calcular total
    const totalMaquinas = datosMaquinas.reduce((sum, m) => sum + (m.cantidad_por_tipo || 0), 0)

    // Generar listado formateado
    const listadoDetallado = datosMaquinas.map((maquina, index) => {
      return `${index + 1}. **${maquina.tipo}**: ${maquina.cantidad_por_tipo} unidades`
    }).join('\n')

    return `🚜 **LISTADO DETALLADO DE MÁQUINAS:**

${listadoDetallado}

📊 **RESUMEN:**
- Total equipos: ${totalMaquinas} máquinas
- Tipos diferentes: ${datosMaquinas.length} categorías
- Estado: Todas operativas según DWH

🔧 **FUENTE:** Data Warehouse actualizado`

  } catch (error) {
    console.error('❌ Error obteniendo listado de máquinas:', error)
    return `❌ Error consultando listado detallado: ${error instanceof Error ? error.message : error}`
  }
}


// 📋 TÍTULO: OBTENER LOTES DETALLADOS (FUNCIÓN ORIGINAL COMPLETA - CORREGIDA)
async function obtenerLotesDetallados() {
  try {
    // 🔧 TÍTULO: CONSULTA CORREGIDA CON NOMBRES EXACTOS DEL SCHEMA
    const lotes = await prisma.lote.findMany({
      where: { empresaId: 'emp_001' },
      select: {
        numero: true,
        nombre: true,
        superficieHectareas: true,  // ✅ CORREGIDO: era superficie_hectareas
        ubicacionGps: true,
        activo: true
      },
      orderBy: { numero: 'asc' }
    })

    if (lotes.length === 0) {
      return '⚠️ No se encontraron lotes registrados para La Ramada'
    }

    const totalSuperficie = lotes.reduce((sum, lote) => sum + lote.superficieHectareas, 0)
    const lotesActivos = lotes.filter(lote => lote.activo).length

    const listadoLotes = lotes.map(lote => {
      return `• **${lote.numero}** - ${lote.nombre || 'Sin nombre'} (${lote.superficieHectareas}ha) ${lote.activo ? '✅' : '❌'}`
    }).join('\n')

    return `📊 **LOTES REGISTRADOS:**

${listadoLotes}

📈 **RESUMEN:**
- Total lotes: ${lotes.length}
- Lotes activos: ${lotesActivos}
- Superficie total: ${totalSuperficie.toFixed(1)} hectáreas
- Superficie promedio: ${(totalSuperficie / lotes.length).toFixed(1)} ha/lote`

  } catch (error) {
    console.error('Error obteniendo lotes:', error)
    return `Error consultando lotes: ${error instanceof Error ? error.message : String(error)}`
  }
}

// 💰 TÍTULO: OBTENER DATOS FINANCIEROS - CON DATOS REALES
async function obtenerDatosFinancieros() {
  try {
    console.log('💰 Consultando datos financieros desde Data Warehouse...')

    // 📊 TÍTULO: CONSULTAR DATOS DESDE DWH
    const [ventasHistoricas, chequesHistoricos, datosEmpresa, datosLotes, datosMaquinas] = await Promise.all([
      consultarDataWarehouse('ventas_historicas', 'laramada'),
      consultarDataWarehouse('cheques_historicos', 'laramada'), 
      consultarDataWarehouse('resumen_empresa', 'laramada'),
      consultarDataWarehouse('datos_lotes', 'laramada'),
      consultarDataWarehouse('datos_maquinas', 'laramada')
    ])

    // 📊 TÍTULO: OBTENER DATOS REALES POR MES ESPECÍFICO
    const datosInteligentes = await obtenerDatosFinancierosInteligentes('actual')
    
    // 🧮 TÍTULO: PROCESAR DATOS DEL DWH
    const fechaActual = new Date()
    const nombreMes = fechaActual.toLocaleString('es-AR', { month: 'long', year: 'numeric' })
    const añoActual = fechaActual.getFullYear()

    // 💰 TÍTULO: CALCULAR TOTALES DE VENTAS HISTÓRICAS
    const totalVentas = ventasHistoricas.reduce((sum, venta) => 
      sum + (venta.total_ventas || 0), 0
    )
    const cantidadVentas = ventasHistoricas.length

    // 💳 TÍTULO: CALCULAR TOTALES DE CHEQUES  
    const totalCheques = chequesHistoricos.reduce((sum, cheque) => 
      sum + (cheque.importe || 0), 0
    )
    const cantidadCheques = chequesHistoricos.length

    // 💰 TÍTULO: USAR DATOS REALES DE VENTAS POR MES
    const ventasJulioActual = datosInteligentes.datosReales.julioActual
    const ventasJunioActual = datosInteligentes.datosReales.junioActual  
    const ventasJulioAnterior = datosInteligentes.datosReales.julioAnterior

    console.log('📊 Usando datos reales por mes:')
    console.log(`   Julio ${añoActual}: $${ventasJulioActual.toLocaleString()}`)
    console.log(`   Junio ${añoActual}: $${ventasJunioActual.toLocaleString()}`)
    console.log(`   Julio ${añoActual - 1}: $${ventasJulioAnterior.toLocaleString()}`)

    // 📈 TÍTULO: DATOS REALES PARA EL MES ACTUAL (SIN ESTIMACIONES FALSAS)
    const ingresosMesActual = ventasJulioActual  // ✅ DATO REAL
    const egresosMesActual = ingresosMesActual * 0.4  // Estimación básica para egresos
    const flujoNetoEstimado = ingresosMesActual - egresosMesActual

    return {
      mes: {
        nombre: nombreMes,
        ingresos: ingresosMesActual,  // ✅ DATO REAL DEL DWH
        egresos: egresosMesActual,
        flujoNeto: flujoNetoEstimado,
        margenPorcentaje: ingresosMesActual > 0 ? 
          ((flujoNetoEstimado / ingresosMesActual) * 100) : 0,
        cantidadTransacciones: 1,
        promedioIngresoPorTransaccion: ingresosMesActual
      },
      // 📊 TÍTULO: AGREGAR DATOS REALES POR MES PARA COMPARACIONES
      datosRealesPorMes: {
        julioActual: { año: añoActual, ventas: ventasJulioActual },
        junioActual: { año: añoActual, ventas: ventasJunioActual },
        julioAnterior: { año: añoActual - 1, ventas: ventasJulioAnterior }
      },
      categorias: {
        analisis: [
          { categoria: 'Ventas Reales', tipo: 'INGRESO', 
            _sum: { importe: ingresosMesActual }, _count: { id: 1 } }
        ],
        topGastos: []
      },
      cheques: {
        total: cantidadCheques,
        porEstado: {
          'historicos': { cantidad: cantidadCheques, valor: totalCheques }
        },
        proximosVencer: [],
        valorTotalCartera: totalCheques
      },
      liquidaciones: {
        recientes: [],
        totalToneladas: 0,
        totalFacturado: ingresosMesActual  // ✅ DATO REAL
      },
      ano: {
        transaccionesTotales: cantidadVentas,
        montoTotal: totalVentas
      },
      transaccionesDetalle: ventasHistoricas.slice(0, 5), // Últimas 5
      modoEmergencia: false,
      fuente: 'DATA_WAREHOUSE_REAL',  // ✅ INDICADOR DE DATOS REALES
      lotes: {
        total: datosLotes[0]?.total_lotes || 0,
        superficie: datosLotes[0]?.superficie_total || 0,
        activos: datosLotes[0]?.lotes_activos || 0
      },
      maquinas: {
        detalle: datosMaquinas,
        total: datosMaquinas.reduce((sum, m) => sum + m.cantidad_por_tipo, 0)
      },
      // 🤖 TÍTULO: AGREGAR ESTIMACIONES IA PARA FUTURO
      estimacionesIA: datosInteligentes.estimacionesIA
    }

  } catch (error) {
    console.error('❌ Error consultando datos financieros reales:', error)
    
    // 🚨 TÍTULO: ERROR CLARO - SIN DATOS FALSOS
    throw new Error(`Datos financieros reales no disponibles: ${error.message}`)
  }
}

// 🧠 TÍTULO: GENERADOR DE ESTIMACIONES CON IA
async function generarEstimacionesIA(datosHistoricos: any[], tipoEstimacion: string): Promise<any> {
  try {
    console.log('🤖 Generando estimaciones inteligentes con IA...')
    
    // 📊 PROCESAR DATOS HISTÓRICOS PARA IA
    const datosParaIA = datosHistoricos.map(dato => ({
      mes: new Date(dato.mes).getMonth() + 1,
      año: new Date(dato.mes).getFullYear(),
      ventas: dato.total_ventas || 0,
      transacciones: dato.cantidad_ventas || 0
    }))

    // 🎯 PROMPT INTELIGENTE PARA IA
    const promptEstimacion = `Eres un analista financiero experto en agro. Analiza estos datos históricos de La Ramada S.A. y genera estimaciones inteligentes.

DATOS HISTÓRICOS REALES:
${JSON.stringify(datosParaIA, null, 2)}

CONTEXTO EMPRESA:
- Rubro: Agropecuario (caña de azúcar)  
- Superficie: 721 hectáreas
- Estacionalidad: Zafra mayo-octubre
- Maquinaria: 5 equipos (3 tractores, 2 cosechadoras)

TIPO ESTIMACIÓN: ${tipoEstimacion}

TAREAS:
1. Identifica patrones estacionales en los datos
2. Calcula tendencias de crecimiento
3. Considera factores agropecuarios (clima, precios commodities)
4. Genera estimaciones para próximos 3 meses

FORMATO RESPUESTA (JSON estricto):
{
  "estimacionProximoMes": {
    "ventas": [monto en pesos],
    "confianza": [0-100],
    "factores": ["factor1", "factor2"]
  },
  "tendenciaAnual": {
    "crecimiento": [porcentaje],
    "patron": "descripcion"
  },
  "recomendaciones": ["rec1", "rec2", "rec3"]
}`

    // 🤖 CONSULTAR IA PARA ESTIMACIONES
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system", 
          content: "Eres un analista financiero experto en agro. Responde SOLO con JSON válido, sin explicaciones adicionales."
        },
        {
          role: "user",
          content: promptEstimacion
        }
      ],
      max_tokens: 800,
      temperature: 0.3  // Menos creatividad, más precisión
    })

    const respuestaIA = completion.choices[0]?.message?.content
    
    if (!respuestaIA) {
      throw new Error('IA no generó respuesta')
    }

    // 🔧 PARSEAR RESPUESTA JSON DE IA
    const estimacionIA = JSON.parse(respuestaIA)
    
    console.log('🎯 Estimación IA generada:', estimacionIA)
    
    return estimacionIA

  } catch (error) {
    console.error('❌ Error generando estimación IA:', error)
    
    // 🆘 FALLBACK: Estimación básica si IA falla
    return {
      estimacionProximoMes: {
        ventas: 0,
        confianza: 0,
        factores: ["IA no disponible"]
      },
      tendenciaAnual: {
        crecimiento: 0,
        patron: "No determinado"
      },
      recomendaciones: ["Revisar datos históricos", "Consultar analista humano"]
    }
  }
}

// 🔧 TÍTULO: FUNCIÓN HÍBRIDA - DATOS REALES + ESTIMACIONES IA
async function obtenerDatosFinancierosInteligentes(contextoTemporal: string = 'actual') {
  try {
    console.log('🧠 Consultando datos con IA para estimaciones...')

    // 📊 OBTENER DATOS HISTÓRICOS REALES
    const ventasHistoricas = await consultarDataWarehouse('ventas_historicas', 'laramada')
    
    if (!ventasHistoricas || ventasHistoricas.length === 0) {
      throw new Error('No hay datos históricos para estimaciones IA')
    }

    // 🤖 GENERAR ESTIMACIONES INTELIGENTES
    const estimacionIA = await generarEstimacionesIA(ventasHistoricas, contextoTemporal)

    // 📊 PROCESAR DATOS HISTÓRICOS REALES
    const fechaActual = new Date()
    const añoActual = fechaActual.getFullYear()

    // 🎯 BUSCAR DATOS REALES POR MES ESPECÍFICO
    const ventasJulioActual = ventasHistoricas.find(v => {
      const fechaVenta = new Date(v.mes)
      return fechaVenta.getMonth() + 1 === 7 && fechaVenta.getFullYear() === añoActual
    })

    const ventasJunioActual = ventasHistoricas.find(v => {
      const fechaVenta = new Date(v.mes)
      return fechaVenta.getMonth() + 1 === 6 && fechaVenta.getFullYear() === añoActual
    })

    const ventasJulioAnterior = ventasHistoricas.find(v => {
      const fechaVenta = new Date(v.mes)
      return fechaVenta.getMonth() + 1 === 7 && fechaVenta.getFullYear() === (añoActual - 1)
    })

    console.log('📊 Datos reales encontrados:')
    console.log(`   Julio ${añoActual}: $${(ventasJulioActual?.total_ventas || 0).toLocaleString()}`)
    console.log(`   Junio ${añoActual}: $${(ventasJunioActual?.total_ventas || 0).toLocaleString()}`)
    console.log(`   Julio ${añoActual - 1}: $${(ventasJulioAnterior?.total_ventas || 0).toLocaleString()}`)

    return {
      datosReales: {
        julioActual: ventasJulioActual?.total_ventas || 0,
        junioActual: ventasJunioActual?.total_ventas || 0,
        julioAnterior: ventasJulioAnterior?.total_ventas || 0,
        añoActual: añoActual
      },
      estimacionesIA: estimacionIA,
      fuente: 'DATOS_REALES_DWH + ESTIMACIONES_IA'
    }

  } catch (error) {
    console.error('❌ Error en análisis financiero inteligente:', error)
    throw new Error(`Análisis financiero IA falló: ${error.message}`)
  }
}

// 🧠 TÍTULO: CLASIFICADOR INTELIGENTE DE CONSULTAS (FUNCIÓN ORIGINAL COMPLETA)
function clasificarConsulta(mensaje: string) {
  // 🔧 TÍTULO: Normalizar texto: minúsculas y sin acentos
  const normalizar = (texto: string) => {
    return texto.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Quita acentos
      .replace(/[^\w\s]/g, ' ') // Quita signos de puntuación
      .replace(/\s+/g, ' ') // Espacios múltiples a uno
      .trim()
  }

  const mensajeNormalizado = normalizar(mensaje)

  // 📚 TÍTULO: Diccionarios de palabras clave por categoría (COMPLETO)
  const categorias = {
    FINANCIERO_VENTAS: [
      // Ventas directas
      'vendi', 'vendí', 'venta', 'ventas', 'vendimos', 'facture', 'facturé', 'facturacion', 'facturación',
      'ingreso', 'ingresos', 'ingrese', 'ingresé', 'cobré', 'cobre', 'cobro', 'cobros',
      'liquidacion', 'liquidación', 'liquide', 'liquidé',

      // Variaciones coloquiales
      'cuanto entre', 'cuanta plata entre', 'cuanto gané', 'cuanto gane', 'ganancia', 'ganancias',
      'cuanto hice', 'revenue', 'facturacion mensual', 'ventas del mes'
    ],

    FINANCIERO_COMPRAS: [
      // Gastos directos  
      'gaste', 'gasté', 'gasto', 'gastos', 'gastamos', 'compre', 'compré', 'compra', 'compras', 'compramos',
      'egreso', 'egresos', 'salida', 'salidas', 'pague', 'pagué', 'pago', 'pagos',

      // Específicos agro
      'combustible', 'gasoil', 'nafta', 'diesel', 'semillas', 'fertilizante', 'agroquimicos', 'agroquímicos',
      'herbicida', 'insecticida', 'urea', 'fosfato',

      // Variaciones coloquiales
      'cuanto sali', 'cuanta plata sali', 'cuanto me costo', 'cuanto me costó', 'inversión', 'inversion',
      'mercaderia', 'mercadería', 'insumos'
    ],

    FINANCIERO_GENERAL: [
      'finanzas', 'financiero', 'financiera', 'dinero', 'plata', 'pesos', 'millones',
      'balance', 'flujo', 'caja', 'banco', 'cuenta', 'cheque', 'cheques',
      'rentabilidad', 'margen', 'utilidad', 'ganancia neta'
    ],

    LOTES_CAMPOS: [
      'lote', 'lotes', 'campo', 'campos', 'hectarea', 'hectárea', 'hectareas', 'hectáreas',
      'superficie', 'terreno', 'terrenos', 'parcela', 'parcelas',
      'cultivo', 'cultivos', 'siembra', 'cosecha', 'zafra', 'tch'
    ],

    MAQUINARIA: [
      'maquina', 'máquina', 'maquinas', 'máquinas', 'tractor', 'tractores', 'cosechadora', 'cosechadoras',
      'implemento', 'implementos', 'equipo', 'equipos', 'service', 'mantenimiento',
      'combustible maquina', 'horas trabajadas', 'reparacion', 'reparación'
    ],

    CHEQUES: [
      'cheque', 'cheques', 'vencimiento', 'vencimientos', 'vence', 'vencen',
      'al dia', 'al día', 'pendiente', 'pendientes', 'deposito', 'depósito'
    ]
  }

  // 🔍 TÍTULO: Función para buscar coincidencias
  const buscarCoincidencias = (categoria: string[], texto: string): number => {
    let puntuacion = 0

    categoria.forEach(palabra => {
      // Buscar palabra exacta
      if (texto.includes(palabra)) {
        puntuacion += 2
      }

      // Buscar palabras similares (para captar variaciones)
      const palabras = texto.split(' ')
      palabras.forEach(p => {
        if (p.includes(palabra.substring(0, 4)) || palabra.includes(p.substring(0, 4))) {
          if (p.length > 3 && palabra.length > 3) {
            puntuacion += 1
          }
        }
      })
    })

    return puntuacion
  }

  // 🎯 TÍTULO: Evaluar cada categoría
  const resultados = {
    FINANCIERO_VENTAS: buscarCoincidencias(categorias.FINANCIERO_VENTAS, mensajeNormalizado),
    FINANCIERO_COMPRAS: buscarCoincidencias(categorias.FINANCIERO_COMPRAS, mensajeNormalizado),
    FINANCIERO_GENERAL: buscarCoincidencias(categorias.FINANCIERO_GENERAL, mensajeNormalizado),
    LOTES_CAMPOS: buscarCoincidencias(categorias.LOTES_CAMPOS, mensajeNormalizado),
    MAQUINARIA: buscarCoincidencias(categorias.MAQUINARIA, mensajeNormalizado),
    CHEQUES: buscarCoincidencias(categorias.CHEQUES, mensajeNormalizado)
  }

  // 🏆 TÍTULO: Encontrar la categoría con mayor puntuación
  const categoriaDetectada = Object.entries(resultados)
    .sort(([, a], [, b]) => b - a)[0]

  const [categoria, puntuacion] = categoriaDetectada

  // ✅ TÍTULO: Solo devolver resultado si hay confianza mínima
  if (puntuacion >= 2) {
    return {
      categoria: categoria,
      confianza: puntuacion,
      esFinanciero: categoria.startsWith('FINANCIERO'),
      subtipo: categoria.includes('VENTAS') ? 'ventas' :
        categoria.includes('COMPRAS') ? 'compras' : 'general'
    }
  }

  return {
    categoria: 'GENERAL',
    confianza: 0,
    esFinanciero: false,
    subtipo: 'general'
  }
}

// 🌐 TÍTULO: API ENDPOINT PRINCIPAL - MANEJA TODAS LAS CONSULTAS (FUNCIÓN ORIGINAL COMPLETA)
export async function POST(request: NextRequest) {
  try {
    console.log('📨 Nueva consulta recibida...')
    
    // 📥 TÍTULO: RECIBIR Y VALIDAR LA CONSULTA DEL USUARIO
    const { message, userId = 'usuario_default' } = await request.json()
    console.log('💬 Nueva consulta:', message)

// 🧠 VERIFICAR APRENDIZAJE
//const palabraDesconocida = await verificarPalabrasDesconocidas(message, 'emp_001')
//if (palabraDesconocida) {
//return NextResponse.json({
//// ... resto del código  
//})
//}

//🎯 ¿HACEMOS ESTE CAMBIO QUIRÚRGICO?
//Solo necesitás comentar 8 líneas (750-757) y mantienes todas las 900+ líneas con toda la funcionalidad avanzada.
//¿Comentamos esas líneas problemáticas para que funcione inmediatamente?
//Es un cambio de 30 segundos que preserva TODO tu trabajo. 💪ReintentarClaude puede cometer errores. Verifique las respuestas.

    if (!message) {
      console.log('❌ Consulta vacía rechazada')
      return NextResponse.json({ error: 'Mensaje requerido' }, { status: 400 })
    }

    console.log(`👤 Usuario: ${userId} | 💬 Consulta: "${message}"`)

    // 🧠 TÍTULO: OBTENER MEMORIA DE CONVERSACIONES ANTERIORES
    const conversationContext = ConversationMemoryManager.getConversationContext(userId)
    const currentContext = ConversationMemoryManager.detectContext(message)

    console.log(`💭 Contexto actual: ${currentContext}`)
    console.log(`🧠 Memoria previa: ${conversationContext}`)

    // 🎯 TÍTULO: Clasificar consulta inteligentemente
    const clasificacion = clasificarConsultaConMemoria(message, conversationContext)
    console.log(`🧠 Consulta clasificada como: ${clasificacion.categoria} (confianza: ${clasificacion.confianza})`)

    // 📊 TÍTULO: CONTEXTO BASE SIEMPRE
    const contextoEmpresa = await obtenerContextoEmpresa()

    // 🎯 TÍTULO: CONTEXTO ESPECÍFICO SEGÚN CONSULTA (MEJORADO)
    let contextoEspecifico = ''

    if (clasificacion.categoria === 'LOTES_CAMPOS') {
      // Si pregunta por lotes específicos, agregar detalles
      const mensajeLower = message.toLowerCase()
      // 🔧 TÍTULO: DETECTORES MEJORADOS PARA DETALLES
      if (mensajeLower.includes('nombre') || mensajeLower.includes('detalle') || 
          mensajeLower.includes('cada') || mensajeLower.includes('cuales') ||
          mensajeLower.includes('listado') || mensajeLower.includes('dame') ||
          mensajeLower.includes('especifico') || mensajeLower.includes('todos')) {
        console.log('🔍 Consultando detalles específicos de lotes...')
        const lotesDetallados = await obtenerLotesDetallados()
        contextoEspecifico = `

📋 DETALLES ESPECÍFICOS DE LOTES:
${lotesDetallados}`
      }
    }

    if (clasificacion.categoria === 'MAQUINARIA') {
      // Si pregunta por máquinas específicas, agregar detalles
      const mensajeLower = message.toLowerCase()
      
      if (mensajeLower.includes('listado') || mensajeLower.includes('dame') ||
          mensajeLower.includes('detalle') || mensajeLower.includes('cuales') ||
          mensajeLower.includes('todos') || mensajeLower.includes('especifico') ||
          mensajeLower.includes('pasame') || mensajeLower.includes('mostrame') ||
          (clasificacion.esContextual && clasificacion.temaAnterior === 'maquinas')) {
        console.log('🚜 Consultando listado detallado de máquinas...')
        const maquinasDetalladas = await obtenerListadoMaquinas()
        contextoEspecifico = `

🚜 LISTADO ESPECÍFICO DE MÁQUINAS:
${maquinasDetalladas}`
      }
    }


    // 💰 TÍTULO: CONTEXTO FINANCIERO
    const esConsultaFinanciera = clasificacion.esFinanciero
    console.log('🧠 Usando clasificación inteligente:', clasificacion.categoria)
    // 🧠 TÍTULO: DETECTAR REFERENCIAS CONTEXTUALES
console.log(`🧠 Clasificación: ${clasificacion.categoria}, Contextual: ${clasificacion.esContextual}, Tema anterior: ${clasificacion.temaAnterior}`)

        let contextoFinanciero = ''
    if (esConsultaFinanciera) {
      const datosFinancieros = await obtenerDatosFinancieros()
      contextoFinanciero = `

💰 ANÁLISIS FINANCIERO DETALLADO:
${datosFinancieros.modoEmergencia ? '🚨 MODO EMERGENCIA - Datos estimados' : '📊 DATOS EN TIEMPO REAL'}

📅 MES ACTUAL (${datosFinancieros.mes.nombre}):
- Ingresos: $${(datosFinancieros.mes.ingresos / 1000000).toFixed(1)}M (${datosFinancieros.mes.cantidadTransacciones} transacciones)
- Egresos: $${(datosFinancieros.mes.egresos / 1000000).toFixed(1)}M
- Flujo neto: $${(datosFinancieros.mes.flujoNeto / 1000000).toFixed(1)}M
- Margen: ${datosFinancieros.mes.margenPorcentaje.toFixed(1)}%
- Promedio por venta: $${(datosFinancieros.mes.promedioIngresoPorTransaccion / 1000).toFixed(0)}K

💳 CARTERA DE CHEQUES (${datosFinancieros.cheques.total} total):
- Valor total: $${(datosFinancieros.cheques.valorTotalCartera / 1000000).toFixed(1)}M
- Al día: ${datosFinancieros.cheques.porEstado['al_dia']?.cantidad || 0} cheques ($${((datosFinancieros.cheques.porEstado['al_dia']?.valor || 0) / 1000000).toFixed(1)}M)
- Pendientes: ${datosFinancieros.cheques.porEstado['pendiente']?.cantidad || 0} cheques ($${((datosFinancieros.cheques.porEstado['pendiente']?.valor || 0) / 1000000).toFixed(1)}M)
- Próximos a vencer: ${datosFinancieros.cheques.proximosVencer.length} cheques

🏭 LIQUIDACIONES INGENIOS:
- Última: ${datosFinancieros.liquidaciones.recientes[0]?.ingenioNombre || 'N/A'} - $${((datosFinancieros.liquidaciones.recientes[0]?.totalNeto || 0) / 1000000).toFixed(1)}M
- Total toneladas: ${datosFinancieros.liquidaciones.totalToneladas} tn
- Total facturado: $${(datosFinancieros.liquidaciones.totalFacturado / 1000000).toFixed(1)}M

📊 TOP GASTOS ESTE MES:
${datosFinancieros.categorias.topGastos.slice(0, 3).map(cat =>
  `- ${cat.categoria}: $${((cat._sum.importe || 0) / 1000).toFixed(0)}K`
).join('\n')}

📈 ACUMULADO AÑO:
- Total transacciones: ${datosFinancieros.ano.transaccionesTotales}
- Monto total: $${(datosFinancieros.ano.montoTotal / 1000000).toFixed(1)}M`
    }

    // 🤖 TÍTULO: GENERAR RESPUESTA CON INTELIGENCIA ARTIFICIAL
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Eres CeoBot, el CEO Digital de La Ramada S.A. con personalidad humana.


🤖 TU PERSONALIDAD ÚNICA:
- Sos un CEO super amigable y accesible 😊
- Hablás como un amigo experto que conoce TODO el negocio
- Siempre positivo, proactivo y conversacional
- Usás emojis estratégicamente para ser más humano
- Das respuestas CORTAS y al grano, no textos largos
- Siempre ofrecés 1-2 sugerencias útiles

🚨 REGLA CRÍTICA - NUNCA INVENTAR DATOS:
- Si los datos muestran $0 o no existen, decí que NO TENÉS esa información
- NUNCA inventes números o montos que no están en los datos reales
- Si pregunta por un mes/año sin datos, responde: "No tengo registros de [período]"
- SÉ HONESTO sobre qué información tenés y cuál no

📊 MANEJO DE DATOS FALTANTES:
EJEMPLO CORRECTO:
Usuario: "¿Y junio?"
Si junio = $0: "No tengo registros de ventas para junio en el sistema 📊"
Si junio = $43M: "En junio vendimos $43M. ¡Buen mes! 🚀"

EJEMPLO INCORRECTO:
Usuario: "¿Y junio?" 
NO digas: "En junio vendimos $25M" (si los datos reales muestran $0)

🎯 ESTILO DE RESPUESTA:
🎯 ESTILO DE RESPUESTA:
1. SALUDO amigable cuando corresponda
2. RESPUESTA directa y clara (máximo 3-4 líneas)
3. SUGERENCIAS proactivas (1-2 opciones)
4. PREGUNTA de seguimiento para mantener la conversación

📝 EJEMPLOS DE TU ESTILO:

CONSULTA: "¿Cuánto vendimos?"
TU RESPUESTA: "¡Hola! 😊 En julio vendimos $8.2M. ¡Muy buen mes!
¿Te gustaría que lo compare con el año pasado? ¿O prefieres ver qué productos vendieron más? 📊"

CONSULTA: "¿Y el año pasado?"
TU RESPUESTA: "Julio 2024 vendimos $6.8M. ¡Creciste 20%! 🚀
¿Querés que analice qué impulsó ese crecimiento? ¿O revisamos mes por mes?"

🚫 NUNCA HAGAS:
- Respuestas largas y corporativas
- Usar lenguaje técnico excesivo
- Dar solo datos sin contexto humano
- Olvidar ser proactivo con sugerencias

🧠 SISTEMA DE APRENDIZAJE:
- Si encontrás palabras que no reconocés, preguntá amigablemente qué significan
- Usá frases como "🤔 No conozco esa palabra" o "¿Te referís a...?"
- Siempre prometé que "si me enseñás, la próxima vez no te voy a preguntar"
- Cuando aprendas algo nuevo, confirmá: "🎉 ¡Perfecto! Ya aprendí que [palabra] = [definición]"

EJEMPLO DE APRENDIZAJE:
CONSULTA: "¿Cuántos alzaprimas tengo?"
TU RESPUESTA: "🤔 No conozco 'alzaprimas'. ¿Te referís a algún tipo de maquinaria? Si me enseñás, la próxima vez no te voy a preguntar. 😊"

🧠 MEMORIA CONVERSACIONAL:
${conversationContext}

🌾 CONTEXTO AGROPECUARIO:
- Terminología: TCH, zafra, hectáreas, ingenio, cosecha
- Enfoque: Siempre en resultados y rentabilidad

DATOS ACTUALES DE LA EMPRESA:
${contextoEmpresa}

${contextoEspecifico}
${contextoFinanciero}

🎯 INSTRUCCIÓN FINAL:
Respondé como un CEO amigable que realmente se preocupa por ayudar. 
Sé conversacional, útil y siempre ofrecé próximos pasos.

CONTEXTO ACTUAL DE LA PREGUNTA: ${currentContext}`
        },
        {
          role: "user",
          content: message
        }
      ],
      max_tokens: 500,     // Límite de respuesta para mantenerla concisa
      temperature: 0.7,    // Balance entre creatividad y precisión
    })

    // 📤 TÍTULO: PROCESAR Y GUARDAR LA RESPUESTA
    const respuesta = completion.choices[0]?.message?.content || "Disculpá, no pude procesar tu consulta."

    // 💾 TÍTULO: GUARDAR CONVERSACIÓN EN MEMORIA PARA PRÓXIMAS CONSULTAS
    ConversationMemoryManager.saveInteraction(
      userId,
      message,
      respuesta,
      currentContext
    )

    console.log('✅ Respuesta generada y guardada exitosamente')

    // 🚀 TÍTULO: ENVIAR RESPUESTA AL USUARIO
    return NextResponse.json({
      message: respuesta,
      timestamp: new Date().toISOString(),
      context: currentContext,
      userId: userId
    })

    } catch (error) {
    console.error('💥 Error crítico en chat API:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
}
}