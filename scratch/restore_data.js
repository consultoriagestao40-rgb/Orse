const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('ERRO: DATABASE_URL não definida.');
  process.exit(1);
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('--- RESTAURAÇÃO DE DADOS SMARTBID (FINAL) ---');

  try {
    // 1. Escalas
    console.log('Restaurando Escalas...');
    const escalas = [
      { nome: '5x2 (44h)', diasTrabalhadosMes: 22, horasMensais: 220 },
      { nome: '12x36 (Diurno/Noturno)', diasTrabalhadosMes: 15, horasMensais: 180 }
    ];

    for (const esc of escalas) {
      await prisma.escala.upsert({
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

    for (const cat of categorias) {
      await prisma.categoria.upsert({
        where: { nome: cat.nome },
        update: {},
        create: cat
      });
    }

    // 3. Produtos
    console.log('Restaurando Produtos...');
    const produtos = [
      { descricao: 'Detergente Neutro 5L', precoUnitario: 15.50, categoria: 'Materiais de Limpeza', unidade: 'GL' },
      { descricao: 'Desinfetante 5L', precoUnitario: 18.90, categoria: 'Materiais de Limpeza', unidade: 'GL' },
      { descricao: 'Enceradeira Industrial', precoUnitario: 1200.00, categoria: 'Equipamentos e Máquinas', unidade: 'UN' },
      { descricao: 'Papel Toalha Interfolha', precoUnitario: 45.00, categoria: 'Descartáveis', unidade: 'FD' }
    ];

    for (const prod of produtos) {
        // Como o schema não tem @unique na descricao, vamos verificar se já existe antes de criar
        const existing = await prisma.produto.findFirst({
            where: { descricao: prod.descricao }
        });
        if (!existing) {
            await prisma.produto.create({ data: prod });
        }
    }

    console.log('--- RESTAURAÇÃO CONCLUÍDA COM SUCESSO ---');
  } catch (err) {
    console.error('ERRO NA RESTAURAÇÃO:', err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
