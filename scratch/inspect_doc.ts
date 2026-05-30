import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const doc = await prisma.documentoProposta.findUnique({
    where: { id: 'cmpsloy27000004jlxvb5n9xo' },
    include: {
      templateOrigem: true,
      secoes: true
    }
  });

  console.log('Document ID:', doc?.id);
  console.log('Document Tipo:', doc?.tipo);
  console.log('Document TemplateOrigem Name:', doc?.templateOrigem?.nome);
  console.log('configApresentacao:', JSON.stringify(doc?.configApresentacao, null, 2));
  console.log('Number of Secoes:', doc?.secoes.length);
  if (doc?.secoes && doc.secoes.length > 0) {
    console.log('First secao text sample:', doc.secoes[0].texto.substring(0, 200));
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
