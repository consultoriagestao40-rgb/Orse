'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getEquipesTecnicas() {
  try {
    const list = await prisma.equipeTecnicaComposicao.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, list };
  } catch (error: any) {
    console.error('Erro ao listar equipes técnicas:', error);
    return { success: false, error: error.message || String(error), list: [] };
  }
}

export async function createEquipeTecnica(data: {
  nome: string;
  custoMensalMaoObra: number;
  custoMensalVeiculo: number;
  custoMensalCombustivel: number;
  custoMensalTotal: number;
  valorDiariaSugerido: number;
  valorHoraSugerido: number;
  itensMaoObra: any;
  itensCustosAdicionais?: any;
}) {
  try {
    const equipe = await prisma.equipeTecnicaComposicao.create({
      data: {
        nome: data.nome,
        custoMensalMaoObra: Number(data.custoMensalMaoObra) || 0,
        custoMensalVeiculo: Number(data.custoMensalVeiculo) || 0,
        custoMensalCombustivel: Number(data.custoMensalCombustivel) || 0,
        custoMensalTotal: Number(data.custoMensalTotal) || 0,
        valorDiariaSugerido: Number(data.valorDiariaSugerido) || 0,
        valorHoraSugerido: Number(data.valorHoraSugerido) || 0,
        itensMaoObra: data.itensMaoObra || [],
        itensCustosAdicionais: data.itensCustosAdicionais || []
      }
    });
    revalidatePath('/');
    return { success: true, equipe };
  } catch (error: any) {
    console.error('Erro ao criar equipe técnica:', error);
    return { success: false, error: error.message || String(error) };
  }
}

export async function updateEquipeTecnica(
  id: string,
  data: {
    nome?: string;
    custoMensalMaoObra?: number;
    custoMensalVeiculo?: number;
    custoMensalCombustivel?: number;
    custoMensalTotal?: number;
    valorDiariaSugerido?: number;
    valorHoraSugerido?: number;
    itensMaoObra?: any;
    itensCustosAdicionais?: any;
  }
) {
  try {
    const updateData: any = {};
    if (data.nome !== undefined) updateData.nome = data.nome;
    if (data.custoMensalMaoObra !== undefined) updateData.custoMensalMaoObra = Number(data.custoMensalMaoObra);
    if (data.custoMensalVeiculo !== undefined) updateData.custoMensalVeiculo = Number(data.custoMensalVeiculo);
    if (data.custoMensalCombustivel !== undefined) updateData.custoMensalCombustivel = Number(data.custoMensalCombustivel);
    if (data.custoMensalTotal !== undefined) updateData.custoMensalTotal = Number(data.custoMensalTotal);
    if (data.valorDiariaSugerido !== undefined) updateData.valorDiariaSugerido = Number(data.valorDiariaSugerido);
    if (data.valorHoraSugerido !== undefined) updateData.valorHoraSugerido = Number(data.valorHoraSugerido);
    if (data.itensMaoObra !== undefined) updateData.itensMaoObra = data.itensMaoObra;
    if (data.itensCustosAdicionais !== undefined) updateData.itensCustosAdicionais = data.itensCustosAdicionais;

    const equipe = await prisma.equipeTecnicaComposicao.update({
      where: { id },
      data: updateData
    });
    revalidatePath('/');
    return { success: true, equipe };
  } catch (error: any) {
    console.error('Erro ao atualizar equipe técnica:', error);
    return { success: false, error: error.message || String(error) };
  }
}

export async function deleteEquipeTecnica(id: string) {
  try {
    await prisma.equipeTecnicaComposicao.delete({
      where: { id }
    });
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    console.error('Erro ao deletar equipe técnica:', error);
    return { success: false, error: error.message || String(error) };
  }
}
