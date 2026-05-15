'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { 
  ArrowLeft, Save, Plus, Trash2, 
  MapPin, Briefcase, HeartPulse, Calendar, Settings, Search, X
} from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { getCCTs, createCCT, updateCCT } from '@/app/ccts/actions';
import { getProdutos } from '@/app/produtos/actions';

const ESTADOS_BRASIL = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

const labelClass = "text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block";
const inputClass = "w-full px-3 py-2 bg-white border border-slate-300 rounded text-sm text-slate-800 outline-none focus:border-[#1B4D3E] focus:ring-1 focus:ring-[#1B4D3E]";

export default function CCTEditorPage() {
  const router = useRouter();
  const { id } = useParams();
  const isNew = id === 'new';

  const [formData, setFormData] = useState<any>({
    nome: '',
    uf: 'SP',
    cidade: '',
    vigenciaInicio: new Date().toISOString().split('T')[0],
    vigenciaFim: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
    vaValor: 0,
    vaTipo: 'DIARIO',
    vaDescPercent: 0,
    vaProvisFerias: false,
    vtValor: 0,
    vtDescPercent: 6,
    cestaBasica: 0,
    examesMedicos: 0,
    seguroVida: 0,
    provisFerias: 11.11,
    provis13: 8.33,
    encargoInss: 20,
    encargoFgts: 8,
    pis: 0.65,
    cofins: 3,
    iss: 5,
    margemLucro: 10,
    taxaAdm: 5,
    custosSindicato: 0,
    
    outrosBeneficios: 0
  });

  const [cargos, setCargos] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  
  // Estados para Modal de EPI
  const [allEpis, setAllEpis] = useState<any[]>([]);
  const [showEpiModal, setShowEpiModal] = useState(false);
  const [activeCargoIdx, setActiveCargoIdx] = useState<number | null>(null);
  const [epiSearch, setEpiSearch] = useState('');

  useEffect(() => {
    async function loadEpis() {
      const data = await getProdutos();
      setAllEpis(data.filter((p: any) => p.categoria === 'EPIs e Uniformes'));
    }
    loadEpis();
  }, []);

  useEffect(() => {
    if (!isNew) {
      async function load() {
        const data = await getCCTs();
        const item = data.find((c: any) => c.id === id);
        if (item) {
          setFormData({
            ...item,
            vigenciaInicio: item.vigenciaInicio ? new Date(item.vigenciaInicio).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            vigenciaFim: item.vigenciaFim ? new Date(item.vigenciaFim).toISOString().split('T')[0] : new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
          });
          if (item.cargos && item.cargos.length > 0) {
            setCargos(item.cargos);
          }
        }
      }
      load();
    } else {
      setCargos([{ id: 'new-1', nome: '', pisoSalarial: 0, gratificacoes: 0, assiduidade: 0, adicionalCopa: 0 }]);
    }
  }, [id, isNew]);

  const addCargo = () => {
    setCargos([...cargos, { id: Math.random().toString(), nome: '', pisoSalarial: 0, gratificacoes: 0, assiduidade: 0, adicionalCopa: 0 }]);
  };

  const updateCargo = (idx: number, field: string, val: any) => {
    const newCargos = [...cargos];
    newCargos[idx][field] = val;
    setCargos(newCargos);
  };

  const removeCargo = (idx: number) => {
    setCargos(cargos.filter((_, i) => i !== idx));
  };

  const openEpiModal = (idx: number) => {
    setActiveCargoIdx(idx);
    setShowEpiModal(true);
  };

  const addEpiToCargo = (epi: any) => {
    if (activeCargoIdx === null) return;
    const newCargos = [...cargos];
    const cargo = newCargos[activeCargoIdx];
    const currentEpis = Array.isArray(cargo.episConfig) ? cargo.episConfig : [];
    
    // Evita duplicados (opcional, mas bom ter)
    if (currentEpis.find((e: any) => e.produtoId === epi.id)) {
      alert('Este item já está na composição.');
      return;
    }

    const newItem = {
      produtoId: epi.id,
      descricao: epi.descricao,
      precoUnitario: epi.precoUnitario,
      quantidade: 1,
      vidaUtil: 6 // Padrão 6 meses
    };

    newCargos[activeCargoIdx].episConfig = [...currentEpis, newItem];
    setCargos(newCargos);
  };

  const updateEpiItem = (epiIdx: number, field: string, val: any) => {
    if (activeCargoIdx === null) return;
    const newCargos = [...cargos];
    const currentEpis = [...newCargos[activeCargoIdx].episConfig];
    currentEpis[epiIdx][field] = val;
    newCargos[activeCargoIdx].episConfig = currentEpis;
    setCargos(newCargos);
  };

  const removeEpiItem = (epiIdx: number) => {
    if (activeCargoIdx === null) return;
    const newCargos = [...cargos];
    newCargos[activeCargoIdx].episConfig = newCargos[activeCargoIdx].episConfig.filter((_: any, i: number) => i !== epiIdx);
    setCargos(newCargos);
  };

  const calculateCargoEpiTotal = (cargo: any) => {
    if (!cargo.episConfig || !Array.isArray(cargo.episConfig)) return 0;
    return cargo.episConfig.reduce((acc: number, item: any) => {
      const custoMensal = (item.precoUnitario * item.quantidade) / (item.vidaUtil || 1);
      return acc + custoMensal;
    }, 0);
  };

  const handleSave = async () => {
    if (!formData.nome?.trim()) return alert('Informe o nome da regra técnica.');
    try {
      setSaving(true);
      
      // Sincroniza o uniformeEpi de cada cargo com o total da composição antes de salvar
      const cargosSincronizados = cargos.map(c => ({
        ...c,
        uniformeEpi: calculateCargoEpiTotal(c)
      }));

      const dataToSave = { ...formData, cargos: cargosSincronizados };
      let res: any;
      if (isNew) {
        res = await createCCT(dataToSave);
      } else {
        res = await updateCCT(id as string, dataToSave);
      }
      if (res && res.error) {
        alert('Erro: ' + res.error);
        return;
      }
      router.push('/admin/ccts');
    } catch (err: any) {
      alert('Erro inesperado: ' + (err?.message || 'Desconhecido'));
    } finally {
      setSaving(false);
    }
  };

  const field = (label: string, key: string, type = 'text', extra?: React.ReactNode) => (
    <div className="space-y-1">
      <label className={labelClass}>{label}</label>
      <input
        type={type}
        step={type === 'number' ? '0.01' : undefined}
        className={inputClass}
        value={formData[key] ?? ''}
        onChange={e => setFormData({ ...formData, [key]: type === 'number' ? e.target.value : e.target.value })}
      />
      {extra}
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="bg-white border-b border-slate-300 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="text-slate-400 hover:text-[#1B4D3E] transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Módulo de Engenharia e Controladoria</p>
              <h1 className="text-xl font-black text-slate-900 uppercase">
                {isNew ? 'Nova Regra Técnica' : 'Editar Regra Técnica'}
              </h1>
              <p className="text-xs text-slate-500">Configuração de Sindicato / Convenção Coletiva</p>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#1B4D3E] hover:bg-[#13382D] disabled:opacity-50 text-white font-bold py-2.5 px-6 rounded text-sm flex items-center gap-2 shadow-sm transition-colors"
          >
            <Save size={16} /> {saving ? 'Salvando...' : 'Salvar Regra'}
          </button>
        </div>

        <div className="max-w-5xl mx-auto p-8 space-y-6 pb-32">

          {/* Bloco 1: Identificação Regional */}
          <div className="bg-white border border-slate-300 rounded-md shadow-sm overflow-hidden">
            <div className="bg-[#1B4D3E] px-6 py-3 flex items-center gap-2">
              <MapPin size={16} className="text-emerald-300" />
              <h2 className="text-xs font-black text-white uppercase tracking-widest">Identificação Regional</h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1 space-y-1">
                <label className={labelClass}>Nome da Regra / Sindicato</label>
                <input
                  type="text"
                  placeholder="Ex: SIEMACO"
                  className={inputClass}
                  value={formData.nome}
                  onChange={e => setFormData({ ...formData, nome: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className={labelClass}>UF</label>
                <select
                  className={inputClass}
                  value={formData.uf}
                  onChange={e => setFormData({ ...formData, uf: e.target.value })}
                >
                  {ESTADOS_BRASIL.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className={labelClass}>Cidade</label>
                <input
                  type="text"
                  placeholder="Opcional"
                  className={inputClass}
                  value={formData.cidade}
                  onChange={e => setFormData({ ...formData, cidade: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className={labelClass}>Vigência Início</label>
                <input type="date" className={inputClass} value={formData.vigenciaInicio} onChange={e => setFormData({ ...formData, vigenciaInicio: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className={labelClass}>Vigência Fim</label>
                <input type="date" className={inputClass} value={formData.vigenciaFim} onChange={e => setFormData({ ...formData, vigenciaFim: e.target.value })} />
              </div>
            </div>
          </div>

          {/* Bloco 2: Benefícios e Custos Operacionais */}
          <div className="bg-white border border-slate-300 rounded-md shadow-sm overflow-hidden">
            <div className="bg-[#1B4D3E] px-6 py-3 flex items-center gap-2">
              <HeartPulse size={16} className="text-emerald-300" />
              <h2 className="text-xs font-black text-white uppercase tracking-widest">Benefícios e Custos Operacionais</h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Vale Refeição/Alimentação */}
              <div className="border border-slate-200 rounded-md p-4 space-y-3">
                <label className={labelClass}>Vale Refeição / Alimentação</label>
                <div className="flex gap-2 items-center">
                  <select
                    className="px-3 py-2 bg-white border border-slate-300 rounded text-sm text-slate-800 outline-none focus:border-[#1B4D3E]"
                    value={formData.vaTipo}
                    onChange={e => setFormData({ ...formData, vaTipo: e.target.value })}
                  >
                    <option value="DIARIO">R$ / Dia</option>
                    <option value="FIXO">R$ / Mês (Fixo)</option>
                  </select>
                  <input
                    type="number"
                    step="0.01"
                    className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded text-sm text-slate-800 outline-none focus:border-[#1B4D3E]"
                    value={formData.vaValor}
                    onChange={e => setFormData({ ...formData, vaValor: e.target.value })}
                  />
                </div>
                <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.vaProvisFerias}
                    onChange={e => setFormData({ ...formData, vaProvisFerias: e.target.checked })}
                    className="rounded"
                  />
                  Provisionar sobre Férias
                </label>
              </div>

              {/* Vale Transporte */}
              <div className="border border-slate-200 rounded-md p-4 space-y-3">
                <label className={labelClass}>Vale Transporte (Diário)</label>
                <input
                  type="number"
                  step="0.01"
                  className={inputClass}
                  value={formData.vtValor}
                  onChange={e => setFormData({ ...formData, vtValor: e.target.value })}
                />
                <div className="space-y-1">
                  <label className={labelClass}>Desconto Legal (% do Piso)</label>
                  <input
                    type="number"
                    step="0.01"
                    className={inputClass}
                    value={formData.vtDescPercent}
                    onChange={e => setFormData({ ...formData, vtDescPercent: e.target.value })}
                  />
                </div>
              </div>

              {/* Desconto VA */}
              <div className="space-y-1">
                <label className={labelClass}>Desconto VA CLT (%)</label>
                <input
                  type="number"
                  step="0.01"
                  className={inputClass}
                  value={formData.vaDescPercent}
                  onChange={e => setFormData({ ...formData, vaDescPercent: e.target.value })}
                />
              </div>

              {/* Cesta Básica */}
              <div className="space-y-1">
                <label className={labelClass}>Cesta Básica (Fixo/Mês)</label>
                <input
                  type="number"
                  step="0.01"
                  className={inputClass}
                  value={formData.cestaBasica}
                  onChange={e => setFormData({ ...formData, cestaBasica: e.target.value })}
                />
              </div>



              {/* Exames Médicos */}
              <div className="space-y-1">
                <label className={labelClass}>Exames Médicos (Mês)</label>
                <input
                  type="number"
                  step="0.01"
                  className={inputClass}
                  value={formData.examesMedicos}
                  onChange={e => setFormData({ ...formData, examesMedicos: e.target.value })}
                />
              </div>

                            {/* Custos com Sindicatos */}
              <div className="space-y-1">
                <label className={labelClass}>Custos com Sindicatos (Mês)</label>
                <input
                  type="number"
                  step="0.01"
                  className={inputClass}
                  value={formData.custosSindicato}
                  onChange={e => setFormData({ ...formData, custosSindicato: e.target.value })}
                />
                <p className="text-[10px] text-slate-400 italic">Soma de Assistência Médica, Social e Fundo de Formação conforme CCT</p>
              </div>



              {/* Outros Benefícios */}
              <div className="space-y-1">
                <label className={labelClass}>Outros Benefícios (Mês)</label>
                <input
                  type="number"
                  step="0.01"
                  className={inputClass}
                  value={formData.outrosBeneficios}
                  onChange={e => setFormData({ ...formData, outrosBeneficios: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Bloco 3: Cargos e Remunerações */}
          <div className="bg-white border border-slate-300 rounded-md shadow-sm overflow-hidden">
            <div className="bg-[#1B4D3E] px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Briefcase size={16} className="text-emerald-300" />
                <h2 className="text-xs font-black text-white uppercase tracking-widest">Cargos e Remunerações</h2>
              </div>
              <button
                onClick={addCargo}
                className="bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold px-4 py-1.5 rounded flex items-center gap-1 transition-colors"
              >
                <Plus size={14} /> Adicionar
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <th className="px-6 py-3">Função / Cargo</th>
                    <th className="px-6 py-3 text-center">Piso (R$)</th>
                    <th className="px-6 py-3 text-center">Gratif. (R$)</th>
                    <th className="px-6 py-3 text-center">Assid. (R$)</th>
                    <th className="px-6 py-3 text-center">Adic. Copa (R$)</th>
                    <th className="px-6 py-3 text-center">EPI / Mensal</th>
                    <th className="px-6 py-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {cargos.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-slate-400 italic text-xs">
                        Ex: Servente
                      </td>
                    </tr>
                  )}
                  {cargos.map((cargo, idx) => (
                    <tr key={cargo.id || idx} className="border-b border-slate-200 hover:bg-slate-50">
                      <td className="px-6 py-3">
                        <input
                          type="text"
                          placeholder="Ex: Servente"
                          className="w-full bg-transparent border-b border-slate-200 focus:border-[#1B4D3E] outline-none py-1 text-sm text-slate-800 font-medium"
                          value={cargo.nome}
                          onChange={e => updateCargo(idx, 'nome', e.target.value)}
                        />
                      </td>
                      {(['pisoSalarial', 'gratificacoes', 'assiduidade', 'adicionalCopa'] as const).map(field => (
                        <td key={field} className="px-6 py-3">
                          <input
                            type="number"
                            step="0.01"
                            className="w-24 bg-white border border-slate-200 rounded px-2 py-1 text-center text-slate-700 focus:border-[#1B4D3E] outline-none font-medium"
                            value={(cargo as any)[field]}
                            onChange={e => updateCargo(idx, field, e.target.value)}
                          />
                        </td>
                      ))}
                      <td className="px-6 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEpiModal(idx)}
                            className="flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 rounded border border-slate-200 hover:border-emerald-200 transition-all group"
                            title="Configurar Composição de EPI"
                          >
                            <Settings size={14} className="group-hover:rotate-90 transition-transform duration-500" />
                            <span className="text-[10px] font-black">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculateCargoEpiTotal(cargo))}
                            </span>
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-center">
                        <button
                          onClick={() => removeCargo(idx)}
                          className="text-slate-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Modal de Composição de EPI */}
        {showEpiModal && activeCargoIdx !== null && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-md shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-300 flex flex-col max-h-[90vh]">
              {/* Header Modal */}
              <div className="bg-[#1B4D3E] px-6 py-4 flex justify-between items-center border-b border-[#13382D]">
                <div>
                  <h2 className="text-white text-xs font-black uppercase tracking-widest flex items-center gap-2">
                    <Settings size={14} className="text-emerald-400" />
                    Composição de EPI e Uniformes
                  </h2>
                  <p className="text-[10px] text-emerald-200 uppercase font-bold mt-0.5">
                    Função: {cargos[activeCargoIdx]?.nome || 'Não definida'}
                  </p>
                </div>
                <button onClick={() => setShowEpiModal(false)} className="text-white/60 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                {/* Lado Esquerdo: Buscador e Catálogo */}
                <div className="w-full md:w-1/2 p-6 border-r border-slate-200 flex flex-col bg-slate-50">
                  <div className="mb-4 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      type="text" 
                      placeholder="Pesquisar item no catálogo..." 
                      className="w-full bg-white border border-slate-300 rounded pl-10 pr-4 py-2 text-xs font-bold uppercase focus:border-[#1B4D3E] outline-none shadow-sm"
                      value={epiSearch}
                      onChange={(e) => setEpiSearch(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {allEpis
                      .filter(e => e.descricao.toLowerCase().includes(epiSearch.toLowerCase()))
                      .map(epi => (
                        <div key={epi.id} className="bg-white p-3 border border-slate-200 rounded hover:border-emerald-500 hover:shadow-md transition-all group flex justify-between items-center">
                          <div>
                            <p className="text-[10px] font-black text-slate-800 uppercase">{epi.descricao}</p>
                            <p className="text-[10px] text-emerald-600 font-bold mt-0.5">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(epi.precoUnitario)} / {epi.unidade}
                            </p>
                          </div>
                          <button 
                            onClick={() => addEpiToCargo(epi)}
                            className="p-1.5 bg-emerald-50 text-emerald-600 rounded hover:bg-emerald-500 hover:text-white transition-colors border border-emerald-100"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Lado Direito: Composição Selecionada */}
                <div className="w-full md:w-1/2 p-6 flex flex-col bg-white overflow-y-auto">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Itens Selecionados na Composição</h3>
                  
                  <div className="space-y-4">
                    {!cargos[activeCargoIdx]?.episConfig || cargos[activeCargoIdx].episConfig.length === 0 ? (
                      <div className="text-center py-20 bg-slate-50 rounded border border-dashed border-slate-300">
                        <p className="text-xs text-slate-400 font-bold uppercase italic">Nenhum item selecionado</p>
                      </div>
                    ) : (
                      cargos[activeCargoIdx].episConfig.map((item: any, epiIdx: number) => (
                        <div key={item.produtoId} className="border border-slate-200 rounded-md overflow-hidden shadow-sm">
                          <div className="bg-slate-50 px-3 py-2 flex justify-between items-center border-b border-slate-200">
                            <span className="text-[10px] font-black text-slate-700 uppercase truncate pr-4">{item.descricao}</span>
                            <button onClick={() => removeEpiItem(epiIdx)} className="text-red-400 hover:text-red-600 transition-colors">
                              <Trash2 size={12} />
                            </button>
                          </div>
                          <div className="p-3 grid grid-cols-2 gap-4 bg-white">
                            <div className="space-y-1">
                              <label className="text-[9px] font-black text-slate-400 uppercase">Quantidade</label>
                              <div className="flex items-center gap-2">
                                <input 
                                  type="number" 
                                  className="w-full border border-slate-200 rounded px-2 py-1 text-xs font-bold text-center outline-none focus:border-[#1B4D3E]"
                                  value={item.quantidade}
                                  onChange={(e) => updateEpiItem(epiIdx, 'quantidade', Number(e.target.value))}
                                />
                                <span className="text-[9px] font-bold text-slate-400 uppercase">UN</span>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-black text-slate-400 uppercase">Vida Útil (Meses)</label>
                              <input 
                                type="number" 
                                className="w-full border border-slate-200 rounded px-2 py-1 text-xs font-bold text-center outline-none focus:border-[#1B4D3E]"
                                value={item.vidaUtil}
                                onChange={(e) => updateEpiItem(epiIdx, 'vidaUtil', Number(e.target.value))}
                              />
                            </div>
                            <div className="col-span-2 pt-2 border-t border-slate-100 flex justify-between items-center">
                              <span className="text-[9px] font-black text-slate-400 uppercase">Custo Mensal:</span>
                              <span className="text-xs font-black text-emerald-700">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((item.precoUnitario * item.quantidade) / (item.vidaUtil || 1))}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Rodapé do Modal com Total */}
                  <div className="mt-8 pt-6 border-t border-slate-200 flex flex-col items-end">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Mensal de EPI/Uniforme</p>
                    <div className="text-2xl font-black text-[#1B4D3E]">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculateCargoEpiTotal(cargos[activeCargoIdx]))}
                    </div>
                    <button 
                      onClick={() => setShowEpiModal(false)}
                      className="mt-6 w-full bg-[#1B4D3E] text-white py-3 rounded font-black text-xs uppercase tracking-widest shadow-xl hover:bg-[#13382D] transition-all active:scale-[0.98]"
                    >
                      Concluir Composição
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

