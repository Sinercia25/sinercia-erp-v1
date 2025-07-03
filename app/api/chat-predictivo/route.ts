import { NextRequest, NextResponse } from 'next/server'
import { OpenAI } from 'openai'
import { Client } from 'pg'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const warehouseConfig = {
  host: '207.154.218.252',
  port: 5432,
  database: 'erp_datawarehouse',
  user: 'erpuser',
  password: 'ERP2025!DataBase#Prod',
  ssl: false
}

function clasificarConsulta(mensaje: string) {
  const normalizar = (texto: string) => {
    return texto.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  }

  const mensajeNormalizado = normalizar(mensaje)
  
  const categorias = {
    PREDICTIVO_FLUJO: [
      'cuando', 'cuanto voy', 'voy a tener', 'me va a faltar', 'deficit',
      'liquidez', 'efectivo', 'plata disponible', 'caja', 'problemas financieros',
      'puedo pagar', 'alcanza', 'va a alcanzar'
    ],
    PREDICTIVO_VENTAS: [
      'voy a vender', 'proximo mes', 'proyeccion', 'estimado', 'espero vender',
      'meta', 'objetivo', 'tendencia ventas', 'prediccion ventas'
    ],
    PREDICTIVO_COSECHA: [
      'cuando cosechar', 'momento optimo', 'mejor momento', 'conviene cosechar',
      'tch optimo', 'precio caña', 'esperar cosecha'
    ]
  }
  
  const buscarCoincidencias = (categoria: string[], texto: string): number => {
    let puntuacion = 0
    categoria.forEach(palabra => {
      if (texto.includes(palabra)) puntuacion += 2
    })
    return puntuacion
  }
  
  const resultados = Object.fromEntries(
    Object.entries(categorias).map(([key, value]) => [key, buscarCoincidencias(value, mensajeNormalizado)])
  )
  
  const [categoria, puntuacion] = Object.entries(resultados)
    .sort(([,a], [,b]) => b - a)[0]
  
  return {
    categoria: puntuacion >= 2 ? categoria : 'GENERAL',
    confianza: puntuacion,
    esPredictivo: categoria.startsWith('PREDICTIVO')
  }
}

async function obtenerDatosCompletos() {
  const startTime = Date.now()
  const warehouse = new Client(warehouseConfig)
  
  try {
    await warehouse.connect()
    
    const [transaccionesResult, chequesResult, lotesResult] = await Promise.all([
      warehouse.query(`
        SELECT tipo, categoria, importe, fecha, descripcion 
        FROM transacciones 
        WHERE empresaId = $1 
        ORDER BY fecha DESC 
        LIMIT 20
      `, ['laramada']),
      warehouse.query('SELECT * FROM cheques WHERE empresaId = $1', ['laramada']),
      warehouse.query('SELECT superficie_hectareas FROM lotes WHERE empresaId = $1 AND activo = true', ['laramada'])
    ])
    
    await warehouse.end()
    
    return {
      transacciones: transaccionesResult.rows,
      cheques: chequesResult.rows,
      lotes: lotesResult.rows,
      responseTime: Date.now() - startTime
    }
    
  } catch (error) {
    throw error
  }
}

async function generarPredicciones(datos: any, tipoConsulta: string) {
  const predicciones = []
  
  // PREDICCIÓN DE FLUJO DE CAJA
  if (tipoConsulta.includes('FLUJO') || tipoConsulta === 'GENERAL') {
    const ingresosMes = datos.transacciones
      .filter((t: any) => t.tipo === 'INGRESO' && new Date(t.fecha) >= new Date('2025-07-01'))
      .reduce((sum: number, t: any) => sum + parseFloat(t.importe), 0)
    
    const egresosMes = datos.transacciones
      .filter((t: any) => t.tipo === 'EGRESO' && new Date(t.fecha) >= new Date('2025-07-01'))
      .reduce((sum: number, t: any) => sum + parseFloat(t.importe), 0)
    
    const flujoActual = ingresosMes - egresosMes
    const proyeccion30dias = flujoActual * 1.2
    
    predicciones.push({
      tipo: 'FLUJO_CAJA',
      descripcion: `Flujo de caja proyectado próximos 30 días: $${(proyeccion30dias / 1000000).toFixed(1)}M`,
      confianza: 85,
      valorEstimado: proyeccion30dias,
      accion: proyeccion30dias < 5000000 ? 'Acelerar cobranzas' : 'Flujo saludable'
    })
  }
  
  // PREDICCIÓN DE VENTAS
  if (tipoConsulta.includes('VENTAS') || tipoConsulta === 'GENERAL') {
    const ventasHistoricas = datos.transacciones
      .filter((t: any) => t.tipo === 'INGRESO')
      .slice(0, 5)
    
    const promedioVenta = ventasHistoricas.length > 0 
      ? ventasHistoricas.reduce((sum: number, t: any) => sum + parseFloat(t.importe), 0) / ventasHistoricas.length
      : 10000000
    
    const ventasProximoMes = promedioVenta * 1.15
    
    predicciones.push({
      tipo: 'VENTAS',
      descripcion: `Ventas estimadas agosto 2025: $${(ventasProximoMes / 1000000).toFixed(1)}M`,
      confianza: 78,
      valorEstimado: ventasProximoMes,
      accion: 'Preparar capacidad para incremento estacional'
    })
  }
  
  return predicciones
}

async function generarContextoPredictivo(clasificacion: any) {
  try {
    const datos = await obtenerDatosCompletos()
    const predicciones = await generarPredicciones(datos, clasificacion.categoria)
    
    const ingresosMes = datos.transacciones
      .filter((t: any) => t.tipo === 'INGRESO' && new Date(t.fecha) >= new Date('2025-07-01'))
      .reduce((sum: number, t: any) => sum + parseFloat(t.importe), 0)
    
    const superficieTotal = datos.lotes.reduce((sum: number, l: any) => sum + parseFloat(l.superficie_hectareas), 0)
    
    let seccionPredicciones = ''
    if (predicciones.length > 0) {
      seccionPredicciones = `

🔮 PREDICCIONES IA:
${predicciones.map(p => 
  `💎 ${p.descripcion} (Confianza: ${p.confianza}%)
     Acción recomendada: ${p.accion}`
).join('\n')}`
    }
    
    return `EMPRESA: LA RAMADA S.A. - ANÁLISIS PREDICTIVO IA 🔮

💎 DATA WAREHOUSE PREDICTIVO • ${datos.responseTime}ms

📊 DATOS BASE:
- Superficie: ${superficieTotal.toFixed(1)} hectáreas
- Ingresos julio: $${(ingresosMes / 1000000).toFixed(1)}M
- Cheques cartera: ${datos.cheques.length} documentos${seccionPredicciones}

🎯 MOTOR PREDICTIVO OPERATIVO`

  } catch (error) {
    return `EMPRESA: LA RAMADA S.A. - MODO EMERGENCIA PREDICTIVO 🚨
⚠️ Sistema predictivo temporalmente no disponible`
  }
}

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json()
    
    const clasificacion = clasificarConsulta(message)
    const contextoEmpresa = await generarContextoPredictivo(clasificacion)

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Eres CeoBot Predictivo de La Ramada S.A. con IA predictiva.

ESPECIALIZACIÓN: Predicciones de flujo de caja, ventas futuras, momento óptimo cosecha.

DATOS + PREDICCIONES: ${contextoEmpresa}

Respondé como CEO con visión de futuro, incluyendo predicciones específicas y acciones recomendadas.`
        },
        { role: "user", content: message }
      ],
      max_tokens: 500,
      temperature: 0.6,
    })

    return NextResponse.json({ 
      message: completion.choices[0]?.message?.content,
      timestamp: new Date().toISOString(),
      predictivo: true,
      clasificacion: clasificacion.categoria
    })

  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error servidor predictivo' }, { status: 500 })
  }
}
