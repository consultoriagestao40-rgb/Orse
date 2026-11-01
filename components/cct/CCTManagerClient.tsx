'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Plus, Edit2, Trash2, Search, Filter, FileText, 
  Sparkles, Download, MessageSquare, ExternalLink,
  ShieldCheck, UserCheck, Calendar, ArrowRight
} from 'lucide-react';
import UploadCctModal from './UploadCctModal';
import { deleteCCT } from '@/app/ccts/actions';
import { useRouter } from 'next/navigation';

interface CCTManagerClientProps {
  initialCcts: any[];
}

export default function CCTManagerClient({ initialCcts }: CCTManagerClientProps) {
  const router = useRouter();
  const [ccts, setCcts] = useState(initialCcts);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredCcts = ccts.filter((cct) => {
    const term = searchTerm.toLowerCase();
    const nome = (cct.nome || '').toLowerCase();
    const uf = (cct.uf || '').toLowerCase();
    const cidade = (cct.cidade || '').toLowerCase();
    return nome.includes(term) || uf.includes(term) || cidade.includes(term);
  });

  const handleDelete = async (id: string, nome: string) => {
    if (!confirm(`Tem certeza que deseja excluir a CCT "${nome}"?`)) return;
    try {
      setDeletingId(id);
      await deleteCCT(id);
      setCcts(ccts.filter(c => c.id !== id));
      router.refresh();
    } catch (err: any) {
      alert('Erro ao excluir CCT: ' + (err?.message || 'Tente novamente'));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      {/* Header Superior */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight uppercase">
              Convenções Coletivas (CCT)
            </h1>
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-widest flex items-center gap-1">
              <Sparkles size={11} /> IA Copilot Integrado
            </span>
          </div>
          <p className="text-slate-500 mt-2 text-sm font-medium">
            Central de inteligência para pisos salariais, benefícios, cláusulas contratuais e consulta assistida por IA.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-gradient-to-r from-[#1B4D3E] to-[#12352B] hover:brightness-110 text-white px-5 py-3.5 rounded-xl font-black text-xs md:text-sm flex items-center gap-2 transition-all shadow-lg shadow-emerald-900/10 active:scale-95 border border-emerald-400/20"
          >
            <Sparkles size={16} className="text-emerald-300" />
            Cadastrar CCT via PDF (IA)
          </button>

          <Link 
            href="/admin/ccts/new/edit"
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-4 py-3.5 rounded-xl font-bold text-xs md:text-sm flex items-center gap-2 transition-all shadow-sm active:scale-95"
          >
            <Plus size={16} /> Nova Regra Manual
          </Link>
        </div>
      </div>

      {/* Card Principal */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Barra de Pesquisa e Filtros */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between sm:items-center gap-3 bg-white">
          <div className="flex items-center gap-3">
            <FileText size={20} className="text-[#1B4D3E]" />
            <h2 className="text-xs font-black text-slate-700 uppercase tracking-wider">
              Convenções Coletivas e Regras Ativas
            </h2>
            <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-md border border-slate-200 uppercase">
              Total: {filteredCcts.length}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Buscar por sindicato, estado ou cidade..." 
                className="w-full bg-white border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Tabela de CCTs */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#1B4D3E] text-white uppercase text-[10px] font-black tracking-widest">
                <th className="px-6 py-4">Sindicato / Região</th>
                <th className="px-6 py-4 text-center">Tabelas Salariais</th>
                <th className="px-6 py-4 text-center">Benefícios Registrados</th>
                <th className="px-6 py-4 text-center">Documento Original</th>
                <th className="px-6 py-4 text-right">Ações & Consulta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCcts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-slate-400 font-medium text-xs">
                    {searchTerm ? (
                      'Nenhuma CCT encontrada com o termo pesquisado.'
                    ) : (
                      <div className="space-y-3">
                        <p className="text-sm text-slate-600 font-bold">Nenhuma Convenção Coletiva cadastrada no sistema.</p>
                        <button
                          onClick={() => setIsModalOpen(true)}
                          className="inline-flex items-center gap-2 bg-[#1B4D3E] text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm hover:bg-[#13382D]"
                        >
                          <Sparkles size={14} /> Subir primeiro PDF da CCT com IA
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                filteredCcts.map((cct: any) => {
                  const hasPdf = Boolean(cct.pdfUrl);
                  const cargosCount = cct.cargos?.length || 0;

                  return (
                    <tr key={cct.id} className="hover:bg-slate-50/70 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3.5">
                          <div className={`p-2.5 rounded-xl ${hasPdf ? 'bg-emerald-50 text-[#1B4D3E]' : 'bg-slate-100 text-slate-400'}`}>
                            <FileText size={20} />
                          </div>
                          <div>
                            <Link 
                              href={`/admin/ccts/${cct.id}`}
                              className="font-bold text-slate-900 text-sm hover:text-[#1B4D3E] transition-colors flex items-center gap-1.5"
                            >
                              <span>{cct.nome || 'Sindicato sem nome'}</span>
                              <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 text-[#1B4D3E] transition-opacity" />
                            </Link>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                {cct.uf || 'BR'} - {cct.cidade || 'Abrangência Estadual'}
                              </span>
                              {cct.vigenciaInicio && (
                                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                  <Calendar size={10} />
                                  {new Date(cct.vigenciaInicio).toLocaleDateString('pt-BR')}
                                  {cct.vigenciaFim && ` até ${new Date(cct.vigenciaFim).toLocaleDateString('pt-BR')}`}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <Link 
                          href={`/admin/ccts/${cct.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-[#1B4D3E] border border-slate-200 transition-colors text-xs font-bold"
                        >
                          <UserCheck size={14} className="text-[#1B4D3E]" />
                          <span>{cargosCount} {cargosCount === 1 ? 'Função' : 'Funções'}</span>
                        </Link>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-col items-center gap-0.5 text-[11px] text-slate-600">
                          {cct.vaValor ? (
                            <span className="font-semibold text-emerald-800">
                              VA/VR: R$ {Number(cct.vaValor).toFixed(2).replace('.', ',')}/dia
                            </span>
                          ) : (
                            <span className="text-slate-400">VA não configurado</span>
                          )}
                          {cct.vtValor ? (
                            <span className="text-[10px] text-slate-500">
                              VT: R$ {Number(cct.vtValor).toFixed(2).replace('.', ',')}
                            </span>
                          ) : null}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-center">
                        {hasPdf ? (
                          <a
                            href={cct.pdfUrl}
                            download={cct.pdfNome || `CCT_${cct.nome || 'documento'}.pdf`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#1B4D3E] border border-emerald-200 text-xs font-bold transition-colors"
                            title="Baixar PDF Original da CCT"
                          >
                            <Download size={13} />
                            <span>Baixar PDF</span>
                          </a>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Sem PDF</span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Botão de Chat com IA */}
                          <Link 
                            href={`/admin/ccts/${cct.id}`}
                            className="px-3 py-1.5 rounded-lg bg-[#1B4D3E] hover:bg-[#13382D] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
                            title="Abrir CCT Publicada e Consultar IA"
                          >
                            <MessageSquare size={13} />
                            <span>Abrir & Chat IA</span>
                          </Link>

                          {/* Botão de Editar */}
                          <Link 
                            href={`/admin/ccts/${cct.id}/edit`}
                            className="p-2 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                            title="Editar Parâmetros Técnicos"
                          >
                            <Edit2 size={16} />
                          </Link>

                          {/* Botão de Excluir */}
                          <button
                            onClick={() => handleDelete(cct.id, cct.nome)}
                            disabled={deletingId === cct.id}
                            className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"
                            title="Excluir CCT"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Upload via IA */}
      <UploadCctModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={(newCct) => {
          setCcts([newCct, ...ccts]);
        }}
      />
    </>
  );
}
