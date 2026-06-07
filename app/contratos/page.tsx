'use client';

import React, { useState, useEffect, useContext } from 'react';
import Sidebar from '@/components/Sidebar';
import { 
  FileText, Plus, Search, 
  Users, TrendingUp, Clock,
  LayoutList, LayoutGrid, AlertCircle, Edit2, CheckCircle, Calendar, DollarSign, Trash2, Printer, Building, X
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getContratos, updateContratoStatus, deleteContrato, renameContratoStatus } from './actions';
import { getSegmentos } from '@/app/admin/settings/actions';
import { updateCliente } from '@/app/clientes/actions';

// ─── Helpers de módulo ────────────────────────────────────────────────────────
const tailwindColorMap: { [key: string]: string } = {
  sky: '#0284c7', blue: '#2563eb', orange: '#ea580c', amber: '#d97706',
  emerald: '#059669', green: '#16a34a', red: '#dc2626', rose: '#e11d48',
  purple: '#9333ea', violet: '#7c3aed', yellow: '#ca8a04', indigo: '#4f46e5',
  pink: '#db2777', teal: '#0d9488', slate: '#475569', gray: '#4b5563',
};

type ViewMode = 'lista' | 'kanban-status' | 'kanban-segmento';

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v || 0);

const gerarNumeroContrato = (c: any) => {
  if (!c || !c.proposta) return 'S/N';
  const numProp = c.proposta.numero?.toString().padStart(3, '0') || '000';
  const numRev = (c.proposta.versoes?.[0]?.versao || 1).toString().padStart(2, '0');
  const d = c.dataInicio ? new Date(c.dataInicio) : new Date(c.createdAt || Date.now());
  const m = (d.getMonth() + 1).toString().padStart(2, '0');
  const y = d.getFullYear().toString();
  return `${numProp}.${numRev}.${m}.${y}`;
};

const renderVencimento = (dataInicio: any, vigenciaMeses: any) => {
  if (!dataInicio || !vigenciaMeses) return <span className="text-slate-400">-</span>;
  const d = new Date(dataInicio);
  const dRef = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + vigenciaMeses, d.getUTCDate()));
  const hoje = new Date();
  const hojeUTC = new Date(Date.UTC(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()));
  const diasParaVencer = Math.round((dRef.getTime() - hojeUTC.getTime()) / (1000 * 3600 * 24));
  const dataStr = dRef.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  let colorClass = 'bg-emerald-500';
  let title = 'Contrato no prazo';
  if (diasParaVencer < 0) {
    colorClass = 'bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]';
    title = `Vencido há ${Math.abs(diasParaVencer)} dias`;
  } else if (diasParaVencer <= 45) {
    colorClass = 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]';
    title = `Vence em ${diasParaVencer} dias`;
  }
  return (
    <div className="flex items-center justify-center gap-2" title={title}>
      <div className={`w-2.5 h-2.5 rounded-full ${colorClass}`} />
      <span className="font-bold">{dataStr}</span>
    </div>
  );
};

// ─── Context ──────────────────────────────────────────────────────────────────
// Compartilha todo o estado e handlers do dashboard com os componentes de coluna.
// Isso evita que KanbanColumn/ContractCard sejam definidos DENTRO do componente pai,
// o que causava remount a cada re-render (quebrando o drag-and-drop).
const ContratosDnDCtx = React.createContext<any>(null);

// ─── ContractCard ─────────────────────────────────────────────────────────────
function ContractCard({ c }: { c: any }) {
  const { viewMode, handleDragEnd, router, hexToRgba, resolveStatusColorToHex, getDarkenedHexForText } =
    useContext(ContratosDnDCtx);

  return (
    <div
      draggable
      onDragStart={(e) => { if (c.id) e.dataTransfer.setData('text/plain', c.id); }}
      onDragEnd={handleDragEnd}
      onClick={() => router.push(`/contratos/${c.id}`)}
      className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm hover:shadow-md hover:border-[#1B4D3E]/30 transition-all cursor-grab active:cursor-grabbing flex flex-col justify-between h-[120px] text-left relative overflow-visible"
    >
      <div>
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="p-1 bg-[#1B4D3E]/8 rounded-md shrink-0">
              <FileText size={12} className="text-[#1B4D3E]" />
            </div>
            <span className="text-xs font-black text-slate-700 tracking-wide truncate">
              {gerarNumeroContrato(c)}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400 shrink-0">
            {viewMode !== 'kanban-status' && (
              <span
                className="text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider shrink-0 border"
                style={{
                  backgroundColor: hexToRgba(resolveStatusColorToHex(c.status), 0.08),
                  color: getDarkenedHexForText(resolveStatusColorToHex(c.status)),
                  borderColor: hexToRgba(resolveStatusColorToHex(c.status), 0.25),
                }}
              >
                {c.status || '—'}
              </span>
            )}
            <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 uppercase tracking-wider">
              {c.vigenciaMeses}m
            </span>
          </div>
        </div>
        <p className="text-xs font-bold text-slate-800 leading-snug truncate" title={c.client?.razaoSocial || c.client?.nomeFantasia}>
          {c.client?.razaoSocial || c.client?.nomeFantasia || 'Sem Cliente'}
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
            📅 {c.dataInicio ? new Date(c.dataInicio).toLocaleDateString('pt-BR') : 'A definir'}
          </p>
          <span className="text-xs font-black text-[#1B4D3E]">{fmt(c.valorMensal)}</span>
        </div>
        <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1 min-w-0">
            {c.proposta?.user?.avatarUrl ? (
              <img src={c.proposta.user.avatarUrl} alt={c.proposta.user.nome}
                className="w-4.5 h-4.5 rounded-full object-cover border border-slate-200 shrink-0" />
            ) : (
              <div className="w-4.5 h-4.5 rounded-full bg-[#1B4D3E]/10 flex items-center justify-center text-[8px] font-black text-[#1B4D3E] uppercase border border-slate-200 shrink-0">
                {(c.proposta?.user?.nome || 'Sistema').split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
              </div>
            )}
            <span className="text-[9px] text-slate-500 font-bold truncate max-w-[120px]">
              {c.proposta?.user?.nome || 'Sistema'}
            </span>
          </div>
          <span className="text-[9px] font-bold text-slate-400">
            {c.empresaEmissora?.nomeFantasia || 'Grupo'}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── KanbanColumn ─────────────────────────────────────────────────────────────
function KanbanColumn({ status, isFirst = false, isLast = false, zIndex }: {
  status: string; isFirst?: boolean; isLast?: boolean; zIndex: number;
}) {
  const {
    filteredContratos, draggedStageId, draggedOverStageId, draggedOverBeforeStageId,
    statusesList, statusColors, editingStatusId, PRESET_COLORS,
    handleDragColumnStart, handleDragColumnEnd, handleDragLeave, handleDropColumnById,
    setEditingStatusId, handleCreateStatus, setContratos, setStatusesList, setStatusColors,
    showCustomAlert, setCustomModal,
    updateContratoStatus: updateStatus, renameContratoStatus: renameStatus,
    resolveColorToHex, resolveStatusColorToHex, hexToRgba, getContrastYIQ,
    getDarkenedHexForText,
  } = useContext(ContratosDnDCtx);

  const cards = filteredContratos.filter((c: any) => c.status === status);
  const total = cards.reduce((acc: number, c: any) => acc + (c.valorMensal || 0), 0);
  const resolvedHex = resolveColorToHex(resolveStatusColorToHex(status));
  const contrast = getContrastYIQ(resolvedHex);
  const bgRgba = hexToRgba(resolvedHex, contrast === 'white' ? 0.08 : 0.18);
  const borderRgba = hexToRgba(resolvedHex, contrast === 'white' ? 0.25 : 0.45);

  const [localName, setLocalName] = useState(status);
  useEffect(() => { setLocalName(status); }, [status]);

  const handleSaveName = async (newName: string) => {
    const trimmed = newName.trim();
    if (trimmed && trimmed !== status) {
      const res = await renameStatus(status, trimmed);
      if (res.success) {
        setContratos((prev: any[]) => prev.map((c: any) => c.status === status ? { ...c, status: trimmed } : c));
        const newList = statusesList.map((s: string) => s === status ? trimmed : s);
        setStatusesList(newList);
        localStorage.setItem('orse_contrato_statuses', JSON.stringify(newList));
        const newColors = { ...statusColors };
        const oldColor = newColors[status];
        if (oldColor) {
          newColors[trimmed] = oldColor;
          delete newColors[status];
          setStatusColors(newColors);
          localStorage.setItem('orse_contrato_status_colors', JSON.stringify(newColors));
        }
      } else {
        alert(res.error || 'Erro ao renomear status no banco de dados');
      }
    }
  };

  return (
    <div className="flex flex-col flex-shrink-0" style={{ width: '274px' }}>
      {/* Header draggável */}
      <div
        draggable="true"
        onDragStart={(e) => {
          const target = e.target as HTMLElement;
          if (target.closest('button') || target.closest('input')) { e.preventDefault(); return; }
          handleDragColumnStart(e, status, 'status');
        }}
        onDragEnd={handleDragColumnEnd}
        className="sticky top-0 bg-slate-50 cursor-grab active:cursor-grabbing z-20 select-none duration-200"
        style={{ zIndex }}
      >
        <div className="relative h-[52px] shrink-0 z-10 w-full group/title pointer-events-auto">
          <svg
            className={`absolute inset-0 h-full transition-all duration-200 overflow-visible pointer-events-none ${isLast ? 'w-[274px]' : 'w-[282px]'}`}
            viewBox={isLast ? '0 0 274 52' : '0 0 282 52'}
            preserveAspectRatio="none"
            style={{ color: resolvedHex }}
          >
            <path
              d={isFirst
                ? 'M 8,0 L 274,0 L 282,26 L 274,52 L 0,52 L 0,8 A 8,8 0 0,1 8,0 Z'
                : isLast
                  ? 'M 0,0 L 266,0 A 8,8 0 0,1 274,8 L 274,52 L 0,52 L 8,26 L 0,0 Z'
                  : 'M 0,0 L 274,0 L 282,26 L 274,52 L 0,52 L 8,26 L 0,0 Z'}
              fill="currentColor"
              stroke={contrast === 'white' ? 'rgba(255,255,255,0.2)' : 'rgba(15,23,42,0.08)'}
              strokeWidth="1"
            />
          </svg>
          <div
            className={`absolute inset-0 z-10 flex items-center justify-between ${isFirst ? 'pl-4 pr-7' : 'pl-7 pr-7'}`}
            style={{ color: contrast === 'white' ? '#ffffff' : '#0f172a' }}
          >
            <div className="flex flex-col min-w-0 justify-center">
              <span className="text-sm font-black uppercase tracking-wider truncate max-w-[160px] leading-none">{status}</span>
              <span className="text-xs font-bold mt-1 opacity-90 truncate select-none leading-none">
                {fmt(total)}/mês • {cards.length} {cards.length === 1 ? 'contrato' : 'contratos'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleCreateStatus(status); }}
                className="p-1 rounded-full opacity-0 group-hover/title:opacity-100 transition-opacity duration-150 flex items-center justify-center cursor-pointer hover:bg-black/5"
                style={{ color: 'inherit' }} title="Criar Nova Etapa"
              ><Plus size={14} /></button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setEditingStatusId(status); }}
                className="p-1 rounded-full opacity-0 group-hover/title:opacity-100 transition-opacity duration-150 flex items-center justify-center cursor-pointer hover:bg-black/5"
                style={{ color: 'inherit' }} title="Editar Coluna"
              ><Edit2 size={14} /></button>
            </div>
          </div>

          {editingStatusId === status && (
            <>
              <div className="fixed inset-0 z-30 cursor-default" onClick={(e) => { e.stopPropagation(); setEditingStatusId(null); }} />
              <div
                className="absolute left-1/2 -translate-x-1/2 top-12 z-40 bg-white border border-slate-200 rounded-xl shadow-xl p-3 w-[260px] text-slate-800 flex flex-col gap-3.5 cursor-default font-sans text-left normal-case tracking-normal"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Editar Coluna</span>
                  <button onClick={() => setEditingStatusId(null)} className="p-0.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-colors">
                    <X size={12} />
                  </button>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Nome do Status</label>
                  <input
                    type="text" value={localName}
                    onChange={(e) => setLocalName(e.target.value)}
                    className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 focus:border-slate-300 outline-none w-full bg-slate-50 font-medium text-slate-800"
                    placeholder="Nome do status"
                    onKeyDown={async (e) => { if (e.key === 'Enter') { await handleSaveName(localName); setEditingStatusId(null); } }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Selecione a Cor</label>
                  <div className="grid grid-cols-10 gap-1 mt-0.5">
                    {PRESET_COLORS.map((c: string) => {
                      const isSelected = resolvedHex.toLowerCase() === c.toLowerCase();
                      return (
                        <button
                          key={c} type="button" title={c}
                          onClick={() => {
                            const newColors = { ...statusColors, [status]: c };
                            setStatusColors(newColors);
                            localStorage.setItem('orse_contrato_status_colors', JSON.stringify(newColors));
                          }}
                          className="w-4 h-4 rounded-full border shadow-sm transition-all hover:scale-110 active:scale-95 flex items-center justify-center cursor-pointer"
                          style={{ backgroundColor: c, borderColor: isSelected ? '#0f172a' : 'rgba(0,0,0,0.1)', borderWidth: isSelected ? '2px' : '1px' }}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getContrastYIQ(c) === 'white' ? '#fff' : '#000' }} />}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="flex flex-col gap-1 pt-1 border-t border-slate-100">
                  <label className="flex items-center gap-2 cursor-pointer border border-slate-200 rounded-lg px-2.5 py-1.5 hover:bg-slate-50 transition-colors w-full">
                    <input
                      type="color" value={resolvedHex}
                      onChange={(e) => {
                        const newColors = { ...statusColors, [status]: e.target.value };
                        setStatusColors(newColors);
                        localStorage.setItem('orse_contrato_status_colors', JSON.stringify(newColors));
                      }}
                      className="w-8 h-5 border-0 p-0 cursor-pointer rounded bg-transparent"
                    />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Cor personalizada</span>
                  </label>
                </div>
                <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-100 mt-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (cards.length > 0) {
                        showCustomAlert('Não é possível excluir', `Esta coluna possui ${cards.length} contrato(s). Por favor, mova todos os contratos para outra coluna antes de excluí-la.`);
                        return;
                      }
                      setCustomModal({
                        isOpen: true, title: 'Excluir Coluna', type: 'confirm',
                        message: `Tem certeza que deseja excluir la coluna "${status}"?`,
                        onConfirm: () => {
                          const newList = statusesList.filter((s: string) => s !== status);
                          setStatusesList(newList);
                          localStorage.setItem('orse_contrato_statuses', JSON.stringify(newList));
                          const newColors = { ...statusColors };
                          delete newColors[status];
                          setStatusColors(newColors);
                          localStorage.setItem('orse_contrato_status_colors', JSON.stringify(newColors));
                          setEditingStatusId(null);
                        }
                      });
                    }}
                    className="w-full py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-bold transition-colors text-center cursor-pointer flex items-center justify-center gap-1.5"
                  ><Trash2 size={12} /> Excluir Coluna</button>
                  <button
                    type="button"
                    onClick={async () => { await handleSaveName(localName); setEditingStatusId(null); }}
                    className="w-full py-1.5 bg-[#1B4D3E] hover:bg-[#1B4D3E]/90 text-white rounded-lg text-xs font-bold transition-colors text-center cursor-pointer"
                  >Concluir</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Corpo da coluna */}
      <div
        className="px-[4px] py-3 rounded-b-2xl rounded-t-none"
        onDragOver={(e) => e.preventDefault()}
        onDrop={async (e) => {
          e.preventDefault();
          handleDragLeave();
          const colId = e.dataTransfer.getData('text/column-id');
          if (colId || draggedStageId) {
            handleDropColumnById(colId || draggedStageId!, draggedOverBeforeStageId || status, 'status');
          } else {
            const id = e.dataTransfer.getData('text/plain');
            if (id) {
              setContratos((prev: any[]) => prev.map((c: any) => c.id === id ? { ...c, status } : c));
              await updateStatus(id, status);
            }
          }
        }}
        style={{
          width: '274px', minWidth: '274px', maxWidth: '274px', marginLeft: '0px',
          backgroundColor: bgRgba, borderColor: borderRgba,
          borderWidth: '0 1px 1px 1px', borderStyle: 'solid',
          height: 'calc(100vh - 52px)', overflowY: 'auto',
        }}
      >
        <div className="flex flex-col gap-1.5 flex-1">
          {!draggedStageId && draggedOverStageId === status && (
            <div className="bg-slate-100/70 border-2 border-dashed border-[#1B4D3E]/30 rounded-lg h-[120px] w-full animate-pulse flex items-center justify-center">
              <span className="text-[10px] font-black text-[#1B4D3E]/60 uppercase tracking-widest animate-pulse">Soltar aqui</span>
            </div>
          )}
          {cards.length === 0
            ? ((!draggedStageId && draggedOverStageId === status) ? null : (
              <div className="border border-dashed border-slate-300/40 rounded-xl py-12 flex items-center justify-center flex-1">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Sem contratos</p>
              </div>
            ))
            : cards.map((c: any) => <ContractCard key={c.id} c={c} />)
          }
        </div>
      </div>
    </div>
  );
}

// ─── KanbanSegmentoColumn ─────────────────────────────────────────────────────
function KanbanSegmentoColumn({ label, cards, isFirst = false, isLast = false, color, zIndex }: {
  label: string; cards: any[]; isFirst?: boolean; isLast?: boolean; color: string; zIndex: number;
}) {
  const {
    draggedStageId, draggedOverStageId, draggedOverBeforeStageId,
    editingSegmentoId, setEditingSegmentoId, PRESET_COLORS,
    handleDragColumnStart, handleDragColumnEnd, handleDragLeave, handleDropColumnById,
    setContratos, contratos, loadData, setSegmentoColors,
    resolveColorToHex, hexToRgba, getContrastYIQ, getDarkenedHexForText,
    updateCliente: updateClienteFn,
  } = useContext(ContratosDnDCtx);

  const total = cards.reduce((acc: number, c: any) => acc + (c.valorMensal || 0), 0);
  const resolvedHex = resolveColorToHex(color);
  const contrast = getContrastYIQ(resolvedHex);
  const bgRgba = hexToRgba(resolvedHex, contrast === 'white' ? 0.08 : 0.18);
  const borderRgba = hexToRgba(resolvedHex, contrast === 'white' ? 0.25 : 0.45);

  return (
    <div className="flex flex-col flex-shrink-0" style={{ width: '274px' }}>
      {/* Header draggável */}
      <div
        draggable="true"
        onDragStart={(e) => {
          const target = e.target as HTMLElement;
          if (target.closest('button') || target.closest('input')) { e.preventDefault(); return; }
          handleDragColumnStart(e, label, 'segmento');
        }}
        onDragEnd={handleDragColumnEnd}
        className="sticky top-0 bg-slate-50 cursor-grab active:cursor-grabbing z-20 select-none duration-200"
        style={{ zIndex }}
      >
        <div className="relative h-[52px] shrink-0 z-10 w-full group/title pointer-events-auto">
          <svg
            className={`absolute inset-0 h-full transition-all duration-200 overflow-visible pointer-events-none ${isLast ? 'w-[274px]' : 'w-[282px]'}`}
            viewBox={isLast ? '0 0 274 52' : '0 0 282 52'}
            preserveAspectRatio="none"
            style={{ color: resolvedHex }}
          >
            <path
              d={isFirst
                ? 'M 8,0 L 274,0 L 282,26 L 274,52 L 0,52 L 0,8 A 8,8 0 0,1 8,0 Z'
                : isLast
                  ? 'M 0,0 L 266,0 A 8,8 0 0,1 274,8 L 274,52 L 0,52 L 8,26 L 0,0 Z'
                  : 'M 0,0 L 274,0 L 282,26 L 274,52 L 0,52 L 8,26 L 0,0 Z'}
              fill="currentColor"
              stroke={contrast === 'white' ? 'rgba(255,255,255,0.2)' : 'rgba(15,23,42,0.08)'}
              strokeWidth="1"
            />
          </svg>
          <div
            className={`absolute inset-0 z-10 flex items-center justify-between ${isFirst ? 'pl-4 pr-7' : 'pl-7 pr-7'}`}
            style={{ color: contrast === 'white' ? '#ffffff' : '#0f172a' }}
          >
            <div className="flex flex-col min-w-0 justify-center">
              <div className="flex items-center gap-1.5 min-w-0">
                <Building size={14} className="shrink-0" style={{ color: 'inherit' }} />
                <span className="text-sm font-black uppercase tracking-wider truncate leading-none">{label}</span>
              </div>
              <span className="text-xs font-bold mt-1 opacity-90 truncate select-none leading-none">
                {fmt(total)}/mês • {cards.length} {cards.length === 1 ? 'contrato' : 'contratos'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setEditingSegmentoId(label); }}
                className="p-1 rounded-full opacity-0 group-hover/title:opacity-100 transition-opacity duration-150 flex items-center justify-center cursor-pointer hover:bg-black/5"
                style={{ color: 'inherit' }} title="Editar Cor"
              ><Edit2 size={14} /></button>
            </div>
          </div>

          {editingSegmentoId === label && (
            <>
              <div className="fixed inset-0 z-30 cursor-default" onClick={(e) => { e.stopPropagation(); setEditingSegmentoId(null); }} />
              <div
                className="absolute left-1/2 -translate-x-1/2 top-12 z-40 bg-white border border-slate-200 rounded-xl shadow-xl p-3 w-[260px] text-slate-800 flex flex-col gap-3.5 cursor-default font-sans text-left normal-case tracking-normal"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Editar Coluna</span>
                  <button onClick={() => setEditingSegmentoId(null)} className="p-0.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-650 transition-colors">
                    <X size={18} />
                  </button>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Selecione a Cor</label>
                  <div className="grid grid-cols-10 gap-1 mt-0.5">
                    {PRESET_COLORS.map((c: string) => {
                      const isSelected = resolvedHex.toLowerCase() === c.toLowerCase();
                      return (
                        <button
                          key={c} type="button" title={c}
                          onClick={() => {
                            localStorage.setItem(`kanban-segmento-color-${label}`, c);
                            setSegmentoColors((prev: any) => ({ ...prev, [label]: c }));
                          }}
                          className="w-4 h-4 rounded-full border shadow-sm transition-all hover:scale-110 active:scale-95 flex items-center justify-center"
                          style={{ backgroundColor: c, borderColor: isSelected ? '#0f172a' : 'rgba(0,0,0,0.1)', borderWidth: isSelected ? '2px' : '1px' }}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getContrastYIQ(c) === 'white' ? '#fff' : '#000' }} />}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="flex flex-col gap-1 pt-1 border-t border-slate-100">
                  <label className="flex items-center gap-2 cursor-pointer border border-slate-200 rounded-lg px-2.5 py-1.5 hover:bg-slate-50 transition-colors w-full">
                    <input
                      type="color" value={resolvedHex}
                      onChange={(e) => {
                        localStorage.setItem(`kanban-segmento-color-${label}`, e.target.value);
                        setSegmentoColors((prev: any) => ({ ...prev, [label]: e.target.value }));
                      }}
                      className="w-8 h-5 border-0 p-0 cursor-pointer rounded bg-transparent"
                    />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Cor personalizada</span>
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingSegmentoId(null)}
                  className="w-full py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-colors text-center cursor-pointer mt-1"
                >Concluir</button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Corpo */}
      <div
        className="px-[4px] py-3 rounded-b-2xl rounded-t-none"
        onDragOver={(e) => e.preventDefault()}
        onDrop={async (e) => {
          e.preventDefault();
          handleDragLeave();
          const colId = e.dataTransfer.getData('text/column-id');
          if (colId || draggedStageId) {
            handleDropColumnById(colId || draggedStageId!, draggedOverBeforeStageId || label, 'segmento');
          } else {
            const id = e.dataTransfer.getData('text/plain');
            if (id) {
              const newSegment = label === 'Sem Segmento' ? '' : label;
              const targetContrato = contratos.find((c: any) => c.id === id);
              if (targetContrato) {
                setContratos((prev: any[]) => prev.map((c: any) => c.id === id ? {
                  ...c, client: c.client ? { ...c.client, segmento: newSegment || null } : null,
                } : c));
                if (targetContrato.clientId) {
                  const res = await updateClienteFn(targetContrato.clientId, { segmento: newSegment });
                  if (!res.success) { alert(res.error || 'Erro ao atualizar o segmento do cliente'); loadData(); }
                } else {
                  alert('Este contrato não tem um cliente associado no banco de dados para salvar o segmento.');
                }
              }
            }
          }
        }}
        style={{
          width: '274px', minWidth: '274px', maxWidth: '274px', marginLeft: '0px',
          backgroundColor: bgRgba, borderColor: borderRgba,
          borderWidth: '0 1px 1px 1px', borderStyle: 'solid',
          height: 'calc(100vh - 52px)', overflowY: 'auto',
        }}
      >
        <div className="flex flex-col gap-1.5 flex-1">
          {!draggedStageId && draggedOverStageId === label && (
            <div className="bg-slate-100/70 border-2 border-dashed border-[#1B4D3E]/30 rounded-lg h-[120px] w-full animate-pulse flex items-center justify-center">
              <span className="text-[10px] font-black text-[#1B4D3E]/60 uppercase tracking-widest animate-pulse">Soltar aqui</span>
            </div>
          )}
          {cards.length === 0
            ? ((!draggedStageId && draggedOverStageId === label) ? null : (
              <div className="border border-dashed border-slate-300/40 rounded-xl py-12 flex items-center justify-center flex-1">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Sem contratos</p>
              </div>
            ))
            : cards.map((c: any) => <ContractCard key={c.id} c={c} />)
          }
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard Principal ───────────────────────────────────────────────────────
export default function ContratosDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [contratos, setContratos] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('lista');
  const [viewModeMounted, setViewModeMounted] = useState(false);
  const [segmentoColors, setSegmentoColors] = useState<Record<string, string>>({});
  const [editingSegmentoId, setEditingSegmentoId] = useState<string | null>(null);
  const [segmentos, setSegmentos] = useState<any[]>([]);

  const [draggedStageId, setDraggedStageId] = useState<string | null>(null);
  const [draggedOverStageId, setDraggedOverStageId] = useState<string | null>(null);
  const [draggedOverBeforeStageId, setDraggedOverBeforeStageId] = useState<string | null>(null);

  const [segmentoOrder, setSegmentoOrder] = useState<string[]>([]);

  const [statusesList, setStatusesList] = useState<string[]>(['Pendente de Assinatura', 'Vigente', 'Reajuste Pendente', 'Encerrado']);
  const [statusColors, setStatusColors] = useState<Record<string, string>>({
    'Pendente de Assinatura': '#f59e0b',
    'Vigente': '#10b981',
    'Reajuste Pendente': '#f97316',
    'Encerrado': '#64748b',
  });
  const [editingStatusId, setEditingStatusId] = useState<string | null>(null);

  const [customModal, setCustomModal] = useState<{
    isOpen: boolean; title: string; defaultValue?: string; placeholder?: string;
    onConfirm: (val: string) => void | Promise<void>; onCancel?: () => void;
    type: 'prompt' | 'alert' | 'confirm'; message?: string;
  }>({ isOpen: false, title: '', onConfirm: () => {}, type: 'prompt' });

  const showCustomAlert = (title: string, message: string) => {
    setCustomModal({ isOpen: true, title, message, type: 'alert', onConfirm: () => {} });
  };

  const handleCreateStatus = (insertAfterStatus: string) => {
    setCustomModal({
      isOpen: true, title: 'Novo Status/Etapa',
      placeholder: 'Nome do novo status/etapa (ex: Assinado)',
      type: 'prompt',
      onConfirm: (name) => {
        if (!name.trim()) return;
        const trimmed = name.trim();
        if (statusesList.includes(trimmed)) { showCustomAlert('Status Duplicado', 'Já existe um status com este nome.'); return; }
        const idx = statusesList.indexOf(insertAfterStatus);
        const newList = [...statusesList];
        if (idx !== -1) newList.splice(idx + 1, 0, trimmed); else newList.push(trimmed);
        setStatusesList(newList);
        localStorage.setItem('orse_contrato_statuses', JSON.stringify(newList));
        const newColors = { ...statusColors, [trimmed]: '#3b82f6' };
        setStatusColors(newColors);
        localStorage.setItem('orse_contrato_status_colors', JSON.stringify(newColors));
      }
    });
  };

  useEffect(() => {
    const saved = localStorage.getItem('orse_contrato_view_mode');
    if (saved) setViewMode(saved as any);

    if (typeof window !== 'undefined') {
      const segColors: Record<string, string> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('kanban-segmento-color-')) {
          segColors[key.replace('kanban-segmento-color-', '')] = localStorage.getItem(key) || '#3b82f6';
        }
      }
      setSegmentoColors(segColors);

      const savedStatuses = localStorage.getItem('orse_contrato_statuses');
      if (savedStatuses) { try { setStatusesList(JSON.parse(savedStatuses)); } catch {} }

      const savedStatusColors = localStorage.getItem('orse_contrato_status_colors');
      if (savedStatusColors) { try { setStatusColors(prev => ({ ...prev, ...JSON.parse(savedStatusColors) })); } catch {} }

      const storedSegmentoOrder = localStorage.getItem('contrato-segmento-order');
      if (storedSegmentoOrder) { try { setSegmentoOrder(JSON.parse(storedSegmentoOrder)); } catch {} }
    }
    setViewModeMounted(true);
  }, []);

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('orse_contrato_view_mode', mode);
  };

  const loadData = async () => {
    setLoading(true);
    const [res, segmentosRes] = await Promise.all([getContratos(), getSegmentos()]);
    if (res.success) setContratos(res.data || []);
    if (segmentosRes && segmentosRes.success) setSegmentos(segmentosRes.segmentos);
    else if (Array.isArray(segmentosRes)) setSegmentos(segmentosRes);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const getStatusColor = (status: string) => {
    if (status === 'Pendente de Assinatura') return 'bg-amber-100 text-amber-700 border-amber-200';
    if (status === 'Vigente') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (status === 'Reajuste Pendente') return 'bg-orange-100 text-orange-700 border-orange-200';
    if (status === 'Encerrado') return 'bg-slate-200 text-slate-700 border-slate-300';
    return 'bg-blue-100 text-blue-700 border-blue-200';
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCustomModal({
      isOpen: true, title: 'Excluir Contrato', type: 'confirm',
      message: 'Tem certeza que deseja excluir este contrato? Essa ação não pode ser desfeita.',
      onConfirm: async () => {
        const res = await deleteContrato(id);
        if (res.success) setContratos(prev => prev.filter(c => c.id !== id));
        else showCustomAlert('Erro ao Excluir Contrato', res.error || 'Erro ao excluir');
      }
    });
  };

  const filteredContratos = contratos.filter(c =>
    c.client?.razaoSocial?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.client?.nomeFantasia?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.empresaEmissora?.nomeFantasia?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.proposta?.numero?.toString().includes(searchTerm)
  );

  const kanbanSegmentoCols = React.useMemo(() => {
    const cols: { id: string; label: string; cards: any[]; total: number }[] = [];
    segmentos.forEach(seg => {
      const segName = seg.nome || seg;
      const segContratos = filteredContratos.filter(c => c.client?.segmento === segName);
      cols.push({ id: seg.id || segName, label: segName, cards: segContratos, total: segContratos.reduce((acc, c) => acc + (c.valorMensal || 0), 0) });
    });
    if (segmentoOrder.length > 0) {
      cols.sort((a, b) => {
        const idxA = segmentoOrder.indexOf(a.label), idxB = segmentoOrder.indexOf(b.label);
        if (idxA === -1 && idxB === -1) return 0;
        if (idxA === -1) return 1; if (idxB === -1) return -1;
        return idxA - idxB;
      });
    }
    return cols;
  }, [filteredContratos, segmentos, segmentoOrder]);

  const pendentesAssinatura = contratos.filter(c => c.status === statusesList[0]);
  const ativos = contratos.filter(c => c.status === statusesList[1]);
  const pendentesReajuste = contratos.filter(c => c.status === statusesList[2]);
  const encerrados = contratos.filter(c => c.status === statusesList[3]);
  const contratosValidosParaReceita = contratos.filter(c => c.status !== statusesList[3]);
  const valorMensalTotal = contratosValidosParaReceita.reduce((acc, c) => acc + (c.valorMensal || 0), 0);
  const valorGlobalTotal = contratosValidosParaReceita.reduce((acc, c) => acc + (c.valorTotal || 0), 0);

  const statusList = statusesList;

  // ── Utilitários de cor ───────────────────────────────────────────────────────
  const resolveStatusColorToHex = (status: string): string => statusColors[status] || '#3b82f6';

  const normalizeHex = (hex: string) => {
    let h = hex.replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    return '#' + h;
  };

  const getContrastYIQ = (hex: string) => {
    const n = normalizeHex(hex);
    const r = parseInt(n.slice(1, 3), 16), g = parseInt(n.slice(3, 5), 16), b = parseInt(n.slice(5, 7), 16);
    return (((r * 299) + (g * 587) + (b * 114)) / 1000) >= 140 ? 'black' : 'white';
  };

  const hexToRgba = (hex: string, alpha: number) => {
    const n = normalizeHex(hex);
    const r = parseInt(n.slice(1, 3), 16), g = parseInt(n.slice(3, 5), 16), b = parseInt(n.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const getDarkenedHexForText = (hex: string) => {
    const n = normalizeHex(hex);
    let r = parseInt(n.slice(1, 3), 16), g = parseInt(n.slice(3, 5), 16), b = parseInt(n.slice(5, 7), 16);
    if (((r * 299) + (g * 587) + (b * 114)) / 1000 > 170) {
      r = Math.max(0, Math.floor(r * 0.5)); g = Math.max(0, Math.floor(g * 0.5)); b = Math.max(0, Math.floor(b * 0.5));
    }
    const h = (v: number) => v.toString(16).padStart(2, '0');
    return `#${h(r)}${h(g)}${h(b)}`;
  };

  const resolveColorToHex = (color?: string): string => {
    if (!color) return '#3b82f6';
    const lower = color.toLowerCase().trim();
    if (lower.startsWith('#')) return lower;
    if (lower.includes('bg-slate-100')) return '#f1f5f9';
    if (lower.includes('bg-slate-200')) return '#e2e8f0';
    if (lower.includes('bg-gray-100')) return '#f3f4f6';
    if (lower.includes('bg-gray-200')) return '#e5e7eb';
    if (lower.includes('bg-sky-100')) return '#e0f2fe';
    if (lower.includes('bg-sky-200')) return '#bae6fd';
    if (lower.includes('bg-orange-100')) return '#ffedd5';
    if (lower.includes('bg-orange-200')) return '#fed7aa';
    if (lower.includes('bg-green-100') || lower.includes('bg-emerald-100')) return '#dcfce7';
    if (lower.includes('bg-green-200') || lower.includes('bg-emerald-200')) return '#bbf7d0';
    if (lower.includes('bg-red-100')) return '#fee2e2';
    if (lower.includes('bg-red-200')) return '#fecaca';
    if (lower.includes('bg-purple-100')) return '#f3e8ff';
    if (lower.includes('bg-purple-200')) return '#e9d5ff';
    if (lower.includes('bg-blue-100')) return '#dbeafe';
    if (lower.includes('bg-blue-200')) return '#bfdbfe';
    if (lower.includes('bg-yellow-100')) return '#fef9c3';
    if (lower.includes('bg-yellow-200')) return '#fef08a';
    if (lower.includes('bg-amber-100')) return '#fef3c7';
    if (lower.includes('bg-amber-200')) return '#fde68a';
    if (lower.includes('bg-teal-100')) return '#ccfbf1';
    if (lower.includes('bg-teal-200')) return '#99f6e4';
    if (lower.includes('bg-indigo-100')) return '#e0e7ff';
    if (lower.includes('bg-indigo-200')) return '#c7d2fe';
    if (lower.includes('bg-violet-100')) return '#ede9fe';
    if (lower.includes('bg-violet-200')) return '#ddd6fe';
    if (lower.includes('bg-pink-100')) return '#fce7f3';
    if (lower.includes('bg-pink-200')) return '#fbcfe8';
    if (lower.includes('bg-rose-100')) return '#ffe4e6';
    if (lower.includes('bg-rose-200')) return '#fecdd3';
    if (tailwindColorMap[lower]) return tailwindColorMap[lower];
    const stripped = lower.replace('bg-', '').split('-')[0];
    return tailwindColorMap[stripped] || '#3b82f6';
  };

  const PRESET_COLORS = [
    '#E0F2FE', '#E0F2F1', '#D1FAE5', '#ECFCCB', '#FEF9C3', '#FFEDD5', '#FFE4E6', '#FCE7F3', '#F3E8FF', '#F1F5F9',
    '#38BDF8', '#0D9488', '#10B981', '#84CC16', '#FACC15', '#FB923C', '#F43F5E', '#EC4899', '#8B5CF6', '#64748B',
    '#0EA5E9', '#00B4D8', '#00F5D4', '#39FF14', '#FFD000', '#FF9F1C', '#FF007F', '#D000FF', '#7000FF', '#48CAE4',
    '#0369A1', '#0B6623', '#065F46', '#3F6212', '#A16207', '#C2410C', '#B91C1C', '#9D174D', '#581C87', '#334155',
  ];

  // ── Handlers de drag-and-drop de coluna ────────────────────────────────────
  const handleDragColumnStart = (e: React.DragEvent, columnLabel: string, type: 'status' | 'segmento') => {
    e.dataTransfer.setData('text/column-id', columnLabel);
    e.dataTransfer.setData('text/column-type', type);
    setDraggedStageId(columnLabel);
  };

  const handleDragColumnEnd = () => {
    setDraggedStageId(null);
    setDraggedOverBeforeStageId(null);
    setDraggedOverStageId(null);
  };

  const handleDragEnd = () => {
    setDraggedStageId(null);
    setDraggedOverStageId(null);
  };

  const handleDragOver = (e: React.DragEvent, stageId?: string, type?: 'status' | 'segmento') => {
    e.preventDefault();
    if (draggedStageId) {
      if (stageId && stageId !== draggedStageId) {
        if (type) {
          let order: string[] = [];
          if (type === 'status') order = statusesList;
          else if (type === 'segmento') order = segmentoOrder.length > 0 ? segmentoOrder : segmentos.map(s => s.nome || s);

          const draggedIdx = order.indexOf(draggedStageId);
          const targetIdx = order.indexOf(stageId);
          if (draggedIdx !== -1 && targetIdx !== -1) {
            if (draggedIdx < targetIdx) {
              setDraggedOverBeforeStageId(targetIdx === order.length - 1 ? 'last' : order[targetIdx + 1]);
            } else {
              setDraggedOverBeforeStageId(stageId);
            }
            return;
          }
        }
        setDraggedOverBeforeStageId(stageId);
      }
    } else {
      if (stageId) setDraggedOverStageId(stageId);
    }
  };

  const handleDragLeave = () => { setDraggedOverStageId(null); };

  const handleDropColumnById = (sourceLabel: string, targetLabel: string, type: 'status' | 'segmento') => {
    if (sourceLabel === targetLabel) {
      setDraggedStageId(null);
      setDraggedOverBeforeStageId(null);
      return;
    }

    if (type === 'status') {
      const currentList = [...statusesList];
      const sourceIdx = currentList.indexOf(sourceLabel);
      if (sourceIdx === -1) return;
      currentList.splice(sourceIdx, 1);
      if (targetLabel === 'last') {
        currentList.push(sourceLabel);
      } else {
        const targetIdx = currentList.indexOf(targetLabel);
        if (targetIdx !== -1) currentList.splice(targetIdx, 0, sourceLabel);
        else currentList.push(sourceLabel);
      }
      setStatusesList(currentList);
      localStorage.setItem('orse_contrato_statuses', JSON.stringify(currentList));
    } else {
      const currentList = segmentoOrder.length > 0 ? [...segmentoOrder] : segmentos.map(s => s.nome || s);
      const sourceIdx = currentList.indexOf(sourceLabel);
      if (sourceIdx === -1) currentList.push(sourceLabel);
      else currentList.splice(sourceIdx, 1);
      if (targetLabel === 'last') {
        currentList.push(sourceLabel);
      } else {
        const targetIdx = currentList.indexOf(targetLabel);
        if (targetIdx !== -1) currentList.splice(targetIdx, 0, sourceLabel);
        else currentList.push(sourceLabel);
      }
      setSegmentoOrder(currentList);
      localStorage.setItem('contrato-segmento-order', JSON.stringify(currentList));
    }

    setDraggedStageId(null);
    setDraggedOverBeforeStageId(null);
  };

  // ── Valor do Context (compartilhado com KanbanColumn e KanbanSegmentoColumn) ──
  const ctxValue = {
    // estado
    contratos, filteredContratos, viewMode, draggedStageId, draggedOverStageId,
    draggedOverBeforeStageId, statusesList, statusColors, editingStatusId,
    editingSegmentoId, segmentoColors, PRESET_COLORS,
    // setters
    setContratos, setStatusesList, setStatusColors, setEditingStatusId,
    setEditingSegmentoId, setSegmentoColors, setCustomModal,
    // handlers
    router, loadData,
    handleDragColumnStart, handleDragColumnEnd, handleDragEnd,
    handleDragLeave, handleDropColumnById,
    handleCreateStatus, showCustomAlert,
    // ações server
    updateContratoStatus, renameContratoStatus, updateCliente,
    // utilitários de cor
    resolveStatusColorToHex, resolveColorToHex,
    hexToRgba, getContrastYIQ, getDarkenedHexForText, normalizeHex,
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <ContratosDnDCtx.Provider value={ctxValue}>
      <div className="flex h-screen overflow-hidden bg-[#F8FAFC]">
        <Sidebar />

        <main className="flex-1 overflow-auto bg-[#F8FAFC]">
          <div className="w-full">

            {/* HEADER */}
            <header className="px-8 pt-6 pb-4 flex justify-between items-end border-b border-slate-300 shrink-0 bg-white relative z-30">
              <div>
                <h1 className="text-xl md:text-2xl font-black text-slate-800">Gestão de Contratos (CLM)</h1>
                <p className="text-slate-500 text-xs md:text-sm mt-1">Ciclo de vida, Reajustes e Aditivos</p>
              </div>
              <div className="flex items-center gap-3 bell-header-spacing">
                <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-sm gap-1">
                  <button onClick={() => handleViewModeChange('lista')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex-shrink-0 ${viewMode === 'lista' ? 'bg-[#1B4D3E] text-white shadow-sm' : 'text-amber-500 hover:text-amber-600'}`}>
                    <LayoutList size={14} /> Lista
                  </button>
                  <button onClick={() => handleViewModeChange('kanban-status')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex-shrink-0 ${viewMode === 'kanban-status' ? 'bg-[#1B4D3E] text-white shadow-sm' : 'text-amber-500 hover:text-amber-600'}`}>
                    <LayoutGrid size={14} /> Por Status
                  </button>
                  <button onClick={() => handleViewModeChange('kanban-segmento')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex-shrink-0 ${viewMode === 'kanban-segmento' ? 'bg-[#1B4D3E] text-white shadow-sm' : 'text-amber-500 hover:text-amber-600'}`}>
                    <Building size={14} /> Por Segmento
                  </button>
                </div>
                <button onClick={() => router.push('/contratos/templates')}
                  className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold py-2 px-4 rounded-xl text-sm flex items-center gap-2 shadow-sm transition-colors">
                  <FileText size={16} /> Minutas
                </button>
                <button onClick={() => router.push('/contratos/novo')}
                  className="bg-[#1B4D3E] hover:bg-[#13382d] text-white font-bold py-2 px-4 rounded-xl text-sm flex items-center gap-2 shadow-sm transition-colors">
                  <Plus size={16} /> Novo Contrato
                </button>
              </div>
            </header>

            {/* KPIs */}
            <div className="px-8 py-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 shrink-0 bg-white border-b border-slate-100">
              {[
                { label: 'Em Assinatura', value: pendentesAssinatura.length, icon: <AlertCircle size={18} />, bg: 'bg-amber-50', border: 'border-amber-200', color: 'text-amber-600' },
                { label: 'Ativos (Vigentes)', value: ativos.length, icon: <CheckCircle size={18} />, bg: 'bg-emerald-50', border: 'border-emerald-200', color: 'text-emerald-600' },
                { label: 'Receita Mensal', value: fmt(valorMensalTotal), icon: <DollarSign size={18} />, bg: 'bg-blue-50', border: 'border-blue-200', color: 'text-blue-600', small: true },
                { label: 'Valor Global', value: fmt(valorGlobalTotal), icon: <TrendingUp size={18} />, bg: 'bg-indigo-50', border: 'border-indigo-200', color: 'text-indigo-600', small: true },
                { label: 'Pend. Reajuste', value: pendentesReajuste.length, icon: <AlertCircle size={18} />, bg: 'bg-orange-50', border: 'border-orange-200', color: 'text-orange-600' },
                { label: 'Encerrados', value: encerrados.length, icon: <Calendar size={18} />, bg: 'bg-slate-100', border: 'border-slate-200', color: 'text-slate-600' },
              ].map(({ label, value, icon, bg, border, color, small }) => (
                <div key={label} className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center gap-3">
                  <div className={`p-2.5 ${bg} rounded-lg border ${border} ${color}`}>{icon}</div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</p>
                    <p className={`${small ? 'text-sm' : 'text-lg'} font-black text-slate-800 leading-none mt-1`}>{value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* BARRA DE BUSCA */}
            <div className="px-8 py-3 flex items-center gap-3 shrink-0 bg-white border-b border-slate-200">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text" placeholder="Buscar contrato, cliente ou emissora..."
                  className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-emerald-500 focus:outline-none transition-all shadow-sm"
                  value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* LISTA */}
            {!viewModeMounted && (
              <div className="flex-1 flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-3 border-[#1B4D3E]/20 border-t-[#1B4D3E] rounded-full animate-spin" />
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Carregando...</span>
                </div>
              </div>
            )}

            {viewModeMounted && viewMode === 'lista' && (
              <div className="bg-white overflow-hidden flex-1 flex flex-col min-h-0 w-full">
                <div className="overflow-auto flex-1 min-h-0">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#1B4D3E] text-white text-[10px] font-bold uppercase tracking-wider">
                        {['Contrato','Cliente','Empresa Grupo','Criado Por','Gerado Em','Início','Vigência','Vencimento','Data Reajuste','Mensal','Status','Ações'].map(h => (
                          <th key={h} className={`px-6 py-3${h === 'Mensal' ? ' text-right' : ['Início','Vigência','Vencimento','Data Reajuste','Status','Ações'].includes(h) ? ' text-center' : ''}`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {loading ? (
                        <tr><td colSpan={12} className="px-6 py-12 text-center text-slate-400">Carregando contratos...</td></tr>
                      ) : filteredContratos.length === 0 ? (
                        <tr><td colSpan={12} className="px-6 py-12 text-center text-slate-400">Nenhum contrato encontrado.</td></tr>
                      ) : filteredContratos.map((c) => (
                        <tr key={c.id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-3 font-bold text-slate-700">{gerarNumeroContrato(c)}</td>
                          <td className="px-6 py-3 font-semibold text-slate-800">{c.client?.razaoSocial || c.client?.nomeFantasia}</td>
                          <td className="px-6 py-3 text-slate-600">{c.empresaEmissora?.nomeFantasia}</td>
                          <td className="px-6 py-3">
                            <div className="flex items-center gap-1.5">
                              {c.proposta?.user?.avatarUrl
                                ? <img src={c.proposta.user.avatarUrl} alt={c.proposta.user.nome} className="w-5 h-5 rounded-full object-cover border border-slate-200" />
                                : <div className="w-5 h-5 rounded-full bg-[#1B4D3E]/10 flex items-center justify-center text-[8px] font-black text-[#1B4D3E] uppercase border border-slate-200">
                                    {(c.proposta?.user?.nome || 'Sistema').split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                                  </div>}
                              <span className="text-slate-600 font-medium">{c.proposta?.user?.nome || 'Sistema'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-3 text-slate-500 font-mono text-xs">{new Date(c.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                          <td className="px-6 py-3 text-center text-slate-600 font-medium">{c.dataInicio ? new Date(c.dataInicio).toLocaleDateString('pt-BR') : '-'}</td>
                          <td className="px-6 py-3 text-center text-slate-600 font-medium">{c.vigenciaMeses}m</td>
                          <td className="px-6 py-3 text-center text-slate-600">{renderVencimento(c.dataInicio, c.vigenciaMeses)}</td>
                          <td className="px-6 py-3 text-center text-orange-600 font-bold">{c.dataReajuste ? new Date(c.dataReajuste).toLocaleDateString('pt-BR') : '-'}</td>
                          <td className="px-6 py-3 text-right font-black text-[#1B4D3E]">{fmt(c.valorMensal)}</td>
                          <td className="px-6 py-3 text-center">
                            <span className="text-[10px] font-black px-2 py-1 rounded uppercase tracking-wider border shadow-2xs"
                              style={{ backgroundColor: hexToRgba(resolveStatusColorToHex(c.status), 0.1), color: getDarkenedHexForText(resolveStatusColorToHex(c.status)), borderColor: hexToRgba(resolveStatusColorToHex(c.status), 0.25) }}>
                              {c.status}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button onClick={() => window.open(`/contratos/${c.id}/print`, '_blank')} className="text-slate-500 hover:text-slate-700 transition-colors p-1 bg-slate-100 rounded" title="Gerar/Imprimir PDF"><Printer size={16} /></button>
                              <button onClick={() => router.push(`/contratos/${c.id}`)} className="text-amber-500 hover:text-amber-600 transition-colors p-1 bg-amber-50 rounded" title="Editar Contrato"><Edit2 size={16} /></button>
                              <button onClick={(e) => handleDelete(c.id, e)} className="text-red-500 hover:text-red-600 transition-colors p-1 bg-red-50 rounded" title="Excluir Contrato"><Trash2 size={16} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* KANBAN POR STATUS */}
            {viewModeMounted && viewMode === 'kanban-status' && (
              <div className="py-4 bg-slate-50 min-w-max">
                <div className="flex gap-[3px]">
                  {statusList.map((status, index) => {
                    const isFirst = index === 0;
                    const isLast = index === statusList.length - 1;
                    const showBeforePlaceholder = draggedStageId && draggedOverBeforeStageId === status && draggedStageId !== status;
                    return (
                      <React.Fragment key={status}>
                        {showBeforePlaceholder && (
                          <div
                            className="w-[274px] shrink-0 bg-slate-100/40 border-2 border-dashed border-[#1B4D3E]/30 rounded-2xl h-[calc(100vh-100px)] flex items-center justify-center mx-1.5 transition-all duration-200"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => { e.preventDefault(); handleDropColumnById(draggedStageId!, status, 'status'); }}
                          >
                            <div className="flex flex-col items-center gap-2">
                              <span className="text-[11px] font-black text-[#1B4D3E]/60 uppercase tracking-widest">Soltar aqui</span>
                            </div>
                          </div>
                        )}
                        <div
                          className={`flex flex-col flex-shrink-0 transition-opacity duration-200 ${draggedStageId === status ? 'opacity-30' : 'opacity-100'}`}
                          style={{ width: '274px' }}
                          onDragOver={(e) => handleDragOver(e, status, 'status')}
                          onDrop={(e) => {
                            e.preventDefault();
                            const colId = e.dataTransfer.getData('text/column-id');
                            if (colId || draggedStageId) {
                              handleDropColumnById(colId || draggedStageId!, draggedOverBeforeStageId || status, 'status');
                            }
                          }}
                        >
                          <KanbanColumn status={status} isFirst={isFirst} isLast={isLast} zIndex={20 + (statusList.length - index)} />
                        </div>
                      </React.Fragment>
                    );
                  })}

                  {draggedStageId && draggedOverBeforeStageId === 'last' && (
                    <div
                      className="w-[274px] shrink-0 bg-slate-100/40 border-2 border-dashed border-[#1B4D3E]/30 rounded-2xl h-[calc(100vh-100px)] flex items-center justify-center mx-1.5 transition-all duration-200"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => { e.preventDefault(); handleDropColumnById(draggedStageId!, 'last', 'status'); }}
                    >
                      <span className="text-[11px] font-black text-[#1B4D3E]/60 uppercase tracking-widest">Mover para o fim</span>
                    </div>
                  )}

                  {draggedStageId && draggedOverBeforeStageId !== 'last' && (
                    <div
                      className="w-[60px] shrink-0 border border-dashed border-[#1B4D3E]/30 hover:border-[#1B4D3E]/50 bg-[#1B4D3E]/5 hover:bg-[#1B4D3E]/10 rounded-2xl h-[calc(100vh-100px)] flex items-center justify-center mx-1 cursor-pointer transition-colors"
                      onDragOver={(e) => { e.preventDefault(); setDraggedOverBeforeStageId('last'); }}
                      onDrop={(e) => { e.preventDefault(); handleDropColumnById(draggedStageId!, 'last', 'status'); }}
                    >
                      <span className="text-[9px] font-black text-[#1B4D3E]/60 uppercase tracking-wider text-center rotate-180" style={{ writingMode: 'vertical-lr' }}>
                        Soltar no fim
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* KANBAN POR SEGMENTO */}
            {viewModeMounted && viewMode === 'kanban-segmento' && (
              <div className="py-4 bg-slate-50 min-w-max">
                <div className="flex gap-[3px]">
                  {kanbanSegmentoCols.map((col, index) => {
                    const isFirst = index === 0;
                    const isLast = index === kanbanSegmentoCols.length - 1;
                    const showBeforePlaceholder = draggedStageId && draggedOverBeforeStageId === col.label && draggedStageId !== col.label;
                    return (
                      <React.Fragment key={col.id}>
                        {showBeforePlaceholder && (
                          <div
                            className="w-[274px] shrink-0 bg-slate-100/40 border-2 border-dashed border-[#1B4D3E]/30 rounded-2xl h-[calc(100vh-100px)] flex items-center justify-center mx-1.5 transition-all duration-200"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => { e.preventDefault(); handleDropColumnById(draggedStageId!, col.label, 'segmento'); }}
                          >
                            <span className="text-[11px] font-black text-[#1B4D3E]/60 uppercase tracking-widest">Soltar aqui</span>
                          </div>
                        )}
                        <div
                          className={`flex flex-col flex-shrink-0 transition-opacity duration-200 ${draggedStageId === col.label ? 'opacity-30' : 'opacity-100'}`}
                          style={{ width: '274px' }}
                          onDragOver={(e) => handleDragOver(e, col.label, 'segmento')}
                          onDrop={(e) => {
                            e.preventDefault();
                            const colId = e.dataTransfer.getData('text/column-id');
                            if (colId || draggedStageId) {
                              handleDropColumnById(colId || draggedStageId!, draggedOverBeforeStageId || col.label, 'segmento');
                            }
                          }}
                        >
                          <KanbanSegmentoColumn
                            label={col.label} cards={col.cards}
                            isFirst={isFirst} isLast={isLast}
                            color={segmentoColors[col.label] || '#3b82f6'}
                            zIndex={20 + (kanbanSegmentoCols.length - index)}
                          />
                        </div>
                      </React.Fragment>
                    );
                  })}

                  {draggedStageId && draggedOverBeforeStageId === 'last' && (
                    <div
                      className="w-[274px] shrink-0 bg-slate-100/40 border-2 border-dashed border-[#1B4D3E]/30 rounded-2xl h-[calc(100vh-100px)] flex items-center justify-center mx-1.5 transition-all duration-200"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => { e.preventDefault(); handleDropColumnById(draggedStageId!, 'last', 'segmento'); }}
                    >
                      <span className="text-[11px] font-black text-[#1B4D3E]/60 uppercase tracking-widest">Mover para o fim</span>
                    </div>
                  )}

                  {draggedStageId && draggedOverBeforeStageId !== 'last' && (
                    <div
                      className="w-[60px] shrink-0 border border-dashed border-[#1B4D3E]/30 hover:border-[#1B4D3E]/50 bg-[#1B4D3E]/5 hover:bg-[#1B4D3E]/10 rounded-2xl h-[calc(100vh-100px)] flex items-center justify-center mx-1 cursor-pointer transition-colors"
                      onDragOver={(e) => { e.preventDefault(); setDraggedOverBeforeStageId('last'); }}
                      onDrop={(e) => { e.preventDefault(); handleDropColumnById(draggedStageId!, 'last', 'segmento'); }}
                    >
                      <span className="text-[9px] font-black text-[#1B4D3E]/60 uppercase tracking-wider text-center rotate-180" style={{ writingMode: 'vertical-lr' }}>
                        Soltar no fim
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </main>

        {/* MODAL */}
        {customModal.isOpen && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md border border-slate-200 animate-in fade-in zoom-in-95 duration-200 text-slate-800 p-6 flex flex-col gap-4 font-sans">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900">{customModal.title}</h3>
                <button onClick={() => { setCustomModal(prev => ({ ...prev, isOpen: false })); if (customModal.onCancel) customModal.onCancel(); }} className="text-slate-400 hover:text-slate-650 transition-colors">
                  <X size={18} />
                </button>
              </div>
              {customModal.type === 'prompt' && (
                <input type="text" id="custom-modal-input" defaultValue={customModal.defaultValue || ''} placeholder={customModal.placeholder || ''}
                  autoFocus
                  onKeyDown={(e) => { if (e.key === 'Enter') { const input = document.getElementById('custom-modal-input') as HTMLInputElement; customModal.onConfirm(input?.value || ''); setCustomModal(prev => ({ ...prev, isOpen: false })); } }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-1 focus:ring-emerald-500"
                />
              )}
              {customModal.type !== 'prompt' && (
                <p className="text-xs text-slate-650 leading-relaxed font-medium">{customModal.message}</p>
              )}
              <div className="flex justify-end gap-3 pt-2">
                {customModal.type !== 'alert' && (
                  <button onClick={() => { setCustomModal(prev => ({ ...prev, isOpen: false })); if (customModal.onCancel) customModal.onCancel(); }}
                    className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all">
                    Cancelar
                  </button>
                )}
                <button
                  onClick={() => { const input = document.getElementById('custom-modal-input') as HTMLInputElement; customModal.onConfirm(customModal.type === 'prompt' ? (input?.value || '') : ''); setCustomModal(prev => ({ ...prev, isOpen: false })); }}
                  className="px-4 py-2 bg-[#1B4D3E] hover:bg-[#1B4D3E]/80 text-white text-[10px] font-black uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg transition-all">
                  {customModal.type === 'alert' ? 'OK' : 'Confirmar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ContratosDnDCtx.Provider>
  );
}
