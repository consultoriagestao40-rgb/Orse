const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- BUSCANDO TENANTS ---');
  const tenants = await prisma.tenant.findMany({
    select: { id: true, nomeFantasia: true, cnpj: true }
  });
  console.log(JSON.stringify(tenants, null, 2));

  console.log('\n--- BUSCANDO USUÁRIOS ---');
  const users = await prisma.user.findMany({
    select: { id: true, nome: true, email: true, tenantId: true, role: true }
  });
  console.log(JSON.stringify(users, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
