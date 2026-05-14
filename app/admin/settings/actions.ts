'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// UNIDADES DE MEDIDA
export async function getUnidadesMedida() {
  try {
    const unidades = await prisma.unidadeMedida.findMany({ orderBy: { sigla: 'asc' } });
    if (unidades.length === 0) {
      // Popula com defaults se estiver vazio
      await prisma.unidadeMedida.createMany({
        data: [
          { nome: 'Unidade', sigla: 'UN' },
          { nome: 'Quilograma', sigla: 'KG' },
          { nome: 'Litro', sigla: 'L' },
          { nome: 'Metro', sigla: 'MT' },
          { nome: 'Metro Quadrado', sigla: 'M²' },
          { nome: 'Par', sigla: 'PAR' },
          { nome: 'Caixa', sigla: 'CX' },
        ],
        skipDuplicates: true
      });
      return await prisma.unidadeMedida.findMany({ orderBy: { sigla: 'asc' } });
    }
    return unidades;
  } catch (error) {
    console.error('Erro ao buscar unidades:', error);
    return [];
  }
}

export async function createUnidadeMedida(nome: string, sigla: string) {
  try {
    const res = await prisma.unidadeMedida.create({
      data: { nome, sigla: sigla.toUpperCase().trim() }
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
