// 📁 /lib/memoriaConversacional/sugerenciasContextuales.ts

// 👇 Tipos opcionales si los tenés tipados
type ResumenVentas = {
  total: number;
  ventasPorSucursal?: { sucursal: string; total: number }[];
};

type ResumenStock = {
  sinStock: number;
  bajoMinimo: number;
  totalProductos: number;
};

export function generarSugerenciaContextual(
  tema: string,
  resumen: any // puede ser ResumenVentas o ResumenStock
): string {
  switch (tema) {
    case 'ventas':
      return sugerenciaVentas(resumen as ResumenVentas);

    case 'stock':
      return sugerenciaStock(resumen as ResumenStock);

    default:
      return '';
  }
}

// 🎯 Lógica contextual para ventas
function sugerenciaVentas(resumen: ResumenVentas): string {
  const ventasSucursal = resumen.ventasPorSucursal;
  if (!ventasSucursal || ventasSucursal.length < 2) return '';

  const top = ventasSucursal[0];
  const bottom = ventasSucursal[ventasSucursal.length - 1];

  if (top.total >= bottom.total * 2) {
    return `📍 La sucursal ${top.sucursal} vendió más del doble que ${bottom.sucursal}. ¿Querés comparar el rendimiento por canal o equipo?`;
  }

  return '📊 ¿Querés ver el detalle por sucursal o vendedor?';
}

// 🎯 Lógica contextual para stock
function sugerenciaStock(resumen: ResumenStock): string {
  if (resumen.sinStock > 0) {
    return `🚨 Hay ${resumen.sinStock} productos sin stock. ¿Querés ver cuáles son?`;
  }
  if (resumen.bajoMinimo > 0) {
    return `📦 Hay ${resumen.bajoMinimo} productos bajo el nivel mínimo. ¿Querés verlos ahora?`;
  }
  return '';
}
