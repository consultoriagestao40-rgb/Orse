
import { prisma } from '../lib/prisma';
import { calculateLaborCost } from '../lib/pricingEngine';

async function debug() {
  const proposta = await prisma.proposta.findFirst({
    orderBy: { createdAt: 'desc' },
    include: {
      versoes: {
        orderBy: { versao: 'desc' },
        include: { items: true }
      }
    }
  });

  if (!proposta || !proposta.versoes.length) {
    console.log('Nenhuma proposta encontrada.');
    return;
  }

  const v = proposta.versoes[0];
  console.log('--- PROPOSTA DEBUG ---');
  console.log('ID:', proposta.id);
  console.log('Versao:', v.versao);

  v.items.forEach((item: any, idx: number) => {
    console.log(`\nItem ${idx + 1}: ${item.nomeCargo}`);
    console.log('Config Financeira (Cargo):', JSON.stringify(item.configFinanceira, null, 2));
    
    // Simula como o editor carrega
    const res = calculateLaborCost(item, {
       tributos: (v.impostos as any).list || [],
       taxaAdm: (v.margens as any).adm || 5,
       margemLucro: (v.margens as any).lucro || 10
    });
    
    console.log('Resultado Detalhe Bloco B:', JSON.stringify(res.detalheBlocoB, null, 2));
    console.log('Resultado Detalhe Bloco C:', JSON.stringify(res.detalheBlocoC, null, 2));
    console.log('Ativos Total:', res.ativos);
  });
}

debug();
