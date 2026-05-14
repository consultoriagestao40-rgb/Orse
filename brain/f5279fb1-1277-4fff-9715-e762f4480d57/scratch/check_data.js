const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.cCT.count();
  console.log('Total CCTs:', count);
  const ccts = await prisma.cCT.findMany({ take: 5 });
  console.log('Sample CCTs:', JSON.stringify(ccts, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
