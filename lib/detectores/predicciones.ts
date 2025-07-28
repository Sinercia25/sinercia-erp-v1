/**
 * 🔮 detectarPredicciones
 * Detecta si se quiere proyectar, estimar o predecir ventas/gastos/resultados.
 */
export function detectarPredicciones(texto: string): boolean {
  return /(proyecci[oó]n|predecir|estimar|estimaci[oó]n|pron[oó]stico|cuánto vamos a|futuro|tendencia|riesgo de quiebra)/.test(texto);
}
