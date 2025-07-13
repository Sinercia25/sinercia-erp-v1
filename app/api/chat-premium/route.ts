// 🏁 TÍTULO: route.ts – Estructura principal del endpoint
// Breve: Define la función POST que recibirá la petición y coordinará los siguientes pasos.
import { NextRequest, NextResponse } from 'next/server'
import { Pool as PgPool } from 'pg'
import parseDbUrl from 'parse-database-url'
import { OpenAI } from 'openai'
import { systemPrompt, examples } from '@/lib/prompt'

// 📥 TÍTULO: CARGA Y VALIDACIÓN DE VARIABLES DE ENTORNO
const { 
  DWH_URL, 
  DATABASE_URL, 
  OPENAI_API_KEY, 
  TEMPERATURE = '0.8', 
  TOP_P       = '0.9' 
} = process.env
if (!DWH_URL || !DATABASE_URL || !OPENAI_API_KEY) {
  throw new Error('🚨 Faltan variables de entorno: DWH_URL, DATABASE_URL o OPENAI_API_KEY')
}

// 🌐 TÍTULO: POOL DE CONEXIÓN AL DATA WAREHOUSE
console.log('⚙️ DEBUG DWH_URL:', DWH_URL)
const dwhConfig = parseDbUrl(DWH_URL)
const dwhPool = new PgPool({
  host:               dwhConfig.host,
  port:               dwhConfig.port,
  user:               dwhConfig.user,
  password:           dwhConfig.password,
  database:           dwhConfig.database,
  ssl: { rejectUnauthorized: false },
  max:                10,
  idleTimeoutMillis:  30_000
})

// 🏭 TÍTULO: POOL DE CONEXIÓN A LA BD PRINCIPAL (Supabase)
const mainDbConfig = parseDbUrl(DATABASE_URL)
const mainDbPool = new PgPool({
  host:               mainDbConfig.host,
  port:               mainDbConfig.port,
  user:               mainDbConfig.user,
  password:           mainDbConfig.password,
  database:           mainDbConfig.database,
  ssl: { rejectUnauthorized: false },
  statement_timeout:  5_000
})

// 🤖 TÍTULO: CLIENTE DE OPENAI
const openai = new OpenAI({ apiKey: OPENAI_API_KEY })

// ── Función auxiliar: obtener contexto de empresa ────────────────────
async function obtenerContextoEmpresa(empresaId: string) {
  const { rows } = await mainDbPool.query<{
    nombre: string
    sector: string
    datawarehouseid: string
  }>(
    `SELECT
       nombre,
       sector,
       "dataWarehouseId" AS datawarehouseid
     FROM empresas
     WHERE id = $1
     LIMIT 1`,
    [empresaId]
  )
  if (rows.length === 0) {
    throw new Error(`Empresa no encontrada: ${empresaId}`)
  }
  const e = rows[0]
  console.log(`🏢 Empresa encontrada: ${e.nombre} (${e.sector}) → DWH slug: ${e.datawarehouseid}`)
  return {
    nombre: e.nombre,
    sector: e.sector,
    dwhId:  e.datawarehouseid
  }
}

// ── Función auxiliar: clasificar consulta ───────────────────────────
function clasificarConsulta(mensaje: string) {
  // Lógica de clasificación (stub)
  return { categoria: 'GENERAL', confianza: 0 }
}

// ── Función auxiliar: consultar la vista materializada ──────────────
async function consultarDataWarehouse(categoria: string, empresaKey: string) {
  if (categoria === 'GENERAL') {
    const sql = `
      SELECT
        empresa,
        total_transacciones,
        total_importe_transacciones,
        total_ventas,
        total_compras,
        total_cheques,
        monto_cheques
      FROM public.resumen_empresa_mv
      WHERE empresa = $1
    `
    console.log(`📊 PASO 3: Consultando vista_materializada para ${empresaKey}`)
    const { rows } = await dwhPool.query(sql, [empresaKey])
    return rows
  }
  return []
}

// ▶️ Circuit breaker: contador de errores consecutivos
let consecutiveErrors = 0

// 🚀 TÍTULO: HANDLER POST – flujo completo
export async function POST(req: NextRequest) {
  try {
    // 1️⃣ Validaciones
  const { message, empresaId, userId = 'default', temperature: ovTemp, top_p: ovTopP } = await req.json()
    if (!message)   return NextResponse.json({ error: 'Mensaje requerido' }, { status: 400 })
    if (!empresaId) return NextResponse.json({ error: 'Empresa requerida' }, { status: 400 })

      // 2️⃣ Circuit breaker: si 3 fallos seguidos, devolvemos fallback estático
if (consecutiveErrors >= 3) {
  return NextResponse.json({
    empresa:      null,
    sector:       null,
    resumen:      {},
    recomendaciones: [
      "Revisa tus métricas en el panel de control y asegúrate de que los datos estén actualizados.",
      "Si el servicio AI no está disponible, contacta a soporte para una solución inmediata."
    ],
    telemetry: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
  })
}
    
// 2️⃣ Moderation guardrail
const moderation = await openai.moderations.create({ input: message })
if (moderation.results[0].flagged) {
  return NextResponse.json(
    { error: 'Contenido no permitido por políticas de uso' },
    { status: 403 }
  )
}

    // 3 Obtener contexto de la empresa
    const { nombre, sector } = await obtenerContextoEmpresa(empresaId)
    console.log(`✅ Contexto cargado: empresa='${nombre}', sector='${sector}'`)

    // 4 Clasificar consulta
    const { categoria } = clasificarConsulta(message)
    console.log(`🧠 Consulta clasificada como: ${categoria}`)

    // 5 Consultar Data Warehouse
    const resultados = await consultarDataWarehouse(categoria, empresaId)
    console.log(`📊 DWH retornó ${resultados.length} registros`)

    // 6 Formatear resumen
    const fila = resultados[0] ?? {
      empresa: nombre,
      total_transacciones: 0,
      total_importe_transacciones: 0,
      total_ventas: 0,
      total_compras: 0,
      total_cheques: 0,
      monto_cheques: 0
    }

    // 7 Llamada a OpenAI para sugerencias proactivas
  const fewShotMessages = examples.flatMap(ex => [
  { role: 'user',      content: ex.user },
  { role: 'assistant', content: ex.assistant }
])

const promptIA = `
Datos de la empresa ${nombre} (${sector}):
- Total transacciones: ${fila.total_transacciones}
- Importe transacciones: ${fila.total_importe_transacciones}
- Total ventas: ${fila.total_ventas}
- Total compras: ${fila.total_compras}
- Total cheques: ${fila.total_cheques}
- Monto cheques: ${fila.monto_cheques}

Pregunta: ${message}

Responde SOLO en JSON:
{ "recomendaciones": ["rec1", "rec2"] }
`.trim()

const completion = await openai.chat.completions.create({
    model:       'gpt-4o-mini',
  messages: [
    { role: 'system',    content: systemPrompt },
    ...fewShotMessages,
    { role: 'user',      content: promptIA }
  ],
  max_tokens: 200,
  temperature:  ovTemp  != null ? Number(ovTemp)  : Number(TEMPERATURE),
top_p:        ovTopP  != null ? Number(ovTopP)  : Number(TOP_P),
})
// ✅ Reset de contador tras éxito
consecutiveErrors = 0
const usage = completion.usage ?? {
  prompt_tokens: 0,
  completion_tokens: 0,
  total_tokens: 0
}
 let recomendaciones: string[] = []
    try {
      const content = completion.choices[0].message!.content
      const parsed = JSON.parse(content)
      if (Array.isArray(parsed.recomendaciones)) {
        recomendaciones = parsed.recomendaciones
      } else {
        console.warn('📌 El campo recomendaciones no es un array:', parsed)
      }
    } catch (e) {
      console.error('❌ Error al parsear JSON de OpenAI:', e)
      recomendaciones = []
    }
    // 8 Devolver respuesta final
    return NextResponse.json({
      empresa: nombre,
      sector,
      resumen: {
        totalTransacciones:      Number(fila.total_transacciones),
        totalImporteTransacciones: Number(fila.total_importe_transacciones),
        totalVentas:             Number(fila.total_ventas),
        totalCompras:            Number(fila.total_compras),
        totalCheques:            Number(fila.total_cheques),
        montoCheques:            Number(fila.monto_cheques)
      },
      recomendaciones,
      telemetry: {
    prompt_tokens:     usage.prompt_tokens,
    completion_tokens: usage.completion_tokens,
    total_tokens:      usage.total_tokens
  }
    })

  } catch (err: any) {
  console.error('💥 Error en POST:', err)
  // 🚨 Incrementa contador de errores consecutivos
  consecutiveErrors += 1
  return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
}
}
