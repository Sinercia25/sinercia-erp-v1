export function detectarReportes(texto: string): boolean {
  return /(informe|resumen|reporte|exportar|pdf|excel|tablas de datos)/.test(texto);
}
