import { db } from '@/lib/db'
import { PeriodoDetectado } from '@/lib/periodos/interpretarTiempoExtendido'

type ResumenVentas = {
  total: number
  ticketPromedio: number
  mejorDia: string
  sucursalDestacada: string
  canalPrincipal: string
  comparativoAnterior?: {
    total: number
    variacionPorcentual: number
  }
}

export async function obtenerResumenVentas(
  empresaId: string,
  periodo: PeriodoDetectado
): Promise<ResumenVentas> {
  const { inicio, fin } = periodo

  if (!inicio || !fin) {
    console.error("❌ Error: el período recibido no tiene fechas válidas:", { inicio, fin })
    return {
      total: 0,
      ticketPromedio: 0,
      mejorDia: 'Sin datos',
      sucursalDestacada: 'Sin datos',
      canalPrincipal: 'Sin datos'
    }
  }

  // 1️⃣ Ventas totales y ticket promedio
  const ventasQuery = `
    SELECT
      SUM(total::numeric) AS total,
      AVG(total::numeric) AS ticket_promedio
    FROM facturas
    WHERE empresa_id = $1
      AND estado = 'emitida'
      AND fecha_emision >= $2
      AND fecha_emision < $3
  `

  const ventasResult = await db.query(ventasQuery, [empresaId, inicio, fin])
  const total = Number(ventasResult.rows[0]?.total || 0)
  const ticketPromedio = Number(ventasResult.rows[0]?.ticket_promedio || 0)

  // 2️⃣ Día con mayor facturación
  const mejorDiaQuery = `
    SELECT
      TO_CHAR(fecha_emision, 'FMDay DD') AS dia,
      SUM(total::numeric) AS total_dia
    FROM facturas
    WHERE empresa_id = $1
      AND estado = 'emitida'
      AND fecha_emision >= $2
      AND fecha_emision < $3
    GROUP BY dia
    ORDER BY total_dia DESC
    LIMIT 1
  `
  const mejorDiaResult = await db.query(mejorDiaQuery, [empresaId, inicio, fin])
  const mejorDia = mejorDiaResult.rows[0]?.dia?.trim() || 'Sin datos'

  
  // 4️⃣ Comparativo con el período anterior
  const msPeriodo = new Date(fin).getTime() - new Date(inicio).getTime()
  const periodoAnteriorDesde = new Date(new Date(inicio).getTime() - msPeriodo)
  const periodoAnteriorHasta = new Date(inicio)

  const comparativoQuery = `
    SELECT SUM(total::numeric) AS total
    FROM facturas
    WHERE empresa_id = $1
      AND estado = 'emitida'
      AND fecha_emision >= $2
      AND fecha_emision < $3
  `
  const comparativoResult = await db.query(comparativoQuery, [
    empresaId,
    periodoAnteriorDesde,
    periodoAnteriorHasta
  ])
  const totalAnterior = Number(comparativoResult.rows[0]?.total || 0)
  const variacion = totalAnterior === 0 ? 0 : ((total - totalAnterior) / totalAnterior) * 100
const periodoDescripcion = periodo.descripcion || 'el período seleccionado'

  
  return {
  total,
  ticketPromedio,
  mejorDia,
  sucursalDestacada: 'Sin datos',
  canalPrincipal: 'Sin datos',
  periodo: periodoDescripcion,
  comparativoAnterior: {
    total: totalAnterior,
    variacionPorcentual: Number(variacion.toFixed(2))
  }
}

}
