import { PrismaClient } from '@prisma/client';

// Extend NodeJS global type to prevent memory leaks
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Connection pool configuration for production
const prismaClientSingleton = () => {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
    // Connection pool settings for production
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
};

// Prevent multiple instances of Prisma Client in development (memory leak prevention)
const prisma = globalThis.prisma ?? prismaClientSingleton();

// In development, store the instance to prevent hot-reload memory leaks
if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

// Graceful shutdown handlers to prevent connection leaks
const handleShutdown = async () => {
  console.log('[Prisma] Disconnecting...');
  await prisma.$disconnect();
  process.exit(0);
};

// Handle different termination signals
if (typeof process !== 'undefined') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect();
  });
  
  // Only add these handlers in production to avoid issues with hot reload
  if (process.env.NODE_ENV === 'production') {
    process.on('SIGINT', handleShutdown);
    process.on('SIGTERM', handleShutdown);
  }
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
