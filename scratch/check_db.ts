import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const p = await prisma.proposta.findFirst({
    where: { numero: 10 },
    include: {
      versoes: {
        orderBy: { versao: 'desc' }
      }
    }
  });

  if (p) {
    console.log(`Proposta ID: ${p.id}, Numero: ${p.numero}`);
    p.versoes.forEach(v => {
      console.log(`  Versao ${v.versao}: id=${v.id}, precoVenda=${v.precoVenda}, dataCriacao=${v.dataCriacao}`);
    });
  } else {
    console.log('Proposta 10 nao encontrada!');
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
