import { queryDWH } from "@/lib/utils/dwh"
import { formatearMonto } from "@/lib/utils/formato"

export async function consultarFinanzasPorCategoria(
  empresa_id: string,
  periodo: { inicio: Date; fin: Date }
): Promise<string> {
  const sql = `
    SELECT categoria, tipo, SUM(total) AS monto
    FROM vista_finanzas_categoria_mes
    WHERE empresa_id = $1
      AND mes >= $2 AND mes < $3
    GROUP BY categoria, tipo
    ORDER BY tipo, monto DESC
  `;

  const values = [empresa_id, periodo.inicio, periodo.fin];
  const rows = await queryDWH(sql, values);

  if (!rows.length) return "No se encontraron movimientos por categoría en ese período.";

  const ingresos: string[] = [];
  const egresos: string[] = [];

  for (const row of rows) {
    const linea = `${row.categoria}: ${formatearMonto(Number(row.monto))}`;
    if (row.tipo === 'egreso') egresos.push(linea);
    else ingresos.push(linea);
  }

  return [
    ingresos.length ? `🟢 Ingresos por categoría:\n${ingresos.join("\n")}` : '',
    egresos.length ? `🔴 Egresos por categoría:\n${egresos.join("\n")}` : ''
  ].filter(Boolean).join("\n\n");
}
