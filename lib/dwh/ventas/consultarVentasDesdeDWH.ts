// 📁 lib/consultas/ventas/consultarVentasDesdeDWH.ts

import { Pool } from 'pg';
import { PeriodoDetectado } from '@/lib/periodos/interpretarTiempoExtendido';

// 🧠 Conexión al Data Warehouse (DWH)
const dwhPool = new Pool({
  connectionString: process.env.DWH_URL,
  ssl: { rejectUnauthorized: false }
});

/**
 * 🧾 consultarVentasDesdeDWH
 * Consulta el total de ventas emitidas para una empresa en un período.
 * Solo accede a la base. No usa cache, ni IA, ni formato de respuesta.
 */
export async function consultarVentasDesdeDWH(
  empresaId: string,
  periodo: PeriodoDetectado
): Promise<number> {
  const sql = `
    SELECT SUM(total::numeric) AS total_ventas
    FROM facturas
    WHERE empresa_id = $1
      AND estado = 'emitida'
      AND fecha_emision >= $2
      AND fecha_emision < $3
  `;

  const valores = [
    empresaId,
    periodo.inicio.toISOString(),
    periodo.fin.toISOString()
  ];

  try {
    const { rows } = await dwhPool.query(sql, valores);
    return rows[0]?.total_ventas ? parseFloat(rows[0].total_ventas) : 0;
  } catch (error) {
    console.error('❌ Error al consultar ventas desde DWH:', error);
    return 0;
  }
}
