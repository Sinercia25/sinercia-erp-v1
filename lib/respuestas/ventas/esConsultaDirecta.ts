export function esConsultaDirectaVentas(texto: string): boolean {
  const t = texto.toLowerCase()
  return (
    t.includes('cuánto vendimos') ||
    t.includes('ventas de') ||
    t.includes('total de ventas') ||
    t.includes('ventas este') ||
    t.includes('ventas en') ||
    t.includes('ticket promedio') ||
    t.includes('cuál fue el mejor día') ||
    t.includes('detalle de ventas') ||
    t.includes('resumen de ventas') ||
    t.includes('venta del mes anterior') ||
    t.includes('comparado con el mes anterior') ||
    t.includes('comparación') ||
    t.includes('podés hacer un análisis') ||
    t.includes('hacer un análisis con el mes anterior')
  )
}
