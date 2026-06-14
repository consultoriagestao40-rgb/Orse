'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getLoggedUser } from '@/app/propostas/actions';

// Helper to check user auth and get tenantId
async function checkAuth() {
  const user = await getLoggedUser();
  if (!user || !user.tenantId) {
    throw new Error('Unauthorized');
  }
  return user;
}

// Helper functions for GPS Geocoding, OSRM routing, and Haversine distance calculations
async function geocodeAddress(address: string): Promise<{ lat: number, lon: number } | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`,
      {
        headers: {
          'User-Agent': 'SlimpeOrseApp/1.0'
        }
      }
    );
    if (!response.ok) return null;
    const data = await response.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon)
      };
    }
  } catch (e) {
    console.error("Geocoding failed:", e);
  }
  return null;
}

async function getRouteEstimation(startLat: number, startLon: number, endLat: number, endLon: number) {
  try {
    const response = await fetch(
      `http://router.project-osrm.org/route/v1/driving/${startLon},${startLat};${endLon},${endLat}?overview=false`
    );
    if (!response.ok) return null;
    const data = await response.json();
    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      return {
        durationMinutes: route.duration / 60,
        distanceKm: route.distance / 1000
      };
    }
  } catch (e) {
    console.error("OSRM routing failed:", e);
  }
  return null;
}

function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function calculatePathDistance(path: { lat: number, lng: number }[]): number {
  let totalDistance = 0;
  for (let i = 0; i < path.length - 1; i++) {
    totalDistance += calculateHaversineDistance(
      path[i].lat,
      path[i].lng,
      path[i + 1].lat,
      path[i + 1].lng
    );
  }
  return totalDistance;
}

// -----------------------------------------------------------------------------
// CRUD ENTREGAS
// -----------------------------------------------------------------------------

export async function getEntregas() {
  try {
    const user = await checkAuth();
    const entregas = await prisma.entrega.findMany({
      where: { tenantId: user.tenantId },
      include: { client: true },
      orderBy: { codigo: 'desc' }
    });
    return { success: true, entregas };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createEntrega(data: {
  numeroNf: string;
  valor: number;
  clientId: string;
  observacao?: string;
}) {
  try {
    const user = await checkAuth();
    const entrega = await prisma.entrega.create({
      data: {
        numeroNf: data.numeroNf,
        valor: Number(data.valor),
        clientId: data.clientId,
        observacao: data.observacao || '',
        status: 'BACKLOG',
        tenantId: user.tenantId
      },
      include: { client: true }
    });
    revalidatePath('/entrega');
    return { success: true, entrega };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateEntrega(id: string, data: {
  status?: string;
  dataExecucao?: string;
  observacao?: string;
  entregadorResponsavel?: string;
  entregadorEmail?: string;
  observacaoEntrega?: string;
  fotosEntrega?: string;
  assinaturaRecebedor?: string;
  assinaturaEntregador?: string;
  nomeRecebedor?: string;
  documentoRecebedor?: string;
  numeroNf?: string;
  valor?: number;
  clientId?: string;
  dataProgramada?: string | null;
  latitudePartida?: number | null;
  longitudePartida?: number | null;
  latitudeChegada?: number | null;
  longitudeChegada?: number | null;
  latitudeAtual?: number | null;
  longitudeAtual?: number | null;
  ultimaAtualizacaoLocalizacao?: string | null;
  deslocamentoIniciadoEm?: string | null;
  entregaIniciadaEm?: string | null;
  tempoEstimadoRota?: number | null;
  distanciaEstimadaRota?: number | null;
  tempoRealizadoRota?: number | null;
  distanciaRealizadaRota?: number | null;
  desvioRota?: boolean | null;
  caminhoGps?: string | null;
  historico?: string;
}) {
  try {
    const user = await checkAuth();

    const currentEntrega = await prisma.entrega.findUnique({
      where: { id, tenantId: user.tenantId },
      include: { client: true }
    });

    if (!currentEntrega) {
      return { success: false, error: "Entrega não encontrada." };
    }

    const updateData: any = {};
    if (data.status !== undefined) updateData.status = data.status;
    if (data.dataExecucao !== undefined) updateData.dataExecucao = data.dataExecucao ? new Date(data.dataExecucao) : null;
    if (data.observacao !== undefined) updateData.observacao = data.observacao;
    if (data.entregadorResponsavel !== undefined) updateData.entregadorResponsavel = data.entregadorResponsavel;
    if (data.entregadorEmail !== undefined) updateData.entregadorEmail = data.entregadorEmail;
    if (data.observacaoEntrega !== undefined) updateData.observacaoEntrega = data.observacaoEntrega;
    if (data.fotosEntrega !== undefined) updateData.fotosEntrega = data.fotosEntrega;
    if (data.assinaturaRecebedor !== undefined) updateData.assinaturaRecebedor = data.assinaturaRecebedor;
    if (data.assinaturaEntregador !== undefined) updateData.assinaturaEntregador = data.assinaturaEntregador;
    if (data.nomeRecebedor !== undefined) updateData.nomeRecebedor = data.nomeRecebedor;
    if (data.documentoRecebedor !== undefined) updateData.documentoRecebedor = data.documentoRecebedor;
    if (data.numeroNf !== undefined) updateData.numeroNf = data.numeroNf;
    if (data.valor !== undefined) updateData.valor = Number(data.valor);
    if (data.clientId !== undefined) updateData.clientId = data.clientId;
    if (data.dataProgramada !== undefined) updateData.dataProgramada = data.dataProgramada ? new Date(data.dataProgramada) : null;
    if (data.latitudePartida !== undefined) updateData.latitudePartida = data.latitudePartida;
    if (data.longitudePartida !== undefined) updateData.longitudePartida = data.longitudePartida;
    if (data.latitudeChegada !== undefined) updateData.latitudeChegada = data.latitudeChegada;
    if (data.longitudeChegada !== undefined) updateData.longitudeChegada = data.longitudeChegada;
    if (data.latitudeAtual !== undefined) updateData.latitudeAtual = data.latitudeAtual;
    if (data.longitudeAtual !== undefined) updateData.longitudeAtual = data.longitudeAtual;
    if (data.ultimaAtualizacaoLocalizacao !== undefined) {
      updateData.ultimaAtualizacaoLocalizacao = data.ultimaAtualizacaoLocalizacao ? new Date(data.ultimaAtualizacaoLocalizacao) : null;
    }
    if (data.deslocamentoIniciadoEm !== undefined) updateData.deslocamentoIniciadoEm = data.deslocamentoIniciadoEm ? new Date(data.deslocamentoIniciadoEm) : null;
    if (data.entregaIniciadaEm !== undefined) updateData.entregaIniciadaEm = data.entregaIniciadaEm ? new Date(data.entregaIniciadaEm) : null;
    if (data.tempoEstimadoRota !== undefined) updateData.tempoEstimadoRota = data.tempoEstimadoRota;
    if (data.distanciaEstimadaRota !== undefined) updateData.distanciaEstimadaRota = data.distanciaEstimadaRota;
    if (data.tempoRealizadoRota !== undefined) updateData.tempoRealizadoRota = data.tempoRealizadoRota;
    if (data.distanciaRealizadaRota !== undefined) updateData.distanciaRealizadaRota = data.distanciaRealizadaRota;
    if (data.desvioRota !== undefined) updateData.desvioRota = data.desvioRota;
    if (data.caminhoGps !== undefined) updateData.caminhoGps = data.caminhoGps;

    // History tracking
    let historicoArray: any[] = [];
    if (currentEntrega.historico) {
      try {
        historicoArray = JSON.parse(currentEntrega.historico);
      } catch (e) {
        historicoArray = [{ data: currentEntrega.createdAt.toISOString(), acao: "Histórico Inicializado", usuario: "Sistema" }];
      }
    } else {
      historicoArray = [{ data: currentEntrega.createdAt.toISOString(), acao: "Entrega Criada", usuario: "Sistema" }];
    }

    const nowStr = new Date().toISOString();
    const userName = user.nome || user.email || "Sistema";

    // ─── ROUTING & GPS AUDITING ───
    if (data.status === 'EM_DESLOCAMENTO' && currentEntrega.status !== 'EM_DESLOCAMENTO') {
      const latPartida = data.latitudePartida ?? currentEntrega.latitudePartida;
      const lonPartida = data.longitudePartida ?? currentEntrega.longitudePartida;
      const endereco = currentEntrega.client?.endereco;

      updateData.deslocamentoIniciadoEm = new Date();

      if (latPartida && lonPartida) {
        const initialPath = [{ lat: latPartida, lng: lonPartida, time: nowStr }];
        updateData.caminhoGps = JSON.stringify(initialPath);

        if (endereco) {
          try {
            const geocoded = await geocodeAddress(endereco);
            if (geocoded) {
              const routeEst = await getRouteEstimation(latPartida, lonPartida, geocoded.lat, geocoded.lon);
              if (routeEst) {
                updateData.tempoEstimadoRota = routeEst.durationMinutes;
                updateData.distanciaEstimadaRota = routeEst.distanceKm;
              }
            }
          } catch (e) {
            console.error("Address estimation failed:", e);
          }
        }
      }
    }

    if (data.latitudeAtual !== undefined && data.longitudeAtual !== undefined && data.latitudeAtual && data.longitudeAtual) {
      const isTransit = (data.status === 'EM_DESLOCAMENTO') || (currentEntrega.status === 'EM_DESLOCAMENTO');
      if (isTransit) {
        let path: any[] = [];
        if (currentEntrega.caminhoGps) {
          try {
            path = JSON.parse(currentEntrega.caminhoGps);
          } catch (e) {}
        }
        if (path.length === 0 && currentEntrega.latitudePartida && currentEntrega.longitudePartida) {
          path.push({
            lat: currentEntrega.latitudePartida,
            lng: currentEntrega.longitudePartida,
            time: currentEntrega.deslocamentoIniciadoEm?.toISOString() || nowStr
          });
        }
        path.push({
          lat: data.latitudeAtual,
          lng: data.longitudeAtual,
          time: nowStr
        });
        updateData.caminhoGps = JSON.stringify(path);
      }
    }

    if (data.status === 'ENTREGA' && currentEntrega.status !== 'ENTREGA') {
      updateData.entregaIniciadaEm = new Date();
      
      const latChegada = data.latitudeChegada ?? currentEntrega.latitudeChegada;
      const lonChegada = data.longitudeChegada ?? currentEntrega.longitudeChegada;
      const deslocamentoIniciado = currentEntrega.deslocamentoIniciadoEm || data.deslocamentoIniciadoEm;

      if (deslocamentoIniciado) {
        const diffMs = new Date().getTime() - new Date(deslocamentoIniciado).getTime();
        updateData.tempoRealizadoRota = Math.max(0, diffMs / 60000);
      }

      let path: any[] = [];
      if (currentEntrega.caminhoGps) {
        try {
          path = JSON.parse(currentEntrega.caminhoGps);
        } catch (e) {}
      }

      if (latChegada && lonChegada) {
        path.push({
          lat: latChegada,
          lng: lonChegada,
          time: nowStr
        });
        updateData.caminhoGps = JSON.stringify(path);
      }

      if (path.length > 0) {
        const distance = calculatePathDistance(path);
        updateData.distanciaRealizadaRota = distance;

        const distEst = updateData.distanciaEstimadaRota ?? currentEntrega.distanciaEstimadaRota;
        if (distEst && distEst > 0) {
          if (distance > distEst * 1.25) {
            updateData.desvioRota = true;
          } else {
            updateData.desvioRota = false;
          }
        }
      }
    }

    if (data.status !== undefined && data.status !== currentEntrega.status) {
      historicoArray.push({
        data: nowStr,
        acao: `Status alterado de ${currentEntrega.status} para ${data.status}`,
        usuario: userName
      });

      if (data.status === 'ENTREGUE') {
        updateData.dataExecucao = new Date();
      }
    }

    if (data.entregadorEmail !== undefined && data.entregadorEmail !== currentEntrega.entregadorEmail) {
      const prevDeliverer = currentEntrega.entregadorResponsavel || "Nenhum";
      const nextDeliverer = data.entregadorResponsavel || "Nenhum";
      historicoArray.push({
        data: nowStr,
        acao: `Entregador alterado de: "${prevDeliverer}" para: "${nextDeliverer}"`,
        usuario: userName
      });
    }

    if (data.deslocamentoIniciadoEm !== undefined && data.deslocamentoIniciadoEm) {
      historicoArray.push({
        data: nowStr,
        acao: "Entregador iniciou deslocamento para entrega",
        usuario: userName
      });
    }

    if (data.latitudeChegada !== undefined && data.latitudeChegada) {
      historicoArray.push({
        data: nowStr,
        acao: "Entregador chegou ao cliente e iniciou entrega local",
        usuario: userName
      });
    }

    if (data.status === 'VALIDACAO' && currentEntrega.status !== 'VALIDACAO') {
      historicoArray.push({
        data: nowStr,
        acao: "Entrega finalizada pelo entregador (Aguardando validação do gestor)",
        usuario: userName
      });
    }

    updateData.historico = JSON.stringify(historicoArray);

    const entrega = await prisma.entrega.update({
      where: { id, tenantId: user.tenantId },
      data: updateData,
      include: { client: true }
    });

    // Auto-optimize route
    const delivererEmail = entrega.entregadorEmail;
    if (delivererEmail) {
      if (entrega.status === 'PROGRAMADO') {
        await otimizarRotaEntregador(delivererEmail);
      }
      if ((data.status !== undefined && data.status !== currentEntrega.status) && (currentEntrega.status === 'PROGRAMADO' || entrega.status === 'ENTREGA' || entrega.status === 'VALIDACAO' || entrega.status === 'ENTREGUE' || entrega.status === 'CANCELADA')) {
        await otimizarRotaEntregador(delivererEmail);
      }
    }
    if (data.entregadorEmail !== undefined && currentEntrega.entregadorEmail && data.entregadorEmail !== currentEntrega.entregadorEmail) {
      await otimizarRotaEntregador(currentEntrega.entregadorEmail);
    }

    revalidatePath('/entrega');
    return { success: true, entrega };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteEntrega(id: string) {
  try {
    const user = await checkAuth();
    await prisma.entrega.delete({
      where: { id, tenantId: user.tenantId }
    });
    revalidatePath('/entrega');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getEntregadorEntregas() {
  try {
    const user = await checkAuth();
    const entregas = await prisma.entrega.findMany({
      where: {
        tenantId: user.tenantId,
        OR: [
          { entregadorEmail: user.email },
          { entregadorResponsavel: user.nome }
        ],
        status: { in: ['PROGRAMADO', 'EM_DESLOCAMENTO', 'ENTREGA'] }
      },
      include: { client: true }
    });

    const sorted = entregas.sort((a, b) => {
      const getRank = (status: string) => {
        if (status === 'ENTREGA') return 1;
        if (status === 'EM_DESLOCAMENTO') return 2;
        if (status === 'PROGRAMADO') return 3;
        return 4;
      };
      const rankA = getRank(a.status);
      const rankB = getRank(b.status);
      if (rankA !== rankB) return rankA - rankB;

      if (a.status === 'PROGRAMADO') {
        const ordA = a.ordemExecucao ?? 9999;
        const ordB = b.ordemExecucao ?? 9999;
        return ordA - ordB;
      }
      return 0;
    });

    return { success: true, entregas: sorted };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function otimizarRotaEntregador(entregadorEmail: string) {
  try {
    const user = await checkAuth();
    if (!entregadorEmail) {
      return { success: false, error: "E-mail do entregador não fornecido." };
    }

    const entregas = await prisma.entrega.findMany({
      where: {
        tenantId: user.tenantId,
        entregadorEmail,
        status: 'PROGRAMADO'
      },
      include: { client: true }
    });

    if (entregas.length === 0) {
      return { success: true };
    }

    if (entregas.length === 1) {
      await prisma.entrega.update({
        where: { id: entregas[0].id },
        data: { ordemExecucao: 1 }
      });
      revalidatePath('/entrega');
      return { success: true };
    }

    const lastKnownEntrega = await prisma.entrega.findFirst({
      where: {
        tenantId: user.tenantId,
        entregadorEmail,
        latitudeAtual: { not: null },
        longitudeAtual: { not: null }
      },
      orderBy: { ultimaAtualizacaoLocalizacao: 'desc' }
    });

    let startLat = lastKnownEntrega?.latitudeAtual || null;
    let startLon = lastKnownEntrega?.longitudeAtual || null;

    const locations = await Promise.all(
      entregas.map(async (ent) => {
        const address = ent.client?.endereco;
        if (!address) return null;
        const geo = await geocodeAddress(address);
        if (geo) {
          return { entregaId: ent.id, lat: geo.lat, lon: geo.lon };
        }
        return null;
      })
    );

    const validLocations = locations.filter((l): l is { entregaId: string; lat: number; lon: number } => l !== null);

    if ((!startLat || !startLon) && validLocations.length > 0) {
      startLat = validLocations[0].lat;
      startLon = validLocations[0].lon;
    }

    let optimizedIds: string[] = [];

    if (validLocations.length > 0 && startLat && startLon) {
      try {
        const url = `http://router.project-osrm.org/trip/v1/driving/${startLon},${startLat};${validLocations.map(l => `${l.lon},${l.lat}`).join(';')}?source=first&destination=any&roundtrip=false`;
        const res = await fetch(url);
        if (res.ok) {
          const result = await res.json();
          if (result.code === 'Ok' && result.waypoints) {
            const mapped = result.waypoints.slice(1).map((wp: any, idx: number) => {
              return {
                entregaId: validLocations[idx].entregaId,
                visitOrder: wp.waypoint_index
              };
            });
            mapped.sort((a: any, b: any) => a.visitOrder - b.visitOrder);
            optimizedIds = mapped.map((m: any) => m.entregaId);
          }
        }
      } catch (e) {
        console.error("OSRM Trip optimization failed, using local nearest neighbor fallback:", e);
      }

      if (optimizedIds.length === 0) {
        let currentLat = startLat;
        let currentLon = startLon;
        const remaining = [...validLocations];
        while (remaining.length > 0) {
          let nearestIdx = 0;
          let minDistance = Infinity;
          for (let i = 0; i < remaining.length; i++) {
            const dist = calculateHaversineDistance(currentLat, currentLon, remaining[i].lat, remaining[i].lon);
            if (dist < minDistance) {
              minDistance = dist;
              nearestIdx = i;
            }
          }
          const nearest = remaining.splice(nearestIdx, 1)[0];
          optimizedIds.push(nearest.entregaId);
          currentLat = nearest.lat;
          currentLon = nearest.lon;
        }
      }
    }

    const unGeocodedIds = entregas
      .filter(e => !optimizedIds.includes(e.id))
      .map(e => e.id);

    const finalOrder = [...optimizedIds, ...unGeocodedIds];

    await Promise.all(
      finalOrder.map((id, index) => 
        prisma.entrega.update({
          where: { id },
          data: { ordemExecucao: index + 1 }
        })
      )
    );

    revalidatePath('/entrega');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function reordenarEntregasManual(entregadorEmail: string, entregaIdsOrdenadas: string[]) {
  try {
    const user = await checkAuth();
    if (!entregadorEmail) {
      return { success: false, error: "E-mail do entregador não fornecido." };
    }

    await Promise.all(
      entregaIdsOrdenadas.map((id, index) => 
        prisma.entrega.update({
          where: { id, tenantId: user.tenantId, entregadorEmail },
          data: { ordemExecucao: index + 1 }
        })
      )
    );

    revalidatePath('/entrega');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
