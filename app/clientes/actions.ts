'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getLoggedUser } from '@/app/propostas/actions';

export async function getClientes() {
  const user = await getLoggedUser();
  try {
    const whereClause: any = {};
    if (user?.tenantId) {
      whereClause.tenantId = user.tenantId;
    }
    const data = await prisma.client.findMany({
      where: whereClause,
      orderBy: { nomeFantasia: 'asc' }
    });
    // Serialize to standard JSON to avoid Next.js Date serialization issues
    return JSON.parse(JSON.stringify(data));
  } catch (error) {
    console.error('Erro ao buscar clientes:', error);
    return [];
  }
}

export async function createCliente(data: any) {
  const user = await getLoggedUser();
  try {
    const novoCliente = await prisma.client.create({
      data: {
        nomeFantasia: data.nomeFantasia || 'Novo Cliente',
        razaoSocial: data.razaoSocial || '',
        cnpj: data.cnpj || '',
        email: data.email || '',
        whatsapp: data.whatsapp || '',
        endereco: data.endereco || '',
        contato: data.contato || '',
        tenantId: user?.tenantId || null,
      }
    });
    
    revalidatePath('/clientes');
    return { success: true, data: JSON.parse(JSON.stringify(novoCliente)) };
  } catch (error: any) {
    console.error('Erro ao criar cliente:', error);
    return { error: error?.message || String(error) || 'Erro interno no banco de dados' };
  }
}

export async function updateCliente(id: string, data: any) {
  try {
    await prisma.client.update({
      where: { id },
      data: {
        nomeFantasia: data.nomeFantasia || 'Novo Cliente',
        razaoSocial: data.razaoSocial || '',
        cnpj: data.cnpj || '',
        email: data.email || '',
        whatsapp: data.whatsapp || '',
        endereco: data.endereco || '',
        contato: data.contato || '',
      }
    });
    revalidatePath('/clientes');
    return { success: true };
  } catch (error: any) {
    console.error('Erro ao atualizar cliente:', error);
    return { error: error?.message || String(error) || 'Erro interno no banco de dados' };
  }
}

export async function deleteCliente(id: string) {
  try {
    await prisma.client.delete({
      where: { id }
    });
    revalidatePath('/clientes');
    return { success: true };
  } catch (error) {
    console.error('Erro ao deletar cliente:', error);
    throw error;
  }
}
