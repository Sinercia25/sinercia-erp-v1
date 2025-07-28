// /lib/prompts/finanzas.ts
import { queryDWH } from '@/lib/utils/dwh'

export async function consultarFinanzas(empresa_id: string, periodo: { desde: string, hasta: string }) {
  const sql = `
    SELECT
      SUM(CASE WHEN tipo = 'ingreso' THEN monto ELSE 0 END) AS total_ingresos,
      SUM(CASE WHEN tipo = 'egreso' THEN monto ELSE 0 END) AS total_egresos,
      SUM(CASE WHEN origen ILIKE '%caja%' THEN monto ELSE 0 END) AS total_caja
    FROM vista_finanzas_por_mes
    WHERE empresa_id = $1 AND fecha BETWEEN $2 AND $3
  `;

  const values = [empresa_id, periodo.desde, periodo.hasta];
  const result = await queryDWH(sql, values);

  const ingresos = Number(result[0]?.total_ingresos || 0);
  const egresos = Number(result[0]?.total_egresos || 0);
  const caja = Number(result[0]?.total_caja || 0);
  const balance = ingresos - egresos;

  return `Ingresos: $${ingresos.toLocaleString()} – Egresos: $${egresos.toLocaleString()} → Balance: $${balance.toLocaleString()}. Caja disponible: $${caja.toLocaleString()}`;
}
