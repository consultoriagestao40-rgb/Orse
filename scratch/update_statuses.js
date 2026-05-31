const { PrismaClient } = require('@prisma/client');
const pg = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const connectionString = process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL;
if (!connectionString) {
  console.error("No DATABASE_URL found.");
  process.exit(1);
}
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function run() {
  try {
    // 1. Update proposta status in the database
    const res1 = await prisma.propostaStatus.updateMany({
      where: {
        color: {
          contains: 'bg-emerald-100'
        }
      },
      data: {
        color: 'bg-green-100 text-green-800 border border-green-200'
      }
    });
    console.log('PropostaStatus colors updated:', res1);
  } catch (err) {
    console.error('Error executing query:', err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

run();
