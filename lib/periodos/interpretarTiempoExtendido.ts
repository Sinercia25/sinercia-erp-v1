// ✅ interpretacionTiempoExtendido.ts – Versión robusta, modular y reutilizable
import { obtenerUltimoPeriodo } from './periodo-memory'

export type PeriodoDetectado = {
  tipo: 'dia' | 'semana' | 'mes' | 'trimestre' | 'año' | 'decada' | 'rango'
  inicio: Date
  fin: Date
  descripcion: string
}

const meses = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
]

export function interpretarTiempoExtendido(texto: string, userId: string): PeriodoDetectado | null {
  texto = texto.toLowerCase()
  const ahora = new Date()
  const añoActual = ahora.getFullYear()
  const mesActual = ahora.getMonth()
  const diaActual = ahora.getDate()

  // 🗓️ NOMBRE DEL MES (ej: "julio", "en julio", "julio de 2024")
  const matchMes = texto.match(/(?:en\s+)?(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)(?:\s+de\s+)?(\d{4})?/)
  if (matchMes) {
    const i = meses.indexOf(matchMes[1])
    const y = parseInt(matchMes[2]) || añoActual
    const inicio = new Date(y, i, 1)
    const fin = new Date(y, i + 1, 1)
    return {
      tipo: 'mes',
      inicio,
      fin,
      descripcion: `el mes de ${meses[i].toUpperCase()} ${y}`
    }
  }

  // ✳️ DETECCIÓN DE RANGO: "desde X hasta Y"
  const matchDesdeHasta = texto.match(/desde\s+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\s+(hasta|a)\s+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/)
  if (matchDesdeHasta) {
    const [d1, d2] = [matchDesdeHasta[1], matchDesdeHasta[3]]
    const inicio = new Date(d1.replace(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/, '$3-$2-$1'))
    const fin = new Date(d2.replace(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/, '$3-$2-$1'))
    fin.setDate(fin.getDate() + 1)
    return { tipo: 'rango', inicio, fin, descripcion: `desde el ${d1} hasta el ${d2}` }
  }

  // 🟢 AYER, HOY, MAÑANA
  if (texto.includes('ayer')) {
    const inicio = new Date(añoActual, mesActual, diaActual - 1)
    const fin = new Date(añoActual, mesActual, diaActual)
    return { tipo: 'dia', inicio, fin, descripcion: 'ayer' }
  }
  if (texto.includes('hoy')) {
    const inicio = new Date(añoActual, mesActual, diaActual)
    const fin = new Date(añoActual, mesActual, diaActual + 1)
    return { tipo: 'dia', inicio, fin, descripcion: 'hoy' }
  }
  if (texto.includes('mañana')) {
    const inicio = new Date(añoActual, mesActual, diaActual + 1)
    const fin = new Date(añoActual, mesActual, diaActual + 2)
    return { tipo: 'dia', inicio, fin, descripcion: 'mañana' }
  }

  // 📅 ESTE MES / MES PASADO
  if (/este mes|actual|ahora/i.test(texto)) {
    const inicio = new Date(añoActual, mesActual, 1)
    const fin = new Date(añoActual, mesActual + 1, 1)
    return { tipo: 'mes', inicio, fin, descripcion: `este mes (${meses[mesActual].toUpperCase()} ${añoActual})` }
  }

  if (/mes pasado|mes anterior/.test(texto)) {
    const m = mesActual === 0 ? 11 : mesActual - 1
    const y = mesActual === 0 ? añoActual - 1 : añoActual
    const inicio = new Date(y, m, 1)
    const fin = new Date(y, m + 1, 1)
    return { tipo: 'mes', inicio, fin, descripcion: `el mes de ${meses[m].toUpperCase()} ${y}` }
  }

  // 🔁 Hace X años o meses
  const matchAnios = texto.match(/hace\s+(\d+)\s+a[nñ]os?/) 
  if (matchAnios) {
    const n = parseInt(matchAnios[1])
    const y = añoActual - n
    const inicio = new Date(y, 0, 1)
    const fin = new Date(y + 1, 0, 1)
    return { tipo: 'año', inicio, fin, descripcion: `el año ${y}` }
  }

  const matchMeses = texto.match(/hace\s+(\d+)\s+meses?/) 
  if (matchMeses) {
    const n = parseInt(matchMeses[1])
    const d = new Date(añoActual, mesActual, 1)
    d.setMonth(d.getMonth() - n)
    const inicio = new Date(d.getFullYear(), d.getMonth(), 1)
    const fin = new Date(inicio.getFullYear(), inicio.getMonth() + 1, 1)
    return { tipo: 'mes', inicio, fin, descripcion: `hace ${n} meses (${meses[inicio.getMonth()].toUpperCase()} ${inicio.getFullYear()})` }
  }

  // 📆 Año exacto
  const matchAnioDirecto = texto.match(/(en|del|a[nñ]o|y el a[nñ]o|para el a[nñ]o)\s*(\d{4})/)
  if (matchAnioDirecto) {
    const y = parseInt(matchAnioDirecto[2])
    return { tipo: 'año', inicio: new Date(y, 0, 1), fin: new Date(y + 1, 0, 1), descripcion: `el año ${y}` }
  }

  // 📆 AÑO PASADO usando la memoria del usuario
  if (
    texto.includes('el año pasado') ||
    texto.includes('año anterior') ||
    texto.includes('y el año pasado')
  ) {
    const periodoPrevio = obtenerUltimoPeriodo(userId)
    const mes = periodoPrevio?.inicio?.getMonth() ?? mesActual
    const año = (periodoPrevio?.inicio?.getFullYear() ?? añoActual) - 1
    const inicio = new Date(año, mes, 1)
    const fin = new Date(año, mes + 1, 1)
    return {
      tipo: 'mes',
      inicio,
      fin,
      descripcion: `el mes de ${meses[mes].toUpperCase()} ${año}`
    }
  }

  // 🗓️ Década
  const matchDecada = texto.match(/d[ée]cada\s+(del\s+)?(\d{2})/)
  if (matchDecada) {
    const dec = parseInt(matchDecada[2])
    const base = dec < 30 ? 2000 : 1900
    const y = base + dec
    return {
      tipo: 'decada',
      inicio: new Date(y, 0, 1),
      fin: new Date(y + 10, 0, 1),
      descripcion: `la década del ${dec}0`
    }
  }

  // 📉 Últimos N años
  const matchUltimos = texto.match(/\b[uú]ltimos?\s+(\d+)\s+a[nñ]os?/) 
  if (matchUltimos) {
    const n = parseInt(matchUltimos[1])
    const inicio = new Date(añoActual - n, 0, 1)
    const fin = new Date(añoActual + 1, 0, 1)
    return {
      tipo: 'rango',
      inicio,
      fin,
      descripcion: `los últimos ${n} años`
    }
  }

  return null
}
