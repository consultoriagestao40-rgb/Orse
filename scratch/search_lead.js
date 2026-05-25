require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const leads = await prisma.lead.findMany({
    where: {
      OR: [
        { nomeFantasia: { contains: 'cristiano', mode: 'insensitive' } },
        { telefone: { contains: '41984042835' } }
      ]
    }
  });
  console.log("Matching Leads:");
  console.log(JSON.stringify(leads, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
