import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

// Using PrismaPg instead of PrismaNeonHttp to SUPPORT TRANSACTIONS in Vercel Serverless
function createPrismaClient() {
  const connectionString = process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL!
  const pool = new Pool({ 
    connectionString,
    max: 10, // Aumentado para permitir queries paralelas sem filas e evitar lentidão
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({
    adapter,
    log: ['error', 'warn'],
  })
}

declare global {
  // eslint-disable-next-line no-var
  var prismaInstance: PrismaClient | undefined
}

export const prisma = globalThis.prismaInstance || createPrismaClient()

globalThis.prismaInstance = prisma
