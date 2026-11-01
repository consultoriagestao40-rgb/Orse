'use server';

import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { getLoggedUser } from '@/app/propostas/actions';
import { revalidatePath } from 'next/cache';

import type { TenantFeaturesConfig } from './constants';



export async function getTenantsForModulosAction() {
  try {
    const user = await getLoggedUser();
    if (!user) {
      return { success: false, error: 'Não autenticado' };
    }

    const platformAccounts = ['admin@smartbidhub.com.br', 'admin@smartbid.com'];
    const isPlatformAdmin = user.email ? platformAccounts.includes(user.email.toLowerCase().trim()) : false;

    // Super Admin vê todos; Admin regular vê apenas a sua empresa
    const tenants = await prisma.tenant.findMany({
      where: isPlatformAdmin ? {} : { id: user.tenantId || '' },
      select: {
        id: true,
        nomeFantasia: true,
        cnpj: true,
        plano: true,
        limiteUsuarios: true,
        features: true,
        ativo: true,
        createdAt: true,
        _count: {
          select: { users: true }
        }
      },
      orderBy: { nomeFantasia: 'asc' }
    });

    return { 
      success: true, 
      tenants: tenants.map(t => {
        let parsedFeatures: TenantFeaturesConfig = {};
        if (t.features) {
          if (typeof t.features === 'string') {
            try { parsedFeatures = JSON.parse(t.features); } catch {}
          } else if (typeof t.features === 'object') {
            parsedFeatures = t.features as any;
          }
        }
        return {
          ...t,
          features: parsedFeatures
        };
      }),
      isPlatformAdmin,
      currentTenantId: user.tenantId
    };
  } catch (error: any) {
    console.error('Erro ao buscar empresas para módulos:', error);
    return { success: false, error: error.message };
  }
}

export async function updateTenantModulosAction(
  tenantId: string, 
  features: TenantFeaturesConfig,
  limiteUsuarios?: number,
  plano?: string
) {
  try {
    const user = await getLoggedUser();
    if (!user) {
      return { success: false, error: 'Não autenticado' };
    }

    const platformAccounts = ['admin@smartbidhub.com.br', 'admin@smartbid.com'];
    const isPlatformAdmin = user.email ? platformAccounts.includes(user.email.toLowerCase().trim()) : false;

    // Apenas Super Admin ou Admin da própria empresa
    if (!isPlatformAdmin && user.tenantId !== tenantId) {
      return { success: false, error: 'Permissão negada' };
    }

    const updated = await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        features: features as any,
        ...(limiteUsuarios !== undefined ? { limiteUsuarios } : {}),
        ...(plano ? { plano } : {})
      }
    });

    revalidatePath('/admin/modulos');
    revalidatePath('/admin/empresas');
    revalidatePath('/');

    return { 
      success: true, 
      tenant: {
        id: updated.id,
        nomeFantasia: updated.nomeFantasia,
        features: updated.features,
        plano: updated.plano,
        limiteUsuarios: updated.limiteUsuarios
      }
    };
  } catch (error: any) {
    console.error('Erro ao atualizar módulos do tenant:', error);
    return { success: false, error: error.message };
  }
}
