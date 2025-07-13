// 🚀 SISTEMA DE SINCRONIZACIÓN PROFESIONAL v2.0
const MultiScheduler = require('./managers/MultiScheduler');
const config = require('./config/sync-config');

async function iniciarSistema() {
  console.log('🚀 Iniciando SinercIA Sync System v2.0');
  console.log('📊 Sistema de sincronización empresarial');
  console.log('=' .repeat(50));
  
  try {
    const scheduler = new MultiScheduler(config);
    await scheduler.iniciar();
    
    // Manejo de señales de cierre
    process.on('SIGINT', async () => {
      console.log('\n🛑 Recibida señal de cierre...');
      await scheduler.detener();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Error iniciando sistema:', error.message);
    process.exit(1);
  }
}

iniciarSistema();