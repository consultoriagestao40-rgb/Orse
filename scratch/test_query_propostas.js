const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const loggedUserId = "cmp7dgjff000004kyhxfxar8h"; // Cristiano Silva
  const tenantId = "cmpplrmri000004jsw45vjg7p";

  const user = await prisma.user.findUnique({
    where: { id: loggedUserId }
  });
  console.log("Logged user:", user);

  let whereClause = {};
  if (user.tenantId) {
    whereClause.tenantId = user.tenantId;
  }

  console.log("Querying with whereClause:", whereClause);

  const propostas = await prisma.proposta.findMany({
    where: whereClause,
    include: {
      client: true,
      user: true,
      versoes: {
        include: { items: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  console.log("Total propostas returned:", propostas.length);
  for (const p of propostas) {
    const sortedVersoes = [...p.versoes].sort((a, b) => b.versao - a.versao);
    const lastVersao = sortedVersoes[0];
    const meta = lastVersao?.metadados || {};
    const clienteNome = p.client?.nomeFantasia || meta.clienteNome || 'Cliente não identificado';
    console.log(`- ID: ${p.id}, Numero: ${p.numero}, Cliente: ${clienteNome}, Valor: ${lastVersao?.precoVenda || 0}`);
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
