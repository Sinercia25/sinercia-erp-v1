import { detectarVentas } from './ventas'
import { detectarFinanzas } from './finanzas'
import { detectarRRHH } from './rrhh'
import { detectarCheques } from './cheques'
import { detectarStock } from './stock'
import { detectarClientes } from './clientes'
import { detectarReportes } from './reportes'
import { detectarCompras } from './compras'
import { detectarDocumentos } from './documentos'
import { detectarAFIP } from './afip'
import { detectarPredicciones } from './predicciones'
import { detectarSoporte } from './soporte'

/**
 * 🧠 clasificarModulo
 * Detecta el módulo más probable según palabras clave del mensaje del usuario.
 * Se usa antes de GPT para ahorrar tokens y acelerar la respuesta.
 */

export function clasificarModulo(texto: string): string {
  // Convertir todo a minúsculas por seguridad
  texto = texto.toLowerCase()

  // 🟩 Módulo: ventas
  if (
    texto.includes('venta') ||
    texto.includes('vendimos') ||
    texto.includes('factura') ||
    texto.includes('ticket') ||
    texto.includes('importe medio') ||
    texto.includes('monto promedio') ||
    texto.includes('ventas') ||
    texto.includes('cuánto fue la venta') ||
    texto.includes('ganamos') ||
    texto.includes('facturación')
  ) {
    return 'ventas'
  }

  // 🟦 Módulo: stock
  if (
    texto.includes('stock') ||
    texto.includes('inventario') ||
    texto.includes('productos sin') ||
    texto.includes('sin existencias') ||
    texto.includes('faltantes') ||
    texto.includes('por debajo del mínimo') ||
    texto.includes('productos agotados') ||
    texto.includes('stock bajo') ||
    texto.includes('sin unidades') ||
    texto.includes('faltan productos')
  ) {
    return 'stock'
  }

  // 🟨 Módulo: finanzas
  if (
    texto.includes('gasto') ||
    texto.includes('egreso') ||
    texto.includes('ingreso') ||
    texto.includes('flujo de caja') ||
    texto.includes('pagos') ||
    texto.includes('caja') ||
    texto.includes('cobros')
  ) {
    return 'finanzas'
  }

  // 🟥 Módulo: rrhh
  if (
    texto.includes('empleados') ||
    texto.includes('sueldos') ||
    texto.includes('f931') ||
    texto.includes('liquidación de haberes') ||
    texto.includes('personal') ||
    texto.includes('ausencias')
  ) {
    return 'rrhh'
  }

  // 🧾 Módulo: cheques
  if (
    texto.includes('cheques') ||
    texto.includes('cheque rechazado') ||
    texto.includes('vencimiento de cheque')
  ) {
    return 'cheques'
  }

  // 🧰 Módulo: maquinaria
  if (
    texto.includes('tractor') ||
    texto.includes('maquinaria') ||
    texto.includes('horas máquina') ||
    texto.includes('uso maquinaria')
  ) {
    return 'maquinaria'
  }

  // 📄 Módulo: documentos
  if (
    texto.includes('documento') ||
    texto.includes('pdf') ||
    texto.includes('contrato') ||
    texto.includes('subí') ||
    texto.includes('factura escaneada')
  ) {
    return 'documentos'
  }

  // 👥 Módulo: clientes
  if (
    texto.includes('clientes') ||
    texto.includes('cliente debe') ||
    texto.includes('cuenta corriente') ||
    texto.includes('facturas abiertas')
  ) {
    return 'clientes'
  }

  // 🟪 Módulo: afip
  if (
    texto.includes('afip') ||
    texto.includes('cuit') ||
    texto.includes('monotributo') ||
    texto.includes('comprobante fiscal')
  ) {
    return 'afip'
  }

  // 📈 Módulo: predicciones
  if (
    texto.includes('proyección') ||
    texto.includes('previsión') ||
    texto.includes('predicción') ||
    texto.includes('estimado') ||
    texto.includes('flujo futuro')
  ) {
    return 'predicciones'
  }

  // 🧠 Módulo general por defecto
  return 'general'
}
