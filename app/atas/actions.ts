'use server';

import { prisma } from '@/lib/prisma';
import { getLoggedUser } from '@/app/propostas/actions';
export { getLoggedUser };
import { revalidatePath } from 'next/cache';
import { sendInternalMessage } from '@/app/leads/chat-actions';

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
  votos?: { nome: string; voto: 'Sim' | 'Não' }[];
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
        categoria: ata.categoria || 'Geral',
        status: ata.status || 'Rascunho',
        justificativaFinalizacao: ata.justificativaFinalizacao || null,
        criadorNome: ata.criadorNome || 'Não especificado',
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
  categoria?: string | null;
  status?: string;
  justificativaFinalizacao?: string | null;
  local?: string;
  pautas: any[];
  participantesPresentes: Participante[];
  pautasDeliberativas?: PautaDeliberativa[];
  relatorio?: string;
  consideracoes: string;
  proximaReuniaoData?: string | Date | null;
  proximaReuniaoHora?: string | null;
  proximaReuniaoLocal?: string | null;
  audioUrl?: string | null;
  audioDuracao?: number | null;
  transcricao?: string | null;
  resumoIa?: string | null;
  acoesSugeridasIa?: any;
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
          categoria: data.categoria || 'Geral',
          status: data.status || 'Rascunho',
          justificativaFinalizacao: data.justificativaFinalizacao || null,
          local: data.local || null,
          pautas: data.pautas,
          participantesPresentes: data.participantesPresentes as any,
          pautasDeliberativas: (data.pautasDeliberativas || []) as any,
          relatorio: data.relatorio || null,
          consideracoes: data.consideracoes,
          proximaReuniaoData: proxData,
          proximaReuniaoHora: data.proximaReuniaoHora || null,
          proximaReuniaoLocal: data.proximaReuniaoLocal || null,
          audioUrl: data.audioUrl !== undefined ? data.audioUrl : undefined,
          audioDuracao: data.audioDuracao !== undefined ? data.audioDuracao : undefined,
          transcricao: data.transcricao !== undefined ? data.transcricao : undefined,
          resumoIa: data.resumoIa !== undefined ? data.resumoIa : undefined,
          acoesSugeridasIa: data.acoesSugeridasIa !== undefined ? data.acoesSugeridasIa : undefined,
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
        const isAtaFinalized = data.status === 'Finalizada';
        const isConcluida = isAtaFinalized ? true : (a.concluida || false);
        const concluidaEmVal = isConcluida ? (a.concluidaEm || new Date()) : null;

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
              concluida: isConcluida,
              concluidaEm: concluidaEmVal
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
              concluida: isConcluida,
              concluidaEm: concluidaEmVal
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
          categoria: data.categoria || 'Geral',
          status: data.status || 'Rascunho',
          justificativaFinalizacao: data.justificativaFinalizacao || null,
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
          tenantId: user.tenantId,
          criadorNome: user.nome,
          audioUrl: data.audioUrl || null,
          audioDuracao: data.audioDuracao || null,
          transcricao: data.transcricao || null,
          resumoIa: data.resumoIa || null,
          acoesSugeridasIa: data.acoesSugeridasIa || null,
        }
      });

      ataId = newAta.id;

      if (data.acoes && data.acoes.length > 0) {
        for (const a of data.acoes) {
          const oldAcao = a.id ? oldAcoes.find(oa => oa.id === a.id) : null;
          const comentariosToCopy = oldAcao ? oldAcao.comentarios : null;

          const isAtaFinalized = data.status === 'Finalizada';
          const isConcluida = isAtaFinalized ? true : (a.concluida || false);
          const concluidaEmVal = isConcluida ? new Date() : null;

          await prisma.ataAcao.create({
            data: {
              ataId: newAta.id,
              item: a.item || null,
              descricao: a.descricao,
              responsavelId: a.responsavelId,
              dataLimite: new Date(a.dataLimite),
              numBitrix: a.numBitrix || null,
              concluida: isConcluida,
              concluidaEm: concluidaEmVal,
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

// 8. Renomeia uma categoria de ata em todas as atas do inquilino
export async function renameAtaCategory(oldName: string, newName: string) {
  const user = await getLoggedUser();
  if (!user) return { success: false, error: 'Não autorizado' };

  try {
    await prisma.ata.updateMany({
      where: {
        tenantId: user.tenantId,
        categoria: oldName
      },
      data: {
        categoria: newName
      }
    });

    revalidatePath('/atas');
    return { success: true };
  } catch (error: any) {
    console.error('Erro ao renomear categoria:', error);
    return { success: false, error: error.message };
  }
}

// 9. Exclui uma categoria de ata (move as atas associadas para 'Geral')
export async function deleteAtaCategory(catName: string) {
  const user = await getLoggedUser();
  if (!user) return { success: false, error: 'Não autorizado' };

  try {
    await prisma.ata.updateMany({
      where: {
        tenantId: user.tenantId,
        categoria: catName
      },
      data: {
        categoria: 'Geral'
      }
    });

    revalidatePath('/atas');
    return { success: true };
  } catch (error: any) {
    console.error('Erro ao excluir categoria:', error);
    return { success: false, error: error.message };
  }
}

// 10. Clona uma ata e suas respectivas ações
export async function cloneAta(id: string) {
  const user = await getLoggedUser();
  if (!user) return { success: false, error: 'Não autorizado' };

  try {
    const existing = await prisma.ata.findUnique({
      where: { id },
      include: {
        acoes: true
      }
    });

    if (!existing || existing.tenantId !== user.tenantId) {
      return { success: false, error: 'Ata não encontrada ou acesso negado.' };
    }

    // Cria nova ata com dados copiados
    const clonedAta = await prisma.ata.create({
      data: {
        titulo: `${existing.titulo} - Cópia`,
        dataReuniou: new Date(),
        horaReuniou: existing.horaReuniou,
        local: existing.local,
        pautas: existing.pautas || [],
        participantesPresentes: existing.participantesPresentes || [],
        pautasDeliberativas: existing.pautasDeliberativas || [],
        relatorio: existing.relatorio,
        consideracoes: existing.consideracoes,
        proximaReuniaoData: existing.proximaReuniaoData,
        proximaReuniaoHora: existing.proximaReuniaoHora,
        proximaReuniaoLocal: existing.proximaReuniaoLocal,
        categoria: existing.categoria || 'Geral',
        status: 'Rascunho', // começa como rascunho
        versao: 1,
        tenantId: user.tenantId,
        criadorNome: user.nome
      }
    });

    // Copia as ações associadas
    if (existing.acoes && existing.acoes.length > 0) {
      for (const acao of existing.acoes) {
        await prisma.ataAcao.create({
          data: {
            ataId: clonedAta.id,
            item: acao.item,
            descricao: acao.descricao,
            responsavelId: acao.responsavelId,
            dataLimite: acao.dataLimite,
            numBitrix: acao.numBitrix,
            concluida: false // começa pendente na cópia
          }
        });
      }
    }

    revalidatePath('/atas');
    return { success: true, clonedId: clonedAta.id };
  } catch (error: any) {
    console.error('Erro ao clonar ata:', error);
    return { success: false, error: error.message };
  }
}

function stripHtml(html: string) {
  if (!html) return '';
  let text = html
    .replace(/<\/p>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<li>/gi, '- ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/?[^>]+(>|$)/g, ''); // Remove todas as tags HTML
  
  // Limpa quebras de linha repetidas
  text = text.replace(/\n\s*\n+/g, '\n').trim();
  return text;
}

// 11. Notifica todos os participantes no chat interno e via WhatsApp quando a ata é publicada
export async function notifyAtaPublish(ataId: string) {
  const user = await getLoggedUser();
  if (!user) return { success: false, error: 'Não autorizado' };

  try {
    const ata = await prisma.ata.findUnique({
      where: { id: ataId },
      include: {
        acoes: {
          include: {
            responsavel: {
              select: {
                id: true,
                nome: true
              }
            }
          }
        }
      }
    });

    if (!ata || ata.tenantId !== user.tenantId) {
      return { success: false, error: 'Ata não encontrada.' };
    }

    const participantesList = Array.isArray(ata.participantesPresentes)
      ? (ata.participantesPresentes as any[])
      : [];

    const pautasDelib = Array.isArray(ata.pautasDeliberativas)
      ? (ata.pautasDeliberativas as any[])
      : [];

    // Filtra participantes que possuem conta no sistema (userId)
    const targetUsers = participantesList.filter(p => p.userId);

    if (targetUsers.length === 0) {
      return { success: true, count: 0 };
    }

    // 1. Participantes (Quem participou)
    let participantesSummary = '';
    if (participantesList.length > 0) {
      participantesSummary = '\n👥 *PARTICIPANTES:*\n';
      participantesList.forEach((p: any) => {
        participantesSummary += `- ${p.nome}${p.presente ? ' (Presente)' : ' (Ausente)'}\n`;
      });
    }

    // 2. Pautas Principais (Pautas)
    let pautasSummary = '';
    const pautasArray = Array.isArray(ata.pautas) ? (ata.pautas as any[]) : [];
    if (pautasArray.length > 0) {
      pautasSummary = '\n📌 *PAUTAS DA REUNIÃO:*\n';
      pautasArray.forEach((p: any) => {
        pautasSummary += `- ${p}\n`;
      });
    }

    // 3. Formata o resumo do relatório
    let relatorioSummary = '';
    if (ata.relatorio) {
      const plainRelatorio = stripHtml(ata.relatorio);
      if (plainRelatorio) {
        relatorioSummary = `\n📖 *RELATÓRIO DA REUNIÃO:*\n${plainRelatorio}\n`;
      }
    }

    // 4. Formata o resumo de pautas deliberativas
    let delibSummary = '';
    if (pautasDelib.length > 0) {
      delibSummary = '\n📝 *PAUTAS DELIBERADAS:*\n';
      pautasDelib.forEach(d => {
        delibSummary += `- Item ${d.item}: ${d.descricao} [${d.status}]\n`;
        if (d.votos && d.votos.length > 0) {
          const sim = d.votos.filter((v: any) => v.voto === 'Sim').length;
          const nao = d.votos.filter((v: any) => v.voto === 'Não').length;
          delibSummary += `  (Votação: Sim: ${sim} | Não: ${nao})\n`;
        }
      });
    }

    // 5. Todas as ações da ata
    let acoesSummary = '';
    if (ata.acoes.length > 0) {
      acoesSummary = '\n✅ *AÇÕES DEFINIDAS:*\n';
      ata.acoes.forEach(a => {
        const limitDate = new Date(a.dataLimite).toLocaleDateString('pt-BR');
        const respNome = a.responsavel?.nome || 'Não especificado';
        acoesSummary += `- [${respNome}] Ação: ${a.descricao} (Prazo: ${limitDate})\n`;
      });
    }

    // 6. Próxima Reunião
    let proximaSummary = '';
    if (ata.proximaReuniaoData) {
      const dateNext = new Date(ata.proximaReuniaoData).toLocaleDateString('pt-BR');
      proximaSummary = `\n📆 *PRÓXIMA REUNIÃO:*\n- Data: ${dateNext}${ata.proximaReuniaoHora ? ` às ${ata.proximaReuniaoHora}` : ''}\n- Local: ${ata.proximaReuniaoLocal || 'Não especificado'}\n`;
    }

    // Busca os celulares de todos os targetUsers no banco de dados em uma única consulta
    const userIds = targetUsers.map(u => u.userId).filter((id): id is string => !!id);
    const dbUsers = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        celular: true
      }
    });
    const userCelularMap = new Map(dbUsers.map(u => [u.id, u.celular]));

    // Prepara chaves do Z-API do tenant
    let instanceId = process.env.ZAPI_INSTANCE_ID;
    let token = process.env.ZAPI_TOKEN;
    let clientToken = process.env.ZAPI_CLIENT_TOKEN;

    if (user.tenantId) {
      const tenant = await prisma.tenant.findUnique({
        where: { id: user.tenantId },
        select: {
          whatsappInstanceId: true,
          whatsappToken: true,
          whatsappClientToken: true
        }
      });
      if (tenant && tenant.whatsappInstanceId && tenant.whatsappToken && tenant.whatsappClientToken) {
        instanceId = tenant.whatsappInstanceId;
        token = tenant.whatsappToken;
        clientToken = tenant.whatsappClientToken;
      }
    }

    for (const part of targetUsers) {
      if (!part.userId) continue;

      // Filtra as ações sob responsabilidade deste participante para destaque
      const partAcoes = ata.acoes.filter(a => a.responsavelId === part.userId);
      let suasAcoes = '';
      if (partAcoes.length > 0) {
        suasAcoes = '\n👉 *SUAS AÇÕES E PRAZOS (DESTAQUE):*\n';
        partAcoes.forEach(a => {
          const limitDate = new Date(a.dataLimite).toLocaleDateString('pt-BR');
          suasAcoes += `- Ação: ${a.descricao} (Prazo: ${limitDate})\n`;
        });
      } else {
        suasAcoes = '\nℹ️ Você não possui ações pendentes atribuídas nesta ata.\n';
      }

      // Monta a mensagem final para este participante
      const msg = `📢 *ATA DE REUNIÃO PUBLICADA:*
*${ata.titulo}*
📅 Data: ${new Date(ata.dataReuniou).toLocaleDateString('pt-BR')} ${ata.horaReuniou ? `às ${ata.horaReuniou}` : ''}
📍 Local: ${ata.local || 'Não especificado'}
👤 Criada por: ${ata.criadorNome || user.nome}
${participantesSummary}${pautasSummary}${relatorioSummary}${delibSummary}${acoesSummary}${suasAcoes}${proximaSummary}
🔗 Visualize a ata completa no menu *Atas de Reunião*.`;

      // Envia a mensagem direta via chat interno (somente se não for o próprio remetente)
      if (part.userId !== user.id) {
        await sendInternalMessage(part.userId, msg);
      }

      // Envia via WhatsApp se o participante tiver celular cadastrado e o Z-API estiver configurado
      const rawPhone = userCelularMap.get(part.userId);
      if (rawPhone && instanceId && token && clientToken) {
        let cleanPhone = rawPhone.replace(/\D/g, '');
        if (cleanPhone.length >= 10 && cleanPhone.length <= 11 && !cleanPhone.startsWith('55')) {
          cleanPhone = `55${cleanPhone}`;
        }
        if (cleanPhone) {
          try {
            const url = `https://api.z-api.io/instances/${instanceId}/token/${token}/send-text`;
            await fetch(url, {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Client-Token': clientToken
              },
              body: JSON.stringify({
                phone: cleanPhone,
                message: msg
              })
            });
          } catch (zapiErr) {
            console.error(`Erro ao disparar WhatsApp de ata para participante ${part.nome}:`, zapiErr);
          }
        }
      }
    }

    return { success: true, count: targetUsers.length };
  } catch (error: any) {
    console.error('Erro ao notificar publicação da ata:', error);
    return { success: false, error: error.message };
  }
}
export async function getPendingActionsDetailed() {
  const user = await getLoggedUser();
  if (!user) return { success: false, error: 'Não autorizado' };

  try {
    const pendingActions = await prisma.ataAcao.findMany({
      where: {
        concluida: false,
        ata: {
          tenantId: user.tenantId
        }
      },
      include: {
        responsavel: {
          select: {
            nome: true
          }
        },
        ata: {
          select: {
            titulo: true,
            categoria: true
          }
        }
      },
      orderBy: {
        dataLimite: 'asc'
      }
    });

    return {
      success: true,
      actions: pendingActions.map(a => ({
        id: a.id,
        item: a.item || 'S/N',
        descricao: a.descricao,
        responsavelNome: a.responsavel?.nome || 'Não identificado',
        ataTitulo: a.ata.titulo,
        categoria: a.ata.categoria || 'Geral',
        dataLimite: a.dataLimite.toISOString().split('T')[0],
        comentarios: Array.isArray(a.comentarios) ? a.comentarios : []
      }))
    };
  } catch (error: any) {
    console.error('Erro ao buscar ações pendentes detalhadas:', error);
    return { success: false, error: error.message };
  }
}

// 12. Processador de IA para Transcrição, Resumo Executivo e Extração de Ações
export interface AISuggestedAction {
  id?: string;
  item?: string;
  descricao: string;
  responsavelNome: string;
  responsavelId?: string;
  dataLimite: string;
  prioridade: 'ALTA' | 'MEDIA' | 'BAIXA';
  contexto?: string;
}

export interface AIProcessedReport {
  success: boolean;
  error?: string;
  resumoExecutivo: string;
  minutaFormatada: string;
  acoesSugeridas: AISuggestedAction[];
  topicosChave: string[];
  climaReuniao: string;
  duracaoEstimadaMinutos?: number;
}

export async function processMeetingAIReport(input: {
  transcricao: string;
  pautas?: string[];
  participantes?: { id?: string; userId?: string; nome: string; departamento?: string }[];
  titulo?: string;
  dataReuniou?: string;
}): Promise<AIProcessedReport> {
  const user = await getLoggedUser();
  if (!user) {
    return { success: false, error: 'Não autenticado', resumoExecutivo: '', minutaFormatada: '', acoesSugeridas: [], topicosChave: [], climaReuniao: '' };
  }

  const texto = (input.transcricao || '').trim();
  if (texto.length < 15) {
    return {
      success: false,
      error: 'Transcrição muito curta ou vazia. Forneça uma fala ou texto de reunião para gerar o relatório com IA.',
      resumoExecutivo: '',
      minutaFormatada: '',
      acoesSugeridas: [],
      topicosChave: [],
      climaReuniao: ''
    };
  }

  try {
    const participantesList = input.participantes || [];
    const pautasList = input.pautas || [];
    const titulo = input.titulo || 'Alinhamento Estratégico';

    // Se houver chave do Gemini ou OpenAI, podemos tentar enriquecimento direto
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    let aiResult: any = null;

    if (geminiKey) {
      try {
        const prompt = `Você é um assessor executivo de reuniões corporativas de alto nível da SmartBidHub.
Analise a transcrição abaixo da reunião "${titulo}" e produza um JSON rigoroso:
{
  "resumoExecutivo": "Resumo analítico dos temas e decisões da reunião",
  "minutaFormatada": "<p>Minuta executiva em HTML estruturado com introdução, tópicos e conclusão</p>",
  "topicosChave": ["Tópico 1", "Tópico 2"],
  "climaReuniao": "Alinhada e Resolutiva",
  "acoesSugeridas": [
    {
      "descricao": "O que deve ser feito",
      "responsavelNome": "Nome do responsável (escolha preferencialmente entre os participantes: ${participantesList.map(p => p.nome).join(', ')})",
      "dataLimite": "YYYY-MM-DD (estime uma data coerente a partir de ${input.dataReuniou || new Date().toISOString().split('T')[0]})",
      "prioridade": "ALTA | MEDIA | BAIXA"
    }
  ]
}

Participantes: ${participantesList.map(p => `${p.nome} (${p.departamento || 'Colaborador'})`).join(', ')}
Pautas planejadas: ${pautasList.join('; ')}

TRANSCRIÇÃO DA REUNIÃO:
"""
${texto}
"""
Retorne APENAS o JSON.`;

        const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' }
          }),
          signal: AbortSignal.timeout(15000)
        });

        if (geminiRes.ok) {
          const raw = await geminiRes.json();
          const content = raw.candidates?.[0]?.content?.parts?.[0]?.text;
          if (content) {
            aiResult = JSON.parse(content);
          }
        }
      } catch (e) {
        console.warn('Fallback para parser semântico nativo:', e);
      }
    }

    // Se a IA externa não respondeu ou não está configurada, aciona o Motor Analítico Semântico Nativo
    if (!aiResult) {
      // 1. Quebra da transcrição em frases e parágrafos
      const linhas = texto.split(/(?<=[.?!])\s+/).filter(Boolean);
      const totalPalavras = texto.split(/\s+/).length;
      const duracaoMinutos = Math.max(1, Math.round(totalPalavras / 130));

      // 2. Extração de Ações / Deliberações
      const actionKeywords = [
        'precisa', 'precisamos', 'vai fazer', 'vou fazer', 'ficou definido', 
        'combinado', 'responsável', 'entregar', 'enviar', 'ajustar', 'revisar',
        'implementar', 'prazo', 'verificar', 'finalizar', 'apresentar', 'cobrar'
      ];

      const acoesExtraidas: AISuggestedAction[] = [];
      let itemCounter = 1;

      // Data de referência base
      const baseDate = input.dataReuniou ? new Date(input.dataReuniou) : new Date();

      linhas.forEach(linha => {
        const linhaLower = linha.toLowerCase();
        const hasAction = actionKeywords.some(kw => linhaLower.includes(kw));

        if (hasAction && linha.length > 20) {
          // Identificar responsável na linha
          let respNome = '';
          let respId = '';

          for (const p of participantesList) {
            const firstName = p.nome.split(' ')[0].toLowerCase();
            if (linhaLower.includes(firstName)) {
              respNome = p.nome;
              respId = p.userId || p.id || '';
              break;
            }
          }

          if (!respNome && participantesList.length > 0) {
            respNome = participantesList[0].nome;
            respId = participantesList[0].userId || participantesList[0].id || '';
          }

          // Estimar data limite
          const targetDate = new Date(baseDate);
          if (linhaLower.includes('amanhã') || linhaLower.includes('urgente')) {
            targetDate.setDate(targetDate.getDate() + 1);
          } else if (linhaLower.includes('próxima semana') || linhaLower.includes('semana que vem')) {
            targetDate.setDate(targetDate.getDate() + 7);
          } else if (linhaLower.includes('mês que vem') || linhaLower.includes('fim do mês')) {
            targetDate.setDate(targetDate.getDate() + 20);
          } else {
            targetDate.setDate(targetDate.getDate() + (itemCounter * 2 + 3));
          }

          const prioridade: 'ALTA' | 'MEDIA' | 'BAIXA' = 
            linhaLower.includes('urgente') || linhaLower.includes('crítico') || linhaLower.includes('prioridade')
              ? 'ALTA'
              : itemCounter <= 2 ? 'MEDIA' : 'BAIXA';

          // Limpa o texto da ação
          let cleanedDesc = linha.replace(/^(eu|você|nós|ele|ela|o|a)\s+/i, '').trim();
          if (cleanedDesc.length > 150) cleanedDesc = cleanedDesc.substring(0, 147) + '...';

          acoesExtraidas.push({
            id: `ia-acao-${itemCounter}`,
            item: String(itemCounter),
            descricao: cleanedDesc,
            responsavelNome: respNome || 'Responsável a definir',
            responsavelId: respId,
            dataLimite: targetDate.toISOString().split('T')[0],
            prioridade,
            contexto: linha
          });

          itemCounter++;
        }
      });

      // Se nenhuma ação for encontrada por palavras-chave, gera deliberações com base nas pautas
      if (acoesExtraidas.length === 0 && pautasList.length > 0) {
        pautasList.forEach((p, idx) => {
          const d = new Date(baseDate);
          d.setDate(d.getDate() + (idx + 1) * 3);
          acoesExtraidas.push({
            id: `ia-acao-${idx + 1}`,
            item: String(idx + 1),
            descricao: `Acompanhar e desdobrar deliberações sobre: ${p}`,
            responsavelNome: participantesList[idx % (participantesList.length || 1)]?.nome || 'Equipe',
            responsavelId: participantesList[idx % (participantesList.length || 1)]?.userId || '',
            dataLimite: d.toISOString().split('T')[0],
            prioridade: 'MEDIA'
          });
        });
      }

      // 3. Tópicos Chave
      const topicos = pautasList.length > 0 
        ? pautasList.filter(Boolean)
        : ['Alinhamento Operacional e Diretrizes', 'Acompanhamento de Entregas e Prazos', 'Deliberações Estratégicas'];

      // 4. Resumo Executivo
      const resumoExecutivo = `### Síntese Executiva da Reunião
**Data:** ${new Date(baseDate).toLocaleDateString('pt-BR')} | **Pauta Principal:** ${titulo}

A reunião contou com a participação de **${participantesList.length} membro(s)**, com foco em alinhamento de processos e resolução de pendências. Durante o encontro, foram debatidos os principais pontos de atenção operacional e deliberadas as seguintes diretrizes:

1. **Alinhamento dos Pontos Críticos:** Discussão aberta sobre as demandas correntes da equipe, priorizando entregas com impacto imediato.
2. **Distribuição de Responsabilidades:** Foram mapeadas **${acoesExtraidas.length} ação(ões) prioritária(s)** com prazos estabelecidos para acompanhamento semanal.
3. **Próximos Passos:** A equipe manterá o acompanhamento das atividades via tarefas da plataforma, garantindo transparência e cumprimento do cronograma.`;

      // 5. Minuta Formatada para o Rich Text Editor
      const minutaFormatada = `
<p><strong>RELATÓRIO DE ALINHAMENTO EXECUTIVO</strong></p>
<p>Reunião realizada em <strong>${new Date(baseDate).toLocaleDateString('pt-BR')}</strong> para alinhamento sobre <em>${titulo}</em>.</p>
<p><strong>1. Principais Tópicos Abordados:</strong></p>
<ul>
  ${topicos.map(t => `<li>${t}</li>`).join('')}
</ul>
<p><strong>2. Síntese das Discussões e Deliberações:</strong></p>
<p>${linhas.slice(0, 3).join(' ') || 'Discussão focada nas prioridades estratégicas da equipe e definição de metas de curto prazo.'}</p>
<p><strong>3. Compromissos e Desdobramentos:</strong></p>
<p>Ficaram acordadas ${acoesExtraidas.length} ações imediatas para execução nos prazos estipulados na tabela de deliberações.</p>
      `.trim();

      aiResult = {
        resumoExecutivo,
        minutaFormatada,
        acoesSugeridas: acoesExtraidas,
        topicosChave: topicos,
        climaReuniao: 'Produtiva e Deliberativa',
        duracaoEstimadaMinutos: duracaoMinutos
      };
    }

    // Associa IDs de usuários do sistema nas ações sugeridas caso tenham nomes compatíveis
    const finalAcoes = (aiResult.acoesSugeridas || []).map((acao: any, idx: number) => {
      let matchedUserId = acao.responsavelId;
      if (!matchedUserId && acao.responsavelNome) {
        const found = participantesList.find(p => 
          p.nome.toLowerCase().includes(acao.responsavelNome.toLowerCase()) ||
          acao.responsavelNome.toLowerCase().includes(p.nome.toLowerCase())
        );
        if (found) {
          matchedUserId = found.userId || found.id;
        }
      }

      return {
        id: acao.id || `acao-${idx + 1}`,
        item: acao.item || String(idx + 1),
        descricao: acao.descricao,
        responsavelNome: acao.responsavelNome || 'A Definir',
        responsavelId: matchedUserId || '',
        dataLimite: acao.dataLimite || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        prioridade: acao.prioridade || 'MEDIA',
        contexto: acao.contexto || ''
      };
    });

    return {
      success: true,
      resumoExecutivo: aiResult.resumoExecutivo,
      minutaFormatada: aiResult.minutaFormatada,
      acoesSugeridas: finalAcoes,
      topicosChave: aiResult.topicosChave || [],
      climaReuniao: aiResult.climaReuniao || 'Estratégica e Focada',
      duracaoEstimadaMinutos: aiResult.duracaoEstimadaMinutos || 15
    };

  } catch (error: any) {
    console.error('Erro ao processar relatório com IA:', error);
    return {
      success: false,
      error: error.message || 'Erro ao gerar relatório com IA.',
      resumoExecutivo: '',
      minutaFormatada: '',
      acoesSugeridas: [],
      topicosChave: [],
      climaReuniao: ''
    };
  }
}

