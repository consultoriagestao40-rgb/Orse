'use server';
import { unstable_noStore as noStore } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getLoggedUser } from '@/app/propostas/actions';

export async function getProdutos() {
  noStore();
  const user = await getLoggedUser();
  if (!user || !user.tenantId) {
    return [];
  }
  try {
    return await prisma.produto.findMany({
      where: {
        ativo: true,
        tenantId: user.tenantId,
      },
      orderBy: { codigo: 'asc' },
    });
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    return [];
  }
}

export async function createProduto(data: any) {
  const user = await getLoggedUser();
  if (!user || !user.tenantId) {
    return { success: false, error: 'Usuário não autenticado ou sem empresa vinculada.' };
  }
  try {
    const { id, ...rest } = data;
    const produto = await prisma.produto.create({
      data: {
        ...rest,
        tenantId: user.tenantId
      }
    });
    revalidatePath('/produtos');
    revalidatePath('/epis');
    return { success: true, produto };
  } catch (error: any) {
    console.error('Erro ao criar produto:', error);
    return { success: false, error: error.message };
  }
}

export async function updateProduto(
  id: string,
  data: {
    descricao: string;
    unidade: string;
    precoUnitario: number;
    categoria: string;
  }
) {
  const user = await getLoggedUser();
  if (!user || !user.tenantId) {
    return { success: false, error: 'Não autorizado.' };
  }
  try {
    const existing = await prisma.produto.findFirst({
      where: { id, tenantId: user.tenantId }
    });
    if (!existing) {
      return { success: false, error: 'Produto não encontrado no seu ambiente.' };
    }

    const produto = await prisma.produto.update({
      where: { id },
      data
    });
    revalidatePath('/produtos');
    revalidatePath('/epis');
    return { success: true, produto };
  } catch (error: any) {
    console.error('Erro ao atualizar produto:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteProduto(id: string) {
  const user = await getLoggedUser();
  if (!user || !user.tenantId) {
    return { success: false, error: 'Não autorizado.' };
  }
  try {
    const existing = await prisma.produto.findFirst({
      where: { id, tenantId: user.tenantId }
    });
    if (!existing) {
      return { success: false, error: 'Produto não encontrado no seu ambiente.' };
    }

    await prisma.produto.update({
      where: { id },
      data: { ativo: false }
    });
    revalidatePath('/produtos');
    revalidatePath('/epis');
    return { success: true };
  } catch (error: any) {
    console.error('Erro ao excluir produto:', error);
    return { success: false, error: error.message };
  }
}
