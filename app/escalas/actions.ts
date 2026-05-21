import { unstable_noStore as noStore } from 'next/cache';
'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getEscalas() {
  noStore();
  try {
    const escalas = await prisma.escala.findMany({
      orderBy: { nome: 'asc' },
    });
    // Serialize to plain objects
    return JSON.parse(JSON.stringify(escalas));
  } catch (error) {
    console.error('Error fetching escalas:', error);
    return [];
  }
}

export async function createEscala(data: {
  nome: string;
  diasTrabalhadosMes: number;
  horasMensais: number;
}) {
  try {
    const novaEscala = await prisma.escala.create({
      data,
    });
    revalidatePath('/admin/escalas');
    revalidatePath('/propostas/nova');
    return { success: true, escala: JSON.parse(JSON.stringify(novaEscala)) };
  } catch (error) {
    console.error('Error creating escala:', error);
    return { success: false, error: 'Erro ao criar escala.' };
  }
}

export async function updateEscala(id: string, data: {
  nome: string;
  diasTrabalhadosMes: number;
  horasMensais: number;
}) {
  try {
    const atualizada = await prisma.escala.update({
      where: { id },
      data,
    });
    revalidatePath('/admin/escalas');
    revalidatePath('/propostas/nova');
    return { success: true, escala: JSON.parse(JSON.stringify(atualizada)) };
  } catch (error) {
    console.error('Error updating escala:', error);
    return { success: false, error: 'Erro ao atualizar escala.' };
  }
}

export async function deleteEscala(id: string) {
  try {
    await prisma.escala.delete({
      where: { id },
    });
    revalidatePath('/admin/escalas');
    revalidatePath('/propostas/nova');
    revalidatePath('/admin/settings');
    return { success: true };
  } catch (error) {
    console.error('Error deleting escala:', error);
    return { success: false, error: 'Erro ao excluir escala.' };
  }
}
