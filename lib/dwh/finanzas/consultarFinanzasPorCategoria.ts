// 🔹 lib/consultas/finanzas/consultarFinanzasPorCategoria.ts
// Devuelve los ingresos o egresos totales agrupados por categoría para una empresa y período

import { Pool } from 'pg';
import { PeriodoDetectado } from '@/lib/periodos/interpretarTiempoExtendido';

// 🌐 Conexión al DWH
const dwhPool = new Pool({
  connectionString: process.env.DWH_URL,
  ssl: { rejectUnauthorized: false }
});

export interface ResultadoCategoria {
  categoria: string;
  total: number;
}

/**
 * 💰 consultarFinanzasPorCategoria
 * Consulta los egresos o ingresos por categoría desde la vista 'vista_finanzas_categoria_mes'
 * @param empresaId ID de la empresa (ej. 'emp_002')
 * @param tipo 'ingreso' o 'egreso'
 * @param periodo Período detectado con inicio y fin
 * @returns Lista de categorías con total por cada una, ordenadas de mayor a menor
 */
export async function consultarFinanzasPorCategoria(
  empresaId: string,
  tipo: 'ingreso' | 'egreso',
  periodo: PeriodoDetectado
): Promise<ResultadoCategoria[]> {
  const sql = `
    SELECT categoria, SUM(importe) AS total
    FROM vista_finanzas_categoria_mes
    WHERE empresa_id = $1
      AND tipo = $2
      AND fecha >= $3 AND fecha < $4
    GROUP BY categoria
    ORDER BY total DESC
  `;

  const valores = [
    empresaId,
    tipo,
    periodo.inicio.toISOString(),
    periodo.fin.toISOString()
  ];

  try {
    const { rows } = await dwhPool.query(sql, valores);
    return rows.map((r) => ({
      categoria: r.categoria,
      total: parseFloat(r.total)
    }));
  } catch (error) {
    console.error('❌ Error al consultar finanzas por categoría:', error);
    return [];
  }
}
