// sync-minutely.js

// ⚠️ 1) Carga tu .env para que process.env.DATABASE_URL incluya pgbouncer=true…
require('dotenv').config();
// ⚠️ 2) …y fuerza que Prisma no use prepared statements
process.env.PRISMA_DISABLE_PREPARED_STATEMENTS = '1';


const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');

// Conexión a Supabase (origen)
const supabase = new PrismaClient();

// Conexión a Data Warehouse (destino)
const warehouse = new Pool({
  host: '207.154.218.252',
  port: 5432,
  database: 'erp_datawarehouse',
  user: 'erpuser',
  password: 'ERP2025!DataBase#Prod',
  ssl: false
});

// Modelos Prisma → tablas DWH para sincronizar cada minuto
const MINUTELY_MODELS = [
  { model: 'transaccion',         table: 'transacciones'          },
  { model: 'liquidacionIngenio',  table: 'liquidaciones_ingenio'  },
  { model: 'entregaIngenio',      table: 'entregas_ingenio'       },
  { model: 'cheque',              table: 'cheques'                },
  { model: 'cosecha',             table: 'cosechas'               }
];


// Nombre de este grupo, usado en sync_meta
const GRUPO = 'minutely';

(async () => {
  try {
    // 1) Leer última ejecución
    const metaRes = await warehouse.query(
      'SELECT last_run FROM sync_meta WHERE grupo = $1',
      [GRUPO]
    );
    const lastRun = metaRes.rows[0]?.last_run || new Date(0);
    console.log(`🔄 [${GRUPO}] desde: ${lastRun.toISOString()}`);

    // 2) Por cada modelo, traer filas nuevas según createdAt
    for (const { model, table } of MINUTELY_MODELS) {
      console.log(`➡ Sincronizando ${table}...`);

      const nuevos = await supabase[model].findMany({
        where: { createdAt: { gt: lastRun } }
      });
      console.log(`   ${nuevos.length} registros nuevos`);

      // 3) Upsert en DWH
      for (const row of nuevos) {
        const keys = Object.keys(row);
        const vals = keys.map(k => row[k]);

        // Columnas en minúscula para DWH
        const colsSql = keys.map(k => `"${k.toLowerCase()}"`).join(', ');
        const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
        const updates = keys
          .map(k => `"${k.toLowerCase()}" = EXCLUDED."${k.toLowerCase()}"`)
          .join(', ');

        const sql = `
          INSERT INTO ${table} (${colsSql})
          VALUES (${placeholders})
          ON CONFLICT (id)
          DO UPDATE SET ${updates};
        `;

        await warehouse.query(sql, vals);
      }
    }

    // 4) Actualizar sync_meta con la hora actual
    await warehouse.query(
      `INSERT INTO sync_meta(grupo, last_run)
         VALUES($1, NOW())
       ON CONFLICT (grupo) DO UPDATE SET last_run = NOW()`,
      [GRUPO]
    );
    console.log(`✅ [${GRUPO}] completado a ${new Date().toISOString()}`);
  } catch (err) {
    console.error(`❌ Error en [${GRUPO}]:`, err.message);
  } finally {
    await supabase.$disconnect();
    await warehouse.end();
  }
})();
