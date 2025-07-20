// 📦 CONFIGURACIÓN GENERAL Y CONEXIONES
import { NextRequest, NextResponse } from 'next/server'
import { Pool as PgPool } from 'pg'
import parseDbUrl from 'parse-database-url'
import { OpenAI } from 'openai'
import { systemPrompt, examples } from '@/lib/prompt'
import { ConversationMemoryManager } from '@/lib/conversation-memory'

const {
DWH_URL,
DATABASE_URL,
OPENAI_API_KEY,
TEMPERATURE = '0.8',
TOP_P = '0.9'
} = process.env

if (!DWH_URL || !DATABASE_URL || !OPENAI_API_KEY) {
throw new Error('🚨 Faltan variables de entorno: DWH_URL, DATABASE_URL o OPENAI_API_KEY')
}

const dwhConfig = parseDbUrl(DWH_URL)
const dwhPool = new PgPool({
host: dwhConfig.host,
port: dwhConfig.port,
user: dwhConfig.user,
password: dwhConfig.password,
database: dwhConfig.database,
ssl: { rejectUnauthorized: false },
max: 10,
idleTimeoutMillis: 30000
})
// 🤖 INSTANCIA DE OPENAI
const openai = new OpenAI({
apiKey: OPENAI_API_KEY
})

// 🔍 Función auxiliar: obtener nombre e industria desde tabla companies del DWH
async function obtenerContextoEmpresa(empresa_id: string) {
const { rows } = await dwhPool.query<{
nombre: string;
industria: string;
}>(`
SELECT nombre, industria
FROM empresas
WHERE id = $1
LIMIT 1
`, [empresa_id]);

if (rows.length === 0) {
throw new Error(`Empresa no encontrada: ${empresa_id}`);
}

return {
nombre: rows[0].nombre,
sector: rows[0].industria 
};
}


// 🧠 INTERPRETACIÓN TEMPORAL EXTENDIDA v1.3 - incluye "desde...hasta" y mejora detección de nombres de meses como "julio"
export type PeriodoDetectado = {
tipo: 'dia' | 'semana' | 'mes' | 'trimestre' | 'año' | 'decada' | 'rango',
inicio: Date,
fin: Date,
descripcion: string
}

export function interpretarTiempoExtendido(texto: string): PeriodoDetectado | null {
texto = texto.toLowerCase()
const ahora = new Date()
const añoActual = ahora.getFullYear()
const mesActual = ahora.getMonth()
const diaActual = ahora.getDate()

const meses = [
'enero','febrero','marzo','abril','mayo','junio',
'julio','agosto','septiembre','octubre','noviembre','diciembre'
]

// 🗓️ NOMBRE DEL MES (ej: "julio")
for (let i = 0; i < meses.length; i++) {
if (texto.includes(meses[i])) {
const inicio = new Date(añoActual, i, 1)
const fin = new Date(añoActual, i + 1, 1)
return {
tipo: 'mes',
inicio,
fin,
descripcion: `el mes de ${meses[i].toUpperCase()} ${añoActual}`
}
}
}

// ✳️ DETECCIÓN DE RANGO: "desde X hasta Y"
const matchDesdeHasta = texto.match(/desde\s+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\s+(hasta|a)\s+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/)
if (matchDesdeHasta) {
const [d1, d2] = [matchDesdeHasta[1], matchDesdeHasta[3]]
const inicio = new Date(d1.replace(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/, '$3-$2-$1'))
const fin = new Date(d2.replace(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/, '$3-$2-$1'))
fin.setDate(fin.getDate() + 1)
return { tipo: 'rango', inicio, fin, descripcion: `desde el ${d1} hasta el ${d2}` }
}

// 🟢 AYER, HOY, MAÑANA
if (texto.includes('ayer')) {
const inicio = new Date(añoActual, mesActual, diaActual - 1)
const fin = new Date(añoActual, mesActual, diaActual)
return { tipo: 'dia', inicio, fin, descripcion: 'ayer' }
}
if (texto.includes('hoy')) {
const inicio = new Date(añoActual, mesActual, diaActual)
const fin = new Date(inicio)
fin.setDate(fin.getDate() + 1)
return { tipo: 'dia', inicio, fin, descripcion: 'hoy' }
}
if (texto.includes('mañana')) {
const inicio = new Date(añoActual, mesActual, diaActual + 1)
const fin = new Date(inicio)
fin.setDate(fin.getDate() + 1)
return { tipo: 'dia', inicio, fin, descripcion: 'mañana' }
}

// 📅 MES ACTUAL y MES PASADO
if (texto.includes('este mes')) {
const inicio = new Date(añoActual, mesActual, 1)
const fin = new Date(añoActual, mesActual + 1, 1)
return { tipo: 'mes', inicio, fin, descripcion: `este mes (${inicio.toLocaleString('es-AR', { month: 'long' })} ${añoActual})` }
}
if (texto.includes('mes pasado') || texto.includes('mes anterior')) {
const m = mesActual === 0 ? 11 : mesActual - 1
const y = mesActual === 0 ? añoActual - 1 : añoActual
const inicio = new Date(y, m, 1)
const fin = new Date(y, m + 1, 1)
return { tipo: 'mes', inicio, fin, descripcion: `el mes de ${meses[m].toUpperCase()} ${y}` }
}

// 🔁 Hace X años o meses
const matchAnios = texto.match(/hace\s+(\d+)\s+a[nñ]os?/) 
if (matchAnios) {
const n = parseInt(matchAnios[1])
const y = añoActual - n
const inicio = new Date(y, 0, 1)
const fin = new Date(y + 1, 0, 1)
return { tipo: 'año', inicio, fin, descripcion: `el año ${y}` }
}
const matchMeses = texto.match(/hace\s+(\d+)\s+meses?/) 
if (matchMeses) {
const n = parseInt(matchMeses[1])
const d = new Date(añoActual, mesActual, 1)
d.setMonth(d.getMonth() - n)
const inicio = new Date(d.getFullYear(), d.getMonth(), 1)
const fin = new Date(inicio.getFullYear(), inicio.getMonth() + 1, 1)
return { tipo: 'mes', inicio, fin, descripcion: `hace ${n} meses (${meses[inicio.getMonth()].toUpperCase()} ${inicio.getFullYear()})` }
}

// 📆 Año exacto y frases tipo "el año pasado" — se ajusta al mes actual del año pasado si no se especifica mes"el año pasado", "y el año 2020"
const matchAnioDirecto = texto.match(/(en|del|a[nñ]o|y el a[nñ]o|para el a[nñ]o)\s*(\d{4})/)
if (matchAnioDirecto) {
const y = parseInt(matchAnioDirecto[2])
return { tipo: 'año', inicio: new Date(y, 0, 1), fin: new Date(y + 1, 0, 1), descripcion: `el año ${y}` }
}
if (texto.includes('el año pasado') || texto.includes('año anterior') || texto.includes('y el año pasado')) {
const y = añoActual - 1
const inicio = new Date(y, mesActual, 1)
const fin = new Date(y, mesActual + 1, 1)
return { tipo: 'mes', inicio, fin, descripcion: `el mes de ${meses[mesActual].toUpperCase()} ${y}` }
}

// 🗓️ Década
const matchDecada = texto.match(/d[ée]cada\s+(del\s+)?(\d{2})/)
if (matchDecada) {
const dec = parseInt(matchDecada[2])
const base = dec < 30 ? 2000 : 1900
const y = base + dec
return {
tipo: 'decada',
inicio: new Date(y, 0, 1),
fin: new Date(y + 10, 0, 1),
descripcion: `la década del ${dec}0`
}
}

// 📉 Últimos N años
const matchUltimos = texto.match(/últimos?\s+(\d+)\s+a[nñ]os?/) 
if (matchUltimos) {
const n = parseInt(matchUltimos[1])
const inicio = new Date(añoActual - n, 0, 1)
const fin = new Date(añoActual + 1, 0, 1)
return {
tipo: 'rango',
inicio,
fin,
descripcion: `los últimos ${n} años`
}
}

return null
}
// 🧠 Detecta qué temas hay en el mensaje del usuario
function detectarTemas(texto: string): string[] {
  texto = texto.toLowerCase();
  const temas: string[] = [];

  if (/venta|factura/.test(texto)) temas.push("ventas");
  if (/ingreso|egreso|caja|flujo/.test(texto)) temas.push("finanzas");
  if (/personal|empleado|rrhh|sueldo/.test(texto)) temas.push("rrhh");
  if (/maquina|mantenimiento|tractor/.test(texto)) temas.push("maquinaria");
  if (/campo|lote|siembra|cosecha/.test(texto)) temas.push("campo");
  if (/cheque/.test(texto)) temas.push("cheques");

  return temas;
}

// 🧩 Bloque de consulta de ventas usando rango extendido
async function consultarVentas(empresa_id: string, mensaje: string): Promise<string> {
  const periodo = interpretarTiempoExtendido(mensaje);
  if (!periodo) return '❌ No se pudo detectar el periodo temporal';

  const sql = `
    SELECT SUM(total::numeric) AS total_ventas
    FROM facturas
    WHERE empresa_id = $1
      AND fecha_emision >= $2
      AND fecha_emision < $3
  `;

  const { rows } = await dwhPool.query(sql, [
    empresa_id,
    periodo.inicio.toISOString(),
    periodo.fin.toISOString()
  ]);

  const total = parseFloat(rows[0]?.total_ventas || '0');
  return `💰 **Ventas en ${periodo.descripcion.toUpperCase()}:** $${(total / 1e6).toFixed(2)}M`;
}

// 🔀 Ejecuta solo el bloque necesario según el tema detectado
async function ejecutarBloque(tema: string, empresa_id: string, mensaje: string): Promise<string | null> {
  switch (tema) {
    case "ventas": return await consultarVentas(empresa_id, mensaje);
    case "finanzas": return await consultarFinanzas(empresa_id, mensaje); // futuro
    case "rrhh": return await consultarRRHH(empresa_id, mensaje); // futuro
    case "maquinaria": return await consultarMaquinaria(empresa_id, mensaje); // futuro
    case "campo": return await consultarCampo(empresa_id, mensaje); // futuro
    case "cheques": return await consultarCheques(empresa_id, mensaje); // futuro
    default: return null;
  }
}



// ✅ POST modular – ejecuta solo los bloques necesarios
export async function POST(req: NextRequest) {
  const { message, empresa_id } = await req.json();

  if (!message || !empresa_id) {
    return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
  }

  const temas = detectarTemas(message); // ej: ["ventas", "rrhh"]

  const resultados = await Promise.all(
    temas.map((tema) => ejecutarBloque(tema, empresa_id, message))
  );

  const respuesta = resultados.filter(Boolean).join("\n");

  return NextResponse.json({ respuesta });
}

