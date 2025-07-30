// 📁 lib/consultas/ventas/consultarVentas.ts

import { getCache, setCache } from '@/lib/cache/cache';
import { consultarVentasDesdeDWH } from '@/lib/dwh/ventas/consultarVentasDesdeDWH';
import { PeriodoDetectado } from '@/lib/periodos/interpretarTiempoExtendido';

/**
 * 📦 consultarVentas
 * Devuelve el total de ventas desde cache o desde el DWH si no hay cache.
 * El resultado es un número (en pesos).
 */
export async function consultarVentas(
  empresaId: string,
  periodo: PeriodoDetectado
): Promise<number> {
  const key = `ventas:${empresaId}:${periodo.inicio.getFullYear()}-${String(periodo.inicio.getMonth() + 1).padStart(2, "0")}`;

  const cached = getCache(key);
  if (cached) {
    return parseFloat(cached);
  }

  const totalVentas = await consultarVentasDesdeDWH(empresaId, periodo);

  const diezMinutos = 10 * 60 * 1000;
  setCache(key, totalVentas.toString(), diezMinutos);

  return totalVentas;
}
