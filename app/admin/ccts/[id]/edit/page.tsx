'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { 
  ArrowLeft, Save, Plus, Trash2, 
  Building, List, HeartPulse, ShieldCheck, MapPin, Briefcase
} from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { getCCTs, createCCT, updateCCT } from '@/app/ccts/actions';

const ESTADOS_BRASIL = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export default function CCTEditorPage() {
  const router = useRouter();
  const { id } = useParams();
  const isNew = id === 'new';

  const [formData, setFormData] = useState<any>({
    nome: '',
    uf: 'PR',
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
    uniformeEpi: 0,
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
    try {
      const dataToSave = { ...formData, cargos };
      let res: any;
      if (isNew) {
        res = await createCCT(dataToSave);
      } else {
        res = await updateCCT(id as string, dataToSave);
      }
      
      if (res && res.error) {
        alert('Erro do Banco de Dados:\n\n' + res.error);
        return;
      }
      
      router.push('/admin/ccts');
    } catch (err: any) {
      console.error(err);
      alert('Erro inesperado: ' + (err?.message || 'Desconhecido'));
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto font-sans">
        <div className="max-w-6xl mx-auto">
          {/* Header V4.0 */}
          <div className="flex justify-between items-start mb-12">
            <div className="flex items-center gap-6">
              <button 
                onClick={() => router.back()} 
                className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-[#1B4D3E] hover:border-[#1B4D3E] transition-all shadow-sm hover:shadow-md"
              >
                <ArrowLeft size={24} />
              </button>
              <div>
                <div className="flex items-center gap-4">
                  <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">
                    {isNew ? 'Nova Regra Técnica' : 'Editar Regra Técnica'}
                  </h1>
                  <span className="bg-[#1B4D3E] text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-emerald-100">
                    Sindicato CRM
                  </span>
                </div>
                <p className="text-slate-500 mt-2 text-sm font-bold uppercase tracking-[0.2em] opacity-60">Configuração de Pisos e Benefícios</p>
              </div>
            </div>
            <button 
              onClick={handleSave}
              className="bg-[#1B4D3E] hover:bg-[#143a2f] text-white px-12 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-3 transition-all shadow-2xl shadow-emerald-200 active:scale-95"
            >
              <Save size={20} strokeWidth={3} /> Salvar Configurações
            </button>
          </div>

          <div className="grid grid-cols-1 gap-10 pb-32">
            
            {/* Bloco 1: Identificação */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-100/50 overflow-hidden">
              <div className="bg-[#1B4D3E] px-8 py-4 flex items-center gap-3">
                <MapPin size={20} className="text-emerald-400" />
                <h2 className="text-xs font-black text-white uppercase tracking-[0.2em]">Identificação Regional</h2>
              </div>
              <div className="p-10 grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="md:col-span-2 space-y-3">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Nome do Sindicato / Convenção</label>
                  <input 
                    type="text" 
                    placeholder="Ex: SIEMACO PR - 2024/2025" 
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-base font-bold text-slate-800 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-[#1B4D3E] transition-all"
                    value={formData.nome}
                    onChange={(e) => setFormData({...formData, nome: e.target.value})}
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Estado (UF)</label>
                  <select 
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-base font-bold text-slate-800 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-[#1B4D3E] transition-all appearance-none"
                    value={formData.uf}
                    onChange={(e) => setFormData({...formData, uf: e.target.value})}
                  >
                    {ESTADOS_BRASIL.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Cidade / Abrangência</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Todo Estado" 
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-base font-bold text-slate-800 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-[#1B4D3E] transition-all"
                    value={formData.cidade}
                    onChange={(e) => setFormData({...formData, cidade: e.target.value})}
                  />
                </div>
              </div>
            </div>

            {/* Bloco 2: Cargos */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-100/50 overflow-hidden">
              <div className="bg-[#1B4D3E] px-8 py-4 flex justify-between items-center">
                <div className="flex items-center gap-3 text-white">
                  <Briefcase size={20} className="text-emerald-400" />
                  <h2 className="text-xs font-black uppercase tracking-[0.2em]">Cargos e Pisos Salariais</h2>
                </div>
                <button 
                  onClick={addCargo}
                  className="bg-emerald-500 hover:bg-emerald-400 text-white px-5 py-2 rounded-xl text-[11px] font-black uppercase tracking-[0.1em] flex items-center gap-2 transition-all shadow-lg shadow-emerald-900/20"
                >
                  <Plus size={16} strokeWidth={3} /> Adicionar Cargo
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50 text-slate-400 uppercase text-[10px] font-black tracking-[0.2em] border-b border-slate-100">
                      <th className="px-10 py-6">Nome da Função</th>
                      <th className="px-6 py-6 text-center">Piso Salarial (R$)</th>
                      <th className="px-6 py-6 text-center">Gratificações (R$)</th>
                      <th className="px-6 py-6 text-center">Assiduidade (R$)</th>
                      <th className="px-10 py-6 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {cargos.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-10 py-16 text-center text-slate-400 font-bold italic opacity-40">
                          Nenhum cargo configurado nesta regra técnica.
                        </td>
                      </tr>
                    )}
                    {cargos.map((cargo, idx) => (
                      <tr key={cargo.id || idx} className="hover:bg-slate-50/30 transition-colors">
                        <td className="px-10 py-6">
                          <input 
                            type="text" 
                            className="w-full bg-transparent border-b-2 border-transparent focus:border-emerald-500 outline-none text-base font-black text-slate-800 py-2 uppercase tracking-tight placeholder:text-slate-200"
                            value={cargo.nome}
                            onChange={(e) => updateCargo(idx, 'nome', e.target.value)}
                            placeholder="DIGITE O NOME DO CARGO..."
                          />
                        </td>
                        <td className="px-6 py-6">
                          <div className="flex justify-center">
                            <input 
                              type="number" 
                              className="w-32 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-center font-black text-slate-700 focus:ring-4 focus:ring-emerald-500/10 focus:border-[#1B4D3E] outline-none transition-all"
                              value={cargo.pisoSalarial}
                              onChange={(e) => updateCargo(idx, 'pisoSalarial', e.target.value)}
                            />
                          </div>
                        </td>
                        <td className="px-6 py-6">
                          <div className="flex justify-center">
                            <input 
                              type="number" 
                              className="w-32 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-center font-bold text-slate-500 focus:ring-4 focus:ring-emerald-500/10 focus:border-[#1B4D3E] outline-none transition-all"
                              value={cargo.gratificacoes}
                              onChange={(e) => updateCargo(idx, 'gratificacoes', e.target.value)}
                            />
                          </div>
                        </td>
                        <td className="px-6 py-6">
                          <div className="flex justify-center">
                            <input 
                              type="number" 
                              className="w-32 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-center font-bold text-slate-500 focus:ring-4 focus:ring-emerald-500/10 focus:border-[#1B4D3E] outline-none transition-all"
                              value={cargo.assiduidade}
                              onChange={(e) => updateCargo(idx, 'assiduidade', e.target.value)}
                            />
                          </div>
                        </td>
                        <td className="px-10 py-6 text-right">
                          <button 
                            onClick={() => removeCargo(idx)}
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all border border-transparent hover:border-red-100"
                          >
                            <Trash2 size={18} strokeWidth={2.5} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bloco 3: Benefícios */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-100/50 overflow-hidden">
              <div className="bg-[#1B4D3E] px-8 py-4 flex items-center gap-3">
                <HeartPulse size={20} className="text-emerald-400" />
                <h2 className="text-xs font-black text-white uppercase tracking-[0.2em]">Benefícios e Verbas Sociais</h2>
              </div>
              <div className="p-10 grid grid-cols-1 md:grid-cols-4 gap-12">
                <div className="space-y-4">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Vale Alimentação (R$)</label>
                  <input 
                    type="number" 
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xl font-black text-slate-800 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-[#1B4D3E] transition-all"
                    value={formData.vaValor}
                    onChange={(e) => setFormData({...formData, vaValor: e.target.value})}
                  />
                  <div className="flex gap-4">
                     <button 
                        onClick={() => setFormData({...formData, vaTipo: 'DIARIO'})}
                        className={`flex-1 py-2 rounded-lg text-[10px] font-black transition-all ${formData.vaTipo === 'DIARIO' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                     >DIÁRIO</button>
                     <button 
                        onClick={() => setFormData({...formData, vaTipo: 'FIXO'})}
                        className={`flex-1 py-2 rounded-lg text-[10px] font-black transition-all ${formData.vaTipo === 'FIXO' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                     >FIXO/MÊS</button>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Vale Transporte (R$)</label>
                  <input 
                    type="number" 
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xl font-black text-slate-800 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-[#1B4D3E] transition-all"
                    value={formData.vtValor}
                    onChange={(e) => setFormData({...formData, vtValor: e.target.value})}
                  />
                  <p className="text-[10px] text-slate-400 font-bold uppercase text-center italic tracking-widest">Valor Diário Médio</p>
                </div>

                <div className="space-y-4">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Cesta Básica (R$)</label>
                  <input 
                    type="number" 
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xl font-black text-slate-800 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-[#1B4D3E] transition-all"
                    value={formData.cestaBasica}
                    onChange={(e) => setFormData({...formData, cestaBasica: e.target.value})}
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Uniforme / EPI (R$)</label>
                  <input 
                    type="number" 
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xl font-black text-slate-800 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-[#1B4D3E] transition-all"
                    value={formData.uniformeEpi}
                    onChange={(e) => setFormData({...formData, uniformeEpi: e.target.value})}
                  />
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
