const { Client } = require('pg');

const warehouseConfig = {
  host: '207.154.218.252',
  port: 5432,
  database: 'erp_datawarehouse',
  user: 'erpuser',
  password: 'ERP2025!DataBase#Prod',
  ssl: false
};

async function expandirUsuarios120() {
  const warehouse = new Client(warehouseConfig);
  
  try {
    console.log('🔄 EXPANDIENDO A 120 EMPLEADOS REALISTAS...');
    
    await warehouse.connect();
    console.log('✅ Conectado a Data Warehouse');
    
    // Limpiar tabla usuarios actual
    await warehouse.query('TRUNCATE TABLE usuarios CASCADE');
    
    const usuarios = [];
    let usuarioId = 1;
    
    // GERENCIA (5 personas)
    const gerencia = [
      {nombre: 'Carlos', apellido: 'Mendoza', rol: 'Gerente General'},
      {nombre: 'María', apellido: 'González', rol: 'Gerente Administrativo'},
      {nombre: 'Roberto', apellido: 'Silva', rol: 'Gerente Financiero'},
      {nombre: 'Ana', apellido: 'Rodríguez', rol: 'Gerente Técnico'},
      {nombre: 'Luis', apellido: 'Fernández', rol: 'Gerente Comercial'}
    ];
    
    gerencia.forEach(emp => {
      usuarios.push({
        id: `usr_${usuarioId.toString().padStart(3, '0')}`,
        empresaId: 'laramada',
        email: `${emp.nombre.toLowerCase()}.${emp.apellido.toLowerCase()}@laramada.com.ar`,
        nombre: emp.nombre,
        apellido: emp.apellido,
        rol: emp.rol,
        activo: true,
        ultimoLogin: new Date('2025-07-03'),
        createdAt: new Date('2020-03-15')
      });
      usuarioId++;
    });
    
    // ADMINISTRACIÓN (25 personas)
    const administracion = [
      'Contador Senior', 'Contador Junior', 'Auxiliar Contable 1', 'Auxiliar Contable 2', 'Auxiliar Contable 3',
      'Tesorero', 'Cajero', 'Compras Senior', 'Compras Junior', 'Ventas 1',
      'Ventas 2', 'Vendedor Campo', 'Secretaria Gerencia', 'Secretaria Admin', 'RRHH',
      'Liquidador Sueldos', 'Facturación 1', 'Facturación 2', 'Archivo', 'Mensajería',
      'Recepción', 'Sistemas', 'Legales', 'Seguros', 'Auditoría'
    ];
    
    administracion.forEach((rol, index) => {
      const nombres = ['Patricia', 'Mónica', 'Claudia', 'Sandra', 'Gabriela', 'Pedro', 'Jorge', 'Ricardo', 'Sergio', 'Daniel'];
      const apellidos = ['García', 'López', 'Martínez', 'Rodríguez', 'Fernández', 'González', 'Pérez', 'Sánchez', 'Romero', 'Torres'];
      
      usuarios.push({
        id: `usr_${usuarioId.toString().padStart(3, '0')}`,
        empresaId: 'laramada',
        email: `admin${index + 1}@laramada.com.ar`,
        nombre: nombres[index % nombres.length],
        apellido: apellidos[index % apellidos.length],
        rol: rol,
        activo: true,
        ultimoLogin: new Date('2025-07-03'),
        createdAt: new Date('2020-06-01')
      });
      usuarioId++;
    });
    
    // PRODUCCIÓN (45 personas)
    const produccion = [
      'Ingeniero Agrónomo 1', 'Ingeniero Agrónomo 2', 'Ingeniero Agrónomo 3', 'Capataz Norte', 'Capataz Sur',
      'Capataz Este', 'Capataz Oeste', 'Capataz Central', 'Supervisor Cosecha', 'Supervisor Siembra'
    ];
    
    // Operarios y personal de campo (35 personas)
    for (let i = 1; i <= 35; i++) {
      const roles = ['Operario Tractor', 'Operario Cosechadora', 'Operario Pulverizador', 'Peón General', 'Tractorista'];
      produccion.push(`${roles[i % roles.length]} ${Math.ceil(i / 5)}`);
    }
    
    produccion.forEach((rol, index) => {
      const nombres = ['José', 'Juan', 'Miguel', 'Pedro', 'Carlos', 'Luis', 'Antonio', 'Francisco', 'Alejandro', 'Mario'];
      const apellidos = ['Herrera', 'Morales', 'Vega', 'Castro', 'Ramos', 'Flores', 'Jiménez', 'Díaz', 'Ruiz', 'Vargas'];
      
      usuarios.push({
        id: `usr_${usuarioId.toString().padStart(3, '0')}`,
        empresaId: 'laramada',
        email: `prod${index + 1}@laramada.com.ar`,
        nombre: nombres[index % nombres.length],
        apellido: apellidos[index % apellidos.length],
        rol: rol,
        activo: true,
        ultimoLogin: new Date('2025-07-02'),
        createdAt: new Date('2019-05-20')
      });
      usuarioId++;
    });
    
    // COMERCIAL (15 personas)
    const comercial = [
      'Director Comercial', 'Vendedor Senior 1', 'Vendedor Senior 2', 'Vendedor Junior 1', 'Vendedor Junior 2',
      'Representante Norte', 'Representante Sur', 'Atención Cliente 1', 'Atención Cliente 2', 'Marketing',
      'Logística 1', 'Logística 2', 'Expedición', 'Chofer 1', 'Chofer 2'
    ];
    
    comercial.forEach((rol, index) => {
      const nombres = ['Patricia', 'Mónica', 'Claudia', 'Sandra', 'Gabriela', 'Fernando', 'Rodrigo', 'Sebastián', 'Nicolás', 'Matías'];
      const apellidos = ['Campos', 'Medina', 'Aguirre', 'Molina', 'Ortega', 'Delgado', 'Moreno', 'Blanco', 'Guerrero', 'Mendez'];
      
      usuarios.push({
        id: `usr_${usuarioId.toString().padStart(3, '0')}`,
        empresaId: 'laramada',
        email: `com${index + 1}@laramada.com.ar`,
        nombre: nombres[index % nombres.length],
        apellido: apellidos[index % apellidos.length],
        rol: rol,
        activo: true,
        ultimoLogin: new Date('2025-07-01'),
        createdAt: new Date('2021-08-30')
      });
      usuarioId++;
    });
    
    // OPERACIONES (30 personas)
    const operaciones = [
      'Jefe Taller', 'Mecánico Senior 1', 'Mecánico Senior 2', 'Mecánico Junior 1', 'Mecánico Junior 2',
      'Soldador', 'Electricista', 'Pintor', 'Encargado Depósito', 'Auxiliar Depósito 1',
      'Auxiliar Depósito 2', 'Playero 1', 'Playero 2', 'Sereno Noche 1', 'Sereno Noche 2',
      'Sereno Día 1', 'Sereno Día 2', 'Mantenimiento 1', 'Mantenimiento 2', 'Limpieza 1',
      'Limpieza 2', 'Jardinería', 'Portería', 'Control Acceso', 'Seguridad 1',
      'Seguridad 2', 'Bombero', 'Enfermero', 'Cocinero', 'Auxiliar Cocina'
    ];
    
    operaciones.forEach((rol, index) => {
      const nombres = ['Ricardo', 'Osvaldo', 'Rubén', 'Ramón', 'Roberto', 'Raúl', 'Rolando', 'Rafael', 'Rodrigo', 'Román'];
      const apellidos = ['Silva', 'Cruz', 'Reyes', 'Domínguez', 'Vázquez', 'Herrero', 'Cabrera', 'Cano', 'Prieto', 'Pastor'];
      
      usuarios.push({
        id: `usr_${usuarioId.toString().padStart(3, '0')}`,
        empresaId: 'laramada',
        email: `op${index + 1}@laramada.com.ar`,
        nombre: nombres[index % nombres.length],
        apellido: apellidos[index % apellidos.length],
        rol: rol,
        activo: true,
        ultimoLogin: new Date('2025-07-02'),
        createdAt: new Date('2019-09-18')
      });
      usuarioId++;
    });
    
    // Insertar todos los usuarios
    for (const usuario of usuarios) {
      const columnas = Object.keys(usuario);
      const valores = Object.values(usuario);
      const placeholders = valores.map((_, i) => `$${i + 1}`).join(', ');
      
      await warehouse.query(
        `INSERT INTO usuarios (${columnas.join(', ')}) VALUES (${placeholders})`,
        valores
      );
    }
    
    console.log('\n🎉 EXPANSIÓN A 120 EMPLEADOS COMPLETADA:');
    console.log(`👥 Total empleados: ${usuarios.length}`);
    console.log(`🏢 Gerencia: 5 personas`);
    console.log(`📊 Administración: 25 personas`);
    console.log(`🚜 Producción: 45 personas`);
    console.log(`💼 Comercial: 15 personas`);
    console.log(`⚙️ Operaciones: 30 personas`);
    
    console.log('\n💎 EMPRESA REALISTA COMPLETADA');
    console.log('🏗️ 708 hectáreas con 120 empleados = Estructura real');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await warehouse.end();
  }
}

expandirUsuarios120();
