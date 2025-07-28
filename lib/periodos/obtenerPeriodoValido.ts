import { interpretarTiempoExtendido } from './interpretarTiempoExtendido'
import { obtenerUltimoPeriodo } from './periodo-memory'
import type { PeriodoDetectado } from './interpretarTiempoExtendido'

export async function obtenerPeriodoValido(
  mensaje: string,
  userId: string
): Promise<PeriodoDetectado> {
  const detectado = interpretarTiempoExtendido(mensaje, userId)
  if (detectado) return detectado

  const ultimo = await obtenerUltimoPeriodo(userId)
  if (ultimo) return ultimo

  // Si no detecta nada, usa el mes actual como fallback
  const ahora = new Date()
  const inicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1)
  const fin = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 1)

  return {
    tipo: 'mes',
    inicio,
    fin,
    descripcion: `mes actual (${inicio.toLocaleDateString('es-AR')})`
  }
}
