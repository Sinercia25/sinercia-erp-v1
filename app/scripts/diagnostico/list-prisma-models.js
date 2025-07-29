// list-prisma-models.js
const { PrismaClient } = require('@prisma/client');
const client = new PrismaClient();

(async () => {
  try {
    // Obtenemos las propiedades directas del cliente
    const keys = Object.keys(client);
    // Filtramos las que tienen un método findMany (delegados de modelo)
    const models = keys.filter(k =>
      client[k] &&
      typeof client[k].findMany === 'function'
    );
    console.log('Modelos disponibles en Prisma:', models);
  } catch (e) {
    console.error('Error listando modelos:', e);
  } finally {
    await client.$disconnect();
  }
})();
