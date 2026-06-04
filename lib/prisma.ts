import { PrismaClient } from '@prisma/client'
import { Pool, neonConfig } from '@neondatabase/serverless'
import { PrismaPg } from '@prisma/adapter-pg'
import ws from 'ws'

neonConfig.webSocketConstructor = ws

const globalForPrisma = global as unknown as { prisma: PrismaClient }

// Using pg Adapter with Neon serverless WebSocket pool for transactions and serverless performance
function createPrismaClient() {
  const connectionString = process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL!
  const pool = new Pool({ 
    connectionString,
    max: 1, // Minimize connection limit per serverless function to prevent exhaustion
  })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({
    adapter,
    log: ['error', 'warn'],
  })
}

export const prisma = globalForPrisma.prisma || createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
