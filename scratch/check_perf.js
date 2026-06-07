const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Checking performance...");
  const start = Date.now();
  const leadsCount = await prisma.lead.count();
  const messagesCount = await prisma.whatsAppMessage.count();
  console.log(`Leads count: ${leadsCount}`);
  console.log(`WhatsApp Messages count: ${messagesCount}`);
  
  const queryStart = Date.now();
  const leads = await prisma.lead.findMany({
    include: {
      stage: true,
      assignedTo: true,
      history: {
        orderBy: { createdAt: 'desc' }
      },
      activities: {
        where: { status: 'PENDENTE' },
        orderBy: { dataInicio: 'asc' },
        take: 1
      },
      shares: {
        include: { user: true }
      },
      contacts: true,
      whatsappMessages: {
        select: {
          id: true,
          direction: true,
          status: true,
          texto: true,
          createdAt: true
        }
      }
    },
    orderBy: { updatedAt: 'desc' }
  });
  const queryEnd = Date.now();
  console.log(`Query execution took: ${queryEnd - queryStart}ms`);
  console.log(`Returned leads: ${leads.length}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
