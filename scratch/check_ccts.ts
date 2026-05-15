
import { prisma } from '../lib/prisma';

async function check() {
  const ccts = await prisma.cCT.findMany({
    include: { cargos: true }
  });

  console.log('--- CCTs NO BANCO ---');
  ccts.forEach(c => {
    console.log(`\nCCT: ${c.nome} (ID: ${c.id})`);
    console.log(`VA: ${c.vaValor} (${c.vaTipo})`);
    console.log(`VT: ${c.vtValor}`);
    console.log(`Cesta: ${c.cestaBasica}`);
    console.log(`Encargo INSS: ${c.encargoInss}%`);
    console.log('Cargos vinculados:', c.cargos.map(cg => cg.nome).join(', '));
  });
}

check();
