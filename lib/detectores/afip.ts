/**
 * 💸 detectarAFIP
 * Detecta si se trata de facturación electrónica, CAE o validación fiscal.
 */
export function detectarAFIP(texto: string): boolean {
  return /(afip|factura electr[oó]nica|cae|comprobante|emiti[ró]|fiscal|validaci[oó]n|webservice)/.test(texto);
}
