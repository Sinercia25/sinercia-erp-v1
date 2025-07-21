// lib/periodo-memory.ts

import type { PeriodoDetectado } from './ruta-de-tu-archivo-interpretarTiempo';

const periodosPorUsuario = new Map<string, PeriodoDetectado>();

export function guardarPeriodo(userId: string, periodo: PeriodoDetectado) {
  periodosPorUsuario.set(userId, periodo);
}

export function obtenerUltimoPeriodo(userId: string): PeriodoDetectado | null {
  return periodosPorUsuario.get(userId) ?? null;
}
