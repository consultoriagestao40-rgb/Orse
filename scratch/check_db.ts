import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

async function check() {
  const connectionString = process.env.DATABASE_URL
  const pool = new Pool({ connectionString })
  const adapter = new PrismaPg(pool)
  const prisma = new PrismaClient({ adapter })

  try {
    const ccts = await prisma.cCT.count();
    const escalas = await prisma.escala.count();
    const categorias = await prisma.categoria.count();
    const produtos = await prisma.produto.count();
    
    console.log('--- STATUS DO BANCO ---');
    console.log(`CCTs: ${ccts}`);
    console.log(`Escalas: ${escalas}`);
    console.log(`Categorias: ${categorias}`);
    console.log(`Produtos: ${produtos}`);
  } catch (err) {
    console.error('Erro ao conectar:', err);
  } finally {
    await pool.end();
  }
}

check();
