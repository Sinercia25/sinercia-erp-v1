// TEMPORAL: Endpoint de debug para diagnosticar problema de stock
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const results: any = {
    timestamp: new Date().toISOString(),
    env: {
      DWH_URL: process.env.DWH_URL ? '✅ Configurado' : '❌ No configurado',
      DATABASE_URL: process.env.DATABASE_URL ? '✅ Configurado' : '❌ No configurado',
      NODE_ENV: process.env.NODE_ENV
    },
    tests: {}
  }

  // Test 1: Conexión al DWH
  try {
    const testConn = await db.query('SELECT 1 as test')
    results.tests.dwh_connection = '✅ OK'
    results.tests.dwh_response = testConn.rows[0]
  } catch (error: any) {
    results.tests.dwh_connection = '❌ Error'
    results.tests.dwh_error = error.message
  }

  // Test 2: Verificar tablas
  try {
    const tables = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('stock_productos', 'productos')
      ORDER BY table_name
    `)
    results.tests.tables = tables.rows.map((r: any) => r.table_name)
  } catch (error: any) {
    results.tests.tables_error = error.message
  }

  // Test 3: Contar productos para emp_002
  try {
    const count = await db.query(`
      SELECT COUNT(*) as total 
      FROM productos 
      WHERE "empresaId" = $1
    `, ['emp_002'])
    results.tests.productos_emp_002 = count.rows[0].total
  } catch (error: any) {
    results.tests.productos_error = error.message
  }

  // Test 4: Query simplificada de stock
  try {
    const stock = await db.query(`
      SELECT COUNT(*) as total
      FROM productos p
      WHERE p."empresaId" = $1 AND p.activo = true
    `, ['emp_002'])
    results.tests.productos_activos = stock.rows[0].total
  } catch (error: any) {
    results.tests.stock_query_error = error.message
  }

  return NextResponse.json(results, { 
    status: 200,
    headers: {
      'Cache-Control': 'no-store'
    }
  })
}