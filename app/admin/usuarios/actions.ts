'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getUsuarios() {
  try {
    return await prisma.user.findMany({
      include: {
        manager: true,
        subordinates: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return [];
  }
}

export async function createUsuario(data: any) {
  try {
    const user = await prisma.user.create({
      data: {
        email: data.email,
        nome: data.nome,
        password: data.password || '123456',
        role: data.role,
        managerId: data.managerId || null,
      },
    });
    revalidatePath('/admin/usuarios');
    return { success: true, data: user };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteUsuario(id: string) {
  try {
    await prisma.user.delete({ where: { id } });
    revalidatePath('/admin/usuarios');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
