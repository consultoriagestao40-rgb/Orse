import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Ultimas 10 Mensagens do WhatsApp no Banco ---');
  const messages = await prisma.whatsAppMessage.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: {
      lead: { select: { nomeFantasia: true, telefone: true } }
    }
  });

  for (const msg of messages) {
    console.log(`ID: ${msg.id}`);
    console.log(`Lead: ${msg.lead?.nomeFantasia} (${msg.lead?.telefone})`);
    console.log(`Direction: ${msg.direction}`);
    console.log(`Status: ${msg.status}`);
    console.log(`Created: ${msg.createdAt}`);
    console.log(`Texto: ${msg.texto.substring(0, 100)}${msg.texto.length > 100 ? '...' : ''}`);
    console.log('--------------------------------------------------');
  }
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
