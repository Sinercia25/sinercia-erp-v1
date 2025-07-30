// 🔹 resumenStock.ts
// Devuelve resumen de stock consolidado por producto (empresa + depósitos)

import { db } from "../../db"

export async function obtenerResumenStock(empresaId: string) {
  try {
    const query = `
      WITH stock_total AS (
        SELECT 
          productoid,
          SUM(cantidad) AS stock_actual
        FROM stock_productos
        WHERE empresaid = $1
        GROUP BY productoid
      ),
      productos_activos AS (
        SELECT 
          p.id,
          p.nombre,
          p."stockMinimo",
          COALESCE(s.stock_actual, 0) AS stock_actual
        FROM productos p
        LEFT JOIN stock_total s ON p.id = s.productoid
        WHERE p."empresaId" = $1 AND p.activo = true
      )
      SELECT 
        COUNT(*) AS total_productos,
        COUNT(*) FILTER (WHERE stock_actual > 0) AS productos_con_stock,
        COUNT(*) FILTER (WHERE stock_actual = 0) AS productos_sin_stock,
        COUNT(*) FILTER (WHERE stock_actual < "stockMinimo") AS productos_bajo_minimo,
        JSON_AGG(
          CASE 
            WHEN stock_actual < "stockMinimo" THEN
              JSON_BUILD_OBJECT(
                'nombre', nombre,
                'stock', stock_actual,
                'minimo', "stockMinimo"
              )
            ELSE NULL
          END
        ) FILTER (WHERE stock_actual < "stockMinimo") AS detalle_critico
      FROM productos_activos;
    `

    const { rows } = await db.query(query, [empresaId])
    const datos = rows[0]

    return {
      total_productos: Number(datos.total_productos),
      productos_con_stock: Number(datos.productos_con_stock),
      productos_sin_stock: Number(datos.productos_sin_stock),
      productos_bajo_minimo: Number(datos.productos_bajo_minimo),
      top_criticos: datos.detalle_critico || []
    }
  } catch (error) {
    console.error('❌ Error en obtenerResumenStock:', error)
    console.error('EmpresaId:', empresaId)
    console.error('DWH_URL está configurado:', !!process.env.DWH_URL)
    
    // Devolver datos vacíos para evitar que la app se rompa
    return {
      total_productos: 0,
      productos_con_stock: 0,
      productos_sin_stock: 0,
      productos_bajo_minimo: 0,
      top_criticos: []
    }
  }
}
