import { prisma } from './lib/prisma';

async function main() {
  const defaultSecoes = [
    { titulo: 'DO OBJETO E ESCOPO', texto: '[OBJETO_PROPOSTA]\n\n[ESCOPO_TECNICO]', ordem: 1 },
    { titulo: 'DAS CONDIÇÕES COMERCIAIS', texto: '[CONDICOES_COMERCIAIS]', ordem: 2 },
    { titulo: 'RESUMO COMERCIAL DA PROPOSTA', texto: 'Valores referentes aos serviços prestados, equipe alocada e insumos, conforme detalhamento a seguir:\n\n[TABELA]', ordem: 3 },
    { titulo: 'ITENS INCLUSOS E EXCLUSOS', texto: '[ITENS]', ordem: 4 },
    { titulo: 'TERMO DE ACEITE', texto: '[TERMO_ACEITE]', ordem: 5 },
  ];

  // 1. Atualiza todos os templates para ter a estrutura padrão
  const templates = await prisma.templatePropostaComercial.findMany();
  for (const t of templates) {
    if (!t.nome.toLowerCase().includes('apresenta')) {
      await prisma.secaoTemplateProposta.deleteMany({ where: { templateId: t.id } });
      for (const s of defaultSecoes) {
        await prisma.secaoTemplateProposta.create({
          data: { ...s, templateId: t.id }
        });
      }
      console.log(`Template ${t.nome} atualizado.`);
    }
  }

  // 2. Atualiza todos os documentos de proposta criados para remover a carta de apresentação e colocar o padrão
  const docs = await prisma.documentoProposta.findMany();
  for (const d of docs) {
    await prisma.secaoDocumentoProposta.deleteMany({ where: { documentoId: d.id } });
    for (const s of defaultSecoes) {
      await prisma.secaoDocumentoProposta.create({
        data: { ...s, documentoId: d.id }
      });
    }
    console.log(`Documento ${d.id} atualizado.`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
