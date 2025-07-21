// ✅ Función robusta para detectar el contexto de la conversación
import { interpretarTiempoExtendido } from '@/lib/interpretarTiempoExtendido';
import { obtenerUltimoPeriodo } from '@/lib/periodo-memory';

export function detectContext(texto: string, userId: string, lastTema: string): string {
  const lower = texto.toLowerCase();

  // 🎯 Palabras clave directas
  if (/(ventas?|vendimos|vendí|facturaci[oó]n|ingresos por ventas)/.test(lower)) {
    return 'ventas';
  }

  if (/(ingresos|egresos|flujo|resultado financiero|utilidad|balance)/.test(lower)) {
    return 'finanzas';
  }

  if (/(personal|empleados|rrhh|sueldos|ausencias)/.test(lower)) {
    return 'rrhh';
  }

  if (/(maquinaria|mantenimiento|tractor|máquinas)/.test(lower)) {
    return 'maquinaria';
  }

  if (/(campo|siembra|cosecha|lote|cultivo)/.test(lower)) {
    return 'campo';
  }

  if (/(cheques?|banco|pagar[eé]|dep[oó]sito|cobro)/.test(lower)) {
    return 'cheques';
  }

  // 🧠 Si se detecta un período y el último tema fue válido, lo conserva
  const periodo = interpretarTiempoExtendido(texto, userId);
  if (periodo && ['ventas', 'finanzas', 'rrhh', 'maquinaria', 'campo', 'cheques'].includes(lastTema)) {
    return lastTema;
  }

  return 'general';
}
