// 📁 /lib/memoriaConversacional/perfiladoRespuesta.ts

export function adaptarRespuestaPorPuesto(respuestaBase: string, puestoId: string): string {
  switch (puestoId.toLowerCase()) {
    case 'gerencia':
      return `${respuestaBase}\n\n📌 ¿Querés que te muestre un comparativo con otras áreas?`

    case 'admin':
      return `${respuestaBase}\n\nRecordá validar con AFIP o con el contador.`;

    case 'produccion':
      return `${respuestaBase}\n\n🚜 ¿Querés ver los datos por lote o máquina?`;

    case 'comercial':
      return `${respuestaBase}\n\n📈 ¿Querés ver los productos más vendidos o clientes top?`;

    case 'operaciones':
      return `${respuestaBase}\n\n🛠️ Si necesitás instrucciones o tareas, avisame.`;

    case 'soporte':
      return `${respuestaBase}\n\n🧩 Si algo falla o está lento, reportalo desde el panel de control.`;

    default:
      return respuestaBase;
  }
}
