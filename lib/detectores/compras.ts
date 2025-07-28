/**
 * 🧾 detectarCompras
 * Detecta si el usuario habla de compras, proveedores o gastos asociados.
 */
export function detectarCompras(texto: string): boolean {
  return /(compras?|proveedores|orden de compra|factura de compra|costos de proveedor|gasto mensual)/.test(texto);
}
