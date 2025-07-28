// 📁 /lib/respuestas/ventas/esSolicitudDeResumen.ts

/**
 * 🧠 Detecta si el usuario pidió un resumen completo
 */
export function esSolicitudDeResumen(mensaje: string): boolean {
  const texto = mensaje.toLowerCase();

  return (
    texto.includes("resumen") ||
    texto.includes("ver más") ||
    texto.includes("ver mas") ||
    texto.includes("detalle") ||
    texto.includes("completo") ||
    texto.includes("ejecutivo") ||
    texto.includes("mostrar todo")
  );
}
