import { prisma } from './lib/prisma';

async function main() {
  console.log("Inserindo templates...");

  // Update existing "Proposta Simples" if it doesn't have tags
  const existingSimples = await prisma.templatePropostaComercial.findFirst({
    where: { nome: { contains: 'Simples' } },
    include: { secoes: true }
  });

  if (existingSimples) {
    for (const secao of existingSimples.secoes) {
      if (secao.titulo.includes('VALOR') && !secao.texto.includes('[TABELA]')) {
        await prisma.secaoDocumentoProposta.updateMany({
           where: { titulo: secao.titulo, texto: secao.texto },
           data: { texto: secao.texto + '\n\n[TABELA]\n\n[TERMO_ACEITE]' }
        }).catch(() => {});
        await prisma.secaoTemplateProposta.update({
          where: { id: secao.id },
          data: { texto: secao.texto + '\n\n[TABELA]\n\n[TERMO_ACEITE]' }
        });
      }
      if (secao.titulo.includes('ESCOPO') && !secao.texto.includes('[ITENS]')) {
        await prisma.secaoDocumentoProposta.updateMany({
           where: { titulo: secao.titulo, texto: secao.texto },
           data: { texto: secao.texto + '\n\n[ITENS]' }
        }).catch(() => {});
        await prisma.secaoTemplateProposta.update({
          where: { id: secao.id },
          data: { texto: secao.texto + '\n\n[ITENS]' }
        });
      }
    }
    console.log("Template Simples atualizado com as tags.");
  } else {
    await prisma.templatePropostaComercial.create({
      data: {
        nome: 'Proposta Simples (Terceirização)',
        secoes: {
          create: [
            { ordem: 1, titulo: '1. APRESENTAÇÃO', texto: 'Apresentamos nossa proposta para prestação de serviços terceirizados...' },
            { ordem: 2, titulo: '2. ESCOPO DO SERVIÇO', texto: 'Fornecimento de mão de obra capacitada...\n\n[ITENS]' },
            { ordem: 3, titulo: '3. VALOR DO INVESTIMENTO', texto: 'O investimento mensal será de [VALOR_TOTAL].\n\n[TABELA]\n\n[TERMO_ACEITE]' }
          ]
        }
      }
    });
    console.log("Template Simples criado.");
  }

  // Create Apresentação if it doesn't exist
  const existingApres = await prisma.templatePropostaComercial.findFirst({
    where: { nome: { contains: 'Apresentação' } }
  });

  if (!existingApres) {
    await prisma.templatePropostaComercial.create({
      data: {
        nome: 'Apresentação (Slide Deck)',
        secoes: {
          create: [
            { ordem: 1, titulo: 'Instruções', texto: 'Este template renderiza os slides em tela cheia. O texto aqui é ignorado.' }
          ]
        }
      }
    });
    console.log("Template de Apresentação criado!");
  } else {
    console.log("Template de Apresentação já existia.");
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
