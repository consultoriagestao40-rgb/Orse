'use client';
import React, { useState } from 'react';

interface Clausula {
  id: string;
  titulo: string;
  texto: string;
}

interface TemplateEditorModalProps {
  onClose: () => void;
  onSave: (templateName: string, clausulas: Clausula[]) => void;
  initialTemplateName?: string;
  initialClausulas?: Clausula[];
}

export default function TemplateEditorModal({ onClose, onSave, initialTemplateName = '', initialClausulas = [] }: TemplateEditorModalProps) {
  const [templateName, setTemplateName] = useState(initialTemplateName);
  const [clausulas, setClausulas] = useState<Clausula[]>(initialClausulas.length > 0 ? initialClausulas : [
    { id: '1', titulo: 'CLÁUSULA 01 - OBJETO DE LOCAÇÃO', texto: '1.1. Aluguel de Bem(ns) Móvel(is) - Sem Operador, conforme descrição na ordem de serviço indicada e anexa a este contrato.' },
    { id: '2', titulo: 'CLÁUSULA 02 - DO(S) BEM(NS) MÓVEL(IS)', texto: '2.1. A LOCADORA é legítima proprietária do(s) bem(ns) móvel(is) descritos no campo 01 do preâmbulo do presente Contrato.' }
  ]);

  const handleAddClausula = () => {
    const newId = Math.random().toString(36).substring(7);
    setClausulas([...clausulas, { id: newId, titulo: '', texto: '' }]);
  };

  const handleRemoveClausula = (id: string) => {
    setClausulas(clausulas.filter(c => c.id !== id));
  };

  const handleChangeClausula = (id: string, field: 'titulo' | 'texto', value: string) => {
    setClausulas(clausulas.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const handleSave = () => {
    if (!templateName.trim()) {
      alert('Por favor, informe o Nome do Template.');
      return;
    }
    onSave(templateName, clausulas);
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* HEADER */}
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800">Editar Template</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-2">Nome do Template</label>
            <input 
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-blue-400 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 transition-shadow shadow-sm"
              placeholder="Ex: Proposta Comercial"
            />
          </div>

          <div className="border border-slate-200 rounded-xl bg-white overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">Cláusulas do Contrato</h3>
              <button 
                onClick={handleAddClausula}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 shadow-sm"
              >
                + Adicionar Cláusula
              </button>
            </div>

            <div className="p-6 space-y-6 bg-slate-50/50">
              {clausulas.map((clausula, index) => (
                <div key={clausula.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm relative group transition-all hover:border-blue-200 hover:shadow-md">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-xs font-bold text-slate-700 uppercase">Cláusula {index + 1}</h4>
                    <button 
                      onClick={() => handleRemoveClausula(clausula.id)}
                      className="text-red-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                      title="Excluir cláusula"
                    >
                      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                      </svg>
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <input 
                      type="text"
                      value={clausula.titulo}
                      onChange={(e) => handleChangeClausula(clausula.id, 'titulo', e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-800 outline-none focus:border-blue-400 focus:bg-white focus:ring-1 focus:ring-blue-400 transition-all"
                      placeholder="Ex: CLÁUSULA 01 - OBJETO DE LOCAÇÃO"
                    />
                    
                    <textarea 
                      value={clausula.texto}
                      onChange={(e) => handleChangeClausula(clausula.id, 'texto', e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-blue-400 focus:bg-white focus:ring-1 focus:ring-blue-400 min-h-[100px] resize-y transition-all"
                      placeholder="Texto da cláusula..."
                    />
                  </div>
                </div>
              ))}
              
              {clausulas.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-sm italic border-2 border-dashed border-slate-200 rounded-xl">
                  Nenhuma cláusula cadastrada. Clique em "Adicionar Cláusula" para começar.
                </div>
              )}
            </div>
          </div>

        </div>

        {/* FOOTER */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 transition-colors shadow-sm"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm shadow-blue-600/20"
          >
            Salvar Template
          </button>
        </div>
      </div>
    </div>
  );
}
