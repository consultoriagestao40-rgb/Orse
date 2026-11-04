import { prisma } from './lib/prisma';

async function main() {
  console.log('Seeding Templates de Proposta Comercial...');

  // 1. Proposta Simples
  await prisma.templatePropostaComercial.upsert({
    where: { nome: 'Proposta Simples (Terceirização)' },
    update: {},
    create: {
      nome: 'Proposta Simples (Terceirização)',
      secoes: {
        create: [
          { ordem: 1, titulo: '1. APRESENTAÇÃO', texto: 'Apresentamos nossa proposta para prestação de serviços terceirizados, com foco em qualidade e eficiência.' },
          { ordem: 2, titulo: '2. ESCOPO DO SERVIÇO', texto: 'Fornecimento de mão de obra capacitada, incluindo todos os encargos trabalhistas, EPIs e uniformes.' },
          { ordem: 3, titulo: '3. VALOR DO INVESTIMENTO', texto: 'O investimento mensal para a prestação dos serviços será de [VALOR_TOTAL], com faturamento para 15 dias após o fechamento do mês.' },
          { ordem: 4, titulo: '4. VALIDADE', texto: 'Esta proposta tem validade de 15 dias a partir da data de sua emissão.' }
        ]
      }
    }
  });

  // 2. Proposta Completa (Condomínios)
  await prisma.templatePropostaComercial.upsert({
    where: { nome: 'Proposta Completa (Condomínios e Indústria)' },
    update: {},
    create: {
      nome: 'Proposta Completa (Condomínios e Indústria)',
      secoes: {
        create: [
          { ordem: 1, titulo: '1. CARTA DE APRESENTAÇÃO', texto: 'Prezado(a) Síndico(a)/Gestor(a) do [CLIENTE_NOME],\n\nAgradecemos a oportunidade de apresentar nossa proposta...' },
          { ordem: 2, titulo: '2. NOSSA METODOLOGIA', texto: 'Trabalhamos com gestão de ponto eletrônico por geolocalização, supervisão periódica in loco e SLA rígido de cobertura de faltas em até 2 horas.' },
          { ordem: 3, titulo: '3. INSUMOS E EQUIPAMENTOS', texto: 'Todos os produtos saneantes utilizados possuem registro na ANVISA. Os equipamentos serão fornecidos em regime de comodato.' },
          { ordem: 4, titulo: '4. PROPOSTA COMERCIAL', texto: 'O valor mensal estimado para o [CLIENTE_NOME] é de [VALOR_TOTAL].\n\nEstão inclusos: \n- Salários e encargos\n- Benefícios (VA, VT)\n- Rescisões\n- Cobertura de férias' }
        ]
      }
    }
  });

  console.log('Templates de Proposta criados com sucesso!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
