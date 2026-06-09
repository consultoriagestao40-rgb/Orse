'use server';

import { prisma } from '@/lib/prisma';
import { getLoggedUser } from '@/app/propostas/actions';
export { getLoggedUser };
import { revalidatePath } from 'next/cache';

// Tipagem dos participantes salvos no JSON
interface Participante {
  userId?: string;
  nome: string;
  departamento?: string;
  email?: string;
  presente: boolean;
}

// Tipagem das pautas deliberativas salvas no JSON
interface PautaDeliberativa {
  item: string;
  descricao: string;
  status: string; // Ex: "Tratado", "Pendente", "Adiado"
  anotacao?: string;
}

// 1. Busca todas as atas do tenant ativo com indicadores básicos
export async function getAtas() {
  const user = await getLoggedUser();
  if (!user) return [];

  try {
    const atas = await prisma.ata.findMany({
      where: {
        tenantId: user.tenantId
      },
      include: {
        acoes: {
          select: {
            concluida: true
          }
        }
      },
      orderBy: {
        dataReuniou: 'desc'
      }
    });

    return atas.map(ata => {
      const totalAcoes = ata.acoes.length;
      const concluidas = ata.acoes.filter(a => a.concluida).length;
      const progressoAcoes = totalAcoes > 0 ? Math.round((concluidas / totalAcoes) * 100) : 0;

      return {
        id: ata.id,
        titulo: ata.titulo,
        dataReuniou: ata.dataReuniou.toISOString(),
        local: ata.local || 'Não especificado',
        versao: ata.versao,
        parentAtaId: ata.parentAtaId,
        totalAcoes,
        concluidas,
        progressoAcoes,
        pautasCount: Array.isArray(ata.pautas) ? ata.pautas.length : 0,
        createdAt: ata.createdAt.toISOString()
      };
    });
  } catch (error) {
    console.error('Erro ao buscar atas:', error);
    return [];
  }
}

// 2. Busca uma ata completa por ID com validação de tenant
export async function getAtaCompleta(id: string) {
  const user = await getLoggedUser();
  if (!user) return null;

  try {
    const ata = await prisma.ata.findUnique({
      where: { id },
      include: {
        acoes: {
          include: {
            responsavel: {
              select: {
                id: true,
                nome: true,
                avatarUrl: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        },
        versoes: {
          select: {
            id: true,
            versao: true,
            dataReuniou: true
          },
          orderBy: {
            versao: 'asc'
          }
        }
      }
    });

    if (!ata) return null;

    // Proteção estrita de tenant
    if (ata.tenantId !== user.tenantId) {
      return null;
    }

    // Se for uma versão dependente, vamos carregar as outras versões da mesma árvore
    let todasVersoes: any[] = [];
    if (ata.parentAtaId || ata.versoes.length > 0) {
      const rootId = ata.parentAtaId || ata.id;
      const rootAta = await prisma.ata.findUnique({
        where: { id: rootId },
        select: {
          id: true,
          versao: true,
          dataReuniou: true,
          versoes: {
            select: {
              id: true,
              versao: true,
              dataReuniou: true
            }
          }
        }
      });

      if (rootAta) {
        todasVersoes = [
          { id: rootAta.id, versao: rootAta.versao, data: rootAta.dataReuniou.toISOString() },
          ...rootAta.versoes.map(v => ({ id: v.id, versao: v.versao, data: v.dataReuniou.toISOString() }))
        ];
        todasVersoes.sort((a, b) => b.versao - a.versao); // Mais recentes primeiro
      }
    }

    return {
      ...ata,
      dataReuniou: ata.dataReuniou.toISOString(),
      proximaReuniaoData: ata.proximaReuniaoData ? ata.proximaReuniaoData.toISOString() : null,
      versoesHistorico: todasVersoes,
      acoes: ata.acoes.map(a => ({
        ...a,
        dataLimite: a.dataLimite.toISOString(),
        concluidaEm: a.concluidaEm ? a.concluidaEm.toISOString() : null
      }))
    };
  } catch (error) {
    console.error('Erro ao buscar ata detalhada:', error);
    return null;
  }
}

// 3. Salva uma nova ata ou cria uma revisão/versão
export async function saveAta(data: {
  id?: string;
  titulo: string;
  dataReuniou: string | Date;
  horaReuniou?: string | null;
  local?: string;
  pautas: any[];
  participantesPresentes: Participante[];
  pautasDeliberativas?: PautaDeliberativa[];
  relatorio?: string;
  consideracoes: string;
  proximaReuniaoData?: string | Date | null;
  proximaReuniaoHora?: string | null;
  proximaReuniaoLocal?: string | null;
  acoes: {
    id?: string;
    item?: string;
    descricao: string;
    responsavelId: string;
    dataLimite: string | Date;
    numBitrix?: string;
    concluida?: boolean;
  }[];
  criarNovaVersao?: boolean;
}) {
  const user = await getLoggedUser();
  if (!user) return { success: false, error: 'Não autenticado' };

  // Validação backend de responsáveis nas ações
  if (data.acoes && data.acoes.length > 0) {
    const invalid = data.acoes.some(a => !a.responsavelId || a.responsavelId.trim() === '');
    if (invalid) {
      return { success: false, error: 'Todas as ações cadastradas precisam ter um responsável selecionado.' };
    }
  }

  try {
    const dataReuniouDate = new Date(data.dataReuniou);
    const proxData = data.proximaReuniaoData ? new Date(data.proximaReuniaoData) : null;

    let ataId = data.id;

    if (data.id && !data.criarNovaVersao) {
      // 1. EDITAR ATA EXISTENTE (Sem nova versão)
      const existing = await prisma.ata.findUnique({
        where: { id: data.id },
        select: { tenantId: true }
      });

      if (!existing || existing.tenantId !== user.tenantId) {
        return { success: false, error: 'Ata não encontrada ou acesso negado.' };
      }

      // Atualiza a ata
      await prisma.ata.update({
        where: { id: data.id },
        data: {
          titulo: data.titulo,
          dataReuniou: dataReuniouDate,
          horaReuniou: data.horaReuniou || null,
          local: data.local || null,
          pautas: data.pautas,
          participantesPresentes: data.participantesPresentes as any,
          pautasDeliberativas: (data.pautasDeliberativas || []) as any,
          relatorio: data.relatorio || null,
          consideracoes: data.consideracoes,
          proximaReuniaoData: proxData,
          proximaReuniaoHora: data.proximaReuniaoHora || null,
          proximaReuniaoLocal: data.proximaReuniaoLocal || null,
        }
      });

      // Atualiza ações de forma inteligente (para preservar comentários!)
      const currentAcoes = await prisma.ataAcao.findMany({
        where: { ataId: data.id },
        select: { id: true }
      });
      const currentIds = currentAcoes.map(a => a.id);
      
      const newAcoes = data.acoes || [];
      const newAcoesIds = newAcoes.map(a => a.id).filter(Boolean) as string[];

      // Deleta as ações que foram removidas
      const idsToDelete = currentIds.filter(id => !newAcoesIds.includes(id));
      if (idsToDelete.length > 0) {
        await prisma.ataAcao.deleteMany({
          where: { id: { in: idsToDelete } }
        });
      }

      // Upsert das ações restantes
      for (const a of newAcoes) {
        if (a.id && currentIds.includes(a.id)) {
          // Atualiza a ação existente
          await prisma.ataAcao.update({
            where: { id: a.id },
            data: {
              item: a.item || null,
              descricao: a.descricao,
              responsavelId: a.responsavelId,
              dataLimite: new Date(a.dataLimite),
              numBitrix: a.numBitrix || null,
              concluida: a.concluida || false,
              concluidaEm: a.concluida ? new Date() : null
            }
          });
        } else {
          // Cria nova ação
          await prisma.ataAcao.create({
            data: {
              ataId: data.id!,
              item: a.item || null,
              descricao: a.descricao,
              responsavelId: a.responsavelId,
              dataLimite: new Date(a.dataLimite),
              numBitrix: a.numBitrix || null,
              concluida: a.concluida || false,
              concluidaEm: a.concluida ? new Date() : null
            }
          });
        }
      }

    } else {
      // 2. CRIAR NOVA ATA OU REVISÃO
      let nextVersion = 1;
      let parentId: string | null = null;
      let oldAcoes: any[] = [];

      if (data.id && data.criarNovaVersao) {
        // É uma revisão/nova versão de uma ata existente
        const oldAta = await prisma.ata.findUnique({
          where: { id: data.id }
        });

        if (oldAta) {
          nextVersion = oldAta.versao + 1;
          parentId = oldAta.parentAtaId || oldAta.id; // Mantém a raiz original
          
          // Buscar ações antigas para herdar comentários
          oldAcoes = await prisma.ataAcao.findMany({
            where: { ataId: data.id }
          });
        }
      }

      const newAta = await prisma.ata.create({
        data: {
          titulo: data.titulo,
          dataReuniou: dataReuniouDate,
          horaReuniou: data.horaReuniou || null,
          local: data.local || null,
          pautas: data.pautas,
          participantesPresentes: data.participantesPresentes as any,
          pautasDeliberativas: (data.pautasDeliberativas || []) as any,
          relatorio: data.relatorio || null,
          consideracoes: data.consideracoes,
          proximaReuniaoData: proxData,
          proximaReuniaoHora: data.proximaReuniaoHora || null,
          proximaReuniaoLocal: data.proximaReuniaoLocal || null,
          versao: nextVersion,
          parentAtaId: parentId,
          tenantId: user.tenantId
        }
      });

      ataId = newAta.id;

      if (data.acoes && data.acoes.length > 0) {
        for (const a of data.acoes) {
          const oldAcao = a.id ? oldAcoes.find(oa => oa.id === a.id) : null;
          const comentariosToCopy = oldAcao ? oldAcao.comentarios : null;

          await prisma.ataAcao.create({
            data: {
              ataId: newAta.id,
              item: a.item || null,
              descricao: a.descricao,
              responsavelId: a.responsavelId,
              dataLimite: new Date(a.dataLimite),
              numBitrix: a.numBitrix || null,
              concluida: a.concluida || false,
              concluidaEm: a.concluida ? new Date() : null,
              comentarios: comentariosToCopy || null
            }
          });
        }
      }
    }

    revalidatePath('/atas');
    return { success: true, ataId };
  } catch (error: any) {
    console.error('Erro ao salvar ata:', error);
    return { success: false, error: error.message || 'Erro ao processar requisição' };
  }
}

// 4. Deleta uma ata e suas ações
export async function deleteAta(id: string) {
  const user = await getLoggedUser();
  if (!user) return { success: false, error: 'Não autorizado' };

  try {
    const existing = await prisma.ata.findUnique({
      where: { id },
      select: { tenantId: true }
    });

    if (!existing || existing.tenantId !== user.tenantId) {
      return { success: false, error: 'Acesso negado.' };
    }

    await prisma.ata.delete({
      where: { id }
    });

    revalidatePath('/atas');
    return { success: true };
  } catch (error: any) {
    console.error('Erro ao excluir ata:', error);
    return { success: false, error: error.message };
  }
}

// 5. Alterna o status de conclusão de uma ação
export async function toggleAcaoConclusao(acaoId: string, concluida: boolean) {
  const user = await getLoggedUser();
  if (!user) return { success: false, error: 'Não autorizado' };

  try {
    const acao = await prisma.ataAcao.findUnique({
      where: { id: acaoId },
      include: {
        ata: {
          select: { tenantId: true }
        }
      }
    });

    if (!acao || acao.ata.tenantId !== user.tenantId) {
      return { success: false, error: 'Ação não encontrada ou acesso negado.' };
    }

    await prisma.ataAcao.update({
      where: { id: acaoId },
      data: {
        concluida,
        concluidaEm: concluida ? new Date() : null
      }
    });

    revalidatePath('/atas');
    return { success: true };
  } catch (error: any) {
    console.error('Erro ao alterar status da ação:', error);
    return { success: false, error: error.message };
  }
}

// 6. Retorna indicadores consolidados de ações para o Tenant
export async function getAcoesStats() {
  const user = await getLoggedUser();
  if (!user) return { total: 0, concluidas: 0, pendentes: 0, taxaEficacia: 0 };

  try {
    const totalAcoes = await prisma.ataAcao.count({
      where: {
        ata: {
          tenantId: user.tenantId
        }
      }
    });

    const concluidas = await prisma.ataAcao.count({
      where: {
        concluida: true,
        ata: {
          tenantId: user.tenantId
        }
      }
    });

    const pendentes = totalAcoes - concluidas;
    const taxaEficacia = totalAcoes > 0 ? Math.round((concluidas / totalAcoes) * 100) : 0;

    return {
      total: totalAcoes,
      concluidas,
      pendentes,
      taxaEficacia
    };
  } catch (error) {
    console.error('Erro ao obter estatísticas de ações:', error);
    return { total: 0, concluidas: 0, pendentes: 0, taxaEficacia: 0 };
  }
}

// 7. Adiciona um comentário a uma ação com validação de tenant
export async function addAcaoComentario(acaoId: string, texto: string) {
  const user = await getLoggedUser();
  if (!user) return { success: false, error: 'Não autorizado' };

  if (!texto.trim()) return { success: false, error: 'Comentário vazio' };

  try {
    const acao = await prisma.ataAcao.findUnique({
      where: { id: acaoId },
      include: {
        ata: {
          select: { tenantId: true }
        }
      }
    });

    if (!acao || acao.ata.tenantId !== user.tenantId) {
      return { success: false, error: 'Ação não encontrada ou acesso negado.' };
    }

    // Parse dos comentários existentes
    const oldComments = Array.isArray(acao.comentarios) ? (acao.comentarios as any[]) : [];
    
    const newComment = {
      id: Math.random().toString(36).substring(2, 9),
      autor: user.nome,
      autorAvatar: user.avatarUrl || null,
      texto: texto.trim(),
      data: new Date().toISOString()
    };

    const updatedComments = [...oldComments, newComment];

    await prisma.ataAcao.update({
      where: { id: acaoId },
      data: {
        comentarios: updatedComments as any
      }
    });

    revalidatePath('/atas');
    return { success: true, comment: newComment };
  } catch (error: any) {
    console.error('Erro ao adicionar comentário:', error);
    return { success: false, error: error.message || 'Erro ao processar requisição' };
  }
}

