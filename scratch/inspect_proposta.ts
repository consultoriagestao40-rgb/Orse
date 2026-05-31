import { prisma } from './lib/prisma';

async function main() {
  const id = 'cmpk3f8hm000004l2uhsyl153';
  const doc = await prisma.documentoProposta.findUnique({
    where: { id },
  });
  console.log('DOCUMENT DETAILS FOR ID:', id);
  console.log('====================================');
  console.log('Tipo:', doc?.tipo);
  console.log('Status:', doc?.status);
  console.log('ConfigApresentacao:', JSON.stringify(doc?.configApresentacao, null, 2));
}

main().catch(console.error);
