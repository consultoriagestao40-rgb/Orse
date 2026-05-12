'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { 
  ArrowLeft, Save, Plus, Trash2, 
  MapPin, Briefcase, HeartPulse, Calendar
} from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { getCCTs, createCCT, updateCCT } from '@/app/ccts/actions';

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
    uniformeEpi: 0,
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
    taxaAdm: 5
  });

  const [cargos, setCargos] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

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

  const handleSave = async () => {
    if (!formData.nome?.trim()) return alert('Informe o nome da regra técnica.');
    try {
      setSaving(true);
      const dataToSave = { ...formData, cargos };
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

              {/* Uniforme EPI */}
              <div className="space-y-1">
                <label className={labelClass}>Uniforme e EPI (Mês)</label>
                <input
                  type="number"
                  step="0.01"
                  className={inputClass}
                  value={formData.uniformeEpi}
                  onChange={e => setFormData({ ...formData, uniformeEpi: e.target.value })}
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
      </main>
    </div>
  );
}
