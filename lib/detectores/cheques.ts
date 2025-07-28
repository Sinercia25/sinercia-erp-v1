/**
 * 💳 detectarCheques
 * Detecta operaciones relacionadas con cheques, bancos, depósitos y cobranzas.
 */
export function detectarCheques(texto: string): boolean {
  return /(cheques?|pagar[eé]|dep[oó]sitos?|acreditaci[oó]n|rechazo de cheque|cobr[oó]|vencimiento|cheques en cartera|cuándo se cobra|banco|bancarios|caja diaria)/.test(texto);
}
