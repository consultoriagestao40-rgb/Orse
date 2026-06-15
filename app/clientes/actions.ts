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
        contatoCargo: data.contatoCargo || '',
        segmento: data.segmento || '',
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
    const updateData: any = {};
    if (data.nomeFantasia !== undefined) updateData.nomeFantasia = data.nomeFantasia;
    if (data.razaoSocial !== undefined) updateData.razaoSocial = data.razaoSocial;
    if (data.cnpj !== undefined) updateData.cnpj = data.cnpj;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.whatsapp !== undefined) updateData.whatsapp = data.whatsapp;
    if (data.endereco !== undefined) updateData.endereco = data.endereco;
    if (data.contato !== undefined) updateData.contato = data.contato;
    if (data.contatoCargo !== undefined) updateData.contatoCargo = data.contatoCargo;
    if (data.segmento !== undefined) updateData.segmento = data.segmento;

    await prisma.client.update({
      where: { id },
      data: updateData
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

export async function importClientes(clientes: any[]) {
  const user = await getLoggedUser();
  if (!user) return { error: 'Não autorizado' };
  
  let inserted = 0;
  let updated = 0;
  
  try {
    for (const c of clientes) {
      // Limpa CNPJ para busca
      const cleanedCnpj = c.cnpj ? c.cnpj.replace(/\D/g, '') : '';
      
      if (cleanedCnpj) {
        const existing = await prisma.client.findFirst({
          where: {
            cnpj: {
              contains: cleanedCnpj
            },
            tenantId: user.tenantId
          }
        });
        
        if (existing) {
          // Atualiza dados cadastrais existentes
          await prisma.client.update({
            where: { id: existing.id },
            data: {
              nomeFantasia: c.nomeFantasia || existing.nomeFantasia,
              razaoSocial: c.razaoSocial || existing.razaoSocial,
              email: c.email || existing.email,
              whatsapp: c.whatsapp || existing.whatsapp,
              endereco: c.endereco || existing.endereco,
              segmento: c.segmento || existing.segmento
            }
          });
          updated++;
          continue;
        }
      }
      
      // Cria novo cliente
      await prisma.client.create({
        data: {
          nomeFantasia: c.nomeFantasia || 'Importado',
          razaoSocial: c.razaoSocial || '',
          cnpj: c.cnpj || '',
          email: c.email || '',
          whatsapp: c.whatsapp || '',
          endereco: c.endereco || '',
          contato: c.contato || '',
          contatoCargo: c.contatoCargo || '',
          segmento: c.segmento || '',
          tenantId: user.tenantId || null
        }
      });
      inserted++;
    }
    
    revalidatePath('/clientes');
    return { success: true, inserted, updated };
  } catch (error: any) {
    console.error('Erro ao importar clientes:', error);
    return { error: error?.message || 'Erro ao processar importação de clientes' };
  }
}
