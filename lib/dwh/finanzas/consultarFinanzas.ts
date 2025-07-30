// 📁 lib/consultas/finanzas/consultarFinanzas.ts

import { Pool } from 'pg';
import { PeriodoDetectado } from '@/lib/periodos/interpretarTiempoExtendido';

const dwhPool = new Pool({
  connectionString: process.env.DWH_URL,
  ssl: { rejectUnauthorized: false }
});

/**
 * 💰 consultarFinanzas
 * Devuelve el total de ingresos y egresos en un período para una empresa.
 * Usa la vista `vista_finanzas_por_mes` del DWH.
 */
export async function consultarFinanzas(
  empresaId: string,
  periodo: PeriodoDetectado
): Promise<string> {
  const sql = `
    SELECT tipo, SUM(importe) AS total
    FROM vista_finanzas_por_mes
    WHERE empresa_id = $1
      AND fecha >= $2 AND fecha < $3
    GROUP BY tipo
  `;

  const valores = [
    empresaId,
    periodo.inicio.toISOString(),
    periodo.fin.toISOString()
  ];

  try {
    const { rows } = await dwhPool.query(sql, valores);
    let ingresos = 0;
    let egresos = 0;

    for (const row of rows) {
      if (row.tipo === 'ingreso') ingresos = parseFloat(row.total);
      if (row.tipo === 'egreso') egresos = parseFloat(row.total);
    }

    return `En ${periodo.descripcion}:
• Ingresos: $${ingresos.toLocaleString()}
• Egresos: $${egresos.toLocaleString()}`;
  } catch (error) {
    console.error('❌ Error al consultar finanzas:', error);
    return '';
  }
}
