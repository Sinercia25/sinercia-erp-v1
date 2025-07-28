// 📦 CONFIGURACIÓN GENERAL Y CONEXIONES
import { NextRequest, NextResponse } from 'next/server'
import { Pool as PgPool } from 'pg'
import parseDbUrl from 'parse-database-url'
import { OpenAI } from 'openai'
import { ventasPrompt } from '@/lib/prompts/ventas';
import { ConversationMemoryManager } from '@/lib/conversation-memory'
import { guardarPeriodo, obtenerUltimoPeriodo } from '@/lib/periodos/periodo-memory';
import { interpretarTiempoExtendido } from '@/lib/periodos/interpretarTiempoExtendido'
import { formatearMonto } from '@/lib/utils/formato'
import { detectContext } from '@/lib/detectores/detectContext';
import { UNSTABLE_REVALIDATE_RENAME_ERROR } from 'next/dist/lib/constants';


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
const memoriaTemasPorUsuario = new Map<string, string[]>();



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


// 🧠 Detecta qué temas hay en el mensaje del usuario
function detectarTemas(texto: string): string[] {
  texto = texto.toLowerCase();
  const temas: string[] = [];

  if (/venta|ventas|factura|vendimos|vender|facturación/.test(texto)) temas.push("ventas");
  if (/ingreso|egreso|caja|flujo/.test(texto)) temas.push("finanzas");
  if (/personal|empleado|rrhh|sueldo/.test(texto)) temas.push("rrhh");
  if (/maquina|mantenimiento|tractor/.test(texto)) temas.push("maquinaria");
  if (/campo|lote|siembra|cosecha/.test(texto)) temas.push("campo");
  if (/cheque/.test(texto)) temas.push("cheques");

  return temas;
}
// 🧩 Bloque de consulta de ventas usando rango extendido y memoria contextual

async function consultarVentas(empresa_id: string, user_id: string, mensaje: string): Promise<string> {
  console.log("🔥 ENTRÓ A consultarVentas");
  console.log("📨 Texto recibido:", mensaje);

  let periodo = interpretarTiempoExtendido(mensaje, user_id);

  if (periodo) {
    console.log("🧠 Periodo detectado:", periodo.descripcion);
    guardarPeriodo(user_id, periodo);
  } else {
    periodo = obtenerUltimoPeriodo(user_id);
    if (!periodo) {
      return `No se pudo detectar ningún período. Probá con algo como "¿Cuánto vendimos en julio?"`;
    }
    console.log("🔁 Usando período desde memoria:", periodo.descripcion);
  }

  const sql = `
    SELECT SUM(total::numeric) AS total_ventas,
           COUNT(*) AS cantidad_transacciones
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
  const transacciones = parseInt(rows[0]?.cantidad_transacciones || '0');

  if (total === 0 && transacciones === 0) {
    return `No se encontraron ventas registradas para ${periodo.descripcion.toUpperCase()} ⚠️\n¿Querés consultar otro período o comparar con el año anterior?`;
  }

  if (total > 0 && transacciones > 0) {
    const ticketPromedio = total / transacciones;
    const linea1 = `Vendiste ${formatearMonto(total)} en ${periodo.descripcion.toUpperCase()} 💰`;
    const linea2 = `El ticket promedio fue de ${formatearMonto(ticketPromedio)}. ¿Querés comparar con otro mes?`;
    return `${linea1}\n${linea2}`;
  }

  // Si llegamos aquí, se usa GPT como fallback (raro, pero por si acaso)
  const promptIA = `
IMPORTANTE: Debés usar literalmente "${periodo.descripcion.toUpperCase()}" como período. No lo cambies ni inventes otro.

Respondé SOLO en este formato exacto:
Vendiste ${formatearMonto(total)} en ${periodo.descripcion.toUpperCase()} 💰\nEl ticket promedio fue de ${formatearMonto(total / transacciones)}. ¿Querés comparar con otro mes?

Pregunta original del usuario: "${mensaje}"
`.trim();

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: ventasPrompt },
      { role: 'user', content: promptIA }
    ],
    max_tokens: 300,
    temperature: 0.7
  });

  const content = completion.choices[0].message?.content || '{}';

  try {
    const cleaned = content.replace(/```json|```/g, '').trim();
    return cleaned;
  } catch (err) {
    console.error("❌ Error al interpretar respuesta del modelo:", err, content);
    return `⚠️ No pude generar la respuesta correctamente. ¿Querés intentarlo de nuevo o consultar otro período?`;
  }
}



// 🔀 Ejecuta solo el bloque necesario según el tema detectado
async function ejecutarBloque(
  tema: string,
  empresa_id: string,
  user_id: string,
  mensaje: string
): Promise<string | null> {
  switch (tema) {
    case "ventas": return await consultarVentas(empresa_id, user_id, mensaje);
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

  // 🧠 Identificación del usuario y contexto
  const userId = req.headers.get('x-user-id') || 'anonimo';
const lastTema = ConversationMemoryManager.getLastContext(userId);
const contexto = detectContext(message, userId, lastTema);
const temas = [contexto];

  console.log("🧠 Contexto detectado:", contexto);
  console.log("🧠 Tema detectado:", contexto);
  console.log("🗂️ Último mensaje del usuario:", ConversationMemoryManager.getLastUserMessage(userId));
  console.log("🧾 Memoria actual:\n" + ConversationMemoryManager.getConversationContext(userId));

  // 🧠 Ejecutar solo los bloques necesarios
  const resultados = await Promise.all(
    temas.map((tema) => ejecutarBloque(tema, empresa_id, userId, message)) // 👈 CORREGIDO
  );

  const respuesta = resultados.filter(Boolean).join("\n");

  // 💾 Guardar esta interacción en memoria
  ConversationMemoryManager.saveInteraction(userId, message, respuesta, contexto);

  return NextResponse.json({ respuesta });
}

