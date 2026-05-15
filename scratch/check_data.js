const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const p = await prisma.proposta.findMany({
    orderBy: { createdAt: 'desc' },
    take: 3,
    include: {
      versoes: {
        orderBy: { versao: 'desc' },
        take: 1,
        include: { items: true }
      }
    }
  });
  console.log(JSON.stringify(p, null, 2));
}
run();
