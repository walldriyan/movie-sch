import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

// Extend NodeJS global type to prevent memory leaks
declare global {
  // eslint-disable-next-line no-var
  var prisma: ReturnType<typeof createPrismaClient> | undefined;
}

// Create Prisma client with Accelerate extension (edge-compatible, no query engine)
const createPrismaClient = () => {
  return new PrismaClient().$extends(withAccelerate());
};

// Prevent multiple instances of Prisma Client in development (memory leak prevention)
const prisma = globalThis.prisma ?? createPrismaClient();

// In development, store the instance to prevent hot-reload memory leaks
if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

// Utility function to serialize Prisma objects (removes Date and Decimal issues)
export function serializePrismaObject<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (obj instanceof Date) {
    return obj.toISOString() as unknown as T;
  }

  if (typeof obj === 'object' && obj !== null) {
    // Handle Decimal type
    if ('toNumber' in obj && typeof (obj as any).toNumber === 'function') {
      return (obj as any).toNumber() as T;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => serializePrismaObject(item)) as unknown as T;
    }

    const serialized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      serialized[key] = serializePrismaObject(value);
    }
    return serialized as T;
  }

  return obj;
}

// Health check function for monitoring
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('[Prisma] Database health check failed:', error);
    return false;
  }
}

export default prisma;
export { prisma };
