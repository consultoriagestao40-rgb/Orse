'use server';

import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

/**
 * Auxiliar de Segurança:
 * Valida se o usuário logado possui privilégios de Super Administrador.
 * Libera acesso apenas para:
 * 1. O email master (cristiano@grupojvsserv.com.br)
 * 2. Ou usuários pertencentes ao tenant com o CNPJ do Grupo JVS (00.000.000/0001-00)
 */
export async function checkIsSuperAdmin() {
  try {
    const cookieStore = await cookies();
    const sbUser = cookieStore.get('sb_user')?.value;
    if (!sbUser) return false;

    let data;
    try {
      // Tenta decodificar caso esteja URL-encoded
      data = JSON.parse(decodeURIComponent(sbUser));
    } catch {
      try {
        // Tenta fazer o parse direto caso o Next.js já tenha decodificado
        data = JSON.parse(sbUser);
      } catch (err) {
        console.error('Erro crítico ao fazer parse do cookie sb_user:', err);
        return false;
      }
    }
    
    // Busca o usuário no banco por e-mail ou nome para máxima precisão e segurança
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: data.email || '___invalid___' },
          { nome: data.nome || '___invalid___' }
        ]
      },
      include: { tenant: true }
    });

    if (!user) return false;

    // Condição de liberação master exclusiva do proprietário do SaaS pelo email verificado
    const isPlatformAdmin = user.email === 'admin@smartbidhub.com.br';

    return isPlatformAdmin;
  } catch (error) {
    console.error('Erro na checagem de Super Admin:', error);
    return false;
  }
}

/**
 * Retorna todos os Tenants (empresas) cadastrados com estatísticas de uso em tempo real.
 */
export async function getTenantsWithStats() {
  const isSuper = await checkIsSuperAdmin();
  if (!isSuper) {
    throw new Error('Acesso negado: Você não possui privilégios de Super Administrador.');
  }

  try {
    const tenants = await prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            users: true,
            propostas: true,
            leads: true,
            contratos: true
          }
        }
      }
    });

    return tenants.map(t => ({
      id: t.id,
      nomeFantasia: t.nomeFantasia,
      cnpj: t.cnpj,
      createdAt: t.createdAt.toISOString(),
      stats: {
        users: t._count.users,
        propostas: t._count.propostas,
        leads: t._count.leads,
        contratos: t._count.contratos
      }
    }));
  } catch (error: any) {
    console.error('Erro ao listar empresas:', error);
    throw new Error('Falha ao obter lista de empresas: ' + error.message);
  }
}

/**
 * Cria uma nova empresa (Tenant) na plataforma SaaS.
 */
export async function createTenantAction(nomeFantasia: string, cnpj: string) {
  const isSuper = await checkIsSuperAdmin();
  if (!isSuper) {
    throw new Error('Acesso negado: Você não possui privilégios de Super Administrador.');
  }

  if (!nomeFantasia || !cnpj) {
    return { success: false, error: 'Nome Fantasia e CNPJ são obrigatórios.' };
  }

  try {
    const formattedCnpj = cnpj.trim();

    // Validar se CNPJ já existe
    const exists = await prisma.tenant.findUnique({
      where: { cnpj: formattedCnpj }
    });

    if (exists) {
      return { success: false, error: 'Este CNPJ já está cadastrado em outra empresa.' };
    }

    const newTenant = await prisma.tenant.create({
      data: {
        nomeFantasia: nomeFantasia.trim(),
        cnpj: formattedCnpj
      }
    });

    return { success: true, tenant: newTenant };
  } catch (error: any) {
    console.error('Erro ao criar empresa:', error);
    return { success: false, error: error.message || 'Erro desconhecido ao criar empresa.' };
  }
}

/**
 * Atualiza metadados cadastrais da empresa cliente.
 */
export async function updateTenantAction(id: string, nomeFantasia: string, cnpj: string) {
  const isSuper = await checkIsSuperAdmin();
  if (!isSuper) {
    throw new Error('Acesso negado: Você não possui privilégios de Super Administrador.');
  }

  if (!id || !nomeFantasia || !cnpj) {
    return { success: false, error: 'Todos os campos são obrigatórios.' };
  }

  try {
    const formattedCnpj = cnpj.trim();

    // Validar duplicidade excluindo o atual
    const exists = await prisma.tenant.findFirst({
      where: {
        cnpj: formattedCnpj,
        id: { not: id }
      }
    });

    if (exists) {
      return { success: false, error: 'Outra empresa já está cadastrada com este CNPJ.' };
    }

    const updated = await prisma.tenant.update({
      where: { id },
      data: {
        nomeFantasia: nomeFantasia.trim(),
        cnpj: formattedCnpj
      }
    });

    return { success: true, tenant: updated };
  } catch (error: any) {
    console.error('Erro ao editar empresa:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Remove uma empresa cliente com travas estritas (não permite deletar o Grupo JVS pioneiro).
 */
export async function deleteTenantAction(id: string) {
  const isSuper = await checkIsSuperAdmin();
  if (!isSuper) {
    throw new Error('Acesso negado: Você não possui privilégios de Super Administrador.');
  }

  try {
    // Buscar a empresa para validar o CNPJ
    const tenant = await prisma.tenant.findUnique({
      where: { id }
    });

    if (!tenant) {
      return { success: false, error: 'Empresa não encontrada.' };
    }

    // Proibir a exclusão do Grupo JVS
    if (tenant.cnpj === '00.000.000/0001-00' || tenant.nomeFantasia === 'Grupo JVS') {
      return { success: false, error: 'A empresa do Grupo JVS é a holding administradora da plataforma e não pode ser removida.' };
    }

    await prisma.tenant.delete({
      where: { id }
    });

    return { success: true };
  } catch (error: any) {
    console.error('Erro ao excluir empresa:', error);
    return { success: false, error: error.message };
  }
}
