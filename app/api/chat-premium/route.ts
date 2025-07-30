// @ts-check

// 📦 CONFIGURACIÓN GENERAL DEL SISTEMA
import { NextRequest, NextResponse } from 'next/server'
import { OpenAI } from 'openai'
import { db } from '@/lib/db'

// 🧠 MEMORIA Y CONTEXTO DEL USUARIO
import {guardarInteraccion, obtenerUltimoMensaje, obtenerUltimoTema} from '@/lib/memoriaConversacional/guardarContexto'
import { PeriodoDetectado } from '@/lib/periodos/interpretarTiempoExtendido'
import { generarSugerenciaContextual } from '@/lib/memoriaConversacional/sugerenciasContextuales'
import { generarOpcionesPorContexto } from '@/lib/memoriaConversacional/sugerenciasOpcionales'
import { generarSugerenciaConGPT } from '@/lib/sugerencias/generarSugerenciaConGPT';




// 🧠 DETECTORES DE INTENCIÓN Y TIEMPO
import { detectContext } from '@/lib/detectores/detectContext'
import { interpretarTiempoExtendido } from '@/lib/periodos/interpretarTiempoExtendido'
import { obtenerPeriodoValido } from '@/lib/periodos/obtenerPeriodoValido'
import { guardarPeriodo, obtenerUltimoPeriodo } from '@/lib/periodos/periodo-memory'


// 🛠️ UTILIDADES GENERALES
import { formatearMonto } from '@/lib/utils/formato'

// 🧾 PROMPTS POR MÓDULO
import { ventasPrompt } from '@/lib/prompts/ventasPrompt'
import { finanzasPrompt } from '@/lib/prompts/finanzasPrompt'
import { stockPrompt } from '@/lib/prompts/stockPrompt'

// 📊 CONSULTAS AL DWH
import { obtenerResumenVentas } from '@/lib/dwh/ventas/resumenVentas'
import { consultarFinanzas, consultarFinanzasPorCategoria } from '@/lib/dwh/finanzas'
import { obtenerResumenStock } from '@/lib/dwh/stock/resumenStock'

// 💬 RESPUESTAS CONVERSACIONALES DIRECTAS
import { generarRespuestaStock } from '@/lib/respuestas/stock/generarRespuestaStock'
import { generarRespuestaSimpleVentas,generarResumenEjecutivoVentas} from '@/lib/respuestas/ventas/generarRespuestaVentas'
import { esConsultaDirectaStock } from '@/lib/respuestas/stock/esConsultaDirecta'
import { esConsultaDirectaVentas } from '@/lib/respuestas/ventas/esConsultaDirecta'
import { esSolicitudDeResumen } from '@/lib/respuestas/ventas/esSolicitudDeResumen'


// 💬 USUARIOS
import { adaptarRespuestaPorPuesto } from '@/lib/memoriaConversacional/perfiladoRespuesta'


// 🤖 OPENAI
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' })

// 🔀 EJECUTA EL BLOQUE NECESARIO SEGÚN EL CONTEXTO
async function ejecutarBloque(
  tema: string,
  empresa_id: string,
  user_id: string,
  mensaje: string
): Promise<string | null> {
  switch (tema) {
        

  case "ventas": {
  const periodo = await obtenerPeriodoValido(mensaje, user_id)
  guardarPeriodo(user_id, periodo)

  const resumen = await obtenerResumenVentas(empresa_id, periodo)

 if (esConsultaDirectaVentas(mensaje)) {
  if (esSolicitudDeResumen(mensaje)) {
    const resumenTexto = generarResumenEjecutivoVentas(resumen)
    const sugerenciaGPT = await generarSugerenciaConGPT('ventas', resumen, mensaje)
    return `${resumenTexto}\n\n${sugerenciaGPT}`
  }

  {const respuesta = generarRespuestaSimpleVentas(resumen)
  const opciones = generarOpcionesPorContexto('ventas') // rápido y natural
  return `${respuesta}\n\n${opciones}`
  }
}


  // Fallback: si no es una pregunta directa, usamos GPT con datos reales
  const prompt = `
Estos son los datos reales de ventas durante ${resumen.periodo}:

${JSON.stringify(resumen, null, 2)}

Respondé al usuario con un análisis claro, profesional y humano. Sé breve y concreto. Si podés, sugerí un paso siguiente.
`.trim()

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0.5,
    messages: [
      { role: 'system', content: ventasPrompt },
      { role: 'user', content: mensaje },
      { role: 'assistant', content: prompt }
    ]
  })

  const respuestaGPT = completion.choices[0].message?.content?.trim()
  return respuestaGPT || 'No se pudo generar respuesta para esa consulta.'
}


     case "stock": {
  console.log('📦 Procesando consulta de stock para empresa:', empresa_id)
  const resumen = await obtenerResumenStock(empresa_id)
  console.log('📊 Resumen obtenido:', JSON.stringify(resumen, null, 2))

  // 🧠 Detectamos si la pregunta es directa y estructurada
  if (esConsultaDirectaStock(mensaje)) {
    console.log('✅ Es consulta directa de stock')
    const respuesta = generarRespuestaStock(resumen)
    return respuesta
  }

  // 🤖 Si no, usamos GPT como asistente inteligente
  console.log('🤖 Usando GPT para respuesta de stock')
  const prompt = `
Estos son los datos del stock actual:

${JSON.stringify(resumen, null, 2)}

Redactá una respuesta profesional y clara para el usuario.
Respondé solo con texto plano. Si hay faltantes o productos críticos, mostralos.
Terminá con una sugerencia útil.
`.trim()

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.4,
    messages: [
      { role: "system", content: stockPrompt },
      { role: "user", content: mensaje },
      { role: "assistant", content: prompt }
    ]
  })

  return completion.choices[0].message?.content || "No se pudo generar respuesta."
}

    case "finanzas": {
      const periodo = interpretarTiempoExtendido(mensaje, user_id) ?? await obtenerUltimoPeriodo(user_id);
      if (!periodo) return `No se detectó ningún período. Probá con "¿Cuánto gastamos en julio?"`;

      if (/categoría|categorias|sueldos|alquiler|combustible|en qué gastamos|gastos por/i.test(mensaje)) {
        const detalle = await consultarFinanzasPorCategoria(empresa_id, 'egreso', periodo);
        if (detalle.length === 0) {
          return `No se encontraron egresos por categoría para ${periodo.descripcion.toUpperCase()}.`;
        }

        const top = detalle.slice(0, 3).map(d =>
          `• ${d.categoria}: $${d.total.toLocaleString()}`
        ).join('\n');

        return `📊 Principales egresos por categoría en ${periodo.descripcion}:\n\n${top}`;
      }

      const dato = await consultarFinanzas(empresa_id, periodo);
      if (!dato || dato.includes("$0")) {
        return `No se encontraron datos financieros para ${periodo.descripcion.toUpperCase()} ⚠️`;
      }

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        temperature: 0.4,
        messages: [
          { role: 'system', content: finanzasPrompt },
          { role: 'user', content: mensaje },
          { role: 'assistant', content: dato }
        ]
      });

      return completion.choices[0].message?.content || dato;
    }

    default:
      return null;
  }
}

// ✅ ENDPOINT PRINCIPAL
const handler = async (req: NextRequest) => {
  try {
    const { message, empresa_id } = await req.json();
    if (!message || !empresa_id) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    const userId = req.headers.get('x-user-id') || 'anonimo';
    const lastTema = obtenerUltimoTema(userId);
    let contexto = await detectContext(message, userId, lastTema);
    
    // 🧠 Si no se pudo detectar el tema (GPT dijo "general"), usamos el último
    if (contexto === 'general' && lastTema) {
      console.log("⚠️ Tema no reconocido, usando último contexto:", lastTema);
      contexto = lastTema;
    }
    
    const temas = [contexto];

    console.log("🧠 Contexto detectado:", contexto);
    console.log("🗂️ Último mensaje del usuario:", obtenerUltimoMensaje(userId));

    const resultados = await Promise.all(
      temas.map((tema) => ejecutarBloque(tema, empresa_id, userId, message))
    );

    const respuesta = resultados.filter(Boolean).join("\n");

    // 🧠 Guardamos el mensaje en la memoria conversacional
    guardarInteraccion(userId, message, respuesta, contexto);

    // 🔐 Simulación: puesto del usuario (en futuro, viene desde BD o token)
    const puestoId = 'gerencia' // Cambialo por 'gerencia', 'admin', etc. para testear

    // 🎨 Adaptamos el estilo de la respuesta al puesto del usuario
    const respuestaFinal = adaptarRespuestaPorPuesto(respuesta, puestoId);

    // ✅ Devolvemos la respuesta final personalizada
    return NextResponse.json({ respuesta: respuestaFinal });
  } catch (error) {
    console.error('❌ Error en handler principal:', error);
    return NextResponse.json({ 
      error: 'Error al procesar la solicitud',
      details: error instanceof Error ? error.message : 'Error desconocido' 
    }, { status: 500 });
  }
}
export { handler as POST };
