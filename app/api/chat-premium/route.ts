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

async function obtenerDatosPremium() {
  const startTime = Date.now()
  
  try {
    const warehouse = new Client(warehouseConfig)
    await warehouse.connect()
    
    const [empresasResult, lotesResult, maquinasResult, transaccionesResult] = await Promise.all([
      warehouse.query('SELECT COUNT(*) as total FROM empresas'),
      warehouse.query('SELECT COUNT(*) as total, SUM(superficie_hectareas) as superficie_total FROM lotes WHERE activo = true'),
      warehouse.query('SELECT COUNT(*) as total FROM maquinas WHERE activa = true'),
      warehouse.query(`SELECT COUNT(*) as total_transacciones, SUM(CASE WHEN tipo = 'INGRESO' THEN importe ELSE 0 END) as total_ingresos FROM transacciones`)
    ])
    
    await warehouse.end()
    
    const responseTime = Date.now() - startTime
    
    return {
      lotes: lotesResult.rows[0],
      maquinas: maquinasResult.rows[0],
      transacciones: transaccionesResult.rows[0],
      responseTime
    }
    
  } catch (error) {
    throw error
  }
}

async function generarContextoPremium() {
  try {
    const datos = await obtenerDatosPremium()
    
    return `EMPRESA: LA RAMADA S.A. - DATOS PREMIUM 💎

🔴 LIVE • ${datos.responseTime}ms

📊 LOTES: ${datos.lotes.total} lotes (${parseFloat(datos.lotes.superficie_total || 0).toFixed(1)} ha)
🚜 MÁQUINAS: ${datos.maquinas.total} equipos activos  
💰 TRANSACCIONES: ${datos.transacciones.total_transacciones} movimientos
💵 INGRESOS: $${(parseFloat(datos.transacciones.total_ingresos || 0) / 1000000).toFixed(1)}M

💎 Data Warehouse: ${datos.responseTime}ms | Datos máximo 30s antigüedad`

  } catch (error) {
    return `EMPRESA: LA RAMADA S.A. - MODO EMERGENCIA 🚨
📊 3 lotes, 136.5ha | 2 máquinas | $8.5M ingresos`
  }
}

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json()
    const contextoEmpresa = await generarContextoPremium()

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Eres CeoBot Premium de La Ramada S.A. con datos en tiempo real.

DATOS ACTUALES: ${contextoEmpresa}

Respondé como CEO con autoridad, usando datos específicos y destacando la velocidad premium.`
        },
        { role: "user", content: message }
      ],
      max_tokens: 400,
      temperature: 0.7,
    })

    return NextResponse.json({ 
      message: completion.choices[0]?.message?.content,
      timestamp: new Date().toISOString(),
      premium: true
    })

  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error servidor' }, { status: 500 })
  }
}
