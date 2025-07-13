// lib/prisma.ts
import { PrismaClient } from '@prisma/client'

declare global {
  // Para que TypeScript sepa que existe global.prisma
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

// Si ya hay uno (hot-reload), reutilízalo.
// En producción, se creará una sola vez.
export const prisma =
  global.prisma ||
  new PrismaClient({
    log: ['query'], // opcional: ver las queries en consola en dev
  })

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma
}
