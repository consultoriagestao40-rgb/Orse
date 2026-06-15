'use server';

import { prisma } from '@/lib/prisma';
import { getLoggedUser } from '@/app/propostas/actions';
import { revalidatePath } from 'next/cache';
import fs from 'fs';
import path from 'path';

const DATA_FILE_PATH = path.join(process.cwd(), 'data', 'planejamento.json');

// Interface Types
export interface RootCauseAnalysis {
  id: string;
  problema: string;
  porques: string[];
  ishikawa: {
    metodo: string[];
    materiaPrima: string[];
    maoDeObra: string[];
    maquina: string[];
    medida: string[];
    meioAmbiente: string[];
  };
  causaRaiz: string;
  createdAt: string;
  userId: string;
}

export interface ActionPlan {
  id: string;
  causaRaizId?: string;
  problemaDireto?: string;
  titulo: string;
  responsavelId: string;
  resultadoEsperado: string;
  resultadoAtingido?: string;
  what: string;
  why: string;
  where: string;
  when: string;
  who: string;
  how: string;
  howMuch: number;
  status: 'PENDENTE' | 'NO_PRAZO' | 'FORA_DO_PRAZO' | 'ATRASADO' | 'CONCLUIDO';
  dataConclusao?: string;
  percentualRealizado: number;
  createdAt: string;
}

export interface KR {
  id: string;
  descricao: string;
  valorInicial: number;
  valorAlvo: number;
  valorAtual: number;
  unidade: string;
}

export interface OKRObjective {
  id: string;
  titulo: string;
  cicloId: string;
  fase: string;
  krs: KR[];
  iniciativas: string[];
  progresso: number;
}

export interface OKRCiclo {
  id: string;
  nome: string;
  dataInicio: string;
  dataFim: string;
  objetivos: OKRObjective[];
}

export interface BrainstormPostit {
  id: string;
  texto: string;
  cor: string;
  x: number;
  y: number;
  userId: string;
  createdAt: string;
}

export interface PlanningDataStore {
  causas: RootCauseAnalysis[];
  planosAcao: ActionPlan[];
  okrCiclos: OKRCiclo[];
  postits: BrainstormPostit[];
}

// Ensure database file exists
function ensureFileExists() {
  const dir = path.dirname(DATA_FILE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE_PATH)) {
    const defaultData: PlanningDataStore = {
      causas: [],
      planosAcao: [],
      okrCiclos: [],
      postits: []
    };
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(defaultData, null, 2), 'utf-8');
  }
}

// Get all planning data
export async function getPlanningData() {
  const user = await getLoggedUser();
  if (!user) return { success: false, error: 'Não autorizado' };

  try {
    ensureFileExists();
    const rawData = fs.readFileSync(DATA_FILE_PATH, 'utf-8');
    const data = JSON.parse(rawData) as PlanningDataStore;
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message || 'Erro ao carregar dados de planejamento' };
  }
}

// Save all planning data
async function saveStoreData(data: PlanningDataStore) {
  ensureFileExists();
  fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

// Get Tenant Users
export async function getTenantUsers() {
  const user = await getLoggedUser();
  if (!user) return { success: false, error: 'Não autorizado' };

  try {
    const users = await prisma.user.findMany({
      where: { tenantId: user.tenantId },
      select: {
        id: true,
        nome: true,
        email: true,
        avatarUrl: true
      },
      orderBy: { nome: 'asc' }
    });
    return { success: true, users };
  } catch (error: any) {
    return { success: false, error: error.message || 'Erro ao carregar usuários' };
  }
}

// Action: Save Root Cause Analysis
export async function saveRootCause(causa: Omit<RootCauseAnalysis, 'id' | 'createdAt' | 'userId'> & { id?: string }) {
  const user = await getLoggedUser();
  if (!user) return { success: false, error: 'Não autorizado' };

  try {
    ensureFileExists();
    const rawData = fs.readFileSync(DATA_FILE_PATH, 'utf-8');
    const store = JSON.parse(rawData) as PlanningDataStore;

    if (causa.id) {
      // Update
      const index = store.causas.findIndex(c => c.id === causa.id);
      if (index !== -1) {
        store.causas[index] = {
          ...store.causas[index],
          ...causa,
          userId: user.id
        } as RootCauseAnalysis;
      }
    } else {
      // Create
      const newCausa: RootCauseAnalysis = {
        ...causa,
        id: 'causa-' + Date.now(),
        createdAt: new Date().toISOString(),
        userId: user.id
      };
      store.causas.push(newCausa);
    }

    await saveStoreData(store);
    revalidatePath('/planejamento');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Erro ao salvar causa raiz' };
  }
}

// Action: Delete Root Cause Analysis
export async function deleteRootCause(id: string) {
  const user = await getLoggedUser();
  if (!user) return { success: false, error: 'Não autorizado' };

  try {
    ensureFileExists();
    const rawData = fs.readFileSync(DATA_FILE_PATH, 'utf-8');
    const store = JSON.parse(rawData) as PlanningDataStore;

    store.causas = store.causas.filter(c => c.id !== id);
    // Unlink action plans
    store.planosAcao = store.planosAcao.map(pa => pa.causaRaizId === id ? { ...pa, causaRaizId: undefined } : pa);

    await saveStoreData(store);
    revalidatePath('/planejamento');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Erro ao excluir causa raiz' };
  }
}

// Action: Save Action Plan 5W2H
export async function saveActionPlan(plano: Omit<ActionPlan, 'id' | 'createdAt'> & { id?: string }) {
  const user = await getLoggedUser();
  if (!user) return { success: false, error: 'Não autorizado' };

  try {
    ensureFileExists();
    const rawData = fs.readFileSync(DATA_FILE_PATH, 'utf-8');
    const store = JSON.parse(rawData) as PlanningDataStore;

    // Determine status based on dates and percentage completed
    let status = plano.status;
    if (plano.percentualRealizado === 100) {
      status = 'CONCLUIDO';
    } else {
      const today = new Date();
      today.setHours(0,0,0,0);
      const limitDate = new Date(plano.when);
      if (limitDate < today) {
        status = 'ATRASADO';
      } else {
        status = 'PENDENTE';
      }
    }

    const cleanPlano = {
      ...plano,
      status,
      dataConclusao: status === 'CONCLUIDO' ? (plano.dataConclusao || new Date().toISOString()) : undefined
    };

    if (plano.id) {
      // Update
      const index = store.planosAcao.findIndex(pa => pa.id === plano.id);
      if (index !== -1) {
        store.planosAcao[index] = {
          ...store.planosAcao[index],
          ...cleanPlano
        } as ActionPlan;
      }
    } else {
      // Create
      const newPlano: ActionPlan = {
        ...cleanPlano,
        id: 'plan-' + Date.now(),
        createdAt: new Date().toISOString()
      } as ActionPlan;
      store.planosAcao.push(newPlano);
    }

    await saveStoreData(store);
    revalidatePath('/planejamento');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Erro ao salvar plano de ação' };
  }
}

// Action: Delete Action Plan
export async function deleteActionPlan(id: string) {
  const user = await getLoggedUser();
  if (!user) return { success: false, error: 'Não autorizado' };

  try {
    ensureFileExists();
    const rawData = fs.readFileSync(DATA_FILE_PATH, 'utf-8');
    const store = JSON.parse(rawData) as PlanningDataStore;

    store.planosAcao = store.planosAcao.filter(pa => pa.id !== id);

    await saveStoreData(store);
    revalidatePath('/planejamento');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Erro ao excluir plano de ação' };
  }
}

// Action: Save OKR Cycle
export async function saveOkrCiclo(ciclo: OKRCiclo) {
  const user = await getLoggedUser();
  if (!user) return { success: false, error: 'Não autorizado' };

  try {
    ensureFileExists();
    const rawData = fs.readFileSync(DATA_FILE_PATH, 'utf-8');
    const store = JSON.parse(rawData) as PlanningDataStore;

    // Recalculate progresso for each objective in cycle
    const updatedCiclo = {
      ...ciclo,
      objetivos: ciclo.objetivos.map(obj => {
        if (!obj.krs || obj.krs.length === 0) {
          return { ...obj, progresso: 0 };
        }
        const krProgresses = obj.krs.map(kr => {
          const totalDelta = kr.valorAlvo - kr.valorInicial;
          if (totalDelta === 0) return 100;
          const currentDelta = kr.valorAtual - kr.valorInicial;
          const progress = (currentDelta / totalDelta) * 100;
          return Math.min(Math.max(progress, 0), 100);
        });
        const avgProgress = krProgresses.reduce((acc, p) => acc + p, 0) / krProgresses.length;
        return { ...obj, progresso: Math.round(avgProgress) };
      })
    };

    const index = store.okrCiclos.findIndex(c => c.id === ciclo.id);
    if (index !== -1) {
      store.okrCiclos[index] = updatedCiclo;
    } else {
      store.okrCiclos.push(updatedCiclo);
    }

    await saveStoreData(store);
    revalidatePath('/planejamento');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Erro ao salvar ciclo OKR' };
  }
}

// Action: Delete OKR Cycle
export async function deleteOkrCiclo(id: string) {
  const user = await getLoggedUser();
  if (!user) return { success: false, error: 'Não autorizado' };

  try {
    ensureFileExists();
    const rawData = fs.readFileSync(DATA_FILE_PATH, 'utf-8');
    const store = JSON.parse(rawData) as PlanningDataStore;

    store.okrCiclos = store.okrCiclos.filter(c => c.id !== id);

    await saveStoreData(store);
    revalidatePath('/planejamento');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Erro ao excluir ciclo OKR' };
  }
}

// Action: Save Brainstorming Post-it
export async function savePostit(postit: Omit<BrainstormPostit, 'userId' | 'createdAt'>) {
  const user = await getLoggedUser();
  if (!user) return { success: false, error: 'Não autorizado' };

  try {
    ensureFileExists();
    const rawData = fs.readFileSync(DATA_FILE_PATH, 'utf-8');
    const store = JSON.parse(rawData) as PlanningDataStore;

    const index = store.postits.findIndex(p => p.id === postit.id);
    if (index !== -1) {
      store.postits[index] = {
        ...store.postits[index],
        ...postit,
        userId: user.id
      };
    } else {
      store.postits.push({
        ...postit,
        userId: user.id,
        createdAt: new Date().toISOString()
      });
    }

    await saveStoreData(store);
    revalidatePath('/planejamento');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Erro ao salvar post-it' };
  }
}

// Action: Delete Post-it
export async function deletePostit(id: string) {
  const user = await getLoggedUser();
  if (!user) return { success: false, error: 'Não autorizado' };

  try {
    ensureFileExists();
    const rawData = fs.readFileSync(DATA_FILE_PATH, 'utf-8');
    const store = JSON.parse(rawData) as PlanningDataStore;

    store.postits = store.postits.filter(p => p.id !== id);

    await saveStoreData(store);
    revalidatePath('/planejamento');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Erro ao excluir post-it' };
  }
}
