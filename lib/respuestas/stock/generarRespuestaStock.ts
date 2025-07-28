/**
 * 📦 generarRespuestaStock.ts
 * Genera una respuesta conversacional profesional a partir de un resumen de stock.
 * No consulta la base de datos. Recibe un objeto con métricas y lo transforma en texto natural.
 */

type ProductoCritico = {
  nombre: string
  stock: number
  minimo: number
}

type ResumenStock = {
  total_productos: number
  productos_con_stock: number
  productos_sin_stock: number
  productos_bajo_minimo: number
  top_criticos: ProductoCritico[]
}

export function generarRespuestaStock(resumen: ResumenStock): string {
  const {
    total_productos,
    productos_con_stock,
    productos_sin_stock,
    productos_bajo_minimo,
    top_criticos
  } = resumen

  // 🔹 Caso 1: No hay productos cargados
  if (total_productos === 0) {
    return 'No tenés productos registrados todavía. Podés cargarlos desde el panel de stock o importar una lista desde Excel.';
  }

  // 🔹 Caso 2: Todo en orden
  if (productos_sin_stock === 0 && productos_bajo_minimo === 0) {
    return `🎉 El stock está equilibrado. Tenés ${total_productos} productos activos y todos están por encima del mínimo.`;
  }

  // 🔹 Caso 3: Hay faltantes o críticos
  let respuesta = `📦 Estado general del inventario:\n\n`

  respuesta += `- Total de productos: ${total_productos}\n`
  respuesta += `- Con stock suficiente: ${productos_con_stock}\n`

  if (productos_sin_stock > 0) {
    respuesta += `- 🚫 Sin stock: ${productos_sin_stock}\n`
  }

  if (productos_bajo_minimo > 0) {
    respuesta += `- ⚠️ Bajo mínimo: ${productos_bajo_minimo}\n`
  }

  if (top_criticos.length > 0) {
    const destacados = top_criticos.slice(0, 3)
    respuesta += `\nProductos críticos:\n`
    destacados.forEach((p) => {
      respuesta += `• ${p.nombre}: ${p.stock} unidades (mínimo requerido: ${p.minimo})\n`
    })
    if (top_criticos.length > 3) {
      respuesta += `...y ${top_criticos.length - 3} más.`
    }
  }

  respuesta += `\n¿Querés que te muestre la lista completa o ver los productos sin stock?`

  return respuesta
}
