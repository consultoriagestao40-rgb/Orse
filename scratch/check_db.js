const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const p = await prisma.proposta.findFirst({
    where: { numero: 10 },
    include: {
      versoes: true
    }
  });
  if (p) {
    console.log("Proposta:", p.id, p.numero);
    p.versoes.forEach(v => {
      console.log(`Versao ${v.versao}: id=${v.id}, precoVenda=${v.precoVenda}, dataCriacao=${v.dataCriacao}`);
    });
  } else {
    console.log("Proposta 10 nao encontrada");
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
