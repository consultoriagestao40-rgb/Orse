'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getLoggedUser } from '@/app/propostas/actions';

// UNIDADES DE MEDIDA
export async function getUnidadesMedida() {
  try {
    const unidades = await prisma.unidadeMedida.findMany({ orderBy: { nome: 'asc' } });
    if (unidades.length === 0) {
      // Popula com defaults se estiver vazio
      await prisma.unidadeMedida.createMany({
        data: [
          { nome: 'UN' },
          { nome: 'KG' },
          { nome: 'L' },
          { nome: 'MT' },
          { nome: 'M²' },
          { nome: 'PAR' },
          { nome: 'CX' },
        ],
        skipDuplicates: true
      });
      return await prisma.unidadeMedida.findMany({ orderBy: { nome: 'asc' } });
    }
    return unidades;
  } catch (error) {
    console.error('Erro ao buscar unidades:', error);
    return [];
  }
}

export async function createUnidadeMedida(nome: string) {
  try {
    const res = await prisma.unidadeMedida.create({
      data: { nome: nome.trim() }
    });
    revalidatePath('/admin/settings');
    return { success: true, data: res };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteUnidadeMedida(id: string) {
  try {
    await prisma.unidadeMedida.delete({ where: { id } });
    revalidatePath('/admin/settings');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// CATEGORIAS
export async function getCategorias() {
  try {
    return await prisma.categoria.findMany({ 
      orderBy: { nome: 'asc' } 
    });
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    return [];
  }
}

export async function createCategoria(nome: string) {
  try {
    const res = await prisma.categoria.create({
      data: { nome: nome.trim() }
    });
    revalidatePath('/admin/settings');
    revalidatePath('/produtos');
    return { success: true, data: res };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteCategoria(id: string) {
  try {
    await prisma.categoria.delete({ where: { id } });
    revalidatePath('/admin/settings');
    revalidatePath('/produtos');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// TIPOS DE SERVIÇO
export async function getTiposServico() {
  try {
    const tipos = await prisma.tipoServico.findMany({ orderBy: { nome: 'asc' } });
    if (tipos.length === 0) {
      // Popula com defaults se estiver vazio
      await prisma.tipoServico.createMany({
        data: [
          { nome: 'Limpeza e Conservação' },
          { nome: 'Portaria' },
          { nome: 'Jardinagem' },
          { nome: 'Manutenção Predial' },
          { nome: 'Full Service' }
        ],
        skipDuplicates: true
      });
      return await prisma.tipoServico.findMany({ orderBy: { nome: 'asc' } });
    }
    return tipos;
  } catch (error) {
    console.error('Erro ao buscar tipos de serviço:', error);
    return [];
  }
}

export async function createTipoServico(nome: string) {
  try {
    const res = await prisma.tipoServico.create({
      data: { nome: nome.trim() }
    });
    revalidatePath('/admin/settings');
    return { success: true, data: res };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteTipoServico(id: string) {
  try {
    await prisma.tipoServico.delete({ where: { id } });
    revalidatePath('/admin/settings');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getSellers() {
  try {
    const { getLoggedUser } = await import('@/app/propostas/actions');
    const user = await getLoggedUser();
    if (!user) return [];

    const users = await prisma.user.findMany({
      where: { tenantId: user.tenantId },
      orderBy: { nome: 'asc' },
      select: { id: true, nome: true, meta: true }
    });
    return users;
  } catch (error) {
    console.error('Erro ao buscar vendedores:', error);
    return [];
  }
}

export async function updateSellerMeta(userId: string, meta: number) {
  try {
    const { getLoggedUser } = await import('@/app/propostas/actions');
    const user = await getLoggedUser();
    if (!user || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) {
      return { success: false, error: 'Não autorizado' };
    }

    await prisma.user.update({
      where: { id: userId, tenantId: user.tenantId },
      data: { meta }
    });
    revalidatePath('/admin/settings');
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    console.error('Erro ao atualizar meta do vendedor:', error);
    return { success: false, error: error.message };
  }
}


// -- Segmentos --
export async function getSegmentos() {
  try {
    return await prisma.segmento.findMany({ orderBy: { nome: 'asc' } });
  } catch (error) {
    console.error('Erro ao buscar segmentos:', error);
    return [];
  }
}

export async function createSegmento(nome: string) {
  try {
    const res = await prisma.segmento.create({ data: { nome: nome.toUpperCase() } });
    revalidatePath('/admin/settings');
    revalidatePath('/clientes');
    revalidatePath('/clientes/[id]/edit', 'page');
    revalidatePath('/propostas/nova');
    return { success: true, data: res };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteSegmento(id: string) {
  try {
    await prisma.segmento.delete({ where: { id } });
    revalidatePath('/admin/settings');
    revalidatePath('/clientes');
    revalidatePath('/clientes/[id]/edit', 'page');
    revalidatePath('/propostas/nova');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// UPDATE E TOGGLE ACTIONS
export async function updateUnidadeMedida(id: string, nome: string) {
  try {
    const res = await prisma.unidadeMedida.update({
      where: { id },
      data: { nome: nome.trim() }
    });
    revalidatePath('/admin/settings');
    return { success: true, data: res };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function toggleUnidadeMedida(id: string, ativo: boolean) {
  try {
    const res = await prisma.unidadeMedida.update({
      where: { id },
      data: { ativo }
    });
    revalidatePath('/admin/settings');
    return { success: true, data: res };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateCategoria(id: string, nome: string) {
  try {
    const res = await prisma.categoria.update({
      where: { id },
      data: { nome: nome.trim() }
    });
    revalidatePath('/admin/settings');
    revalidatePath('/produtos');
    return { success: true, data: res };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function toggleCategoria(id: string, ativo: boolean) {
  try {
    const res = await prisma.categoria.update({
      where: { id },
      data: { ativo }
    });
    revalidatePath('/admin/settings');
    revalidatePath('/produtos');
    return { success: true, data: res };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateTipoServico(id: string, nome: string) {
  try {
    const res = await prisma.tipoServico.update({
      where: { id },
      data: { nome: nome.trim() }
    });
    revalidatePath('/admin/settings');
    return { success: true, data: res };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function toggleTipoServico(id: string, ativo: boolean) {
  try {
    const res = await prisma.tipoServico.update({
      where: { id },
      data: { ativo }
    });
    revalidatePath('/admin/settings');
    return { success: true, data: res };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateSegmento(id: string, nome: string) {
  try {
    const res = await prisma.segmento.update({
      where: { id },
      data: { nome: nome.toUpperCase().trim() }
    });
    revalidatePath('/admin/settings');
    revalidatePath('/clientes');
    revalidatePath('/clientes/[id]/edit', 'page');
    revalidatePath('/propostas/nova');
    return { success: true, data: res };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function toggleSegmento(id: string, ativo: boolean) {
  try {
    const res = await prisma.segmento.update({
      where: { id },
      data: { ativo }
    });
    revalidatePath('/admin/settings');
    revalidatePath('/clientes');
    revalidatePath('/clientes/[id]/edit', 'page');
    revalidatePath('/propostas/nova');
    return { success: true, data: res };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// PERGUNTAS FREQUENTES (FAQ)
export async function getFaqsPadrao() {
  try {
    const { getLoggedUser } = await import('@/app/propostas/actions');
    const user = await getLoggedUser();
    const whereClause: any = {};
    if (user?.tenantId) {
      whereClause.tenantId = user.tenantId;
    } else {
      whereClause.tenantId = null;
    }
    return await prisma.faqPadrao.findMany({
      where: whereClause,
      orderBy: { ordem: 'asc' }
    });
  } catch (error) {
    console.error('Erro ao buscar FAQs padrões:', error);
    return [];
  }
}

export async function createFaqPadrao(pergunta: string, resposta: string, ordem: number = 0) {
  try {
    const { getLoggedUser } = await import('@/app/propostas/actions');
    const user = await getLoggedUser();
    const tenantId = user?.tenantId || null;
    const res = await prisma.faqPadrao.create({
      data: {
        pergunta: pergunta.trim(),
        resposta: resposta.trim(),
        ordem,
        tenantId
      }
    });
    revalidatePath('/admin/settings');
    return { success: true, data: res };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateFaqPadrao(id: string, pergunta: string, resposta: string, ordem: number = 0) {
  try {
    const res = await prisma.faqPadrao.update({
      where: { id },
      data: {
        pergunta: pergunta.trim(),
        resposta: resposta.trim(),
        ordem
      }
    });
    revalidatePath('/admin/settings');
    return { success: true, data: res };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteFaqPadrao(id: string) {
  try {
    await prisma.faqPadrao.delete({ where: { id } });
    revalidatePath('/admin/settings');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateUserTimezone(timezone: string) {
  try {
    const { getLoggedUser } = await import('@/app/propostas/actions');
    const user = await getLoggedUser();
    if (!user) {
      return { success: false, error: 'Usuário não autenticado.' };
    }

    // Atualiza no banco
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { timezone }
    });

    // Atualiza o cookie de sessão no servidor
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const sbUser = cookieStore.get('sb_user')?.value;
    if (sbUser) {
      let data: any = null;
      let cleaned = sbUser.trim();
      if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
        cleaned = cleaned.slice(1, -1);
      }
      try {
        data = JSON.parse(decodeURIComponent(cleaned));
      } catch {
        data = JSON.parse(sbUser);
      }
      if (data) {
        data.timezone = timezone;
        cookieStore.set('sb_user', JSON.stringify(data), {
          path: '/',
          maxAge: 60 * 60 * 24 * 7,
          secure: true,
          sameSite: 'lax'
        });
      }
    }

    revalidatePath('/admin/settings');
    revalidatePath('/');
    return { success: true, user: updatedUser };
  } catch (error: any) {
    console.error('Erro ao atualizar fuso horário:', error);
    return { success: false, error: error.message };
  }
}

// ==========================================
// CONFIGURAÇÃO DE E-MAIL DO SISTEMA (SAAS SMTP)
// ==========================================
export async function getSystemSmtpSettings() {
  try {
    const account = await prisma.smtpAccount.findFirst({
      where: { isSystem: true }
    });

    if (!account) {
      return {
        configured: false,
        host: process.env.SMTP_HOST || 'smtp.hostinger.com',
        port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 465,
        user: process.env.SMTP_USER || '',
        fromEmail: process.env.SMTP_FROM_EMAIL || '',
        fromName: process.env.SMTP_FROM_NAME || 'SmartBid • Notificações',
        active: true
      };
    }

    return {
      configured: true,
      id: account.id,
      host: account.host,
      port: account.port,
      user: account.user,
      fromEmail: account.fromEmail,
      fromName: account.fromName,
      active: account.active
    };
  } catch (error: any) {
    console.error('Erro ao buscar configurações SMTP do sistema:', error);
    return { error: error.message };
  }
}

export async function saveSystemSmtpSettings(data: {
  host: string;
  port: number;
  user: string;
  password?: string;
  fromEmail: string;
  fromName: string;
  active?: boolean;
}) {
  try {
    const existing = await prisma.smtpAccount.findFirst({
      where: { isSystem: true }
    });

    const updateData: any = {
      nome: 'E-mail Oficial do Sistema SaaS',
      host: data.host.trim(),
      port: Number(data.port) || 465,
      user: data.user.trim(),
      fromEmail: data.fromEmail.trim(),
      fromName: data.fromName.trim() || 'SmartBid',
      active: data.active ?? true,
      isSystem: true
    };

    if (data.password && data.password.trim().length > 0) {
      updateData.password = data.password.trim();
    }

    if (existing) {
      const res = await prisma.smtpAccount.update({
        where: { id: existing.id },
        data: updateData
      });
      revalidatePath('/admin/settings');
      return { success: true, data: res };
    } else {
      if (!data.password || data.password.trim().length === 0) {
        return { success: false, error: 'A senha do e-mail é obrigatória para a primeira configuração.' };
      }
      updateData.password = data.password.trim();
      const res = await prisma.smtpAccount.create({
        data: updateData
      });
      revalidatePath('/admin/settings');
      return { success: true, data: res };
    }
  } catch (error: any) {
    console.error('Erro ao salvar SMTP do sistema:', error);
    return { success: false, error: error.message || 'Erro ao salvar configurações' };
  }
}

export async function testSystemSmtpConnection(targetEmail: string) {
  try {
    const { sendMail } = await import('@/lib/mail');
    const res = await sendMail({
      to: targetEmail.trim(),
      fromName: 'SmartBid • Teste de Sistema',
      subject: '✅ Teste de Conexão SMTP Bem-Sucedido — SmartBid',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 28px; border: 1px solid #e2e8f0; border-radius: 16px; max-width: 500px; margin: 0 auto;">
          <div style="background: #1B4D3E; padding: 16px; border-radius: 12px; text-align: center; margin-bottom: 20px;">
            <h2 style="color: #ffffff; margin: 0; font-size: 18px; text-transform: uppercase;">SmartBid • Conexão SMTP OK</h2>
          </div>
          <p style="color: #475569; font-size: 14px; line-height: 1.6;">
            Este é um e-mail de teste disparado pelo painel administrativo da <strong>SmartBid</strong> para validar a autenticação do seu servidor Hostinger.
          </p>
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px; margin: 20px 0;">
            <p style="color: #166534; font-size: 13.5px; font-weight: bold; margin: 0;">
              ✨ Seus disparos de e-mail institucional estão 100% operacionais.
            </p>
          </div>
          <p style="color: #94a3b8; font-size: 11px; margin: 0;">
            Enviado em: ${new Date().toLocaleString('pt-BR')}
          </p>
        </div>
      `,
      text: 'Este é um e-mail de teste da plataforma SmartBid para validar a conexão SMTP com a Hostinger.'
    });

    if (res.simulated) {
      return { success: false, error: 'As credenciais SMTP não estão completamente preenchidas ou foram simuladas.' };
    }

    if (!res.success) {
      return { success: false, error: res.error || 'Falha ao conectar no servidor SMTP da Hostinger. Verifique host, porta, usuário e senha.' };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Erro ao realizar teste de disparo' };
  }
}

// -------------------------------------------------------------
// EXPORTAÇÃO INTEGRAL DE DADOS (LGPD / ENCERRAMENTO DE CONTA)
// -------------------------------------------------------------
export async function exportFullTenantData() {
  const user = await getLoggedUser();
  if (!user || !user.tenantId) {
    return { success: false, error: 'Acesso não autorizado ou empresa não identificada.' };
  }
  if (user.role !== 'ADMIN') {
    return { success: false, error: 'Apenas administradores podem realizar o download integral dos dados da empresa.' };
  }

  try {
    const tenantId = user.tenantId;

    const [
      tenant,
      clientes,
      propostas,
      contratos,
      leads,
      atas,
      produtos,
      ccts,
      usuarios
    ] = await Promise.all([
      prisma.tenant.findUnique({ where: { id: tenantId } }),
      prisma.client.findMany({ where: { tenantId }, orderBy: { nomeFantasia: 'asc' } }),
      prisma.proposta.findMany({
        where: { tenantId },
        include: {
          client: true,
          versoes: {
            orderBy: { versao: 'desc' },
            include: { items: true }
          },
          documentosComerciais: true
        },
        orderBy: { numero: 'desc' }
      }),
      prisma.contrato.findMany({
        where: { tenantId },
        include: { client: true, empresaEmissora: true, clausulas: { orderBy: { ordem: 'asc' } } },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.lead.findMany({
        where: { tenantId },
        include: { stage: true, contacts: true },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.ata.findMany({
        where: { tenantId, titulo: { not: '__SYSTEM_PLANNING_DATA__' } },
        include: { acoes: true },
        orderBy: { dataReuniou: 'desc' }
      }),
      prisma.produto.findMany({ where: { tenantId }, orderBy: { codigo: 'asc' } }),
      prisma.cCT.findMany({ where: { tenantId }, include: { cargos: true }, orderBy: { nome: 'asc' } }),
      prisma.user.findMany({
        where: { tenantId },
        select: { id: true, nome: true, email: true, role: true, ativo: true, cargo: true, createdAt: true }
      })
    ]);

    const exportPayload = {
      exportadoEm: new Date().toISOString(),
      versaoEsquema: '2.0-LGPD',
      empresa: {
        id: tenant?.id,
        nomeFantasia: tenant?.nomeFantasia || '',
        razaoSocial: tenant?.razaoSocial || '',
        cnpj: tenant?.cnpj || '',
        email: tenant?.email || '',
        telefone: tenant?.telefone || ''
      },
      solicitante: {
        nome: user.nome,
        email: user.email,
        perfil: user.role
      },
      estatisticas: {
        totalClientes: clientes.length,
        totalPropostas: propostas.length,
        totalContratos: contratos.length,
        totalLeads: leads.length,
        totalAtas: atas.length,
        totalProdutos: produtos.length,
        totalCcts: ccts.length,
        totalUsuarios: usuarios.length
      },
      dados: {
        clientes,
        propostas,
        contratos,
        leads,
        atas,
        produtos,
        ccts,
        usuarios
      }
    };

    return { success: true, data: JSON.parse(JSON.stringify(exportPayload)) };
  } catch (error: any) {
    console.error('Erro ao exportar dados do inquilino:', error);
    return { success: false, error: error.message || 'Erro ao gerar exportação de dados' };
  }
}
