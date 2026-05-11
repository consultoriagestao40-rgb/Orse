'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { Plus, Download, Save, RefreshCw } from 'lucide-react';
import { calcularPreco } from '../lib/pricingEngine';
import { Proposta, ResultadoCalculo } from '../types/calculator';

export default function Home() {
  const [piso, setPiso] = useState(2000);
  const [escala, setEscala] = useState<'5x2' | '12x36'>('12x36');
  const [resultado, setResultado] = useState<ResultadoCalculo | null>(null);

  // Dados Mock para a Proposta
  const propostaBase: Proposta = {
    id: 'prop-001',
    status: 'Rascunho',
    dataCriacao: new Date().toISOString(),
    cliente: 'Exemplo Cliente S/A',
    cargo: {
      id: 'c-001',
      idCCT: 'cct-001',
      nome: 'Agente de Portaria',
      pisoSalarial: piso,
      adicionais: { insalubridade: 0, periculosidade: 0, noturno: 0 }
    },
    cct: {
      id: 'cct-001',
      nome: 'SEAC-SP 2024',
      baseTerritorial: 'São Paulo',
      vigenciaInicio: '2024-01-01',
      vigenciaFim: '2024-12-31',
      percentuais: { assiduidade: 5, anuenio: 0, gratificacoes: 200 }
    },
    encargos: {
      grupoA: { inss: 20, fgts: 8, sesiSesc: 1.5, sebrae: 0.6, incra: 0.2, salarioEducacao: 2.5, rat: 3, seguroAcidente: 0 },
      grupoB: { ferias: 11.11, decimoTerceiro: 8.33, dsr: 0, feriados: 0, auxilioEnfermidade: 0 },
      grupoC: { avisoPrevioIndenizado: 0, multaFGTS: 0 }
    },
    beneficios: [
      { nome: 'Vale Alimentação', valorMensal: 600, diasUteis: 22, tetoDescontoFolha: 0 },
      { nome: 'Vale Transporte', valorMensal: 250, diasUteis: 22, tetoDescontoFolha: 0.06 }
    ],
    insumos: { uniformeEPI: 50, reservaTecnica: 100, outros: 0 },
    impostos: { iss: 5, pis: 0.65, cofins: 3, cprb: 4.5 },
    margem: { adm: 5, lucro: 10 },
    escala: escala
  };

  useEffect(() => {
    const res = calcularPreco(propostaBase);
    setResultado(res);
  }, [piso, escala]);

  return (
    <div className="flex min-h-screen bg-[var(--background)]">
      <Sidebar />
      
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Dashboard de Orçamentos</h2>
            <p className="text-[var(--secondary)] font-medium">Bem-vindo ao sistema ORSE. Gerencie suas propostas de FM.</p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg font-medium hover:bg-gray-50 transition-colors">
              <Download size={18} />
              Exportar PDF
            </button>
            <button className="btn-primary flex items-center gap-2">
              <Plus size={18} />
              Nova Proposta
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <section className="card">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <div className="w-2 h-6 bg-[var(--primary)] rounded-full" />
                  Dados do Cargo & CCT
                </h3>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-md font-bold uppercase tracking-wider">Revisão #01</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-[var(--secondary)]">Piso Salarial (R$)</label>
                  <input 
                    type="number" 
                    value={piso} 
                    onChange={(e) => setPiso(Number(e.target.value))}
                    className="input-field w-full text-lg font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-[var(--secondary)]">Escala de Trabalho</label>
                  <select 
                    value={escala}
                    onChange={(e) => setEscala(e.target.value as '5x2' | '12x36')}
                    className="input-field w-full text-lg font-medium"
                  >
                    <option value="5x2">5x2 (Multiplicador 1.0)</option>
                    <option value="12x36">12x36 (Multiplicador 2.1071)</option>
                  </select>
                </div>
              </div>
            </section>

            <section className="card">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <div className="w-2 h-6 bg-[var(--primary)] rounded-full" />
                Resumo de Custos Diretos
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-[var(--background)] rounded-xl border border-[var(--border)]">
                  <p className="text-[10px] uppercase font-black text-[var(--secondary)] mb-1">Remuneração</p>
                  <p className="text-lg font-black text-[var(--foreground)]">R$ {resultado?.remuneracaoBase.toFixed(2)}</p>
                </div>
                <div className="p-4 bg-[var(--background)] rounded-xl border border-[var(--border)]">
                  <p className="text-[10px] uppercase font-black text-[var(--secondary)] mb-1">Encargos</p>
                  <p className="text-lg font-black text-[var(--foreground)]">R$ {resultado?.custoSocial.total.toFixed(2)}</p>
                </div>
                <div className="p-4 bg-[var(--background)] rounded-xl border border-[var(--border)]">
                  <p className="text-[10px] uppercase font-black text-[var(--secondary)] mb-1">Custo Direto</p>
                  <p className="text-lg font-black text-[var(--primary)]">R$ {resultado?.custoDireto.toFixed(2)}</p>
                </div>
                <div className="p-4 bg-[var(--background)] rounded-xl border border-[var(--border)] text-center">
                  <p className="text-[10px] uppercase font-black text-[var(--secondary)] mb-1">Status</p>
                  <p className="text-sm font-bold text-green-600">Calculado</p>
                </div>
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className="card bg-slate-900 text-white border-none shadow-2xl sticky top-8">
              <h3 className="text-lg font-bold mb-6 text-blue-400">DRE Projetada (Venda)</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-end border-b border-white/10 pb-4">
                  <span className="text-sm text-slate-400 font-medium">Faturamento Bruto</span>
                  <span className="text-2xl font-black">R$ {resultado?.dre.faturamento.toFixed(2)}</span>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">(-) Impostos</span>
                    <span className="text-red-400">- R$ {resultado?.dre.impostos.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">(-) Custos Operacionais</span>
                    <span className="text-red-400">- R$ {resultado?.dre.custos.toFixed(2)}</span>
                  </div>
                </div>
                <div className="pt-4 mt-4 border-t-2 border-blue-500/30 flex justify-between items-center bg-blue-500/10 p-4 rounded-xl">
                  <span className="font-bold text-blue-300">Margem Bruta (R$)</span>
                  <span className="text-2xl font-black text-green-400">R$ {resultado?.dre.margemBruta.toFixed(2)}</span>
                </div>
                <p className="text-[10px] text-center text-slate-500 italic mt-4">
                  Cálculo realizado com base na metodologia de Gross-up corporativo.
                </p>
              </div>
              <button className="w-full mt-8 btn-primary bg-blue-600 hover:bg-blue-500 py-4 flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20">
                <Save size={20} />
                Finalizar Proposta
              </button>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
