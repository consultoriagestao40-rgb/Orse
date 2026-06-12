'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { unstable_noStore as noStore } from 'next/cache';
import { getLoggedUser } from '@/app/propostas/actions';

async function checkAuth() {
  const user = await getLoggedUser();
  if (!user || !user.tenantId) {
    throw new Error('Unauthorized');
  }
  return user;
}

export async function getEmpresasEmissoras() {
  noStore();
  try {
    const user = await getLoggedUser();
    if (!user || !user.tenantId) {
      return [];
    }
    return await prisma.empresaEmissora.findMany({
      where: { tenantId: user.tenantId },
      orderBy: { nomeFantasia: 'asc' }
    });
  } catch (error) {
    console.error('Erro ao buscar empresas emissoras:', error);
    return [];
  }
}

export async function createEmpresaEmissora(data: any) {
  try {
    const user = await checkAuth();
    const res = await prisma.empresaEmissora.create({
      data: {
        nomeFantasia: data.nomeFantasia,
        razaoSocial: data.razaoSocial,
        cnpj: data.cnpj,
        endereco: data.endereco,
        telefone: data.telefone,
        email: data.email,
        tenantId: user.tenantId
      }
    });
    revalidatePath('/admin/settings');
    revalidatePath('/propostas/nova');
    return { success: true, data: res };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateEmpresaEmissora(id: string, data: any) {
  try {
    const user = await checkAuth();
    const res = await prisma.empresaEmissora.update({
      where: { id, tenantId: user.tenantId },
      data: {
        nomeFantasia: data.nomeFantasia,
        razaoSocial: data.razaoSocial,
        cnpj: data.cnpj,
        endereco: data.endereco,
        telefone: data.telefone,
        email: data.email,
      }
    });
    revalidatePath('/admin/settings');
    revalidatePath('/propostas/nova');
    return { success: true, data: res };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteEmpresaEmissora(id: string) {
  try {
    const user = await checkAuth();
    await prisma.empresaEmissora.delete({ 
      where: { id, tenantId: user.tenantId } 
    });
    revalidatePath('/admin/settings');
    revalidatePath('/propostas/nova');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
