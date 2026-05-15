'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getCCTs() {
  try {
    const data = await prisma.cCT.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        cargos: true
      }
    });
    // Convert Dates to Strings to avoid Next.js serialization errors in Server Components
    return JSON.parse(JSON.stringify(data));
  } catch (error) {
    console.error('Erro ao buscar CCTs:', error);
    return [];
  }
}

export async function createCCT(data: any) {
  try {
    const { cargos, ...cctData } = data;
    
    // Tratamento ultra-seguro para datas
    let vigInicio = new Date();
    let vigFim = new Date(new Date().setFullYear(new Date().getFullYear() + 1));
    if (cctData.vigenciaInicio) vigInicio = new Date(cctData.vigenciaInicio);
    if (cctData.vigenciaFim) vigFim = new Date(cctData.vigenciaFim);

    const cct = await prisma.cCT.create({
      data: {
        nome: cctData.nome || 'Nova Regra Técnica',
        uf: cctData.uf || 'PR',
        cidade: cctData.cidade || '',
        vigenciaInicio: vigInicio,
        vigenciaFim: vigFim,
        
        vaValor: Number(cctData.vaValor) || 0,
        vaTipo: cctData.vaTipo || 'DIARIO',
        vaProvisFerias: Boolean(cctData.vaProvisFerias),
        vaDescPercent: Number(cctData.vaDescPercent) || 0,
        
        vtValor: Number(cctData.vtValor) || 0,
        vtDescPercent: Number(cctData.vtDescPercent) || 0,
        
        examesMedicos: Number(cctData.examesMedicos) || 0,
        seguroVida: Number(cctData.seguroVida) || 0,
        cestaBasica: Number(cctData.cestaBasica) || 0,
        uniformeEpi: Number(cctData.uniformeEpi) || 0,

        provisFerias: Number(cctData.provisFerias) || 11.11,
        provis13: Number(cctData.provis13) || 8.33,
        encargoInss: Number(cctData.encargoInss) || 20,
        encargoFgts: Number(cctData.encargoFgts) || 8,
        
        pis: Number(cctData.pis) || 0.65,
        cofins: Number(cctData.cofins) || 3,
        iss: Number(cctData.iss) || 5,
        margemLucro: Number(cctData.margemLucro) || 10,
        taxaAdm: Number(cctData.taxaAdm) || 5,
        custosSindicato: Number(cctData.custosSindicato) || 0,
        
        reservaTecnica: Number(cctData.reservaTecnica) || 0,
        manutencaoEquipamentos: Number(cctData.manutencaoEquipamentos) || 0,
        outrosBeneficios: Number(cctData.outrosBeneficios) || 0,
        insalubridadeBase: cctData.insalubridadeBase || 'MINIMO',
        salarioMinimo: Number(cctData.salarioMinimo) || 1412,

        cargos: {
          create: (cargos || []).filter((c: any) => c.nome?.trim() !== '').map((c: any) => ({
            nome: c.nome,
            pisoSalarial: Number(c.pisoSalarial) || 0,
            gratificacoes: Number(c.gratificacoes) || 0,
            assiduidade: Number(c.assiduidade) || 0,
            adicionalCopa: Number(c.adicionalCopa) || 0,
            insalubridadePercent: Number(c.insalubridadePercent) || 0,
            episConfig: c.episConfig || []
          }))
        }
      }
    });
    
    return { success: true };
  } catch (error: any) {
    console.error('Erro ao criar CCT:', error);
    // Retornamos o objeto de erro para evitar que o Next.js ofusque em produção
    return { error: error?.message || String(error) || 'Erro interno no banco de dados' };
  }
}

export async function updateCCT(id: string, data: any) {
  try {
    const { cargos, ...cctData } = data;
    
    // Deleta os cargos antigos e cria os novos para garantir sincronia total
    await prisma.cargo.deleteMany({ where: { cctId: id } });

    let vigInicio = new Date();
    let vigFim = new Date(new Date().setFullYear(new Date().getFullYear() + 1));
    if (cctData.vigenciaInicio) vigInicio = new Date(cctData.vigenciaInicio);
    if (cctData.vigenciaFim) vigFim = new Date(cctData.vigenciaFim);

    const cct = await prisma.cCT.update({
      where: { id },
      data: {
        nome: cctData.nome || 'Nova Regra Técnica',
        uf: cctData.uf || 'PR',
        cidade: cctData.cidade || '',
        vigenciaInicio: vigInicio,
        vigenciaFim: vigFim,
        
        vaValor: Number(cctData.vaValor) || 0,
        vaTipo: cctData.vaTipo || 'DIARIO',
        vaProvisFerias: Boolean(cctData.vaProvisFerias),
        vaDescPercent: Number(cctData.vaDescPercent) || 0,
        
        vtValor: Number(cctData.vtValor) || 0,
        vtDescPercent: Number(cctData.vtDescPercent) || 0,
        
        examesMedicos: Number(cctData.examesMedicos) || 0,
        seguroVida: Number(cctData.seguroVida) || 0,
        cestaBasica: Number(cctData.cestaBasica) || 0,
        uniformeEpi: Number(cctData.uniformeEpi) || 0,

        provisFerias: Number(cctData.provisFerias) || 11.11,
        provis13: Number(cctData.provis13) || 8.33,
        encargoInss: Number(cctData.encargoInss) || 20,
        encargoFgts: Number(cctData.encargoFgts) || 8,
        
        pis: Number(cctData.pis) || 0.65,
        cofins: Number(cctData.cofins) || 3,
        iss: Number(cctData.iss) || 5,
        margemLucro: Number(cctData.margemLucro) || 10,
        taxaAdm: Number(cctData.taxaAdm) || 5,

        custosSindicato: Number(cctData.custosSindicato) || 0,
        
        reservaTecnica: Number(cctData.reservaTecnica) || 0,
        manutencaoEquipamentos: Number(cctData.manutencaoEquipamentos) || 0,
        outrosBeneficios: Number(cctData.outrosBeneficios) || 0,
        insalubridadeBase: cctData.insalubridadeBase || 'MINIMO',
        salarioMinimo: Number(cctData.salarioMinimo) || 1412,

        cargos: {
          create: (cargos || []).filter((c: any) => c.nome?.trim() !== '').map((c: any) => ({
            nome: c.nome,
            pisoSalarial: Number(c.pisoSalarial) || 0,
            gratificacoes: Number(c.gratificacoes) || 0,
            assiduidade: Number(c.assiduidade) || 0,
            adicionalCopa: Number(c.adicionalCopa) || 0,
            insalubridadePercent: Number(c.insalubridadePercent) || 0,
            episConfig: c.episConfig || []
          }))
        }
      }
    });
    return { success: true };
  } catch (error: any) {
    console.error('Erro ao atualizar CCT:', error);
    return { error: error?.message || String(error) || 'Erro interno no banco de dados' };
  }
}

export async function deleteCCT(id: string) {
  try {
    await prisma.cCT.delete({
      where: { id }
    });
    return { success: true };
  } catch (error) {
    console.error('Erro ao deletar CCT:', error);
    throw error;
  }
}
