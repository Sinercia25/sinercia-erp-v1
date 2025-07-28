/**
 * 🟢 detectarVentas
 * Detecta si el usuario habla de ventas, facturación, cobros o clientes activos.
 */
export function detectarVentas(texto: string): boolean {
  return /(ventas?|vendí|vendimos|facturaci[oó]n|ingresos por ventas|clientes activos|cobros pendientes|cuánto vendimos|qué productos se vendieron|ranking de ventas)/.test(texto);
}
