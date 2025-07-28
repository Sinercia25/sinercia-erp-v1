// 📁 /lib/respuestas/ventas/generarRespuestaVentas.ts

/**
 * 🎯 Devuelve una respuesta concreta y breve: solo el total vendido.
 */
export function generarRespuestaSimpleVentas(resumen: any): string {
 const periodo = resumen.periodo ? resumen.periodo.toUpperCase() : 'el período seleccionado'

return `💰 Vendiste $${resumen.total.toLocaleString('es-AR')} en ${resumen.periodo.toUpperCase()}.`

}

/**
 * 📊 Devuelve el resumen ejecutivo completo con comparativo y sugerencias.
 */
export function generarResumenEjecutivoVentas(resumen: any): string {
  const {
    total,
    ticketPromedio,
    mejorDia,
    sucursalDestacada,
    canalPrincipal,
    comparativoAnterior
  } = resumen;

  let respuesta = ``;
  

  if (comparativoAnterior) {
    const signo = comparativoAnterior.variacionPorcentual >= 0 ? '📈' : '📉';
    const variacion = comparativoAnterior.variacionPorcentual.toFixed(1);
    respuesta += `\n${signo} Comparado con el período anterior:\n`;
    respuesta += `• Total anterior: $${comparativoAnterior.total.toLocaleString('es-AR')}\n`;
    respuesta += `• Variación: ${variacion}%\n`;
  }

  return respuesta.trim();
}
