'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { 
  Plus, Edit2, Building2, Search, 
  Filter, MoreVertical, FileText, Trash2,
  Upload, X, Check
} from 'lucide-react';
import { getClientes, deleteCliente, importClientes } from './actions';
import { useRouter } from 'next/navigation';

export default function ClientesPage() {
  const router = useRouter();
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  // States para Importação de Planilha CSV
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [encoding, setEncoding] = useState<'utf-8' | 'iso-8859-1'>('utf-8');
  const [importedClients, setImportedClients] = useState<any[]>([]);
  const [importSuccessMessage, setImportSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const data = await getClientes();
      setClientes(data || []);
      setLoading(false);
    }
    load();
  }, []);

  // CSV Parser & Mapeador
  const parseCSV = (text: string): string[][] => {
    const lines: string[][] = [];
    let row: string[] = [];
    let inQuotes = false;
    let currentValue = '';

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (inQuotes) {
        if (char === '"') {
          if (nextChar === '"') {
            currentValue += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          currentValue += char;
        }
      } else {
        if (char === '"') {
          inQuotes = true;
        } else if (char === ',' || char === ';') { // Comma or Semicolon separator
          row.push(currentValue);
          currentValue = '';
        } else if (char === '\r' || char === '\n') {
          row.push(currentValue);
          currentValue = '';
          if (row.length > 0 && row.some(x => x !== '')) {
            lines.push(row);
          }
          row = [];
          if (char === '\r' && nextChar === '\n') {
            i++;
          }
        } else {
          currentValue += char;
        }
      }
    }
    if (row.length > 0 || currentValue !== '') {
      row.push(currentValue);
      lines.push(row);
    }
    return lines;
  };

  const processCSVData = (csvLines: string[][]) => {
    if (csvLines.length < 2) return;
    
    const headers = csvLines[0].map(h => h.trim().toLowerCase());
    
    // Procura índices das colunas de forma inteligente
    const idxRazao = headers.findIndex(h => h.includes('razão') || h.includes('razao'));
    const idxNome = headers.findIndex(h => h.includes('nome') || h === 'fantasia');
    const idxCnpj = headers.findIndex(h => h.includes('cnpj') || h.includes('cpf') || h.includes('cnpj/cpf') || h === 'documento');
    const idxEndereco = headers.findIndex(h => h.includes('endereço') || h.includes('endereco') || h === 'rua');
    const idxNumero = headers.findIndex(h => h.includes('numero') || h.includes('número') || h === 'num');
    const idxCompleme = headers.findIndex(h => h.includes('compleme') || h.includes('complemento'));
    const idxBairro = headers.findIndex(h === 'bairro');
    const idxMunicipio = headers.findIndex(h => h.includes('municipio') || h.includes('município') || h === 'cidade');
    const idxUF = headers.findIndex(h === 'uf' || h === 'estado');
    const idxCep = headers.findIndex(h === 'cep');
    const idxEmail = headers.findIndex(h => h.includes('email') || h.includes('e-mail') || h.includes('mail'));
    const idxTelefone = headers.findIndex(h => h.includes('telefone') || h.includes('tel') || h === 'fone');
    const idxCelular = headers.findIndex(h => h.includes('celular') || h.includes('cel') || h === 'whatsapp');
    const idxClasse = headers.findIndex(h => h.includes('classe') || h === 'segmento' || h === 'grupo');
    const idxVendedor = headers.findIndex(h => h.includes('vendedor') || h.includes('resp'));

    const mappedClients = [];

    for (let i = 1; i < csvLines.length; i++) {
      const row = csvLines[i];
      if (row.length < 2) continue; // Pula linhas em branco ou incompletas

      const getVal = (idx: number) => (idx !== -1 && row[idx]) ? row[idx].trim() : '';

      const nomeFantasia = getVal(idxNome) || getVal(idxRazao) || 'Cliente Importado';
      const razaoSocial = getVal(idxRazao) || nomeFantasia;
      const cnpj = getVal(idxCnpj);
      const email = getVal(idxEmail);
      const whatsapp = getVal(idxCelular) || getVal(idxTelefone);

      // Monta o Endereço Completo
      const street = getVal(idxEndereco);
      const num = getVal(idxNumero);
      const comp = getVal(idxCompleme);
      const neighborhood = getVal(idxBairro);
      const city = getVal(idxMunicipio);
      const state = getVal(idxUF);
      const zip = getVal(idxCep);

      const addressParts = [];
      if (street) addressParts.push(street);
      if (num) addressParts.push(`Nº ${num}`);
      if (comp) addressParts.push(comp);
      if (neighborhood) addressParts.push(neighborhood);
      if (city && state) addressParts.push(`${city} - ${state}`);
      else if (city) addressParts.push(city);
      if (zip) addressParts.push(`CEP: ${zip}`);

      const endereco = addressParts.join(', ');
      const segmento = getVal(idxClasse) || '';
      const contato = getVal(idxVendedor) || '';

      mappedClients.push({
        nomeFantasia,
        razaoSocial,
        cnpj,
        email,
        whatsapp,
        endereco,
        segmento,
        contato
      });
    }

    setImportedClients(mappedClients);
  };

  // Re-lê o arquivo sempre que mudar o uploadedFile ou a codificação (encoding)
  useEffect(() => {
    if (!uploadedFile) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        const parsed = parseCSV(text);
        processCSVData(parsed);
      }
    };
    reader.readAsText(uploadedFile, encoding);
  }, [uploadedFile, encoding]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const handleConfirmImport = async () => {
    if (importedClients.length === 0) return;
    setImporting(true);
    const res = await importClientes(importedClients);
    if (res.success) {
      setImportSuccessMessage(`Sucesso! ${res.inserted} inseridos e ${res.updated} atualizados.`);
      setImportedClients([]);
      setUploadedFile(null);
      // Atualiza listagem
      const data = await getClientes();
      setClientes(data || []);
      setTimeout(() => {
        setImportSuccessMessage(null);
        setIsImportModalOpen(false);
      }, 3000);
    } else {
      alert('Erro na importação: ' + res.error);
    }
    setImporting(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este cliente?')) {
      await deleteCliente(id);
      setClientes(clientes.filter(c => c.id !== id));
    }
  };

  const filteredClientes = clientes.filter(c => 
    c.nomeFantasia?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.cnpj?.includes(searchTerm)
  );

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">
        {/* Header Superior V4 */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Gerenciador de Clientes</h1>
              <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">
                V4.0 Enterprise
              </span>
            </div>
            <p className="text-slate-500 mt-2 text-sm font-medium">Cadastro centralizado de clientes e tomadores de serviço.</p>
          </div>
          <div className="flex gap-3 shrink-0">
            <button 
              onClick={() => {
                setImportedClients([]);
                setUploadedFile(null);
                setEncoding('utf-8');
                setIsImportModalOpen(true);
              }}
              className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-705 px-6 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-xs active:scale-95 cursor-pointer"
            >
              <Upload size={18} strokeWidth={2.5} className="text-slate-500" /> Importar Planilha
            </button>
            <button 
              onClick={() => router.push('/clientes/novo')}
              className="bg-[#1B4D3E] hover:bg-[#13382D] text-white px-8 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-xl shadow-emerald-250 active:scale-95 bell-header-spacing cursor-pointer border-none"
            >
              <Plus size={18} strokeWidth={3} /> Novo Cliente
            </button>
          </div>
        </div>

        {/* Card Principal - Estilo Foto 02 */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          
          {/* Header do Card Integrado (Igual Foto 02) */}
          <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-white">
            <div className="flex items-center gap-3">
              <Building2 size={20} className="text-slate-500" />
              <h2 className="text-sm font-black text-slate-700 uppercase tracking-wider">Listagem de Clientes</h2>
              <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-md border border-slate-200 uppercase">
                Total: {clientes.length}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Buscar proposta ou cliente..." 
                  className="bg-white border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-medium w-64"
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button className="p-2 border border-slate-200 rounded-lg text-slate-400 hover:bg-slate-50 transition-colors">
                <Filter size={18} />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#1B4D3E] text-white uppercase text-[10px] font-black tracking-widest">
                  <th className="px-6 py-4">ID / Cliente</th>
                  <th className="px-6 py-4">Documento / Razão</th>
                  <th className="px-6 py-4 text-center">Contato Principal</th>
                  <th className="px-6 py-4 text-center">Cadastro</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={5} className="px-6 py-20 text-center text-slate-400 font-medium italic">Carregando dados...</td></tr>
                ) : filteredClientes.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-20 text-center text-slate-400 font-medium italic">Nenhum cliente encontrado.</td></tr>
                ) : (
                  filteredClientes.map((cliente) => (
                    <tr key={cliente.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-slate-50 rounded-lg text-slate-300">
                            <FileText size={18} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-slate-900 text-sm uppercase">{cliente.nomeFantasia || 'SEM NOME'}</p>
                              {cliente.segmento && (
                                <span className="bg-[#1B4D3E]/10 text-[#1B4D3E] text-[8px] font-black px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
                                  {cliente.segmento}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                              ID: {cliente.id.slice(-6).toUpperCase()}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-bold text-slate-800 text-sm uppercase">{cliente.razaoSocial || 'S/ Razão Social'}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">CNPJ: {cliente.cnpj || '-'}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-center">
                          <p className="text-sm font-black text-slate-700 uppercase">{cliente.email?.split('@')[0] || '-'}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">{cliente.whatsapp || '-'}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center text-xs font-bold text-slate-500">
                        {new Date(cliente.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 text-right relative">
                        <div className="flex items-center justify-end gap-1">
                          <button 
                            onClick={() => router.push(`/clientes/${cliente.id}/edit`)}
                            className="p-2 text-amber-500 hover:text-amber-600 transition-colors"
                            title="Editar Cliente"
                          >
                            <Edit2 size={16} />
                          </button>
                          <div className="relative inline-block text-left">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenu(activeMenu === cliente.id ? null : cliente.id);
                              }}
                              className="p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-lg hover:bg-slate-100/50"
                              title="Mais Ações"
                            >
                              <MoreVertical size={18} />
                            </button>
                            
                            {activeMenu === cliente.id && (
                              <>
                                <div 
                                  className="fixed inset-0 z-10" 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveMenu(null);
                                  }}
                                />
                                <div className="absolute right-0 mt-1 w-52 bg-white border border-slate-200 shadow-xl rounded-xl py-1.5 z-20 text-left animate-in fade-in slide-in-from-top-1 duration-150">
                                  <div className="px-3 py-1.5 border-b border-slate-100">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ações do Cliente</p>
                                  </div>
                                  
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveMenu(null);
                                      router.push(`/propostas/nova?clientId=${cliente.id}`);
                                    }}
                                    className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 flex items-center gap-2 font-medium transition-colors"
                                  >
                                    <Plus size={14} className="text-emerald-600" />
                                    Nova Proposta FPV
                                  </button>
                                  
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveMenu(null);
                                      router.push(`/clientes/${cliente.id}/edit`);
                                    }}
                                    className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium transition-colors"
                                  >
                                    <Edit2 size={14} className="text-slate-500" />
                                    Editar Cliente
                                  </button>
                                  
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveMenu(null);
                                      handleDelete(cliente.id);
                                    }}
                                    className="w-full text-left px-3 py-2.5 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium border-t border-slate-100 transition-colors"
                                  >
                                    <Trash2 size={14} className="text-red-500" />
                                    Excluir Cliente
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        {/* MODAL IMPORTAÇÃO CLIENTES */}
        {isImportModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200 text-left">
              <header className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 select-none">
                <div className="flex items-center gap-2">
                  <Upload size={16} className="text-slate-600" />
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Importar Clientes via Planilha CSV</h3>
                </div>
                <button onClick={() => setIsImportModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer border-none bg-transparent">
                  <X size={16} />
                </button>
              </header>

              <div className="p-6 overflow-y-auto space-y-6">
                {importSuccessMessage && (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-black p-4 rounded-2xl flex items-center gap-2.5 animate-bounce">
                    <Check size={16} className="text-emerald-600 shrink-0" />
                    <span>{importSuccessMessage}</span>
                  </div>
                )}

                {/* Área de Seleção de Arquivo */}
                {!uploadedFile ? (
                  <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-250 rounded-2xl p-12 bg-slate-50 hover:bg-slate-100/40 hover:border-[#1b4d3e]/50 transition-all cursor-pointer relative group">
                    <input 
                      type="file" 
                      accept=".csv"
                      onChange={handleFileUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <Upload size={36} className="text-slate-400 group-hover:text-[#1B4D3E] transition-colors mb-3" />
                    <p className="text-sm font-black text-slate-700 uppercase tracking-wider">Selecione o Arquivo CSV</p>
                    <p className="text-slate-400 text-xs mt-1.5 text-center font-medium max-w-sm leading-relaxed">
                      Salve seu arquivo Excel como{" "}
                      <strong>CSV (Separado por vírgula ou ponto-e-vírgula)</strong>. O sistema mapeará as colunas de Nome, Razão Social, CNPJ, E-mail, Telefone, Endereço e Segmento.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Info do Arquivo e Codificação */}
                    <div className="flex flex-wrap justify-between items-center bg-slate-50 border border-slate-200 rounded-2xl p-4 gap-4">
                      <div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Arquivo Selecionado</span>
                        <span className="text-xs font-black text-slate-800 uppercase block">{uploadedFile.name}</span>
                        <span className="text-[10px] text-slate-400 font-bold block">{(uploadedFile.size / 1024).toFixed(1)} KB • {importedClients.length} registros encontrados</span>
                      </div>

                      {/* Codificação do Arquivo (UTF-8 ou ISO-8859-1) */}
                      <div className="flex flex-col gap-1 items-end">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Codificação / Acentuação</span>
                        <div className="flex bg-white border border-slate-250 rounded-lg p-0.5 select-none">
                          <button
                            type="button"
                            onClick={() => setEncoding('utf-8')}
                            className={`px-3 py-1 text-[9.5px] font-black uppercase rounded-md transition-all cursor-pointer ${encoding === 'utf-8' ? 'bg-[#1B4D3E] text-white shadow-2xs' : 'text-slate-500 hover:text-slate-750'}`}
                          >
                            UTF-8
                          </button>
                          <button
                            type="button"
                            onClick={() => setEncoding('iso-8859-1')}
                            className={`px-3 py-1 text-[9.5px] font-black uppercase rounded-md transition-all cursor-pointer ${encoding === 'iso-8859-1' ? 'bg-[#1B4D3E] text-white shadow-2xs' : 'text-slate-500 hover:text-slate-750'}`}
                          >
                            Excel / Windows
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Tabela de Pré-visualização (Primeiros 10 itens) */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Pré-visualização dos Dados Mapeados (Primeiros 10 registros)</span>
                      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-3xs overflow-x-auto">
                        <table className="w-full text-left border-collapse text-[10.5px]">
                          <thead>
                            <tr className="bg-slate-100 border-b border-slate-200 font-black text-slate-450 uppercase tracking-wider select-none">
                              <th className="py-2.5 px-4">Nome Fantasia</th>
                              <th className="py-2.5 px-4">Razão Social</th>
                              <th className="py-2.5 px-4">CNPJ</th>
                              <th className="py-2.5 px-4">E-mail</th>
                              <th className="py-2.5 px-4">WhatsApp/Fone</th>
                              <th className="py-2.5 px-4">Endereço Mapeado</th>
                              <th className="py-2.5 px-4">Segmento</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-150 font-bold text-slate-650">
                            {importedClients.slice(0, 10).map((c, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                <td className="py-2 px-4 uppercase text-slate-800 font-extrabold max-w-[150px] truncate">{c.nomeFantasia}</td>
                                <td className="py-2 px-4 uppercase text-slate-500 max-w-[150px] truncate">{c.razaoSocial}</td>
                                <td className="py-2 px-4 font-mono">{c.cnpj || '-'}</td>
                                <td className="py-2 px-4 truncate max-w-[100px]">{c.email || '-'}</td>
                                <td className="py-2 px-4 font-mono">{c.whatsapp || '-'}</td>
                                <td className="py-2 px-4 truncate max-w-[200px]" title={c.endereco}>{c.endereco || '-'}</td>
                                <td className="py-2 px-4 text-center">
                                  {c.segmento ? (
                                    <span className="bg-slate-100 text-slate-600 text-[8.5px] px-1.5 py-0.5 rounded font-black uppercase">{c.segmento}</span>
                                  ) : '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {importedClients.length > 10 && (
                        <p className="text-[10px] text-slate-400 italic text-right font-medium pr-1">... e mais {importedClients.length - 10} clientes na planilha.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <footer className="px-6 py-4 border-t border-slate-100 flex justify-between items-center bg-slate-50 select-none">
                <button
                  type="button"
                  onClick={() => {
                    setUploadedFile(null);
                    setImportedClients([]);
                  }}
                  disabled={!uploadedFile || importing}
                  className="px-5 py-2.5 border border-slate-200 rounded-xl text-xs font-black text-slate-500 uppercase tracking-wider hover:bg-slate-100 bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  Limpar Arquivo
                </button>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsImportModalOpen(false)}
                    disabled={importing}
                    className="px-5 py-2.5 border border-slate-200 rounded-xl text-xs font-black text-slate-500 uppercase tracking-wider hover:bg-slate-100 bg-white disabled:opacity-50 transition-all cursor-pointer"
                  >
                    Fechar
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmImport}
                    disabled={!uploadedFile || importing || importedClients.length === 0}
                    className="px-6 py-2.5 bg-[#1B4D3E] hover:bg-[#13382D] text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer border-none"
                  >
                    {importing ? 'Importando...' : `Confirmar Importação (${importedClients.length})`}
                  </button>
                </div>
              </footer>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
