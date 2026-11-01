'use client';

import React, { useEffect, useRef, useState } from 'react';
import { 
  MapPin, Phone, MessageSquare, Plus, ExternalLink, Star, 
  Building2, UserCheck, ShieldCheck, Check
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
  onInjectLead: (lead: ProspectLead) => void;
}

export default function ProspeccaoMap({
  leads,
  onInjectLead
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

      // TileLayer OpenStreetMap oficial - 100% público, sem chave de API e sem marcas d'água
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      mapInstanceRef.current = map;
      markersRef.current = [];

      // Adiciona Marcadores no verde SmartBid (#1B4D3E)
      validLeads.forEach((lead, idx) => {
        const letter = getLetter(idx);

        const customIcon = L.divIcon({
          className: 'custom-prospect-marker',
          html: `
            <div style="position: relative; width: 38px; height: 38px; cursor: pointer; display: flex; align-items: center; justify-content: center;">
              <div style="position: absolute; inset: 0; border-radius: 9999px; background: rgba(27, 77, 62, 0.25); animation: ping 2.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
              <div style="width: 32px; height: 32px; border-radius: 9999px; background: #1B4D3E; border: 2.5px solid #FFFFFF; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.25); display: flex; align-items: center; justify-content: center; color: #FFFFFF; font-weight: 900; font-size: 13px; font-family: sans-serif;">
                ${letter}
              </div>
            </div>
          `,
          iconSize: [38, 38],
          iconAnchor: [19, 19]
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

  const handleInjectClick = (lead: ProspectLead) => {
    onInjectLead(lead);
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
    <div className="relative w-full h-[620px] rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-white flex flex-col md:flex-row">
      
      {/* CONTÊINER DO MAPA LEAFLET */}
      <div className="relative flex-1 h-full min-h-[350px]">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Badge Superior "RADAR B2B ATIVO" */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-white/95 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-200 shadow-md">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-ping" />
          <span className="text-xs font-black uppercase tracking-wider text-slate-800">
            Radar B2B • {leads.length} Empresas Mapeadas
          </span>
        </div>

        {/* CARD FLUTUANTE DA EMPRESA SELECIONADA */}
        {activeLead && (
          <div className="absolute bottom-5 left-5 right-5 md:right-auto md:w-[400px] z-30 animate-fadeIn">
            <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-5 shadow-xl text-slate-800 relative">
              
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#1B4D3E] flex items-center justify-center font-black text-white font-mono text-base shadow-sm">
                    {getLetter(activeIndex)}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm md:text-base text-slate-900 tracking-tight leading-tight line-clamp-1">
                      {activeLead.nomeFantasia}
                    </h3>
                    <p className="text-xs text-[#1B4D3E] font-bold flex items-center gap-1.5 mt-0.5">
                      <UserCheck size={13} />
                      {activeLead.decisorSugerido || 'Diretor de Operações / Facilities'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 text-amber-700 text-xs font-bold">
                  <Star size={12} className="fill-amber-400 text-amber-400" />
                  <span>{activeLead.rating ? Number(activeLead.rating).toFixed(1) : '4.8'}</span>
                </div>
              </div>

              {/* Endereço */}
              <div className="mt-3 text-xs text-slate-600 flex items-start gap-2 leading-relaxed">
                <MapPin size={14} className="text-slate-400 shrink-0 mt-0.5" />
                <span className="line-clamp-2">{activeLead.endereco}</span>
              </div>

              {/* Telefone Verificado */}
              <div className="mt-2.5 flex items-center gap-2 text-xs font-bold text-slate-700">
                <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
                <span>{activeLead.telefone || 'Telefone em verificação'}</span>
              </div>

              {/* Botões de Ação Direta */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                {activeLead.telefone && activeLead.telefone !== 'Não informado' ? (
                  <a
                    href={getWhatsAppLink(activeLead.telefone)!}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm no-underline"
                  >
                    <MessageSquare size={14} className="fill-current" />
                    <span>WhatsApp</span>
                  </a>
                ) : (
                  <div className="flex-1 bg-slate-100 text-slate-400 font-bold text-xs py-2.5 px-3 rounded-xl text-center">
                    Sem WhatsApp
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => handleInjectClick(activeLead)}
                  disabled={injectedIds.has(activeLead.nomeFantasia)}
                  className="bg-[#1B4D3E] hover:bg-[#13382D] disabled:opacity-60 text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                  title="Injetar no Funil de Leads CRM"
                >
                  {injectedIds.has(activeLead.nomeFantasia) ? (
                    <>
                      <Check size={14} className="text-emerald-200" />
                      <span>Injetado</span>
                    </>
                  ) : (
                    <>
                      <Plus size={14} />
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
      <div className="w-full md:w-80 bg-white border-t md:border-t-0 md:border-l border-slate-200 flex flex-col z-20">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Building2 size={16} className="text-[#1B4D3E]" />
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
              Empresas no Mapa ({leads.length})
            </h4>
          </div>
          <span className="text-[10px] text-slate-400 font-bold">AO VIVO</span>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
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
                    ? 'bg-emerald-50 border border-emerald-300 shadow-xs' 
                    : 'hover:bg-slate-50 border border-transparent'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-black text-xs shrink-0 ${
                  isSelected 
                    ? 'bg-[#1B4D3E] text-white shadow-xs' 
                    : 'bg-slate-100 text-slate-700'
                }`}>
                  {letter}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-800 truncate">
                    {lead.nomeFantasia}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    {lead.endereco}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                      {lead.porte || 'Médio'}
                    </span>
                    {lead.telefone && lead.telefone !== 'Não informado' && (
                      <span className="text-[9px] text-[#1B4D3E] flex items-center gap-1 font-bold">
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
