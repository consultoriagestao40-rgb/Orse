const { PrismaClient } = require('@prisma/client');
const pg = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const connectionString = process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL;
if (!connectionString) {
  console.error("No DATABASE_URL found.");
  process.exit(1);
}
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function run() {
  try {
    const propostas = await prisma.proposta.findMany({
      where: { numero: 15 },
      include: {
        versoes: true,
        documentosComerciais: true,
        contrato: true
      }
    });
    console.log('PROPOSTAS WITH NUMBER 15:', JSON.stringify(propostas, null, 2));

    const documentos = await prisma.documentoProposta.findMany({
      include: {
        proposta: true
      }
    });
    console.log('TOTAL DOCUMENTS:', documentos.length);
    const docs15 = documentos.filter(d => d.proposta && d.proposta.numero === 15);
    console.log('DOCUMENTS FOR PROPOSAL 15:', JSON.stringify(docs15, null, 2));

    const contratos = await prisma.contrato.findMany({
      include: {
        proposta: true
      }
    });
    console.log('TOTAL CONTRATOS:', contratos.length);
    const contr15 = contratos.filter(c => c.proposta && c.proposta.numero === 15);
    console.log('CONTRATOS FOR PROPOSAL 15:', JSON.stringify(contr15, null, 2));

  } catch (err) {
    console.error('Error executing query:', err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

run();
