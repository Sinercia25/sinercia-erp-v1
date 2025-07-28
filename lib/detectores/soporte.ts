/**
 * 🆘 detectarSoporte
 * Detecta si el usuario necesita ayuda, soporte o no entiende qué hacer.
 */
export function detectarSoporte(texto: string): boolean {
  return /(no entiendo|ayuda|soporte|necesito asistencia|duda|cómo hago|problema|error|guiame|tutorial)/.test(texto);
}
