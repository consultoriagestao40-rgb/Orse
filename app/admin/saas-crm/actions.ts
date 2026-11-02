'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

import { SAAS_AVAILABLE_MODULES, type SaasModuleConfig } from './constants';

// 1. CARREGAR DADOS GERAIS DO CRM, TRÁFEGO E CONCORRENTES
export async function getSaasCRMData() {
  try {
    // 1.1 Leads do CRM SmartBid
    let leads = await prisma.saasLead.findMany({
      include: {
        propostas: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Se a base estiver vazia, cria dados demonstrativos iniciais
    if (leads.length === 0) {
      await seedInitialSaasData();
      leads = await prisma.saasLead.findMany({
        include: { propostas: { orderBy: { createdAt: 'desc' } } },
        orderBy: { createdAt: 'desc' },
      });
    }

    // 1.2 Propostas geradas
    const propostas = await prisma.saasProposta.findMany({
      include: { lead: true },
      orderBy: { createdAt: 'desc' },
    });

    // 1.3 Palavras-chave
    let keywords = await prisma.trafficKeyword.findMany({
      orderBy: [{ cliques: 'desc' }, { impressoes: 'desc' }],
    });

    // 1.4 Concorrentes do Leilão (Auction Insights)
    let competitors = await prisma.trafficCompetitor.findMany({
      orderBy: { impressoesShare: 'desc' },
    });

    return {
      success: true,
      leads,
      propostas,
      keywords,
      competitors,
    };
  } catch (error: any) {
    console.error('[getSaasCRMData] Erro:', error);
    return { success: false, error: error.message };
  }
}

// 2. CRIAR / EDITAR LEAD NO CRM DO SAAS
export async function createOrUpdateSaasLead(data: {
  id?: string;
  nome: string;
  empresa: string;
  email: string;
  telefone: string;
  cargo?: string;
  tamanhoEmpresa?: string;
  origem?: string;
  status?: string;
  valorMensal?: number;
  valorSetup?: number;
  notas?: string;
  tags?: string;
}) {
  try {
    if (data.id) {
      const updated = await prisma.saasLead.update({
        where: { id: data.id },
        data: {
          nome: data.nome,
          empresa: data.empresa,
          email: data.email,
          telefone: data.telefone,
          cargo: data.cargo,
          tamanhoEmpresa: data.tamanhoEmpresa,
          origem: data.origem || 'LP',
          status: data.status || 'NOVO',
          valorMensal: Number(data.valorMensal || 0),
          valorSetup: Number(data.valorSetup || 0),
          notas: data.notas,
          tags: data.tags,
        },
      });
      revalidatePath('/admin/saas-crm');
      return { success: true, lead: updated };
    } else {
      const created = await prisma.saasLead.create({
        data: {
          nome: data.nome,
          empresa: data.empresa,
          email: data.email,
          telefone: data.telefone,
          cargo: data.cargo,
          tamanhoEmpresa: data.tamanhoEmpresa,
          origem: data.origem || 'LP',
          status: data.status || 'NOVO',
          valorMensal: Number(data.valorMensal || 0),
          valorSetup: Number(data.valorSetup || 0),
          notas: data.notas,
          tags: data.tags,
        },
      });
      revalidatePath('/admin/saas-crm');
      return { success: true, lead: created };
    }
  } catch (error: any) {
    console.error('[createOrUpdateSaasLead] Erro:', error);
    return { success: false, error: error.message };
  }
}

// 3. ATUALIZAR STATUS DO LEAD NO KANBAN
export async function updateSaasLeadStatus(leadId: string, status: string) {
  try {
    const updated = await prisma.saasLead.update({
      where: { id: leadId },
      data: { status },
    });
    revalidatePath('/admin/saas-crm');
    return { success: true, lead: updated };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 4. DELETAR LEAD DO CRM
export async function deleteSaasLead(leadId: string) {
  try {
    await prisma.saasLead.delete({ where: { id: leadId } });
    revalidatePath('/admin/saas-crm');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 5. GERADOR INTELIGENTE DE PROPOSTA COMERCIAL SAAS (FLEGÁVEL)
export async function createSaasProposta(data: {
  leadId?: string;
  empresaNome: string;
  cnpj?: string;
  contatoNome: string;
  contatoEmail: string;
  contatoTelefone: string;
  modulos: string[]; // ids dos modulos flegados
  plano: 'MENSAL' | 'SEMESTRAL' | 'ANUAL';
  valorMensal: number;
  valorSetup: number;
  descontoSetup: number;
  maxUsuarios: number;
  condicoesEspeciais?: string;
}) {
  try {
    // 5.1 Se não tiver leadId, cria ou atualiza lead correspondente
    let leadId = data.leadId;
    if (!leadId) {
      const existingLead = await prisma.saasLead.findFirst({
        where: { email: data.contatoEmail },
      });
      if (existingLead) {
        leadId = existingLead.id;
        await prisma.saasLead.update({
          where: { id: leadId },
          data: {
            status: 'PROPOSTA_ENVIADA',
            valorMensal: data.valorMensal,
            valorSetup: Math.max(0, data.valorSetup - data.descontoSetup),
          },
        });
      } else {
        const newLead = await prisma.saasLead.create({
          data: {
            nome: data.contatoNome,
            empresa: data.empresaNome,
            email: data.contatoEmail,
            telefone: data.contatoTelefone,
            status: 'PROPOSTA_ENVIADA',
            valorMensal: data.valorMensal,
            valorSetup: Math.max(0, data.valorSetup - data.descontoSetup),
            origem: 'REUNIAO',
          },
        });
        leadId = newLead.id;
      }
    } else {
      await prisma.saasLead.update({
        where: { id: leadId },
        data: {
          status: 'PROPOSTA_ENVIADA',
          valorMensal: data.valorMensal,
          valorSetup: Math.max(0, data.valorSetup - data.descontoSetup),
        },
      });
    }

    // 5.2 Cria a proposta interativa
    const proposta = await prisma.saasProposta.create({
      data: {
        leadId,
        empresaNome: data.empresaNome,
        cnpj: data.cnpj,
        contatoNome: data.contatoNome,
        contatoEmail: data.contatoEmail,
        contatoTelefone: data.contatoTelefone,
        modulos: JSON.stringify(data.modulos),
        plano: data.plano,
        valorMensal: data.valorMensal,
        valorSetup: data.valorSetup,
        descontoSetup: data.descontoSetup,
        maxUsuarios: data.maxUsuarios,
        condicoesEspeciais: data.condicoesEspeciais,
        status: 'ENVIADA',
      },
    });

    const publicUrl = `https://smartbidhub.com.br/proposta/smartbid/${proposta.token}`;

    revalidatePath('/admin/saas-crm');
    return {
      success: true,
      proposta,
      token: proposta.token,
      publicUrl,
    };
  } catch (error: any) {
    console.error('[createSaasProposta] Erro:', error);
    return { success: false, error: error.message };
  }
}

// 6. BUSCAR PROPOSTA PELO TOKEN (LINK PÚBLICO DO CLIENTE)
export async function getSaasPropostaByToken(token: string) {
  try {
    const proposta = await prisma.saasProposta.findUnique({
      where: { token },
      include: { lead: true },
    });

    if (!proposta) {
      return { success: false, error: 'Proposta não localizada ou expirada.' };
    }

    // Marca como visualizada se ainda estiver apenas como enviada
    if (proposta.status === 'ENVIADA') {
      await prisma.saasProposta.update({
        where: { id: proposta.id },
        data: { status: 'VISUALIZADA' },
      });
    }

    return {
      success: true,
      proposta: {
        ...proposta,
        modulosArray: JSON.parse(proposta.modulos || '[]'),
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 7. ASSINATURA DIGITAL DA PROPOSTA PELO CLIENTE
export async function signSaasProposta(
  token: string,
  params: {
    nome: string;
    cpfOuCargo: string;
    ip?: string;
  }
) {
  try {
    const proposta = await prisma.saasProposta.findUnique({
      where: { token },
    });

    if (!proposta) {
      return { success: false, error: 'Proposta não encontrada.' };
    }

    // 7.1 Gera código Pix simulado ou real
    const pixCode = `00020101021226850014br.gov.bcb.pix2563qrcode.asaas.com/qr/v2/smartbid-${proposta.id.slice(0, 8)}`;
    const pixCopiaECola = pixCode;

    // 7.2 Atualiza status da proposta para ASSINADA
    const updatedProposta = await prisma.saasProposta.update({
      where: { id: proposta.id },
      data: {
        status: 'ASSINADA',
        assinadoEm: new Date(),
        assinadoPorNome: params.nome,
        assinadoPorCpf: params.cpfOuCargo,
        assinadoPorIp: params.ip || '127.0.0.1',
        asaasPixQrCode: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(pixCode)}`,
        asaasPixCopiaECola: pixCopiaECola,
      },
    });

    // 7.3 Atualiza o lead no CRM para FECHADO
    if (proposta.leadId) {
      await prisma.saasLead.update({
        where: { id: proposta.leadId },
        data: { status: 'FECHADO' },
      });
    }

    revalidatePath('/admin/saas-crm');
    revalidatePath(`/proposta/smartbid/${token}`);

    return {
      success: true,
      proposta: updatedProposta,
      pixCode,
      qrCodeUrl: updatedProposta.asaasPixQrCode,
    };
  } catch (error: any) {
    console.error('[signSaasProposta] Erro:', error);
    return { success: false, error: error.message };
  }
}

// 8. OTIMIZAÇÃO DE PALAVRAS-CHAVE (NEGATIVAR / REATIVAR)
export async function toggleNegativeKeyword(id: string, novoStatus: 'ATIVA' | 'NEGATIVADA', motivo?: string) {
  try {
    const updated = await prisma.trafficKeyword.update({
      where: { id },
      data: {
        status: novoStatus,
        motivoNegativacao: novoStatus === 'NEGATIVADA' ? (motivo || 'Baixo ROI / Cliques desqualificados') : null,
        negativadaEm: novoStatus === 'NEGATIVADA' ? new Date() : null,
      },
    });
    revalidatePath('/admin/saas-crm');
    return { success: true, keyword: updated };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 9. ADICIONAR NOVA PALAVRA-CHAVE OU TERMO DE BUSCA
export async function addTrafficKeyword(data: {
  termo: string;
  status?: 'ATIVA' | 'NEGATIVADA';
  motivo?: string;
}) {
  try {
    const cleanTermo = data.termo.trim().toLowerCase();
    const created = await prisma.trafficKeyword.upsert({
      where: { termo: cleanTermo },
      update: {
        status: data.status || 'ATIVA',
        motivoNegativacao: data.motivo,
      },
      create: {
        termo: cleanTermo,
        status: data.status || 'ATIVA',
        motivoNegativacao: data.motivo,
        cliques: 0,
        impressoes: 0,
        custoTotal: 0,
        conversoes: 0,
      },
    });
    revalidatePath('/admin/saas-crm');
    return { success: true, keyword: created };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 10. TESTAR CONEXÃO COM A API DO ASAAS
export async function testAsaasKeyAction(apiKey: string) {
  try {
    if (!apiKey || !apiKey.trim()) {
      return { success: false, error: 'Por favor, informe a Chave de API do Asaas.' };
    }

    const cleanKey = apiKey.trim();
    const baseUrl = cleanKey.startsWith('$aact_prod')
      ? 'https://api.asaas.com/v3'
      : 'https://sandbox.asaas.com/api/v3';

    const res = await fetch(`${baseUrl}/finance/balance`, {
      method: 'GET',
      headers: {
        access_token: cleanKey,
        'Content-Type': 'application/json',
      },
    });

    if (res.ok) {
      const data = await res.json();
      return {
        success: true,
        ambiente: cleanKey.startsWith('$aact_prod') ? 'PRODUÇÃO' : 'SANDBOX (TESTES)',
        saldo: data.balance ?? 0,
        message: 'Conexão com Asaas realizada com sucesso! API ativa e pronta para emitir PIX e Cartão.',
      };
    } else {
      const errorText = await res.text();
      return {
        success: false,
        error: `Asaas retornou HTTP ${res.status}: Chave inválida ou expirada.`,
        details: errorText,
      };
    }
  } catch (error: any) {
    return { success: false, error: `Falha de rede com Asaas: ${error.message}` };
  }
}

// FUNÇÃO AUXILIAR: CRIAÇÃO DE DADOS INICIAIS INTELIGENTES
async function seedInitialSaasData() {
  try {
    // Cria alguns leads no funil
    await prisma.saasLead.createMany({
      data: [
        {
          nome: 'Roberto Antunes',
          empresa: 'Grupovip Serviços & Segurança',
          email: 'roberto@grupovipservicos.com.br',
          telefone: '(11) 98765-4321',
          cargo: 'Diretor Comercial',
          tamanhoEmpresa: '51-200',
          origem: 'GOOGLE_ADS',
          status: 'DEMO_AGENDADA',
          valorMensal: 890.0,
          valorSetup: 1500.0,
          notas: 'Quer automatizar o cálculo de FPV e cálculo de encargos sociais da CCT de Asseio e Conservação SP.',
          tags: 'Facilities, CCT, FPV',
        },
        {
          nome: 'Mariana Duarte',
          empresa: 'Alfa Facilities & Portaria',
          email: 'mariana.duarte@alfafacilities.com.br',
          telefone: '(21) 99123-8899',
          cargo: 'Gerente Operacional',
          tamanhoEmpresa: '200+',
          origem: 'LP',
          status: 'PROPOSTA_ENVIADA',
          valorMensal: 1190.0,
          valorSetup: 1800.0,
          notas: 'Apresentada demo em 30/10. Muito interessada no App de entrega de EPIs com assinatura e CRM.',
          tags: 'App EPI, CRM, Contratos',
        },
        {
          nome: 'Carlos Mendonça',
          empresa: 'Mendonça Conservação',
          email: 'carlos@mendoncaservicos.com.br',
          telefone: '(31) 98456-1122',
          cargo: 'Sócio-Fundador',
          tamanhoEmpresa: '11-50',
          origem: 'WHATSAPP',
          status: 'QUALIFICADO',
          valorMensal: 590.0,
          valorSetup: 1000.0,
          notas: 'Precisa substituir as planilhas manuais de Excel que estão dando prejuízo em licitações e contratos privados.',
          tags: 'Excel, Margem, Starter',
        },
      ],
      skipDuplicates: true,
    });

    // Cria palavras-chave de tráfego com análise de performance
    await prisma.trafficKeyword.createMany({
      data: [
        {
          termo: 'sistema para empresas de facilities',
          origem: 'GOOGLE_ADS',
          cliques: 245,
          impressoes: 2890,
          custoTotal: 833.0,
          conversoes: 22,
          status: 'ATIVA',
        },
        {
          termo: 'software formacao preco terceirizacao',
          origem: 'GOOGLE_ADS',
          cliques: 180,
          impressoes: 1650,
          custoTotal: 612.0,
          conversoes: 18,
          status: 'ATIVA',
        },
        {
          termo: 'planilha custo asseio e conservacao gratis',
          origem: 'GOOGLE_ADS',
          cliques: 310,
          impressoes: 4120,
          custoTotal: 589.0,
          conversoes: 1, // Torrando verba!
          status: 'NEGATIVADA',
          motivoNegativacao: 'Usuários buscando arquivos gratuitos sem intenção de contratar SaaS corporativo.',
          negativadaEm: new Date(),
        },
        {
          termo: 'sistema gestao contratos terceirizados',
          origem: 'GOOGLE_ADS',
          cliques: 140,
          impressoes: 1420,
          custoTotal: 490.0,
          conversoes: 14,
          status: 'ATIVA',
        },
        {
          termo: 'como abrir empresa de limpeza e portaria',
          origem: 'GOOGLE_ADS',
          cliques: 195,
          impressoes: 3400,
          custoTotal: 370.5,
          conversoes: 0,
          status: 'NEGATIVADA',
          motivoNegativacao: 'Tráfego de iniciantes/MEI sem porte para contratação de SaaS.',
          negativadaEm: new Date(),
        },
      ],
      skipDuplicates: true,
    });

    // Cria concorrentes disputando o leilão no Google Ads (Auction Insights)
    await prisma.trafficCompetitor.createMany({
      data: [
        {
          dominio: 'smartbidhub.com.br',
          nomeEmpresa: 'SmartBid (Sua Conta)',
          impressoesShare: 38.5,
          sobreposicao: 100.0,
          posicaoSuperior: 78.4,
          lanceEstimado: 3.4,
        },
        {
          dominio: 'totvs.com/prestadores-servicos',
          nomeEmpresa: 'TOTVS Prestadores de Serviços',
          impressoesShare: 24.2,
          sobreposicao: 46.1,
          posicaoSuperior: 82.0,
          lanceEstimado: 5.8,
        },
        {
          dominio: 'senior.com.br/facilities',
          nomeEmpresa: 'Senior Sistemas Facilities',
          impressoesShare: 18.7,
          sobreposicao: 39.5,
          posicaoSuperior: 69.2,
          lanceEstimado: 4.9,
        },
        {
          dominio: 'softcomtecnologia.com.br',
          nomeEmpresa: 'Softcom Gestão & FPV',
          impressoesShare: 11.4,
          sobreposicao: 28.0,
          posicaoSuperior: 44.1,
          lanceEstimado: 2.8,
        },
      ],
      skipDuplicates: true,
    });
  } catch (seedErr) {
    console.warn('[seedInitialSaasData] Aviso:', seedErr);
  }
}
