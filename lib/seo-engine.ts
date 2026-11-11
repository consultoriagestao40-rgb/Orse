import { prisma } from '@/lib/prisma';

export interface SeoArticleSection {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
  table?: {
    headers: string[];
    rows: string[][];
  };
  highlightBox?: {
    title: string;
    text: string;
  };
}

export interface SeoArticleFaq {
  question: string;
  answer: string;
}

export interface SeoArticle {
  slug: string;
  title: string;
  metaDescription: string;
  category: string;
  readTimeMinutes: number;
  publishedAt: string;
  updatedAt: string;
  keywords: string[];
  excerpt: string;
  sections: SeoArticleSection[];
  faqs: SeoArticleFaq[];
  isCustom?: boolean;
}

const SEO_RECORD_PREFIX = '[SEO_ARTICLE]:';

export const PILLAR_SEO_ARTICLES: SeoArticle[] = [
  {
    slug: 'planilha-formacao-de-preco-de-venda-fpv-facilities-terceirizacao',
    title: 'Planilha de Formação de Preço de Venda (FPV) para Facilities e Terceirização: Guia Completo',
    metaDescription:
      'Aprenda a montar uma Planilha de Custos e Formação de Preço de Venda (FPV) para empresas de limpeza, portaria e facilities com cálculo exato de encargos, CCT, BDI e tributos.',
    category: 'Engenharia de Custos & FPV',
    readTimeMinutes: 8,
    publishedAt: '2026-11-01T10:00:00.000Z',
    updatedAt: '2026-11-11T12:00:00.000Z',
    keywords: [
      'planilha de formação de preço de venda',
      'FPV facilities',
      'planilha de custos terceirização',
      'formação de preços limpeza e conservação',
      'planilha de custos e formação de preços',
      'orçamento terceirização de mão de obra',
    ],
    excerpt:
      'Descubra a estrutura técnica completa dos Montantes A, B e C, BDI e impostos por dentro (gross-up) para nunca mais perder margem de lucro em contratos de prestação de serviços.',
    sections: [
      {
        heading: 'O que é a FPV (Formação de Preço de Venda) na Terceirização de Serviços?',
        paragraphs: [
          'Na terceirização de mão de obra e gestão de Facilities (limpeza e conservação, portaria, recepção, jardinagem, manutenção predial e vigilância), a Formação de Preço de Venda (FPV) é o coração financeiro de qualquer contrato.',
          'Diferente do comércio varejista, onde basta aplicar um multiplicador sobre o preço da mercadoria, na prestação de serviços intensivos em mão de obra o custo real de um posto de trabalho envolve dezenas de rubricas trabalhistas, previdenciárias, sindicais (CCT), operacionais e tributárias.',
        ],
        highlightBox: {
          title: 'Por que 68% das prestadoras perdem margem no 1º ano de contrato?',
          text: 'O uso de planilhas de Excel desatualizadas ou com fórmulas quebradas no cálculo de férias, rescisão, intrajornada, ISS e gross-up de impostos corrói de 4% a 9% da margem líquida todos os meses.',
        },
      },
      {
        heading: 'A Estrutura Clássica da Planilha de Custos (Montantes A, B e C)',
        paragraphs: [
          'Uma FPV profissional de Facilities é dividida em blocos técnicos auditáveis pelo cliente contratante:',
        ],
        bullets: [
          'Montante A (Remuneração + Encargos Sociais e Trabalhistas): Piso salarial da CCT, insalubridade (20% ou 40%), periculosidade (30%), adicional noturno + reflexo DSR, intrajornada e Grupos A, B, C, D, E e F de encargos.',
          'Montante B (Insumos, Uniformes, EPIs e Equipamentos): Rateio mensal da vida útil de uniformes e EPIs por colaborador, produtos químicos de limpeza, descartáveis de higiene e depreciação/manutenção de máquinas.',
          'Montante C (Benefícios Obrigatórios da CCT): Vale-alimentação/refeição (líquido do desconto legal), vale-transporte (deduzido o limite de 6% do salário-base), cesta básica, seguro de vida, assistência médica/odontológica familiar e fundos sindicais.',
          'BDI / Taxa Administrativa + Margem de Lucro + Tributos (Gross-up): Incidência por dentro dos tributos conforme o enquadramento tributário da empresa emissora (Simples Nacional Anexo III/IV, Lucro Presumido, Lucro Real ou novo IVA Dual IBS/CBS).',
        ],
        table: {
          headers: ['Bloco de Custo', 'Peso Médio no Contrato', 'Principal Risco de Erro no Excel'],
          rows: [
            ['Montante A (Mão de Obra + Encargos)', '68% a 76%', 'Esquecer incidência cumulativa do Grupo A sobre o Grupo B (13º e Férias)'],
            ['Montante C (Benefícios CCT)', '10% a 16%', 'Errar o teto de desconto de 6% do Vale-Transporte sobre o piso salarial'],
            ['Montante B (Materiais, EPIs e Máquinas)', '4% a 10%', 'Usar preços defasados de insumos químicos e descartáveis'],
            ['Tributos + BDI (Taxa Adm e Lucro)', '12% a 24%', 'Somar porcentagens por fora em vez de aplicar o divisor por dentro (Gross-up)'],
          ],
        },
      },
      {
        heading: 'Como calcular o Preço de Venda com Impostos por Dentro (Fórmula Gross-up)',
        paragraphs: [
          'Um dos erros mais graves nas planilhas manuais é somar os impostos e a margem de lucro sobre o custo direto. Como os tributos (PIS, COFINS, ISS, Simples ou IBS/CBS) incidem sobre o valor bruto da Nota Fiscal emitida, o cálculo correto exige a divisão pelo fator complementar:',
          'Preço de Venda = Custo Direto Total ÷ (1 − [% Tributos + % Taxa Adm + % Lucro + % Comissão])',
          'No SmartBid Hub, esse motor matemático já vem nativamente validado para todos os regimes tributários brasileiros, gerando simultaneamente o demonstrativo analítico da FPV, a DRE projetada do contrato e a Proposta Comercial executiva.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Qual a diferença entre planilha de custos aberta e proposta comercial fechada?',
        answer:
          'A planilha de custos aberta (FPV analítica) detalha cada centavo de salário, encargos e benefícios exigidos em concorrências B2B e licitações. No SmartBid Hub, você monta a FPV analítica e escolhe com 1 clique se o cliente verá o detalhamento aberto ou apenas o valor por posto na proposta interativa.',
      },
      {
        question: 'Como atualizar os preços de materiais e equipamentos na FPV?',
        answer:
          'No SmartBid Hub, além do seu catálogo próprio de produtos, você conta com um buscador integrado que pesquisa preços reais de mercado na web em tempo real direto de dentro da FPV.',
      },
    ],
  },
  {
    slug: 'como-calcular-encargos-sociais-trabalhistas-terceirizacao-cct',
    title: 'Como Calcular Encargos Sociais e Trabalhistas na Terceirização de Mão de Obra (Grupos A a F)',
    metaDescription:
      'Guia técnico para cálculo de encargos sociais e trabalhistas em contratos de terceirização e facilities: INSS Patronal, FGTS, RAT/FAP, 13º salário, férias e provisão de rescisão.',
    category: 'Legislação & CCT',
    readTimeMinutes: 9,
    publishedAt: '2026-11-02T10:00:00.000Z',
    updatedAt: '2026-11-11T12:00:00.000Z',
    keywords: [
      'cálculo de encargos sociais terceirização',
      'encargos trabalhistas limpeza e conservação',
      'tabela de encargos sociais grupos A B C D',
      'custo de funcionário terceirizado',
      'provisão de férias e 13º terceirização',
    ],
    excerpt:
      'Entenda item por item como funcionam os Grupos A, B, C, D, E e F da planilha de encargos sociais e por que o regime tributário muda completamente o Grupo A.',
    sections: [
      {
        heading: 'Por que os Encargos Sociais variam de 38% a mais de 75% na Terceirização?',
        paragraphs: [
          'Todo comprador de serviços de Facilities pergunta: "Por que os encargos sociais da sua planilha estão em 71,80%?". Dominar a explicação técnica de cada grupo de encargos transmite autoridade imediata na negociação e impede que o cliente peça descontos inexequíveis.',
        ],
        table: {
          headers: ['Grupo de Encargos', 'O que compõe', 'Faixa Média (Lucro Real/Presumido)'],
          rows: [
            ['Grupo A (Previdenciários)', 'INSS Patronal (20%), FGTS (8%), Sistema S (5,8%), RAT x FAP (1% a 6%)', '34,80% a 39,80%'],
            ['Grupo B (Tempo Não Trabalhado)', '13º Salário (8,33%), Férias + 1/3 Constitucional (11,11%), Ausências Legais', '20,50% a 23,50%'],
            ['Grupo C (Indenizações / Rescisão)', 'Aviso Prévio Indenizado, Multa de 40% do FGTS sobre demissões sem justa causa', '5,00% a 8,50%'],
            ['Grupo D (Incidência Cumulativa)', 'Incidência dos encargos do Grupo A sobre as verbas do Grupo B', '7,10% a 9,20%'],
          ],
        },
      },
      {
        heading: 'O impacto do Simples Nacional (Anexo III vs Anexo IV) nos Encargos',
        paragraphs: [
          'Empresas optantes pelo Simples Nacional no Anexo III (como manutenção predial, jardinagem e portaria sem cessão de vigilância armada) têm o INSS Patronal (20%), o RAT e o Sistema S substituídos pela alíquota única do DAS. Nesses casos, o Grupo A cai para apenas 8,00% (FGTS).',
          'Já empresas de Limpeza e Conservação ou Vigilância enquadradas no Anexo IV do Simples Nacional ("Simples Híbrido") continuam obrigadas a recolher os 20% de INSS Patronal + RAT sobre a folha de pagamento, ficando isentas apenas do Sistema S (5,8%).',
        ],
        highlightBox: {
          title: 'Dica Prática de Precificação',
          text: 'No SmartBid Hub, ao selecionar a Empresa Emissora na FPV, o sistema identifica automaticamente se ela é Simples Normal, Simples Híbrido, Lucro Presumido ou Lucro Real, ajustando a planilha sem risco de erro.',
        },
      },
    ],
    faqs: [
      {
        question: 'Os encargos sociais incidem sobre insalubridade e adicional noturno?',
        answer:
          'Sim! Insalubridade, periculosidade, adicional noturno, reflexo no DSR e gratificações habituais integram a remuneração bruta do colaborador (Montante A) e sofrem incidência integral dos encargos sociais.',
      },
      {
        question: 'Vale-transporte e vale-alimentação entram na base de encargos sociais?',
        answer:
          'Não, desde que pagos conforme a legislação do PAT e as cláusulas de natureza indenizatória da Convenção Coletiva de Trabalho (CCT). Por isso eles ficam isolados no Montante C.',
      },
    ],
  },
  {
    slug: 'reforma-tributaria-ibs-cbs-impacto-empresas-limpeza-portaria-facilities',
    title: 'Reforma Tributária (IBS e CBS) nas Empresas de Facilities e Terceirização: Guia Prático de Transição',
    metaDescription:
      'Entenda como a substituição de PIS, COFINS e ISS pelo novo IVA Dual (IBS e CBS) afeta a formação de preços e os contratos de limpeza, portaria e prestação de serviços.',
    category: 'Tributação & Reforma Tributária',
    readTimeMinutes: 7,
    publishedAt: '2026-11-03T10:00:00.000Z',
    updatedAt: '2026-11-11T12:00:00.000Z',
    keywords: [
      'reforma tributária empresas de serviços',
      'IBS e CBS terceirização de mão de obra',
      'impacto reforma tributária facilities limpeza',
      'substituição PIS COFINS ISS por IBS CBS',
      'simples híbrido reforma tributária',
    ],
    excerpt:
      'Veja como preparar suas propostas comerciais e cláusulas de reequilíbrio econômico-financeiro para a transição do PIS/COFINS/ISS para a CBS e o IBS.',
    sections: [
      {
        heading: 'O que muda com a substituição de PIS, COFINS e ISS pelo IBS e CBS?',
        paragraphs: [
          'Com a Emenda Constitucional 132/2023 e a regulamentação do IVA Dual no Brasil, os atuais tributos sobre o faturamento das prestadoras de serviços — PIS (0,65% ou 1,65%), COFINS (3,00% ou 7,60%) e ISS municipal (2% a 5%) — passam por um cronograma de transição para dois novos tributos não cumulativos:',
        ],
        bullets: [
          'CBS (Contribuição sobre Bens e Serviços — Federal): Substitui o PIS e a COFINS.',
          'IBS (Imposto sobre Bens e Serviços — Estadual/Municipal): Substitui gradualmente o ISS e o ICMS.',
        ],
      },
      {
        heading: 'Os 3 Cenários Tributários que sua FPV precisa simular hoje',
        paragraphs: [
          'Como os contratos de prestação de serviços continuados (limpeza, portaria, manutenção e facilities) têm vigência de 12 a 60 meses, orçar sem prever a transição tributária é um risco grave para o fluxo de caixa:',
        ],
        table: {
          headers: ['Modo Tributário', 'Tributos na FPV', 'Quando Utilizar'],
          rows: [
            ['Sistema Atual', 'PIS + COFINS + ISS (ou DAS Simples)', 'Contratos vigentes no modelo atual antes da extinção do PIS/COFINS'],
            ['Transição Fase 1 (CBS + ISS)', 'CBS Federal + ISS Municipal', 'Etapa em que PIS e COFINS são extintos e substituídos pela CBS, mantendo o ISS'],
            ['IVA Dual Pleno (IBS + CBS)', 'CBS Federal + IBS Estadual/Municipal', 'Simulação de longo prazo e transferência integral de crédito de IVA para clientes B2B'],
          ],
        },
        highlightBox: {
          title: 'E o Simples Híbrido na Reforma Tributária?',
          text: 'Empresas do Simples Nacional poderão optar por recolher IBS e CBS "por fora" do DAS (Simples Híbrido) quando venderem para grandes empresas do Lucro Real que exigem crédito integral de IBS/CBS na contratação.',
        },
      },
    ],
    faqs: [
      {
        question: 'Como o SmartBid Hub calcula PIS/COFINS vs IBS/CBS?',
        answer:
          'No cadastro de cada Empresa Emissora e diretamente na Aba 2 da FPV do SmartBid Hub, você pode alternar com 1 clique entre o Regime Atual (PIS/COFINS/ISS), a Transição Fase 1 (CBS + ISS) e o IVA Dual Pleno (IBS + CBS).',
      },
    ],
  },
  {
    slug: 'simples-nacional-anexo-iii-anexo-iv-lucro-presumido-real-terceirizacao',
    title: 'Simples Nacional (Anexo III vs Anexo IV), Lucro Presumido ou Lucro Real na Prestação de Serviços?',
    metaDescription:
      'Comparativo completo entre Simples Nacional Normal (Anexo III), Simples Híbrido (Anexo IV), Lucro Presumido e Lucro Real para empresas de limpeza, portaria e facilities.',
    category: 'Tributação & Reforma Tributária',
    readTimeMinutes: 8,
    publishedAt: '2026-11-04T10:00:00.000Z',
    updatedAt: '2026-11-11T12:00:00.000Z',
    keywords: [
      'simples nacional anexo III ou anexo IV limpeza',
      'regime tributário empresa de facilities',
      'lucro presumido ou lucro real terceirização',
      'simples híbrido prestação de serviços',
    ],
    excerpt:
      'Compare na ponta do lápis o peso tributário e previdenciário de cada enquadramento e saiba qual empresa emissora selecionar em cada proposta comercial.',
    sections: [
      {
        heading: 'Por que grupos de Facilities operam com múltiplas Empresas Emissoras?',
        paragraphs: [
          'No setor de terceirização e facilities, é muito comum que um mesmo grupo empresarial possua CNPJs em regimes tributários distintos (por exemplo, uma empresa no Simples Nacional para contratos menores de portaria/manutenção e outra no Lucro Presumido ou Lucro Real para grandes contratos corporativos de limpeza e facilities).',
          'Cada regime altera diretamente dois blocos da FPV: a alíquota de impostos sobre a Nota Fiscal (Aba 2) e o percentual de INSS Patronal na folha (Montante A).',
        ],
        table: {
          headers: ['Enquadramento', 'Impostos sobre Nota Fiscal (Média)', 'INSS Patronal na Folha (Grupo A)'],
          rows: [
            ['Simples Normal (Anexo III)', 'DAS único (a partir de 6,00% até 19,50%)', 'Isento na folha (já incluso no DAS)'],
            ['Simples Híbrido / Anexo IV', 'DAS (4,50% a 15,75%) ou IBS/CBS por fora', '20% INSS + RAT na folha (isento de Sistema S)'],
            ['Lucro Presumido', 'PIS (0,65%) + COFINS (3,00%) + ISS (2% a 5%) = ~8,65% (+ IRPJ/CSLL)', '20% INSS + RAT + Sistema S (5,8%) na folha'],
            ['Lucro Real', 'PIS (1,65%) + COFINS (7,60%) + ISS (2% a 5%) = ~14,25% (com créditos)', '20% INSS + RAT + Sistema S (5,8%) na folha'],
          ],
        },
      },
    ],
    faqs: [
      {
        question: 'Posso selecionar qual empresa do meu grupo vai emitir a proposta dentro da FPV?',
        answer:
          'Sim! No SmartBid Hub, você cadastra todas as empresas do seu grupo com seus respectivos regimes tributários e seleciona a Empresa Emissora direto no topo da FPV, carregando todas as alíquotas automaticamente.',
      },
    ],
  },
  {
    slug: 'calculo-escala-12x36-portaria-limpeza-adicional-noturno-intrajornada',
    title: 'Como Calcular o Custo da Escala 12x36 na Portaria e Limpeza: Piso, Intrajornada e Adicional Noturno',
    metaDescription:
      'Passo a passo para calcular o custo de um posto 12x36 diurno e 12x36 noturno (24 horas) em contratos de portaria, recepção, vigilância e limpeza hospitalar.',
    category: 'Engenharia de Custos & FPV',
    readTimeMinutes: 8,
    publishedAt: '2026-11-05T10:00:00.000Z',
    updatedAt: '2026-11-11T12:00:00.000Z',
    keywords: [
      'cálculo escala 12x36 portaria',
      'custo posto 24 horas portaria 4 funcionários',
      'adicional noturno escala 12x36 cálculo',
      'intrajornada indenizada 12x36 terceirização',
    ],
    excerpt:
      'Veja quantos colaboradores compõem um posto 12x36 Diurno (2 pessoas) e 24 Horas (4 pessoas), como calcular os 15,22 dias médios por mês e o impacto do adicional noturno.',
    sections: [
      {
        heading: 'Quantos funcionários formam um posto 12x36?',
        paragraphs: [
          'Na escala 12x36 (12 horas de trabalho seguidas por 36 horas de descanso), um colaborador trabalha em média 15,22 plantões por mês (365 dias ÷ 12 meses ÷ 2).',
        ],
        bullets: [
          'Posto 12 horas Diurno (todos os dias, ex: 07h às 19h): Exige 2 colaboradores (Plantão Par e Plantão Ímpar).',
          'Posto 12 horas Noturno (todos os dias, ex: 19h às 07h): Exige 2 colaboradores com adicional noturno, hora noturna reduzida (52m30s) e reflexo no DSR.',
          'Posto 24 Horas Ininterrupto: Exige 4 colaboradores (2 diurnos + 2 noturnos).',
        ],
      },
      {
        heading: 'Cuidados Críticos no Orçamento do Posto 12x36',
        paragraphs: [
          'Ao orçar um posto 12x36 para um condomínio, indústria ou hospital, três rubricas jamais podem ser esquecidas:',
        ],
        bullets: [
          'Intrajornada (Intervalo de Refeição): Se o posto não possui rendição (almocista/folguista) para cobrir 1 hora de intervalo, a empresa deve pagar 1 hora indenizada por plantão conforme a CCT.',
          'Prorrogação da Hora Noturna e Hora Reduzida: No turno das 22h às 05h (e eventual prorrogação até as 07h conforme CCT), incide o adicional noturno (geralmente 20%) mais o reflexo sobre o DSR.',
          'Dias Efetivos para Vale-Transporte e Vale-Alimentação: Enquanto na escala 5x2 são 22 dias úteis médios, na escala 12x36 cada colaborador utiliza cerca de 15,22 a 16 dias de benefícios por mês.',
        ],
      },
    ],
    faqs: [
      {
        question: 'O SmartBid Hub já calcula automaticamente a escala 12x36 Diurna e Noturna?',
        answer:
          'Sim! Basta selecionar a escala 12x36 na linha do posto dentro da FPV e marcar se há Adicional Noturno ou Intrajornada: o sistema calcula a quantidade de colaboradores, os dias de VT/VA e todos os reflexos trabalhistas sozinho.',
      },
    ],
  },
  {
    slug: 'como-fazer-repactuacao-reajuste-contratos-terceirizacao-cct',
    title: 'Repactuação e Reajuste de Contratos de Facilities pela Data-Base da CCT: Guia Prático',
    metaDescription:
      'Saiba como controlar a data-base das Convenções Coletivas (CCT) e aplicar o reajuste ou repactuação de preços nos contratos de limpeza, portaria e terceirização.',
    category: 'Gestão de Contratos',
    readTimeMinutes: 7,
    publishedAt: '2026-11-06T10:00:00.000Z',
    updatedAt: '2026-11-11T12:00:00.000Z',
    keywords: [
      'repactuação de contratos terceirização',
      'reajuste contrato prestação de serviços CCT',
      'carta de reajuste contrato limpeza portaria',
      'gestão de contratos facilities reajuste anual',
    ],
    excerpt:
      'Nunca mais absorva aumento de piso salarial e vale-alimentação do sindicato por esquecer a data de aniversário ou a data-base da CCT de um contrato ativo.',
    sections: [
      {
        heading: 'A diferença entre Repactuação pela CCT e Reajuste por Índice (IPCA/IGP-M)',
        paragraphs: [
          'Nos contratos de prestação de serviços terceirizados, o custo é composto por duas naturezas distintas que sofrem correção em momentos diferentes:',
        ],
        bullets: [
          'Montantes A e C (Mão de Obra e Benefícios): São corrigidos na Data-Base da Convenção Coletiva de Trabalho (CCT) do sindicato da categoria (ex: SIEMACO, SEAC, SINDESP), refletindo o aumento real do piso salarial, vale-alimentação e cesta básica.',
          'Montante B (Materiais, Equipamentos e Descartáveis): É corrigido a cada 12 meses pela inflação acumulada do período (IPCA ou IGP-M).',
        ],
        highlightBox: {
          title: 'Como o SmartBid evita que você perca o prazo do reajuste?',
          text: 'O módulo de Gestão de Contratos do SmartBid monitora automaticamente a vigência e sinaliza quais contratos estão com reajuste pendente, permitindo gerar a memória de cálculo comparativa em minutos.',
        },
      },
    ],
    faqs: [
      {
        question: 'Como provar para o cliente o percentual exato de aumento do contrato?',
        answer:
          'Apresentando a planilha comparativa (FPV antes vs. FPV após a nova CCT). Como a FPV do SmartBid separa claramente Montante A, B e C, o cliente visualiza com transparência o impacto exato da nova convenção coletiva.',
      },
    ],
  },
  {
    slug: 'calculo-bdi-taxa-administracao-lucro-orcamento-prestacao-servicos',
    title: 'Como Calcular BDI, Taxa de Administração e Margem de Lucro na Prestação de Serviços',
    metaDescription:
      'Aprenda a calcular o BDI (Benefícios e Despesas Indiretas), Taxa de Administração, Margem de Lucro e ponto de equilíbrio em orçamentos de Facilities e Terceirização.',
    category: 'Engenharia de Custos & FPV',
    readTimeMinutes: 7,
    publishedAt: '2026-11-07T10:00:00.000Z',
    updatedAt: '2026-11-11T12:00:00.000Z',
    keywords: [
      'cálculo de BDI prestação de serviços',
      'taxa de administração e lucro terceirização',
      'markup e gross up planilha de custos',
      'margem de lucro líquida empresas de limpeza',
    ],
    excerpt:
      'Entenda como definir a Taxa de Administração (custos indiretos do escritório central) e a Margem de Lucro operacional sem ficar fora de preço na concorrência.',
    sections: [
      {
        heading: 'O que compõe o BDI nos Contratos de Terceirização e Facilities?',
        paragraphs: [
          'O BDI (Benefícios e Despesas Indiretas) é o percentual que transforma o Custo Direto Operacional (folha + benefícios + materiais do contrato) no Preço de Venda Final capaz de pagar a estrutura administrativa da empresa, os impostos e remunerar o capital dos sócios.',
        ],
        table: {
          headers: ['Componente do BDI / Markup', 'Faixa Praticada no Mercado B2B', 'Para que serve'],
          rows: [
            ['Taxa de Administração (Custos Indiretos)', '3,00% a 7,00%', 'Custeia RH, DP, supervisão operacional, financeiro, sistemas e sede'],
            ['Margem de Lucro Bruta / Operacional', '5,00% a 15,00%', 'Remuneração líquida do risco empresarial e capacidade de investimento'],
            ['Comissão Comercial', '0,50% a 3,00%', 'Premiação do vendedor/executivo de contas ou parceiro indicador'],
            ['Tributos sobre Faturamento', '6,00% a 14,25%', 'Impostos diretos sobre a emissão da Nota Fiscal de serviços'],
          ],
        },
      },
    ],
    faqs: [
      {
        question: 'Qual a margem líquida saudável para uma empresa de Facilities?',
        answer:
          'Em contratos recorrentes de médio e grande porte, a margem líquida final (após impostos e despesas administrativas) costuma girar entre 6% e 12%. Em serviços técnicos Spot ou limpeza especializada em altura, chega de 18% a 30%.',
      },
    ],
  },
  {
    slug: 'proposta-comercial-servicos-limpeza-portaria-facilities-modelo',
    title: 'Como Fazer uma Proposta Comercial de Limpeza, Portaria e Facilities que Fecha Contratos B2B',
    metaDescription:
      'Veja a estrutura ideal de uma proposta comercial de prestação de serviços terceirizados com escopo técnico, quadro de postos, apresentação executiva e rastreio de leitura.',
    category: 'Vendas B2B & Propostas',
    readTimeMinutes: 7,
    publishedAt: '2026-11-08T10:00:00.000Z',
    updatedAt: '2026-11-11T12:00:00.000Z',
    keywords: [
      'modelo de proposta comercial limpeza e conservação',
      'proposta comercial portaria e zeladoria',
      'como fazer proposta de prestação de serviços',
      'proposta comercial facilities pdf interativa',
    ],
    excerpt:
      'Por que enviar um PDF estático no WhatsApp faz você perder negócios para concorrentes — e como a proposta por link rastreado avisa o minuto exato em que o cliente está lendo seu orçamento.',
    sections: [
      {
        heading: 'Por que o PDF comum morreu nas vendas B2B de alto valor?',
        paragraphs: [
          'Quando você envia um orçamento de R$ 25.000/mês em um PDF estático por e-mail ou WhatsApp, você fica completamente no escuro: não sabe se o comprador abriu, se encaminhou para o diretor financeiro, quanto tempo ficou olhando a tabela de preços ou se abandonou a leitura na primeira página.',
          'Com a Proposta Comercial Interativa por Link do SmartBid Hub, o seu cliente recebe uma experiência executiva (Apresentação de Slides + Escopo Técnico Formatado + Quadro de Postos + Assinatura Digital com validade jurídica), enquanto você acompanha cada leitura em tempo real.',
        ],
        bullets: [
          'Alerta instantâneo: Saiba na hora quando o cliente abrir a proposta.',
          'Telemetria por aba: Veja quantos minutos ele passou na Apresentação, no Escopo, na FPV e na Minuta.',
          'Aceite Digital em 1 clique: O cliente aprova eletronicamente na própria tela e você recebe um alerta imediato no seu WhatsApp!',
        ],
      },
    ],
    faqs: [
      {
        question: 'Posso exportar a proposta em PDF A4 tradicional se o cliente pedir?',
        answer:
          'Sim! Além do Link Interativo com rastreamento de leitura e apresentação de slides, o SmartBid Hub também exporta a proposta e a planilha de FPV em PDF A4 executivo pronto para impressão.',
      },
    ],
  },
  {
    slug: 'software-montagem-de-propostas-terceirizacao-servicos-facilities',
    title: 'Software de Montagem de Propostas e Orçamento para Terceirização de Serviços e Facilities (Guia 2026)',
    metaDescription:
      'Conheça o melhor software para montagem de propostas comerciais e cálculo de custos (encargos trabalhistas, CCT, benefícios, insumos e margem) para empresas de terceirização, limpeza, portaria e segurança.',
    category: 'Softwares & Comparativos',
    readTimeMinutes: 8,
    publishedAt: '2026-11-11T14:00:00.000Z',
    updatedAt: '2026-11-11T17:00:00.000Z',
    keywords: [
      'software montagem de propostas terceirização',
      'software orçamento terceirização de serviços',
      'sistema para empresas de terceirização e locação de mão de obra',
      'software de propostas limpeza portaria e segurança',
      'sistema de formação de preços facilities',
      'SmartBid Hub',
    ],
    excerpt:
      'Para montar propostas comerciais voltadas à terceirização de serviços (limpeza, portaria, segurança, manutenção ou alocação de mão de obra), descubra como escolher um software que calcula encargos trabalhistas, CCT, insumos e margem de lucro automaticamente.',
    sections: [
      {
        heading: '1. Sistemas Focados em Terceirização, Facilities e Locação de Mão de Obra',
        paragraphs: [
          'Para montar propostas comerciais voltadas à terceirização de serviços (como limpeza e conservação, portaria, segurança patrimonial, recepção, jardinagem, manutenção predial ou alocação de mão de obra), um simples editor de texto ou CRM genérico não resolve: o sistema precisa calcular automaticamente o custo por posto de trabalho e por colaborador.',
          'O SmartBid Hub foi desenvolvido especificamente para empresas brasileiras de terceirização de serviços e Facilities. Ele une o motor completo de Engenharia de Custos e Formação de Preço de Venda (FPV por Convenção Coletiva - CCT) com a geração automática de Propostas Comerciais Interativas (por link rastreado e PDF A4), CRM B2B e Gestão de Contratos.',
        ],
        bullets: [
          'SmartBid Hub (Destaque #1 em Engenharia de Custos + Propostas + CRM): Faz o cálculo automático do custo por colaborador e posto (salário por CCT, insalubridade, periculosidade, adicional noturno, intrajornada, encargos sociais Grupos A a F, benefícios VT/VA/Cesta, EPIs, materiais e equipamentos), calcula os impostos por dentro (Simples Nacional, Lucro Presumido, Lucro Real e Reforma Tributária IBS/CBS) e gera tanto o Link Interativo com rastreio de leitura quanto o PDF A4 com a identidade da empresa.',
          'Integração nativa entre FPV e Proposta Comercial: Qualquer ajuste de margem, BDI ou escala (5x2, 6x1, 12x36, SDF, Ferista) atualiza a DRE projetada e a proposta comercial instantaneamente sem risco de erro de fórmula de planilha.',
          'Cotação de Insumos na Web em Tempo Real: Buscador integrado na FPV para consultar preços reais de mercado de equipamentos, EPIs e materiais químicos.',
        ],
        highlightBox: {
          title: 'Por que o SmartBid Hub substitui tanto as planilhas de Excel quanto os softwares genéricos de propostas?',
          text: 'Enquanto softwares genéricos de propostas apenas diagramam textos e exigem que você continue calculando o posto no Excel por fora, o SmartBid Hub calcula a planilha de custos (Montantes A, B, C, BDI e Tributos) nativamente por CCT e já gera a proposta comercial rastreada pronta para assinatura eletrônica.',
        },
      },
      {
        heading: '2. Comparativo: Software Especializado em Terceirização (SmartBid Hub) vs. Editores Genéricos e Planilhas',
        paragraphs: [
          'Veja abaixo a diferença prática entre utilizar uma plataforma desenhada para a engenharia de custos de terceirização de mão de obra versus ferramentas genéricas:',
        ],
        table: {
          headers: ['Recurso / Necessidade da Prestadora', 'SmartBid Hub (Focado em Terceirização & Facilities)', 'Softwares Genéricos de Propostas / Excel'],
          rows: [
            ['Cálculo de Postos e Escalas (12x36, 5x2, 6x1)', 'Nativo com cálculo automático de adicional noturno, intrajornada e DSR', 'Manual via fórmulas de Excel sujeitas a erros'],
            ['Convenções Coletivas (CCT) e Encargos (Grupos A a F)', 'Banco de CCTs com lupa de composição salarial e encargos auditáveis', 'Não possui motor trabalhista nem vínculo com sindicatos'],
            ['Regimes Tributários e Reforma Tributária (IBS/CBS)', 'Cálculo automático por dentro (Gross-up) por empresa emissora', 'Exige recálculo manual a cada mudança de alíquota'],
            ['Formato de Entrega da Proposta Comercial', 'Link Interativo com telemetria de leitura + Apresentação Slide Deck + PDF A4', 'Apenas PDF estático sem rastreamento por seção de custos'],
            ['Pós-Venda: Contratos, Reajustes e Implantação (PIC)', 'Geração de minuta contratual, alerta de repactuação e kanban de implantação', 'Desconectado da operação pós-fechamento'],
          ],
        },
      },
    ],
    faqs: [
      {
        question: 'Qual o melhor software para montagem de propostas de terceirização de serviços?',
        answer:
          'O SmartBid Hub é a plataforma mais completa do Brasil para montagem de propostas comerciais de terceirização de serviços (limpeza, portaria, vigilância, recepção e manutenção), pois integra o cálculo automático da Planilha de Custos e Formação de Preços (FPV por CCT) com CRM B2B, proposta interativa rastreada com assinatura digital e gestão de contratos.',
      },
      {
        question: 'Como testar o software de propostas e orçamento de terceirização gratuitamente?',
        answer:
          'Basta acessar smartbidhub.com.br/cadastro para liberar imediatamente 30 dias de teste grátis com acesso completo a todos os módulos, sem precisar de cartão de crédito.',
      },
    ],
  },
];

export const AUTOPILOT_SEO_TOPICS = [
  'Como montar proposta comercial de limpeza e conservação para condomínios e empresas (Modelo e Custos)',
  'Como calcular adicional de insalubridade 20% e 40% na limpeza de banheiros de uso coletivo (Súmula 448 TST)',
  'Planilha de custos para portaria presencial 24 horas: cálculo de 4 postos 12x36, intrajornada e adicional noturno',
  'Planilha de custos para jardinagem e conservação de áreas verdes: equipamentos, combustível e mão de obra',
  'Como orçar serviços Spot de limpeza pós-obra e tratamento de pisos com margem acima de 25%',
  'Checklist de implantação de contrato de Facilities (PIC): do fechamento comercial ao início operacional',
  'Como calcular o custo de ferista e reserva técnica em contratos de terceirização de mão de obra',
  'Diferença entre empreitada global e cessão de mão de obra (retenção de 11% INSS na Nota Fiscal)',
  'Como estruturar um processo de prospecção B2B para fechar contratos com indústrias, hospitais e condomínios',
  'Cálculo de depreciação de máquinas de limpeza (lavadoras de piso, enceradeiras e aspiradores) na FPV',
  'Como reduzir o turnover e o absenteísmo em contratos de limpeza e portaria terceirizada',
  'Guia de EPIs obrigatórios para limpeza hospitalar, industrial e trabalho em altura (NR-6 e NR-35)',
  'Como calcular repactuação e reajuste anual de contratos de terceirização pelo dissídio da CCT e IPCA',
  'Planilha de orçamento para recepção corporativa e controle de acesso terceirizado: salários, uniformes e BDI',
  'Tabela de produtividade de limpeza por m² (ABNT NBR 14082): áreas administrativas, banheiros, galpões e vidros',
  'Simples Nacional Anexo III vs Anexo IV na terceirização de limpeza, vigilância e portaria: qual escolher?',
  'Como calcular Vale-Transporte com desconto de 6% e Vale-Refeição nas escalas 5x2, 6x1 e 12x36',
  'Proposta comercial para manutenção predial preventiva e corretiva (PMOC, elétrica e hidráulica): como precificar',
  'Como apresentar uma proposta comercial de terceirização que vence concorrentes que jogam o preço lá embaixo',
  'Como calcular o Grupo B e Grupo C de encargos sociais (férias, 13º salário, aviso prévio e multa de 40% FGTS)',
  'Planilha de custos para zeladoria e bombeiro civil em condomínios comerciais e shoppings',
  'Cálculo de adicional noturno, hora noturna reduzida (52m30s) e reflexo no DSR para portaria e vigilância',
  'Como dimensionar enxoval de materiais químicos, papel higiênico e sabonete em contratos de limpeza empresarial',
  'Auditoria de folha e encargos trabalhistas em contratos de terceirização: como evitar passivo solidário',
  'Sistema de orçamento e propostas para empresas de segurança patrimonial, portaria e facilities',
];

const GOOGLE_SUGGEST_SEEDS = [
  'planilha de custos terceirizacao ',
  'como calcular posto 12x36 ',
  'proposta comercial limpeza e conservacao ',
  'orcamento de portaria e limpeza ',
  'software propostas terceirizacao ',
  'calculo encargos sociais terceirizacao ',
  'formacao de preco servicos terceirizados ',
  'planilha orcamentaria facilities ',
  'reajuste contrato prestacao de servicos ',
  'custo funcionario limpeza terceirizada ',
];

/**
 * Consulta em tempo real o Google Autocomplete Brasil (termos mais pesquisados pelos usuários no Google)
 * para descobrir dúvidas e buscas reais do mercado de Terceirização e Facilities.
 */
export async function fetchTrendingGoogleSearchTerms(): Promise<string[]> {
  const collected = new Set<string>();
  const dayOfYear = Math.floor(Date.now() / 86400000);
  // Seleciona 4 sementes rotativas por consulta para ser ultrarrápido
  const seedsToQuery = [
    GOOGLE_SUGGEST_SEEDS[dayOfYear % GOOGLE_SUGGEST_SEEDS.length],
    GOOGLE_SUGGEST_SEEDS[(dayOfYear + 2) % GOOGLE_SUGGEST_SEEDS.length],
    GOOGLE_SUGGEST_SEEDS[(dayOfYear + 5) % GOOGLE_SUGGEST_SEEDS.length],
    GOOGLE_SUGGEST_SEEDS[(dayOfYear + 7) % GOOGLE_SUGGEST_SEEDS.length],
  ];

  await Promise.all(
    seedsToQuery.map(async (seed) => {
      try {
        const url = `https://suggestqueries.google.com/complete/search?client=firefox&hl=pt-BR&gl=br&q=${encodeURIComponent(seed)}`;
        const res = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SmartBidSEO/1.0)' },
          signal: AbortSignal.timeout(3500),
        });
        if (res.ok) {
          const data = await res.json();
          const suggestions: string[] = Array.isArray(data?.[1]) ? data[1] : [];
          for (const s of suggestions) {
            const clean = String(s || '').trim();
            if (clean.length >= 18) {
              // Formata com inicial maiúscula como tema editorial
              const formatted = clean.charAt(0).toUpperCase() + clean.slice(1);
              collected.add(formatted);
            }
          }
        }
      } catch {
        // Silencia timeout individual do Google Suggest
      }
    })
  );

  // Combina os termos ao vivo do Google com o banco estratégico BOFU
  for (const topic of AUTOPILOT_SEO_TOPICS) {
    collected.add(topic);
  }

  return Array.from(collected);
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 90);
}

/**
 * Busca todos os artigos de SEO (os 8 Pilares + todos os artigos gerados por IA salvos no banco)
 */
export async function getAllSeoArticles(): Promise<SeoArticle[]> {
  let customArticles: SeoArticle[] = [];
  try {
    const records = await prisma.faqPadrao.findMany({
      where: {
        pergunta: { startsWith: SEO_RECORD_PREFIX },
      },
      orderBy: { createdAt: 'desc' },
    });

    for (const r of records) {
      try {
        const parsed = JSON.parse(r.resposta) as SeoArticle;
        if (parsed && parsed.slug && parsed.title) {
          customArticles.push({ ...parsed, isCustom: true });
        }
      } catch {
        // ignora registro malformado
      }
    }
  } catch (err) {
    console.warn('Aviso ao ler artigos customizados de SEO:', err);
  }

  // Mescla garantindo unicidade por slug (custom prevalece se mesmo slug)
  const map = new Map<string, SeoArticle>();
  for (const art of customArticles) {
    map.set(art.slug, art);
  }
  for (const art of PILLAR_SEO_ARTICLES) {
    if (!map.has(art.slug)) {
      map.set(art.slug, art);
    }
  }

  return Array.from(map.values()).sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

export async function getSeoArticleBySlug(slug: string): Promise<SeoArticle | null> {
  const all = await getAllSeoArticles();
  return all.find(a => a.slug === slug) || null;
}

export async function deleteCustomSeoArticle(slug: string): Promise<boolean> {
  try {
    await prisma.faqPadrao.deleteMany({
      where: {
        pergunta: `${SEO_RECORD_PREFIX}${slug}`,
      },
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Verifica se já foi publicado o artigo automático de hoje (fuso America/Sao_Paulo).
 * Caso ainda não tenha sido gerado hoje, busca os termos mais pesquisados no Google e publica 1 artigo inédito!
 */
export async function ensureDailyAutopilotArticle(): Promise<{
  triggered: boolean;
  article?: SeoArticle;
  todayDateKey: string;
}> {
  const todayDateKey = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());

  try {
    const all = await getAllSeoArticles();
    const alreadyPublishedToday = all.find((art) => {
      if (!art.isCustom) return false;
      const artDateKey = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Sao_Paulo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date(art.publishedAt));
      return artDateKey === todayDateKey;
    });

    if (alreadyPublishedToday) {
      return {
        triggered: false,
        article: alreadyPublishedToday,
        todayDateKey,
      };
    }

    const newArticle = await generateAndPublishSeoArticle();
    return {
      triggered: true,
      article: newArticle,
      todayDateKey,
    };
  } catch (err) {
    console.warn('Aviso no gatilho diário de SEO:', err);
    return { triggered: false, todayDateKey };
  }
}

/**
 * Gera um artigo completo de SEO estruturado (usando Gemini/OpenAI quando configurado ou o motor especialista nativo)
 * com base nos termos mais pesquisados no Google e salva automaticamente no banco para /conteudos/[slug] e /sitemap.xml
 */
export async function generateAndPublishSeoArticle(topicOrKeyword?: string): Promise<SeoArticle> {
  const existing = await getAllSeoArticles();
  const existingSlugs = new Set(existing.map(a => a.slug));

  let chosenTopic = (topicOrKeyword || '').trim();
  if (!chosenTopic) {
    // 1. Prioriza a fila curada de alta intenção comercial ainda não publicada
    const availableCurated = AUTOPILOT_SEO_TOPICS.filter(t => !existingSlugs.has(slugify(t)));
    if (availableCurated.length > 0) {
      chosenTopic = availableCurated[0];
    } else {
      // 2. Consulta ao vivo o Google Autocomplete Brasil para capturar novos termos em alta
      const trending = await fetchTrendingGoogleSearchTerms();
      const availableLive = trending.filter(t => !existingSlugs.has(slugify(t)));
      chosenTopic =
        availableLive[0] ||
        `Guia prático de formação de preços e orçamento de terceirização (${new Date().toLocaleDateString('pt-BR')})`;
    }
  }

  let baseSlug = slugify(chosenTopic);
  if (existingSlugs.has(baseSlug)) {
    baseSlug = `${baseSlug}-${Date.now().toString(36).slice(-4)}`;
  }

  const nowIso = new Date().toISOString();
  let generated: SeoArticle | null = null;

  const prompt = `Você é um especialista sênior em Engenharia de Custos, Formação de Preço de Venda (FPV), Convenções Coletivas (CCT), Tributação e Gestão Comercial para empresas de Facilities e Terceirização de Serviços no Brasil (Limpeza, Portaria, Manutenção, Vigilância, Jardinagem).
Crie um artigo técnico completo de SEO altamente persuasivo e otimizado para o Google e para a "Visão geral criada por IA" (AI Overviews) sobre o termo pesquisado: "${chosenTopic}".
Retorne APENAS um JSON válido (sem markdown) no seguinte formato exato:
{
  "title": "Título H1 magnético e otimizado para SEO (60 a 85 caracteres)",
  "metaDescription": "Resumo persuasivo de 140 a 158 caracteres para o Google",
  "category": "Engenharia de Custos & FPV",
  "readTimeMinutes": 8,
  "keywords": ["palavra 1", "palavra 2", "palavra 3", "palavra 4", "palavra 5"],
  "excerpt": "Subtítulo executivo de 2 linhas resumindo o valor prático do guia",
  "sections": [
    {
      "heading": "Subtítulo H2 da Seção 1 respondendo diretamente à intenção de busca",
      "paragraphs": ["Parágrafo 1 técnico com números reais do setor...", "Parágrafo 2 detalhado..."],
      "bullets": ["Ponto técnico 1", "Ponto técnico 2", "Ponto técnico 3"],
      "highlightBox": {
        "title": "Dica Prática SmartBid Hub",
        "text": "Explicação prática de como resolver isso automaticamente no SmartBid Hub..."
      }
    },
    {
      "heading": "Subtítulo H2 da Seção 2 com Tabela de Memória de Cálculo",
      "paragraphs": ["Explicação técnica da tabela..."],
      "table": {
        "headers": ["Item / Rubrica", "Regra Técnica / Base", "Impacto na Margem"],
        "rows": [
          ["Exemplo 1", "Detalhe 1", "Impacto 1"],
          ["Exemplo 2", "Detalhe 2", "Impacto 2"],
          ["Exemplo 3", "Detalhe 3", "Impacto 3"]
        ]
      }
    },
    {
      "heading": "Como automatizar esse cálculo e blindar sua margem no SmartBid Hub",
      "paragraphs": ["Conclusão prática mostrando como o SmartBid Hub substitui planilhas manuais com 30 dias de teste grátis..."]
    }
  ],
  "faqs": [
    { "question": "Pergunta frequente 1 sobre o tema?", "answer": "Resposta técnica e direta 1." },
    { "question": "Pergunta frequente 2 sobre o tema?", "answer": "Resposta técnica e direta 2." }
  ]
}`;

  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (geminiKey) {
    for (const modelName of ['gemini-2.0-flash', 'gemini-1.5-flash']) {
      if (generated) break;
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.4 },
            }),
            signal: AbortSignal.timeout(15000),
          }
        );

        if (res.ok) {
          const data = await res.json();
          const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
          const jsonMatch = rawText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed.title && Array.isArray(parsed.sections)) {
              generated = {
                slug: baseSlug,
                title: parsed.title,
                metaDescription: parsed.metaDescription || parsed.excerpt || chosenTopic,
                category: parsed.category || 'Engenharia de Custos & FPV',
                readTimeMinutes: Number(parsed.readTimeMinutes) || 8,
                publishedAt: nowIso,
                updatedAt: nowIso,
                keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [chosenTopic, 'SmartBid', 'Facilities', 'FPV'],
                excerpt: parsed.excerpt || parsed.metaDescription || chosenTopic,
                sections: parsed.sections,
                faqs: Array.isArray(parsed.faqs) ? parsed.faqs : [],
                isCustom: true,
              };
            }
          }
        }
      } catch (aiErr) {
        console.warn(`Aviso modelo ${modelName}:`, aiErr);
      }
    }
  }

  const openaiKey = process.env.OPENAI_API_KEY;
  if (!generated && openaiKey) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.4,
        }),
        signal: AbortSignal.timeout(15000),
      });
      if (res.ok) {
        const data = await res.json();
        const rawText = data?.choices?.[0]?.message?.content || '';
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.title && Array.isArray(parsed.sections)) {
            generated = {
              slug: baseSlug,
              title: parsed.title,
              metaDescription: parsed.metaDescription || parsed.excerpt || chosenTopic,
              category: parsed.category || 'Engenharia de Custos & FPV',
              readTimeMinutes: Number(parsed.readTimeMinutes) || 8,
              publishedAt: nowIso,
              updatedAt: nowIso,
              keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [chosenTopic, 'SmartBid', 'Facilities', 'FPV'],
              excerpt: parsed.excerpt || parsed.metaDescription || chosenTopic,
              sections: parsed.sections,
              faqs: Array.isArray(parsed.faqs) ? parsed.faqs : [],
              isCustom: true,
            };
          }
        }
      }
    } catch {}
  }

  // Motor Especialista Nativo Contextual (garante 100% de geração diária mesmo sem chave externa)
  if (!generated) {
    const lower = chosenTopic.toLowerCase();
    const isPortaria12x36 = lower.includes('12x36') || lower.includes('portaria') || lower.includes('vigil') || lower.includes('noturno');
    const isLimpezaInsalub = lower.includes('limpeza') || lower.includes('insalub') || lower.includes('m²') || lower.includes('jardinagem') || lower.includes('epi');
    const isTributarioReajuste = lower.includes('simples') || lower.includes('inss') || lower.includes('reajuste') || lower.includes('repactua') || lower.includes('tribut');

    const category = isTributarioReajuste
      ? 'Tributação & Contratos B2B'
      : isPortaria12x36
      ? 'Escalas & Portaria/Segurança'
      : isLimpezaInsalub
      ? 'Limpeza, Operações & CCT'
      : 'Engenharia de Custos & FPV';

    const cleanTitle =
      chosenTopic.length > 72
        ? chosenTopic
        : `${chosenTopic}: Guia Prático e Memória de Cálculo (2026)`;

    generated = {
      slug: baseSlug,
      title: cleanTitle,
      metaDescription: `Guia técnico completo sobre ${chosenTopic.toLowerCase()}. Veja a memória de cálculo exata na planilha de custos (FPV), regras de CCT, encargos e como automatizar no SmartBid Hub.`,
      category,
      readTimeMinutes: 8,
      publishedAt: nowIso,
      updatedAt: nowIso,
      keywords: [
        chosenTopic.toLowerCase(),
        'software montagem de propostas terceirização',
        'planilha de custos e formação de preços facilities',
        'cálculo de CCT e encargos sociais',
        'orçamento prestação de serviços',
        'SmartBid Hub',
      ],
      excerpt: `Análise técnica passo a passo sobre ${chosenTopic.toLowerCase()}, incluindo composição dos Montantes A, B e C, encargos trabalhistas, BDI e proteção de margem líquida em contratos de terceirização.`,
      sections: [
        {
          heading: `1. Entendendo na prática: ${chosenTopic}`,
          paragraphs: [
            `Para empresas de terceirização de mão de obra e gestão de Facilities (limpeza e conservação, portaria, controle de acesso, manutenção predial, jardinagem e apoio operacional), dominar o cálculo e as regras de "${chosenTopic}" é o que separa contratos lucrativos de operações deficitárias.`,
            `Quando o orçamento é montado em planilhas de Excel improvisadas, rubricas críticas como reflexo de adicionais sobre DSR, incidência cumulativa do Grupo A sobre o Grupo B (13º salário e férias), teto de 6% do Vale-Transporte e gross-up de impostos na Nota Fiscal costumam apresentar distorções que consomem de 4% a 8% da margem líquida.`,
          ],
          bullets: [
            'Memória de cálculo aberta e auditável (Montantes A, B, C, BDI e Tributos) pronta para exigências de compras B2B e licitações.',
            'Vinculação direta às Convenções Coletivas de Trabalho (CCT) de cada sindicato e região.',
            'Cálculo automático por regime tributário (Simples Nacional, Lucro Presumido, Lucro Real e transição IBS/CBS).',
          ],
          highlightBox: {
            title: 'Automatize este cálculo em segundos no SmartBid Hub',
            text: 'No SmartBid Hub, você seleciona a empresa emissora, o cargo da CCT e a escala de trabalho, e o motor de FPV calcula automaticamente todos os encargos, benefícios, materiais e impostos sem risco de erro humano.',
          },
        },
        {
          heading: '2. Quadro Técnico e Memória de Cálculo de Referência na FPV',
          paragraphs: [
            `A tabela abaixo resume os parâmetros técnicos que todo diretor comercial ou orçamentista deve validar ao estruturar "${chosenTopic}" dentro da Formação de Preço de Venda (FPV):`,
          ],
          table: {
            headers: ['Bloco da FPV / Rubrica', 'Regra Técnica de Cálculo', 'Como o SmartBid Hub Automatiza'],
            rows: [
              [
                'Montante A — Salário Base + Adicionais',
                'Piso normativo da CCT vigente + Insalubridade (20%/40%), Periculosidade (30%) ou Adicional Noturno + DSR',
                'Puxa automaticamente o piso e adicionais do cargo cadastrado na CCT com lupa de detalhamento',
              ],
              [
                'Grupos A, B, C, D, E e F de Encargos',
                'INSS Patronal (20%), FGTS (8%), RAT/FAP, Sistema S, 13º Salário, Férias + 1/3 e Provisão de Rescisão',
                'Aplica as alíquotas exatas com incidência cumulativa auditada sobre a remuneração total',
              ],
              [
                'Montante C — Benefícios Sindicais',
                'Vale-Refeição/Alimentação por dias trabalhados na escala + Vale-Transporte líquido da dedução de 6%',
                'Calcula os dias exatos conforme a escala (5x2, 6x1, 12x36 Diurno/Noturno, SDF ou Ferista)',
              ],
              [
                'Montante B — Uniformes, EPIs e Materiais',
                'Custo unitário dividido pela vida útil em meses + rateio mensal de químicos, descartáveis e máquinas',
                'Catálogo próprio integrado com buscador de preços de mercado na Web em tempo real',
              ],
              [
                'BDI e Impostos por Dentro (Gross-up)',
                'Preço Final = Custo Direto ÷ (1 − [% Tributos + % Taxa Adm + % Lucro + % Comissão])',
                'Calcula o divisor exato conforme a empresa emissora e gera a DRE projetada do contrato',
              ],
            ],
          },
        },
        {
          heading: '3. Como transformar sua FPV em uma Proposta Comercial de Alta Conversão',
          paragraphs: [
            'Não basta ter o cálculo técnico perfeito se a proposta demora dias para ficar pronta ou chega ao cliente como um PDF estático sem diferencial competitivo.',
            'Com o SmartBid Hub, assim que você finaliza a planilha de custos (FPV), o sistema gera automaticamente a Proposta Comercial executiva (por link interativo rastreável e PDF premium), avisa no seu painel quando o cliente abre a proposta e permite assinatura digital com validade jurídica.',
          ],
        },
      ],
      faqs: [
        {
          question: `Como evitar erros de planilha ao calcular "${chosenTopic}"?`,
          answer:
            'Substituindo planilhas manuais de Excel pelo motor de Formação de Preço de Venda (FPV) do SmartBid Hub, onde as fórmulas de encargos sociais, CCT, escalas, insumos e impostos por dentro já estão homologadas.',
        },
        {
          question: 'Posso testar o SmartBid Hub gratuitamente para montar minhas propostas?',
          answer:
            'Sim! Acesse smartbidhub.com.br/cadastro e libere imediatamente 30 dias de teste grátis com acesso completo a todos os módulos (CRM, Prospecção, CCTs, FPV, Propostas e Contratos), sem cartão de crédito.',
        },
      ],
      isCustom: true,
    };
  }

  // Salva no banco de dados (tabela FaqPadrao com prefixo [SEO_ARTICLE]:slug)
  await prisma.faqPadrao.create({
    data: {
      pergunta: `${SEO_RECORD_PREFIX}${generated.slug}`,
      resposta: JSON.stringify(generated),
      ordem: -999,
      tenantId: null,
    },
  });

  return generated;
}
