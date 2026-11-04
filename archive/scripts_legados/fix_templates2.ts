import { prisma } from './lib/prisma';

async function main() {
  const nome = 'Template de Apresentação (Slides)';
  
  let template = await prisma.templatePropostaComercial.findUnique({
    where: { nome }
  });

  if (!template) {
    template = await prisma.templatePropostaComercial.create({
      data: {
        nome,
        tipo: 'SLIDE_DECK',
      }
    });
    console.log('Template de Apresentação criado:', template.id);
  } else {
    await prisma.templatePropostaComercial.update({
      where: { id: template.id },
      data: { tipo: 'SLIDE_DECK' }
    });
    console.log('Template de Apresentação atualizado:', template.id);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
