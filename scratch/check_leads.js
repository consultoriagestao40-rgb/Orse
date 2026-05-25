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
    include: {
      contacts: true
    }
  });
  console.log("Leads in database:");
  console.log(JSON.stringify(leads.map(l => ({ id: l.id, nome: l.nomeFantasia, telefone: l.telefone, stageId: l.stageId })), null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
