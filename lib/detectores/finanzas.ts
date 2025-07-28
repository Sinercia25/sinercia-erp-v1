/**
 * 💰 detectarFinanzas
 * Detecta ingresos, egresos, gastos, costos, balance, flujo de caja, utilidad.
 */
export function detectarFinanzas(texto: string): boolean {
  return /(ingresos|egresos|gastos?|costos?|salidas|flujo de caja|finanzas|balance|resultado financiero|utilidad|ganancias|pérdidas|cuánto ganamos|cuánto gastamos|rubro que más gastó|categorías de egresos)/.test(texto);
}
