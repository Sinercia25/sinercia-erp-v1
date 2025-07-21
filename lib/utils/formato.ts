export function formatearMonto(valor: number): string {
  if (valor >= 1_000_000) {
    return `$${(valor / 1_000_000).toFixed(1)}M`;
  } else {
    return `$${valor.toLocaleString("es-AR")}`;
  }
}
