// 📁 lib/detectores/stock.ts

export function detectarStock(texto: string): boolean {
  return /stock|minimo|productos sin|faltante|producto critico|bajo minimo|reposición|faltan|stock minimo/i.test(texto)
}
