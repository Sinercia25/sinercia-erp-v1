// 📁 /lib/respuestas/stock/esConsultaDirecta.ts
export function esConsultaDirectaStock(texto: string): boolean {
  const t = texto.toLowerCase()

  return (
    t.includes("sin stock") ||
    t.includes("bajo mínimo") ||
    t.includes("productos críticos") ||
    t.includes("faltantes") ||
    t.includes("stock disponible") ||
    t.includes("cuántos productos") ||
    t.includes("hay stock")
  )
}
