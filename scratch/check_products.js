const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const produtos = await prisma.produto.findMany({
    where: { ativo: true }
  });
  console.log('--- PRODUTOS ATIVOS NO BANCO ---');
  console.log(JSON.stringify(produtos, null, 2));
  console.log('--------------------------------');
}

main().finally(() => {
  prisma.$disconnect();
  pool.end();
});
