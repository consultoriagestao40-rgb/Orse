'use server';
import { unstable_noStore as noStore } from 'next/cache';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getLoggedUser } from '@/app/propostas/actions';

export async function getProdutos() {
  noStore();
  const user = await getLoggedUser();
  try {
    const whereClause: any = { ativo: true };
    if (user?.tenantId) {
      whereClause.tenantId = user.tenantId;
    }
    return await prisma.produto.findMany({
      where: whereClause,
      orderBy: { codigo: 'asc' },
    });
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    return [];
  }
}

export async function createProduto(data: any) {
  const user = await getLoggedUser();
  try {
    // Remove o ID se vier vazio do formulário para o Prisma gerar um novo
    const { id, ...rest } = data;
    const produto = await prisma.produto.create({
      data: {
        ...rest,
        tenantId: user?.tenantId || null
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
  try {
    const produto = await prisma.produto.update({ where: { id }, data });
    revalidatePath('/produtos');
    revalidatePath('/epis');
    return { success: true, produto };
  } catch (error: any) {
    console.error('Erro ao atualizar produto:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteProduto(id: string) {
  try {
    await prisma.produto.update({ where: { id }, data: { ativo: false } });
    revalidatePath('/produtos');
    revalidatePath('/epis');
    return { success: true };
  } catch (error: any) {
    console.error('Erro ao excluir produto:', error);
    return { success: false, error: error.message };
  }
}
