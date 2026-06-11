'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getLoggedUser } from '@/app/propostas/actions';

// -----------------------------------------------------------------------------
// STAGES (ESTÁGIOS DO PIC KANBAN)
// -----------------------------------------------------------------------------

export async function ensureDefaultPicStages(tenantId: string) {
  const defaults = [
    { nome: 'Backlog', color: '#94a3b8', ordem: 1 },
    { nome: 'Reunião', color: '#f59e0b', ordem: 2 },
    { nome: 'Em Implantação', color: '#3b82f6', ordem: 3 },
    { nome: 'Implantado', color: '#10b981', ordem: 4 }
  ];

  for (const d of defaults) {
    await prisma.picStage.upsert({
      where: {
        id: `default-${d.nome.toLowerCase().replace(/\s/g, '-')}-${tenantId}`
      },
      update: {},
      create: {
        id: `default-${d.nome.toLowerCase().replace(/\s/g, '-')}-${tenantId}`,
        nome: d.nome,
        color: d.color,
        ordem: d.ordem,
        tenantId
      }
    });
  }
}

export async function getPicStages() {
  const user = await getLoggedUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  try {
    await ensureDefaultPicStages(user.tenantId!);
    const stages = await prisma.picStage.findMany({
      where: { tenantId: user.tenantId },
      orderBy: { ordem: 'asc' }
    });
    return { success: true, stages };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createPicStage(nome: string, color: string = '#3b82f6', insertAfterId?: string) {
  const user = await getLoggedUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  try {
    const stages = await prisma.picStage.findMany({
      where: { tenantId: user.tenantId },
      orderBy: { ordem: 'asc' }
    });

    let targetIndex = stages.length; // default to append
    if (insertAfterId) {
      const idx = stages.findIndex(s => s.id === insertAfterId);
      if (idx !== -1) {
        targetIndex = idx + 1;
      }
    }

    const stage = await prisma.picStage.create({
      data: {
        nome,
        color,
        ordem: targetIndex + 1,
        tenantId: user.tenantId
      }
    });

    // Reorder all stages sequentially
    const newStagesList = [...stages];
    newStagesList.splice(targetIndex, 0, stage);

    for (let i = 0; i < newStagesList.length; i++) {
      await prisma.picStage.update({
        where: { id: newStagesList[i].id },
        data: { ordem: i + 1 }
      });
    }

    revalidatePath('/pic');
    return { success: true, stage };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updatePicStage(stageId: string, nome?: string, color?: string) {
  try {
    const stage = await prisma.picStage.update({
      where: { id: stageId },
      data: {
        nome,
        color
      }
    });
    revalidatePath('/pic');
    return { success: true, stage };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deletePicStage(stageId: string, fallbackStageId: string) {
  try {
    // Mover os PICs associados para a etapa fallback
    await prisma.pic.updateMany({
      where: { stageId },
      data: { stageId: fallbackStageId }
    });

    await prisma.picStage.delete({
      where: { id: stageId }
    });

    revalidatePath('/pic');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updatePicStagesOrder(stageIds: string[]) {
  try {
    for (let i = 0; i < stageIds.length; i++) {
      await prisma.picStage.update({
        where: { id: stageIds[i] },
        data: { ordem: i + 1 }
      });
    }
    revalidatePath('/pic');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// -----------------------------------------------------------------------------
// GESTÃO DE PICS
// -----------------------------------------------------------------------------

export async function getPics() {
  const user = await getLoggedUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  try {
    await ensureDefaultPicStages(user.tenantId!);
    const pics = await prisma.pic.findMany({
      where: { tenantId: user.tenantId },
      include: {
        stage: true,
        contrato: {
          include: {
            client: true,
            empresaEmissora: true,
            proposta: {
              include: {
                user: true
              }
            }
          }
        },
        secoes: {
          include: {
            acoes: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calcular o percentual total de ações concluídas
    const formattedPics = pics.map(pic => {
      let totalActions = 0;
      let completedActions = 0;
      if (pic.secoes) {
        for (const s of pic.secoes) {
          if (s.acoes) {
            totalActions += s.acoes.length;
            completedActions += s.acoes.filter(a => a.status === 'CONCLUIDA').length;
          }
        }
      }
      const progressPercent = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;
      return {
        ...pic,
        progressPercent
      };
    });

    return { success: true, pics: formattedPics };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getPicById(id: string) {
  const user = await getLoggedUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  try {
    const pic = await prisma.pic.findUnique({
      where: { id, tenantId: user.tenantId },
      include: {
        stage: true,
        funcionarios: { orderBy: { funcao: 'asc' } },
        equipamentos: { orderBy: { nome: 'asc' } },
        materiais: { orderBy: { nome: 'asc' } },
        contrato: {
          include: {
            client: true,
            empresaEmissora: true,
            proposta: {
              include: {
                user: true,
                versoes: {
                  orderBy: { versao: 'desc' },
                  take: 1
                }
              }
            }
          }
        },
        secoes: {
          orderBy: { ordem: 'asc' },
          include: {
            acoes: {
              orderBy: { ordem: 'asc' },
              include: {
                responsavel: {
                  select: { id: true, nome: true, avatarUrl: true, email: true }
                }
              }
            }
          }
        }
      }
    });

    if (!pic) return { success: false, error: 'PIC não encontrado' };
    return { success: true, pic };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updatePicStageId(picId: string, stageId: string) {
  try {
    const pic = await prisma.pic.update({
      where: { id: picId },
      data: { stageId }
    });
    revalidatePath('/pic');
    return { success: true, pic };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updatePicDetails(picId: string, fields: any) {
  try {
    const pic = await prisma.pic.update({
      where: { id: picId },
      data: fields
    });
    revalidatePath(`/pic`);
    return { success: true, pic };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// -----------------------------------------------------------------------------
// GESTÃO DOS ITENS OPERACIONAIS (ABAS FUNCIONÁRIOS, EQUIPAMENTOS, MATERIAIS)
// -----------------------------------------------------------------------------

export async function updatePicEmployees(picId: string, employees: any[]) {
  try {
    await prisma.picEmployee.deleteMany({ where: { picId } });
    if (employees.length > 0) {
      await prisma.picEmployee.createMany({
        data: employees.map(emp => ({
          picId,
          funcao: emp.funcao,
          quantidade: emp.quantidade || 1,
          escala: emp.escala || '5x2',
          horarioEntrada: emp.horarioEntrada || '08:00',
          horarioSaida: emp.horarioSaida || '17:00',
          diasSemana: emp.diasSemana || 'Segunda a Sexta'
        }))
      });
    }
    revalidatePath('/pic');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updatePicEquipments(picId: string, equipments: any[]) {
  try {
    await prisma.picEquipment.deleteMany({ where: { picId } });
    if (equipments.length > 0) {
      await prisma.picEquipment.createMany({
        data: equipments.map(eq => ({
          picId,
          nome: eq.nome,
          quantidade: eq.quantidade || 1,
          tipo: eq.tipo || 'PROPRIO',
          observacao: eq.observacao || ''
        }))
      });
    }
    revalidatePath('/pic');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updatePicMaterials(picId: string, materials: any[]) {
  try {
    await prisma.picMaterial.deleteMany({ where: { picId } });
    if (materials.length > 0) {
      await prisma.picMaterial.createMany({
        data: materials.map(mat => ({
          picId,
          nome: mat.nome,
          quantidade: mat.quantidade || 1,
          unidade: mat.unidade || 'UN',
          observacao: mat.observacao || ''
        }))
      });
    }
    revalidatePath('/pic');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// -----------------------------------------------------------------------------
// PLANEJADOR DE AÇÕES (ABAS 04: SEÇÕES E AÇÕES)
// -----------------------------------------------------------------------------

export async function createPicSection(picId: string, nome: string) {
  try {
    const lastSec = await prisma.picSection.findFirst({
      where: { picId },
      orderBy: { ordem: 'desc' }
    });
    const nextOrdem = lastSec ? lastSec.ordem + 1 : 1;

    const section = await prisma.picSection.create({
      data: {
        picId,
        nome,
        ordem: nextOrdem
      }
    });

    revalidatePath('/pic');
    return { success: true, section };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function renamePicSection(secaoId: string, nome: string) {
  try {
    const section = await prisma.picSection.update({
      where: { id: secaoId },
      data: { nome }
    });
    revalidatePath('/pic');
    return { success: true, section };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deletePicSection(secaoId: string) {
  try {
    await prisma.picSection.delete({ where: { id: secaoId } });
    revalidatePath('/pic');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createPicAction(secaoId: string, descricao: string) {
  try {
    const lastAct = await prisma.picAction.findFirst({
      where: { secaoId },
      orderBy: { ordem: 'desc' }
    });
    const nextOrdem = lastAct ? lastAct.ordem + 1 : 1;

    const action = await prisma.picAction.create({
      data: {
        secaoId,
        descricao,
        ordem: nextOrdem,
        status: 'PENDENTE'
      }
    });

    revalidatePath('/pic');
    return { success: true, action };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updatePicAction(actionId: string, data: {
  descricao?: string;
  responsavelId?: string | null;
  dataLimite?: string | Date | null;
  observacao?: string | null;
  status?: string;
}) {
  try {
    const updateData: any = {};
    if (data.descricao !== undefined) updateData.descricao = data.descricao;
    if (data.responsavelId !== undefined) updateData.responsavelId = data.responsavelId;
    if (data.dataLimite !== undefined) updateData.dataLimite = data.dataLimite ? new Date(data.dataLimite) : null;
    if (data.observacao !== undefined) updateData.observacao = data.observacao;
    if (data.status !== undefined) updateData.status = data.status;

    const action = await prisma.picAction.update({
      where: { id: actionId },
      data: updateData
    });

    revalidatePath('/pic');
    return { success: true, action };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deletePicAction(actionId: string) {
  try {
    await prisma.picAction.delete({ where: { id: actionId } });
    revalidatePath('/pic');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// -----------------------------------------------------------------------------
// TRIGGER DE CRIAÇÃO AUTOMÁTICA DO PIC AO ATIVAR CONTRATO
// -----------------------------------------------------------------------------

export async function triggerPicCreationForContract(contratoId: string) {
  try {
    // 1. Buscar o contrato e suas relações
    const contrato = await prisma.contrato.findUnique({
      where: { id: contratoId },
      include: {
        client: true,
        empresaEmissora: true,
        proposta: {
          include: {
            user: true,
            versoes: {
              orderBy: { versao: 'desc' },
              take: 1,
              include: { items: true }
            }
          }
        }
      }
    });

    if (!contrato) throw new Error('Contrato não encontrado');

    // 2. Verificar status
    const statusUpper = contrato.status.toUpperCase();
    const isVigente = statusUpper === 'VIGENTE' || statusUpper === 'ATIVO';
    if (!isVigente) return { success: true, message: 'Contrato não está em status ativo/vigente' };

    // 3. Verificar tipo de proposta (CLT Recorrente)
    const proposta = contrato.proposta;
    if (!proposta) throw new Error('Proposta não associada ao contrato');
    const versao = proposta.versoes?.[0];
    if (!versao) throw new Error('Versão da proposta não encontrada');
    const metadata = (versao.metadados as any) || {};

    const tipoProposta = metadata.tipoProposta || 'RECORRENTE';
    if (tipoProposta !== 'RECORRENTE') {
      return { success: true, message: 'PIC ignorado: contrato não é do tipo CLT Recorrente' };
    }

    // 4. Verificar se o PIC já existe
    const picExists = await prisma.pic.findUnique({
      where: { contratoId }
    });
    if (picExists) return { success: true, message: 'PIC já existe para este contrato' };

    // 5. Garantir estágios padrão no inquilino (tenant)
    const tenantId = contrato.tenantId || proposta.tenantId;
    if (!tenantId) throw new Error('Inquilino (Tenant) não identificado');
    await ensureDefaultPicStages(tenantId);

    // Obter o estágio inicial (Backlog)
    const backlogStageId = `default-backlog-${tenantId}`;
    const stage = await prisma.picStage.findUnique({
      where: { id: backlogStageId }
    });
    const finalStageId = stage ? stage.id : (await prisma.picStage.findFirst({
      where: { tenantId },
      orderBy: { ordem: 'asc' }
    }))?.id;

    if (!finalStageId) throw new Error('Estágio inicial do PIC não encontrado');

    // 6. Criar o registro principal do PIC
    const client = contrato.client;
    const pic = await prisma.pic.create({
      data: {
        contratoId,
        stageId: finalStageId,
        tenantId,
        status: 'ATIVO',
        anotacoes: '',
        // Dados Financeiros iniciais
        valorMensal: contrato.valorMensal || 0,
        periodoMedicaoInicio: 'Dia 01',
        periodoMedicaoFim: 'Dia 30',
        dataFaturamento: 'Dia 30',
        documentacoesMensais: 'Listagem de funcionários, contracheques, certidões negativas, comprovantes de recolhimento de impostos e encargos (FGTS, INSS).',
        prazoPagamento: '15 dias após faturamento',
        dataPagamento: '-',
        faturamentoCnpj: client?.cnpj || '',
        faturamentoRazaoSocial: client?.razaoSocial || client?.nomeFantasia || '',
        faturamentoEndereco: client?.endereco || '',
        faturamentoInscricaoEstadual: '-',
        faturamentoInscricaoMunicipal: '-',
        faturamentoEmail: client?.email || ''
      }
    });

    // 7. Copiar funcionários
    if (versao.items && versao.items.length > 0) {
      await prisma.picEmployee.createMany({
        data: versao.items.map((item: any) => {
          const itemAtivosConfig = (item.ativosConfig as any) || {};
          const postParams = itemAtivosConfig.parametrosPosto || {};
          return {
            picId: pic.id,
            funcao: item.nomeCargo,
            quantidade: item.quantidade || 1,
            escala: item.escala || '5x2',
            horarioEntrada: postParams.horarioInicio || item.entrada || '08:00',
            horarioSaida: postParams.horarioFim || item.saida || '17:00',
            diasSemana: 'Segunda a Sexta'
          };
        })
      });
    }

    // Helper para verificar se string indica locação
    const isLocado = (desc: string) => {
      const norm = desc.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
      return norm.includes('locado') || norm.includes('locada') || norm.includes('locacao') || norm.includes('locaco') || norm.includes('locação');
    };

    // 8. Copiar equipamentos (máquinas detalhadas de insumos)
    const insumosObj = metadata.insumos || {};
    const maquinasList = insumosObj.detalheMaquinas || [];
    if (maquinasList.length > 0) {
      await prisma.picEquipment.createMany({
        data: maquinasList.map((m: any) => ({
          picId: pic.id,
          nome: m.descricao || m.nome || 'Máquina/Equipamento',
          quantidade: m.quantidade || 1,
          tipo: isLocado(m.descricao || '') ? 'LOCADO' : 'PROPRIO',
          observacao: ''
        }))
      });
    }

    // 9. Copiar materiais e descartáveis
    const materiaisList = insumosObj.detalheMateriais || [];
    const descartaveisList = insumosObj.detalheDescartaveis || [];
    const combinedMaterials = [...materiaisList, ...descartaveisList];
    if (combinedMaterials.length > 0) {
      await prisma.picMaterial.createMany({
        data: combinedMaterials.map((m: any) => ({
          picId: pic.id,
          nome: m.descricao || m.nome || 'Material/Insumo',
          quantidade: m.quantidade || 1,
          unidade: m.unidade || 'UN',
          observacao: ''
        }))
      });
    }

    // 10. Criar seções e ações padrão (Responsáveis iniciais iniciam sem usuário)
    const rhSection = await prisma.picSection.create({
      data: { picId: pic.id, nome: 'RH', ordem: 1 }
    });
    await prisma.picAction.createMany({
      data: [
        { secaoId: rhSection.id, descricao: 'Recrutamento e seleção', ordem: 1 },
        { secaoId: rhSection.id, descricao: 'Contratação (Documentação, Exames, Admissão)', ordem: 2 },
        { secaoId: rhSection.id, descricao: 'Entrega de EPI/Uniforme e integração', ordem: 3 }
      ]
    });

    const supSection = await prisma.picSection.create({
      data: { picId: pic.id, nome: 'Suprimentos', ordem: 2 }
    });
    await prisma.picAction.createMany({
      data: [
        { secaoId: supSection.id, descricao: 'Compra de uniforme/EPI', ordem: 1 },
        { secaoId: supSection.id, descricao: 'Compra/Locação dos equipamentos', ordem: 2 },
        { secaoId: supSection.id, descricao: 'Compra de Materiais/Insumos', ordem: 3 }
      ]
    });

    const opSection = await prisma.picSection.create({
      data: { picId: pic.id, nome: 'Operação', ordem: 3 }
    });
    await prisma.picAction.createMany({
      data: [
        { secaoId: opSection.id, descricao: 'Visita no local e reunião pré-implantação com o cliente', ordem: 1 },
        { secaoId: opSection.id, descricao: 'Elaboração e aprovação do plano de trabalho in-loco', ordem: 2 },
        { secaoId: opSection.id, descricao: 'Definição de SLA do contrato', ordem: 3 }
      ]
    });

    revalidatePath('/pic');
    return { success: true, picId: pic.id };
  } catch (error: any) {
    console.error('Erro no trigger do PIC:', error);
    return { success: false, error: error.message };
  }
}
