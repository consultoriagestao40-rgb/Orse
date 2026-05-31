const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Mimic getPropostaCompleta logic
async function runTest() {
  const id = "cmpfzyz6g000004l5fxgclggs";
  console.log("Fetching proposal", id);

  const proposta = await prisma.proposta.findUnique({
    where: { id },
    include: {
      user: true,
      versoes: {
        orderBy: { versao: 'desc' },
        include: { items: true }
      },
      shares: true
    }
  });

  if (!proposta || !proposta.versoes.length) {
    console.log("Proposal or versions not found");
    return;
  }

  const v = proposta.versoes[0];
  const meta = v.metadados || {};
  const impostos = v.impostos || {};
  const margens = v.margens || {};

  const returnObj = {
    id: proposta.id,
    numero: `FPV-${proposta.numero.toString().padStart(3, '0')}`,
    clientId: proposta.clientId,
    cliente: {
      id: proposta.clientId,
      clienteNome: meta.clienteNome || '',
      contato: meta.contato || '',
      celular: meta.celular || '',
      email: meta.email || '',
      objetoProposta: meta.objetoProposta || '',
      hasEscopoTecnico: meta.hasEscopoTecnico || false,
      escopoTecnico: meta.escopoTecnico || '',
      cidade: meta.cidade || '',
      dataElaboracao: meta.dataElaboracao || '',
      numeroProposta: meta.numeroProposta || '',
      revisao: meta.revisao || '',
      tipoServicos: meta.tipoServicos || '',
      tipoProposta: meta.tipoProposta || 'RECORRENTE',
      vendedorNome: meta.vendedorNome || proposta.user?.nome || 'Ádamo Quadros',
      vendedorCargo: meta.vendedorCargo || proposta.user?.cargo || 'Novos Negócios',
      vendedorTelefone: meta.vendedorTelefone || proposta.user?.celular || '(41) 9 9737-0880',
      vendedorEmail: meta.vendedorEmail || proposta.user?.email || 'contato@silvaconsultoria.com.br',
      vendedorAvatarUrl: proposta.user?.avatarUrl || null,
      quadroEfetivoSubtitulo: meta.quadroEfetivoSubtitulo || 'Quadro efetivo - Opções',
      quadroEfetivoClausula1: meta.quadroEfetivoClausula1 || 'Em casos de trabalho em feriados ou necessidades de jornada fora do escopo o funcionário deverá ter duas folgas compensatórias em sequência;',
      quadroEfetivoClausula2: meta.quadroEfetivoClausula2 || 'Para reduções no efetivo prazo de 30 (trinta) dias;',
      quadroEfetivoClausula3: meta.quadroEfetivoClausula3 || 'Intervalo para jornadas acima de 6h diárias de no mínimo 60 minutos, entre 4h a 6h o intervalo será de 15 minutos (CLT).',
      condicaoColaboradores1: meta.condicaoColaboradores1 || 'Vale alimentação de R$900,00;',
      condicaoColaboradores2: meta.condicaoColaboradores2 || 'Cesta trimestral de assiduidade;',
      condicaoColaboradores3: meta.condicaoColaboradores3 || '2 Vales transporte por dia.',
      condicaoCliente1: meta.condicaoCliente1 || 'Faturamento dos serviços aos dias 15 ou 30 de cada mês com vencimento nos próximos 15 dias;',
      condicaoCliente2: meta.condicaoCliente2 || 'Reajuste anual, automático e equivalente ao dissídio da categoria (SIEMACO) todo mês fevereiro de cada ano subsequente;',
      condicaoCliente3: meta.condicaoCliente3 || 'Próximo reajuste Fevereiro/2026.',
      razaoSocial: meta.razaoSocial || '',
      cnpj: meta.cnpj || '',
      dataInicio: meta.dataInicio || '',
      dataVencimento: meta.dataVencimento || '',
      contatoCargo: meta.contatoCargo || '',
      condicoesColaboradores: meta.condicoesColaboradores || [],
      condicoesCliente: meta.condicoesCliente || [],
      itensInclusosExcluidos: meta.itensInclusosExcluidos || []
    },
    insumos: {
      materiais: meta.insumos?.materiais || 0,
      maquinas: meta.insumos?.maquinas || 0,
      descartaveis: meta.insumos?.descartaveis || 0,
      servicos: meta.insumos?.servicos || 0,
      servicosDescricao: meta.insumos?.servicosDescricao || '',
      detalheMateriais: meta.insumos?.detalheMateriais || [],
      detalheMaquinas: meta.insumos?.detalheMaquinas || [],
      detalheDescartaveis: meta.insumos?.detalheDescartaveis || []
    },
    premissas: {
      taxaAdm: margens?.adm || 5,
      margemLucro: margens?.lucro || 10,
      comissaoVendedor: margens?.comissaoVendedor || 0,
      reservaTecnicaPct: margens?.reservaTecnicaPct || 0,
      manutencaoPct: margens?.manutencaoPct || 0,
      tributos: impostos.list || [],
      meta: { sindicatoId: impostos?.sindicatoId || '' }
    },
    equipe: v.items.map((i) => {
      const itemAtivosConfig = i.ativosConfig || {};
      return {
        id: i.id,
        nomeCargo: i.nomeCargo,
        quantidade: i.quantidade,
        escala: i.escala,
        cargo: i.configFinanceira,
        ativosConfig: itemAtivosConfig,
        parametrosPosto: itemAtivosConfig.parametrosPosto || {
          horarioInicio: i.entrada || '08:00',
          horarioFim: i.saida || '17:00',
          insalubridadePercent: 0,
          periculosidade: false,
          adicionalNoturnoHoras: 0,
          diasTrabalhadosMes: 22,
          intrajornadaHoras: 0,
          dsrPercent: 0,
          episAdicionais: []
        },
        tipoItem: i.tipoItem || 'POSTO_FIXO',
        unidadeMedida: i.unidadeMedida || null,
        quantidadeDemanda: i.quantidadeDemanda,
        precoUnitarioDemanda: i.precoUnitarioDemanda,
        comissaoVendedorPct: i.comissaoVendedorPct || 0,
        equipeTecnicaId: i.equipeTecnicaId || null
      };
    })
  };

  const totalTributos = Array.isArray(impostos.list)
    ? impostos.list.reduce((acc, t) => acc + (t.percent || 0), 0)
    : 0;

  console.log("Total tributos calculated:", totalTributos);
  console.log("Sindicato ID:", impostos?.sindicatoId);

  const cctDb = impostos?.sindicatoId ? await prisma.cCT.findUnique({ where: { id: impostos.sindicatoId }, include: { cargos: true } }) : null;
  console.log("Fetched CCT:", cctDb ? cctDb.id : null);

  const pricingEngine = require('../lib/pricingEngine');
  
  const calcInput = {
    items: returnObj.equipe,
    impostos: { total: Number(totalTributos) },
    margens: { 
      adm: margens?.adm || 5, 
      lucro: margens?.lucro || 10,
      comissaoVendedor: margens?.comissaoVendedor || 0
    },
    reservaTecnicaPct: margens?.reservaTecnicaPct || 0,
    manutencaoPct: margens?.manutencaoPct || 0,
    encargos: meta.encargos,
    cctGlobal: cctDb,
    insumosGlobais: {
      materiais: meta.insumos?.materiais || 0,
      maquinas: meta.insumos?.maquinas || 0,
      descartaveis: meta.insumos?.descartaveis || 0,
      servicos: meta.insumos?.servicos || 0
    }
  };

  console.log("Running calculateEnterprisePrice...");
  try {
    const resultado = pricingEngine.calculateEnterprisePrice(calcInput);
    console.log("Result calculated successfully! faturamentoBruto =", resultado.faturamentoBruto);
  } catch (err) {
    console.error("CRITICAL ERROR IN PRICING ENGINE:", err);
  }
}

runTest()
  .catch(e => console.error("Database connection error", e))
  .finally(() => prisma.$disconnect());
