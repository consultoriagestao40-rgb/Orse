'use server';

import { prisma } from '@/lib/prisma';
import { getLoggedUser } from '@/app/propostas/actions';
import { revalidatePath } from 'next/cache';

const PLANNING_TITLE = "__SYSTEM_PLANNING_DATA__";

// Interface Types
export interface CauseStage {
  id: string;
  nome: string;
  color: string;
}

export interface RootCauseAnalysis {
  id: string;
  tipo: '5_PORQUES' | 'ISHIKAWA';
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
  status: string;
}

export interface SubAction {
  id: string;
  what: string;
  why: string;
  where: string;
  when: string;      // Prazo desta ação individual
  who: string;       // responsavelId do usuário ou texto
  how: string;
  howMuch: number;
  status: 'PENDENTE' | 'EM_ANDAMENTO' | 'EM_ATRASO' | 'CONCLUIDO';
  percentualRealizado: number; // 0 ou 100
  evidencia?: string;
}

export interface ActionPlan {
  id: string;
  causaRaizId?: string;
  problemaDireto?: string;
  titulo: string;
  responsavelId: string; // Criador/Responsável geral
  resultadoEsperado: string;
  resultadoAtingido?: string;
  dataFim: string;       // Prazo final consolidado do plano de ação
  status: 'PENDENTE' | 'ATRASADO' | 'CONCLUIDO';
  percentualRealizado: number; // Média baseada nas sub-ações
  acoes: SubAction[];    // Lista de ações 5W2H
  createdAt: string;
  // Opcionais para compatibilidade
  what?: string;
  why?: string;
  where?: string;
  when?: string;
  who?: string;
  how?: string;
  howMuch?: number;
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
  causasStages?: CauseStage[];
}

// Get or Create Planning Ata record in DB
async function getOrCreatePlanningAta(tenantId: string) {
  let ata = await prisma.ata.findFirst({
    where: { 
      titulo: PLANNING_TITLE,
      tenantId: tenantId
    }
  });

  if (!ata) {
    const defaultData: PlanningDataStore = {
      causas: [
        {
          id: "c1",
          tipo: "5_PORQUES",
          problema: "Queda no índice de satisfação do cliente com o tempo de atendimento técnico",
          porques: [
            "Os técnicos demoram para iniciar o atendimento local",
            "A roteirização e estimativa de tempo de trânsito está imprecisa",
            "Não tínhamos acompanhamento em tempo real do trajeto do técnico",
            "O sistema de chat/GPS não notificava o gestor sobre os deslocamentos técnicos"
          ],
          ishikawa: {
            metodo: [],
            materiaPrima: [],
            maoDeObra: [],
            maquina: [],
            medida: [],
            meioAmbiente: []
          },
          causaRaiz: "Falta de integração e notificações automáticas de deslocamento de técnicos no sistema central de gestão",
          createdAt: new Date().toISOString(),
          userId: "system",
          status: "CONCLUIDA"
        },
        {
          id: "c2",
          tipo: "ISHIKAWA",
          problema: "Alto índice de quebras de aparelhos de comodato no cliente",
          porques: [],
          ishikawa: {
            metodo: ["Manutenção preventiva inadequada", "Falta de manual de instruções rápido no local"],
            materiaPrima: ["Lote de diluidores com plástico de baixa resistência"],
            maoDeObra: ["Operador do cliente força a alavanca incorretamente"],
            maquina: ["Bico injetor de água com pressão acima do limite técnico"],
            medida: [],
            meioAmbiente: ["Ambiente operacional com umidade e calor excessivos"]
          },
          causaRaiz: "Incompatibilidade da pressão hidráulica e falta de treinamento do operador local",
          createdAt: new Date().toISOString(),
          userId: "system",
          status: "CONCLUIDA"
        }
      ],
      planosAcao: [
        {
          id: "pa1",
          causaRaizId: "c1",
          problemaDireto: "",
          titulo: "Implementar Notificações de Status de Deslocamento de Técnicos",
          responsavelId: "",
          resultadoEsperado: "Gestor sendo notificado sonoramente e visualmente em tempo real no chat sobre o início/fim das rotas, reduzindo o tempo de resposta em 20%",
          resultadoAtingido: "Notificações sonoras e visuais implementadas com sucesso no chat",
          dataFim: new Date().toISOString().split('T')[0],
          status: "CONCLUIDO",
          percentualRealizado: 100,
          acoes: [
            {
              id: "sub-pa1-1",
              what: "Adicionar alertas visuais e sonoros quando o entregador/técnico inicia rota, inicia serviço ou conclui entrega/OS",
              why: "Para que os gestores tenham visibilidade imediata das rotas de atendimento sem precisar consultar o mapa manualmente",
              where: "Módulo de Ativos (sidebar desktop e mobile PWA)",
              when: new Date().toISOString().split('T')[0],
              who: "Desenvolvedor Responsável",
              how: "Integrar webhooks de eventos de mudança de status com alertas sonoros e mensagens automáticas no chat interno",
              howMuch: 0,
              status: "CONCLUIDO",
              percentualRealizado: 100
            }
          ],
          createdAt: new Date().toISOString()
        }
      ],
      okrCiclos: [
        {
          id: "ciclo1",
          nome: "Q3 2026",
          dataInicio: "2026-07-01",
          dataFim: "2026-09-30",
          objetivos: [
            {
              id: "obj1",
              titulo: "Alcançar a excelência operacional em serviços de campo e entregas",
              cicloId: "ciclo1",
              fase: "Fase de Otimização",
              progresso: 0,
              krs: [
                {
                  id: "kr1",
                  descricao: "Reduzir o tempo médio de atendimento técnico (SLA) para menos de 45 minutos",
                  valorInicial: 65.0,
                  valorAlvo: 45.0,
                  valorAtual: 60.0,
                  unidade: "minutos"
                },
                {
                  id: "kr2",
                  descricao: "Aumentar o índice de satisfação do cliente (CSAT) no atendimento local",
                  valorInicial: 85.0,
                  valorAlvo: 95.0,
                  valorAtual: 88.0,
                  unidade: "%"
                }
              ],
              iniciativas: [
                "Implementação de player de áudio premium e alertas visuais no chat de suporte técnico",
                "Otimização do Kanban de Comodatos com chevrons e drag-and-drop para facilitar a gestão comercial"
              ]
            }
          ]
        }
      ],
      postits: [
        {
          id: "p1",
          texto: "Ideia: Permitir gravação de áudio em chat interno com um design semelhante ao WhatsApp",
          cor: "bg-emerald-100 border-emerald-300 text-emerald-800",
          x: 100,
          y: 120,
          userId: "system",
          createdAt: new Date().toISOString()
        },
        {
          id: "p2",
          texto: "Ideia: Ajustar margens de impressão do contrato de comodato no formato A4 com repeat tfoot/thead",
          cor: "bg-blue-100 border-blue-300 text-blue-800",
          x: 420,
          y: 150,
          userId: "system",
          createdAt: new Date().toISOString()
        }
      ]
    };

    ata = await prisma.ata.create({
      data: {
        titulo: PLANNING_TITLE,
        dataReuniou: new Date(),
        pautas: defaultData as any,
        participantesPresentes: [] as any,
        consideracoes: "Persistência do módulo de planejamento de metas",
        status: "Finalizada",
        tenantId: tenantId
      }
    });
  }

  return ata;
}

// Get all planning data
export async function getPlanningData() {
  const user = await getLoggedUser();
  if (!user) return { success: false, error: 'Não autorizado' };

  try {
    const ata = await getOrCreatePlanningAta(user.tenantId!);
    const data = ata.pautas as unknown as PlanningDataStore;

    // Migração de dados em tempo de execução para novo modelo de múltiplos sub-planos e status de causas
    let hasMigration = false;
    if (data) {
      if (data.causas) {
        data.causas = data.causas.map(c => {
          if (!c.status) {
            c.status = c.causaRaiz ? 'CONCLUIDA' : 'RASCUNHO';
            hasMigration = true;
          }
          return c;
        });
      }

      if (!data.causasStages) {
        data.causasStages = [
          { id: 'RASCUNHO', nome: 'Rascunho', color: '#64748B' },
          { id: 'EM_ANALISE', nome: 'Em análise', color: '#F59E0B' },
          { id: 'EM_REVISAO', nome: 'Em revisão', color: '#3B82F6' },
          { id: 'CONCLUIDA', nome: 'Concluída', color: '#10B981' }
        ];
        hasMigration = true;
      }
      
      if (data.planosAcao) {
        data.planosAcao = data.planosAcao.map(pa => {
          if (!pa.acoes) {
            pa.acoes = [
              {
                id: 'sub-' + pa.id + '-' + Date.now(),
                what: pa.what || '',
                why: pa.why || '',
                where: pa.where || '',
                when: pa.when || pa.createdAt || new Date().toISOString().split('T')[0],
                who: pa.who || pa.responsavelId || '',
                how: pa.how || '',
                howMuch: pa.howMuch || 0,
                status: pa.status === 'CONCLUIDO' ? 'CONCLUIDO' : 'PENDENTE',
                percentualRealizado: pa.percentualRealizado || 0
              }
            ];
            pa.dataFim = pa.when || pa.createdAt || new Date().toISOString().split('T')[0];
            hasMigration = true;
          }
          return pa;
        });
      }

      if (hasMigration) {
        // Persistir imediatamente no banco para evitar repetidas migrações
        await saveStoreData(user.tenantId!, data);
      }
    }

    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message || 'Erro ao carregar dados de planejamento' };
  }
}

// Save all planning data
async function saveStoreData(tenantId: string, data: PlanningDataStore) {
  const ata = await getOrCreatePlanningAta(tenantId);
  await prisma.ata.update({
    where: { id: ata.id },
    data: {
      pautas: data as any
    }
  });
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
    const ata = await getOrCreatePlanningAta(user.tenantId!);
    const store = ata.pautas as unknown as PlanningDataStore;

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
        userId: user.id,
        status: causa.status || 'RASCUNHO'
      };
      store.causas.push(newCausa);
    }

    await saveStoreData(user.tenantId!, store);
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
    const ata = await getOrCreatePlanningAta(user.tenantId!);
    const store = ata.pautas as unknown as PlanningDataStore;

    store.causas = store.causas.filter(c => c.id !== id);
    // Unlink action plans
    store.planosAcao = store.planosAcao.map(pa => pa.causaRaizId === id ? { ...pa, causaRaizId: undefined } : pa);

    await saveStoreData(user.tenantId!, store);
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
    const ata = await getOrCreatePlanningAta(user.tenantId!);
    const store = ata.pautas as unknown as PlanningDataStore;

    // Recalcular percentualRealizado e status consolidado do plano com base nas sub-ações
    const subActions = plano.acoes || [];
    let percentualRealizado = 0;
    if (subActions.length > 0) {
      const completedCount = subActions.filter(a => a.status === 'CONCLUIDO').length;
      percentualRealizado = Math.round((completedCount / subActions.length) * 100);
    }

    let status: 'PENDENTE' | 'ATRASADO' | 'CONCLUIDO' = 'PENDENTE';
    if (percentualRealizado === 100) {
      status = 'CONCLUIDO';
    } else {
      const today = new Date();
      today.setHours(0,0,0,0);
      const limitDate = new Date(plano.dataFim);
      if (limitDate < today) {
        status = 'ATRASADO';
      } else {
        status = 'PENDENTE';
      }
    }

    const cleanPlano = {
      ...plano,
      status,
      percentualRealizado,
      acoes: subActions
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

    await saveStoreData(user.tenantId!, store);
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
    const ata = await getOrCreatePlanningAta(user.tenantId!);
    const store = ata.pautas as unknown as PlanningDataStore;

    store.planosAcao = store.planosAcao.filter(pa => pa.id !== id);

    await saveStoreData(user.tenantId!, store);
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
    const ata = await getOrCreatePlanningAta(user.tenantId!);
    const store = ata.pautas as unknown as PlanningDataStore;

    // Recalculate progresso for each objective in cycle
    const updatedCiclo = {
      ...ciclo,
      objetivos: (ciclo.objetivos || []).map(obj => {
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

    await saveStoreData(user.tenantId!, store);
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
    const ata = await getOrCreatePlanningAta(user.tenantId!);
    const store = ata.pautas as unknown as PlanningDataStore;

    store.okrCiclos = store.okrCiclos.filter(c => c.id !== id);

    await saveStoreData(user.tenantId!, store);
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
    const ata = await getOrCreatePlanningAta(user.tenantId!);
    const store = ata.pautas as unknown as PlanningDataStore;

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

    await saveStoreData(user.tenantId!, store);
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
    const ata = await getOrCreatePlanningAta(user.tenantId!);
    const store = ata.pautas as unknown as PlanningDataStore;

    store.postits = store.postits.filter(p => p.id !== id);

    await saveStoreData(user.tenantId!, store);
    revalidatePath('/planejamento');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Erro ao excluir post-it' };
  }
}

// Action: Save Cause Stages
export async function saveCausaStages(stages: CauseStage[]) {
  const user = await getLoggedUser();
  if (!user) return { success: false, error: 'Não autorizado' };

  try {
    const ata = await getOrCreatePlanningAta(user.tenantId!);
    const store = ata.pautas as unknown as PlanningDataStore;

    store.causasStages = stages;

    await saveStoreData(user.tenantId!, store);
    revalidatePath('/planejamento');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Erro ao salvar estágios de causa' };
  }
}
