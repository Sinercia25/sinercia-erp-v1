export function generarOpcionesPorContexto(tema: string): string {
  switch (tema) {
    case 'ventas':
      return '📌 ¿Querés ver el detalle por sucursal o por canal de venta?'
    case 'stock':
      return '📦 ¿Querés ver los productos bajo mínimo o sin stock?'
    case 'finanzas':
      return '💰 ¿Querés ver egresos por categoría o comparar con el mes anterior?'
    default:
      return '🧠 ¿Querés explorar otro módulo o recibir una sugerencia más precisa?'
  }
}
