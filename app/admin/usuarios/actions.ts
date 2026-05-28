'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getLoggedUser } from '@/app/propostas/actions';

export async function getUsuarios() {
  const user = await getLoggedUser();
  try {
    const whereClause: any = {};
    if (user?.tenantId) {
      whereClause.tenantId = user.tenantId;
    }
    return await prisma.user.findMany({
      where: whereClause,
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
  const user = await getLoggedUser();
  try {
    const newUser = await prisma.user.create({
      data: {
        email: data.email,
        nome: data.nome,
        password: data.password || '123456',
        role: data.role,
        cargo: data.cargo || null,
        celular: data.celular || null,
        managerId: data.managerId || null,
        tenantId: user?.tenantId || null,
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


export async function updateUsuario(id: string, data: any) {
  try {
    const user = await prisma.user.update({
      where: { id },
      data: {
        email: data.email,
        nome: data.nome,
        password: data.password ? data.password : undefined,
        role: data.role,
        cargo: data.cargo || null,
        celular: data.celular || null,
        managerId: data.managerId || null,
      },
    });
    revalidatePath('/admin/usuarios');
    return { success: true, data: user };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}