/**
 * 📁 detectarDocumentos
 * Detecta si el usuario quiere consultar, subir o buscar documentos.
 */
export function detectarDocumentos(texto: string): boolean {
  return /(documentos?|archivos?|pdf|contratos?|manuales|ver archivo|leer documento|subí un archivo)/.test(texto);
}
