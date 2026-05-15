import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

const prisma = new PrismaClient().$extends(withAccelerate());

async function main() {
  console.log('--- RESTAURAÇÃO DE DADOS SMARTBID ---');

  // 1. Escalas
  console.log('Restaurando Escalas...');
  const escalas = [
    { nome: '5x2 (44h)', diasTrabalhadosMes: 22, descricao: 'Segunda a Sexta' },
    { nome: '12x36 (Diurno/Noturno)', diasTrabalhadosMes: 15, descricao: 'Escala 12 por 36' }
  ];

  for (const esc of escalas) {
    await (prisma as any).escala.upsert({
      where: { nome: esc.nome },
      update: {},
      create: esc
    });
  }

  // 2. Categorias
  console.log('Restaurando Categorias...');
  const categorias = [
    { nome: 'Materiais de Limpeza' },
    { nome: 'Equipamentos e Máquinas' },
    { nome: 'Descartáveis' },
    { nome: 'EPIs e Uniformes' }
  ];

  const catMap: Record<string, string> = {};
  for (const cat of categorias) {
    const created = await (prisma as any).categoria.upsert({
      where: { nome: cat.nome },
      update: {},
      create: cat
    });
    catMap[cat.nome] = created.id;
  }

  // 3. Produtos (Exemplos básicos)
  console.log('Restaurando Produtos...');
  const produtos = [
    { nome: 'Detergente Neutro 5L', precoBase: 15.50, categoriaId: catMap['Materiais de Limpeza'], unidade: 'Galao' },
    { nome: 'Desinfetante 5L', precoBase: 18.90, categoriaId: catMap['Materiais de Limpeza'], unidade: 'Galao' },
    { nome: 'Enceradeira Industrial', precoBase: 1200.00, categoriaId: catMap['Equipamentos e Máquinas'], unidade: 'Unidade' },
    { nome: 'Papel Toalha Interfolha', precoBase: 45.00, categoriaId: catMap['Descartáveis'], unidade: 'Fardo' }
  ];

  for (const prod of produtos) {
    await (prisma as any).produto.upsert({
      where: { nome_categoriaId: { nome: prod.nome, categoriaId: prod.categoriaId } },
      update: {},
      create: prod
    });
  }

  console.log('--- RESTAURAÇÃO CONCLUÍDA ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await (prisma as any).$disconnect();
  });
