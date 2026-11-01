'use client';

import React, { useEffect, useRef, useState } from 'react';
import { 
  MapPin, Phone, MessageSquare, Plus, ExternalLink, Star, 
  Building2, UserCheck, ShieldCheck, Navigation, Sparkles, Check
} from 'lucide-react';

interface ProspectLead {
  id?: string;
  nomeFantasia: string;
  endereco: string;
  telefone?: string;
  site?: string | null;
  porte?: string;
  avaliacoes?: number;
  segmento?: string;
  lat?: number | null;
  lng?: number | null;
  rating?: number;
  decisorSugerido?: string;
}

interface ProspeccaoMapProps {
  leads: ProspectLead[];
  selectedIndices: Set<number>;
  onToggleSelect: (index: number) => void;
  onInjectSingle: (lead: ProspectLead) => void;
}

export default function ProspeccaoMap({
  leads,
  selectedIndices,
  onToggleSelect,
  onInjectSingle
}: ProspeccaoMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [selectedLeadIndex, setSelectedLeadIndex] = useState<number | null>(null);
  const [injectedIds, setInjectedIds] = useState<Set<string>>(new Set());

  // Letras de identificador de A a Z
  const getLetter = (idx: number) => {
    return String.fromCharCode(65 + (idx % 26));
  };

  useEffect(() => {
    // Carregar dinamicamente Leaflet para evitar erros de SSR
    let isMounted = true;

    const initMap = async () => {
      if (typeof window === 'undefined' || !mapContainerRef.current) return;

      const L = (await import('leaflet')).default;

      // Injeta CSS do Leaflet se ainda não existir
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      // Se já houver mapa criado, destroi para recriar
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Determinar centro inicial
      const validLeads = leads.filter(l => l.lat && l.lng);
      let centerLat = -25.4284; // Default Curitiba
      let centerLng = -49.2733;

      if (validLeads.length > 0) {
        centerLat = validLeads.reduce((acc, curr) => acc + (curr.lat || 0), 0) / validLeads.length;
        centerLng = validLeads.reduce((acc, curr) => acc + (curr.lng || 0), 0) / validLeads.length;
      }

      // Cria mapa com Leaflet
      const map = L.map(mapContainerRef.current, {
        center: [centerLat, centerLng],
        zoom: 13,
        zoomControl: true,
        attributionControl: false
      });

      // TileLayer CartoDB Dark Matter (Estilo mapa noturno futurista idêntico ao anúncio)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      mapInstanceRef.current = map;
      markersRef.current = [];

      // Adiciona Marcadores Holográficos Neon
      validLeads.forEach((lead, idx) => {
        const letter = getLetter(idx);

        // Ícone HTML customizado com glow e radar
        const customIcon = L.divIcon({
          className: 'custom-prospect-marker',
          html: `
            <div style="position: relative; width: 44px; height: 44px; cursor: pointer; display: flex; align-items: center; justify-content: center;">
              <div style="position: absolute; inset: 0; border-radius: 9999px; background: rgba(16, 185, 129, 0.25); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
              <div style="width: 34px; height: 34px; border-radius: 9999px; background: #064E3B; border: 2.5px solid #10B981; box-shadow: 0 0 15px rgba(16, 185, 129, 0.8), 0 0 30px rgba(16, 185, 129, 0.4); display: flex; align-items: center; justify-content: center; color: #FFFFFF; font-weight: 900; font-size: 13px; font-family: monospace;">
                ${letter}
              </div>
            </div>
          `,
          iconSize: [44, 44],
          iconAnchor: [22, 22]
        });

        const marker = L.marker([lead.lat!, lead.lng!], { icon: customIcon }).addTo(map);

        marker.on('click', () => {
          setSelectedLeadIndex(idx);
          map.flyTo([lead.lat!, lead.lng!], 15, { duration: 0.8 });
        });

        markersRef.current.push(marker);
      });

      // Se houver mais de 1 ponto, ajusta os limites de visualização
      if (validLeads.length > 1) {
        const bounds = L.latLngBounds(validLeads.map(l => [l.lat!, l.lng!]));
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    };

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [leads]);

  // Lead em foco selecionado
  const activeLead = selectedLeadIndex !== null ? leads[selectedLeadIndex] : leads[0] || null;
  const activeIndex = selectedLeadIndex !== null ? selectedLeadIndex : 0;

  const handleInjectClick = (lead: ProspectLead, idx: number) => {
    onInjectSingle(lead);
    setInjectedIds(prev => new Set(prev).add(lead.nomeFantasia));
  };

  // Monta link do WhatsApp
  const getWhatsAppLink = (phone?: string) => {
    if (!phone) return null;
    const cleanNumber = phone.replace(/\D/g, '');
    const fullNumber = cleanNumber.length <= 11 ? `55${cleanNumber}` : cleanNumber;
    return `https://wa.me/${fullNumber}?text=Ol%C3%A1%2C%20gostaria%20de%20apresentar%20nossos%20servi%C3%A7os%20corporativos.`;
  };

  return (
    <div className="relative w-full h-[620px] rounded-3xl overflow-hidden border border-emerald-500/30 shadow-2xl bg-slate-950 flex flex-col md:flex-row">
      {/* Grade Futurista Holográfica sobre o Mapa */}
      <div className="absolute inset-0 pointer-events-none z-10 bg-[linear-gradient(to_right,#10b9810a_1px,transparent_1px),linear-gradient(to_bottom,#10b9810a_1px,transparent_1px)] bg-[size:3.5rem_3.5rem]" />

      {/* CONTÊINER DO MAPA LEAFLET */}
      <div className="relative flex-1 h-full min-h-[350px]">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Badge Superior "RADAR HOLOGRÁFICO B2B ATIVO" */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-emerald-500/40 shadow-xl">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-[11px] font-black uppercase tracking-widest text-emerald-300 font-mono">
            RADAR B2B • {leads.length} EMPRESAS MAPEADAS
          </span>
        </div>

        {/* CARD FLUTUANTE DA EMPRESA SELECIONADA (IDÊNTICO AO DA FOTO DO ANÚNCIO) */}
        {activeLead && (
          <div className="absolute bottom-5 left-5 right-5 md:right-auto md:w-[410px] z-30 animate-in fade-in slide-in-from-bottom-5 duration-300">
            <div className="bg-slate-950/95 backdrop-blur-xl border-2 border-emerald-500/80 rounded-2xl p-5 shadow-2xl shadow-emerald-500/20 text-white relative overflow-hidden">
              {/* Efeito Glow Verde Esmeralda */}
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-start justify-between gap-3 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-800 flex items-center justify-center font-black text-slate-950 font-mono text-base shadow-md shadow-emerald-500/40">
                    {getLetter(activeIndex)}
                  </div>
                  <div>
                    <h3 className="font-black text-sm md:text-base text-white tracking-tight leading-tight line-clamp-1">
                      {activeLead.nomeFantasia}
                    </h3>
                    <p className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5 mt-0.5">
                      <UserCheck size={13} className="text-emerald-400" />
                      {activeLead.decisorSugerido || 'Diretor de Operações / Facilities'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 bg-amber-500/20 px-2 py-0.5 rounded-md border border-amber-500/30 text-amber-300 text-[10px] font-black">
                  <Star size={11} className="fill-amber-400 text-amber-400" />
                  <span>{activeLead.rating ? Number(activeLead.rating).toFixed(1) : '4.8'}</span>
                </div>
              </div>

              {/* Endereço */}
              <div className="mt-3 text-xs text-slate-300 flex items-start gap-2 relative z-10 leading-relaxed">
                <MapPin size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                <span className="line-clamp-2">{activeLead.endereco}</span>
              </div>

              {/* Telefone Verificado */}
              <div className="mt-2.5 flex items-center gap-2 text-xs font-mono font-bold text-slate-200 relative z-10">
                <ShieldCheck size={15} className="text-blue-400 shrink-0" />
                <span>{activeLead.telefone || 'Telefone em verificação'}</span>
              </div>

              {/* Botões de Ação Direta */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-2 relative z-10">
                {activeLead.telefone && activeLead.telefone !== 'Não informado' ? (
                  <a
                    href={getWhatsAppLink(activeLead.telefone)!}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-500/30 no-underline"
                  >
                    <MessageSquare size={14} className="fill-current" />
                    <span>ENVIAR MENSAGEM</span>
                  </a>
                ) : (
                  <div className="flex-1 bg-slate-800 text-slate-400 font-bold text-xs py-2.5 px-3 rounded-xl text-center">
                    Sem WhatsApp
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => handleInjectClick(activeLead, activeIndex)}
                  disabled={injectedIds.has(activeLead.nomeFantasia)}
                  className="bg-slate-800 hover:bg-slate-700 disabled:opacity-60 text-white font-bold text-xs py-2.5 px-3 rounded-xl flex items-center gap-1.5 transition-all border border-slate-700 cursor-pointer"
                  title="Injetar no Funil de Leads CRM"
                >
                  {injectedIds.has(activeLead.nomeFantasia) ? (
                    <>
                      <Check size={14} className="text-emerald-400" />
                      <span>Injetado</span>
                    </>
                  ) : (
                    <>
                      <Plus size={14} className="text-teal-400" />
                      <span>Injetar</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* PAINEL LATERAL DE EMPRESAS NO RADAR */}
      <div className="w-full md:w-80 bg-slate-950/90 border-t md:border-t-0 md:border-l border-slate-800/80 flex flex-col z-20">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 size={16} className="text-emerald-400" />
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-200">
              Polos Identificados ({leads.length})
            </h4>
          </div>
          <span className="text-[10px] font-mono text-slate-500 font-bold">MAPA AO VIVO</span>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-2 space-y-1">
          {leads.map((lead, idx) => {
            const isSelected = selectedLeadIndex === idx;
            const letter = getLetter(idx);

            return (
              <div
                key={idx}
                onClick={() => {
                  setSelectedLeadIndex(idx);
                  if (mapInstanceRef.current && lead.lat && lead.lng) {
                    mapInstanceRef.current.flyTo([lead.lat, lead.lng], 15, { duration: 0.8 });
                  }
                }}
                className={`p-3 rounded-xl transition-all cursor-pointer flex items-center gap-3 ${
                  isSelected 
                    ? 'bg-emerald-950/60 border border-emerald-500/60 shadow-lg' 
                    : 'hover:bg-slate-900/60 border border-transparent'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-black text-xs shrink-0 ${
                  isSelected 
                    ? 'bg-emerald-500 text-slate-950 shadow-md' 
                    : 'bg-slate-800 text-slate-300'
                }`}>
                  {letter}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-white truncate">
                    {lead.nomeFantasia}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    {lead.endereco}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] font-mono text-emerald-400 font-bold">
                      {lead.porte || 'Médio'}
                    </span>
                    {lead.telefone && lead.telefone !== 'Não informado' && (
                      <span className="text-[9px] text-blue-400 flex items-center gap-1 font-mono">
                        <Phone size={9} /> {lead.telefone}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
