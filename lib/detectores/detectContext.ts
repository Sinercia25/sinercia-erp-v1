// 📁 lib/detectores/detectContext.ts

import { interpretarTiempoExtendido } from '@/lib/periodos/interpretarTiempoExtendido'
import { clasificarModulo } from '@/lib/detectores/clasificarModulo'
import { detectarTemaConGPT } from '@/lib/detectores/detectarTemaGPT' // GPT fallback

/**
 * 🎯 detectContext
 * Detecta el módulo más probable (ventas, rrhh, etc.) en base al mensaje.
 * Usa el clasificador manual + backup con GPT si no se detecta nada.
 * También mantiene el módulo anterior si hay período válido y contexto activo.
 */
export async function detectContext(
  texto: string,
  userId: string,
  lastTema: string
): Promise<string> {
  const lower = texto.toLowerCase()

  // 🔍 Paso 1: detectar módulo manualmente
  const moduloDetectado = clasificarModulo(lower)

  // 📅 Paso 2: detectar si hay período (ej: "este mes", "julio")
  const periodo = interpretarTiempoExtendido(lower, userId)

  // Si hay período y el último módulo era válido, lo mantenemos
  const modulosValidos = [
    'ventas', 'finanzas', 'rrhh', 'cheques', 'stock',
    'clientes', 'reportes', 'compras', 'documentos',
    'afip', 'predicciones', 'soporte'
  ]

// Si el mensaje contiene un período, y NO se detectó un nuevo módulo, mantenemos el módulo anterior
if (periodo && !moduloDetectado && modulosValidos.includes(lastTema)) {
  return lastTema
}

  // ⚠️ Paso 3: si el clasificador no encontró nada útil, usamos GPT
  if (!moduloDetectado || moduloDetectado === 'general') {
    console.log('⚠️ Tema no reconocido por regex, intentando con GPT...')
    const temaGPT = await detectarTemaConGPT(lower)
    console.log('✅ Tema detectado por GPT:', temaGPT)
    return temaGPT
  }

  // ✅ En caso de detección manual exitosa
  return moduloDetectado
}
