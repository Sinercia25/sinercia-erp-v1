const { Client } = require('pg');

const supabaseConfig = {
  connectionString: 'postgresql://postgres.uypkyjjjeochnsuhrhjp:Password12345contra12345@aws-0-us-east-2.pooler.supabase.com:6543/postgres?sslmode=require',
  ssl: { rejectUnauthorized: false }
};

async function listarTablasSupabase() {
  const client = new Client(supabaseConfig);
  
  try {
    await client.connect();
    console.log('✅ Conectado a Supabase');
    
    const resultado = await client.query(`
      SELECT table_name, 
             (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as columnas
      FROM information_schema.tables t
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    console.log('\n📊 TODAS LAS TABLAS EN SUPABASE:');
    console.log('=' .repeat(50));
    
    resultado.rows.forEach(tabla => {
      console.log(`📋 ${tabla.table_name.padEnd(25)} | ${tabla.columnas} columnas`);
    });
    
    console.log(`\n📈 TOTAL TABLAS: ${resultado.rows.length}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

listarTablasSupabase();
