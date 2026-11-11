'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { unstable_noStore as noStore } from 'next/cache';
import { getLoggedUser } from '@/app/propostas/actions';
import { extractVigencia } from '@/lib/cctParser';

export async function getCCTs() {
  noStore();
  const user = await getLoggedUser();
  if (!user || !user.tenantId) {
    return [];
  }
  try {
    const data = await prisma.cCT.findMany({
      where: { tenantId: user.tenantId },
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
  const user = await getLoggedUser();
  if (!user || !user.tenantId) {
    return { error: 'Usuário não autenticado ou sem empresa vinculada.' };
  }
  try {
    const { cargos, ...cctData } = data;
    
    // Consulta e tratamento ultra-seguro para datas de vigência
    let vigInicioStr = cctData.vigenciaInicio;
    let vigFimStr = cctData.vigenciaFim;

    if (!vigInicioStr && (cctData.textoCompleto || cctData.resumoClausulas)) {
      const extracted = extractVigencia(cctData.textoCompleto || '', cctData.resumoClausulas || []);
      vigInicioStr = extracted.vigenciaInicio;
      vigFimStr = extracted.vigenciaFim;
    }

    let vigInicio = new Date();
    let vigFim = new Date(new Date().setFullYear(new Date().getFullYear() + 1));
    if (vigInicioStr) {
      const s = String(vigInicioStr).split('T')[0];
      vigInicio = new Date(`${s}T12:00:00.000Z`);
    }
    if (vigFimStr) {
      const s = String(vigFimStr).split('T')[0];
      vigFim = new Date(`${s}T12:00:00.000Z`);
    }

    const cct = await prisma.cCT.create({
      data: {
        nome: cctData.nome || 'Nova Regra Técnica',
        uf: cctData.uf || 'PR',
        cidade: cctData.cidade || '',
        vigenciaInicio: vigInicio,
        vigenciaFim: vigFim,
        tenantId: user.tenantId,
        
        vaValor: Number(cctData.vaValor) || 0,
        vaTipo: cctData.vaTipo || 'DIARIO',
        vaProvisFerias: Boolean(cctData.vaProvisFerias),
        vaDescPercent: Number(cctData.vaDescPercent) || 0,
        vaRefeicaoLocal: Number(cctData.vaRefeicaoLocal) || 0,
        
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
        salarioMinimo: Number(cctData.salarioMinimo) || 1621,
        pdfUrl: cctData.pdfUrl || null,
        pdfNome: cctData.pdfNome || null,
        textoCompleto: cctData.textoCompleto || null,
        resumoClausulas: cctData.resumoClausulas || null,

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
    
    revalidatePath('/admin/ccts');
    revalidatePath('/propostas/nova');
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    console.error('Erro ao criar CCT:', error);
    return { error: error?.message || String(error) || 'Erro interno no banco de dados' };
  }
}

export async function getCCTById(id: string) {
  noStore();
  const user = await getLoggedUser();
  if (!user || !user.tenantId) {
    return null;
  }
  try {
    const data = await prisma.cCT.findFirst({
      where: { id, tenantId: user.tenantId },
      include: {
        cargos: true
      }
    });
    return data ? JSON.parse(JSON.stringify(data)) : null;
  } catch (error) {
    console.error('Erro ao buscar CCT por ID:', error);
    return null;
  }
}

export async function updateCCT(id: string, data: any) {
  const user = await getLoggedUser();
  if (!user || !user.tenantId) {
    return { error: 'Não autorizado.' };
  }
  try {
    const existing = await prisma.cCT.findFirst({
      where: { id, tenantId: user.tenantId }
    });
    if (!existing) {
      return { error: 'Regra técnica (CCT) não encontrada no seu ambiente.' };
    }

    const { cargos, ...cctData } = data;
    
    // Deleta os cargos antigos e cria os novos para garantir sincronia total
    await prisma.cargo.deleteMany({ where: { cctId: id } });

    // Consulta e tratamento ultra-seguro para datas de vigência
    let vigInicioStr = cctData.vigenciaInicio;
    let vigFimStr = cctData.vigenciaFim;

    if (!vigInicioStr && (cctData.textoCompleto || cctData.resumoClausulas)) {
      const extracted = extractVigencia(cctData.textoCompleto || '', cctData.resumoClausulas || []);
      vigInicioStr = extracted.vigenciaInicio;
      vigFimStr = extracted.vigenciaFim;
    }

    let vigInicio = new Date();
    let vigFim = new Date(new Date().setFullYear(new Date().getFullYear() + 1));
    if (vigInicioStr) {
      const s = String(vigInicioStr).split('T')[0];
      vigInicio = new Date(`${s}T12:00:00.000Z`);
    }
    if (vigFimStr) {
      const s = String(vigFimStr).split('T')[0];
      vigFim = new Date(`${s}T12:00:00.000Z`);
    }

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
        vaRefeicaoLocal: Number(cctData.vaRefeicaoLocal) || 0,
        
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
        salarioMinimo: Number(cctData.salarioMinimo) || 1621,
        ...(cctData.pdfUrl ? { pdfUrl: cctData.pdfUrl } : {}),
        ...(cctData.pdfNome ? { pdfNome: cctData.pdfNome } : {}),
        ...(cctData.textoCompleto ? { textoCompleto: cctData.textoCompleto } : {}),
        ...(cctData.resumoClausulas ? { resumoClausulas: cctData.resumoClausulas } : {}),

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
    revalidatePath('/admin/ccts');
    revalidatePath(`/admin/ccts/${id}`);
    revalidatePath('/propostas/nova');
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    console.error('Erro ao atualizar CCT:', error);
    return { error: error?.message || String(error) || 'Erro interno no banco de dados' };
  }
}

export async function deleteCCT(id: string) {
  const user = await getLoggedUser();
  if (!user || !user.tenantId) {
    throw new Error('Não autorizado.');
  }
  try {
    const existing = await prisma.cCT.findFirst({
      where: { id, tenantId: user.tenantId }
    });
    if (!existing) {
      throw new Error('Regra técnica não encontrada no seu ambiente.');
    }

    await prisma.cCT.delete({
      where: { id }
    });
    revalidatePath('/admin/ccts');
    revalidatePath('/propostas/nova');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Erro ao deletar CCT:', error);
    throw error;
  }
}
