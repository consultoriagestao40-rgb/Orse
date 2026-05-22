'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { unstable_noStore as noStore } from 'next/cache';

export async function getEmpresasEmissoras() {
  noStore();
  try {
    return await prisma.empresaEmissora.findMany({
      orderBy: { nomeFantasia: 'asc' }
    });
  } catch (error) {
    console.error('Erro ao buscar empresas emissoras:', error);
    return [];
  }
}

export async function createEmpresaEmissora(data: any) {
  try {
    const res = await prisma.empresaEmissora.create({
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

export async function updateEmpresaEmissora(id: string, data: any) {
  try {
    const res = await prisma.empresaEmissora.update({
      where: { id },
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
    await prisma.empresaEmissora.delete({ where: { id } });
    revalidatePath('/admin/settings');
    revalidatePath('/propostas/nova');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
