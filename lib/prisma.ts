import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

// Using PrismaPg instead of PrismaNeonHttp to SUPPORT TRANSACTIONS in Vercel Serverless
function createPrismaClient() {
  const connectionString = process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL!
  const pool = new Pool({ 
    connectionString,
    max: 2, // Limite para evitar exaustão de conexões no ambiente serverless
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({
    adapter,
    log: ['error', 'warn'],
  })
}

export const prisma = globalForPrisma.prisma || createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
