/**
 * 👥 detectarRRHH
 * Detecta temas relacionados con empleados, sueldos, ausencias o liquidaciones.
 */
export function detectarRRHH(texto: string): boolean {
  return /(personal|empleados|rrhh|recursos humanos|sueldos?|nómina|jornadas|liquidaci[oó]n|f931|ausencias|vacaciones|bajas|altas|cargas sociales)/.test(texto);
}
