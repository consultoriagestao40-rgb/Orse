'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getProdutos() {
  try {
    return await prisma.produto.findMany({
      where: { ativo: true },
      orderBy: { codigo: 'asc' },
    });
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    return [];
  }
}

export async function createProduto(data: {
  descricao: string;
  unidade: string;
  precoUnitario: number;
  categoria: string;
}) {
  try {
    const produto = await prisma.produto.create({ data });
    revalidatePath('/produtos');
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
    return { success: true };
  } catch (error: any) {
    console.error('Erro ao excluir produto:', error);
    return { success: false, error: error.message };
  }
}
