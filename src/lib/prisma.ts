import { PrismaClient } from '@prisma/client';

// add prisma to the NodeJS global type
declare global {
  var prisma: PrismaClient | undefined
}

// Prevent multiple instances of Prisma Client in development
export const prisma = global.prisma ?? new PrismaClient({
  log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export default prisma;
