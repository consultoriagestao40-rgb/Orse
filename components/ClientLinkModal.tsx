'use client';

import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Share2, FileText, Calculator, BookOpen, Presentation, Clock, Calendar, Video, Image, Paperclip, Trash2, Plus, Loader2, HelpCircle } from 'lucide-react';
import { getTemplates } from '@/app/contratos/actions';
import { updateConfigApresentacao, uploadClientFileAction, getDocumentoConfigApresentacao } from '@/app/propostas-comerciais/actions';
import { getFaqsPadrao } from '@/app/admin/settings/actions';

interface ClientLinkModalProps {
  documentoId: string;
  configApresentacao: any;
  onClose: () => void;
  onSaveSuccess?: (newConfig: any) => void;
}

export default function ClientLinkModal({ documentoId, configApresentacao, onClose, onSaveSuccess }: ClientLinkModalProps) {
  const [loading, setLoading] = useState(false);
  const [loadingFullConfig, setLoadingFullConfig] = useState(true);
  const [copied, setCopied] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);

  // Configuração padrão ou existente
  const [apresentacao, setApresentacao] = useState(
    configApresentacao?.clientTabs?.apresentacao !== false
  );
  const [proposta, setProposta] = useState(
    configApresentacao?.clientTabs?.proposta !== false
  );
  const [fpv, setFpv] = useState(
    configApresentacao?.clientTabs?.fpv !== false
  );
  const [minuta, setMinuta] = useState(
    configApresentacao?.clientTabs?.minuta === true // Padrão falso
  );
  const [minutaTemplateId, setMinutaTemplateId] = useState(
    configApresentacao?.clientTabs?.minutaTemplateId || ''
  );
  const [canvaEmbedUrl, setCanvaEmbedUrl] = useState(
    configApresentacao?.canvaEmbedUrl || ''
  );

  // Novos Estados
  const [video, setVideo] = useState(
    configApresentacao?.clientTabs?.video === true
  );
  const [videoUrl, setVideoUrl] = useState(
    configApresentacao?.videoUrl || ''
  );
  const [fotos, setFotos] = useState(
    configApresentacao?.clientTabs?.fotos === true
  );
  const [fotosList, setFotosList] = useState<string[]>(
    configApresentacao?.fotosList || []
  );
  const [uploadingFotos, setUploadingFotos] = useState(false);

  const [documentos, setDocumentos] = useState(
    configApresentacao?.clientTabs?.documentos === true
  );
  const [documentosList, setDocumentosList] = useState<{ name: string; url: string }[]>(
    configApresentacao?.documentosList || []
  );
  const [uploadingDocs, setUploadingDocs] = useState(false);

  const [validadeDays, setValidadeDays] = useState<number | ''>(
    configApresentacao?.validadeDays || ''
  );

  // FAQ States
  const [faq, setFaq] = useState(
    configApresentacao?.clientTabs?.faq === true
  );
  const [faqList, setFaqList] = useState<any[]>(
    configApresentacao?.faqList || []
  );
  const [loadingFaqs, setLoadingFaqs] = useState(false);
  const [newFaqQuestion, setNewFaqQuestion] = useState('');
  const [newFaqAnswer, setNewFaqAnswer] = useState('');

  useEffect(() => {
    if (faq && faqList.length === 0) {
      setLoadingFaqs(true);
      getFaqsPadrao()
        .then(res => {
          if (res && res.length > 0) {
            setFaqList(res.map(item => ({ pergunta: item.pergunta, resposta: item.resposta })));
          }
        })
        .catch(err => console.error('Erro ao carregar FAQs padrão:', err))
        .finally(() => setLoadingFaqs(false));
    }
  }, [faq]);

  // Carregar a configuração completa do documento de forma assíncrona
  useEffect(() => {
    async function loadFullConfig() {
      try {
        const res = await getDocumentoConfigApresentacao(documentoId);
        if (res.success && res.configApresentacao) {
          const config = res.configApresentacao;
          setFotosList(config.fotosList || []);
          setDocumentosList(config.documentosList || []);
          setFaqList(config.faqList || []);
          if (config.clientTabs) {
            setApresentacao(config.clientTabs.apresentacao !== false);
            setProposta(config.clientTabs.proposta !== false);
            setFpv(config.clientTabs.fpv !== false);
            setMinuta(config.clientTabs.minuta === true);
            if (config.clientTabs.minutaTemplateId) {
              setMinutaTemplateId(config.clientTabs.minutaTemplateId);
            }
            setVideo(config.clientTabs.video === true);
            setFotos(config.clientTabs.fotos === true);
            setDocumentos(config.clientTabs.documentos === true);
            setFaq(config.clientTabs.faq === true);
          }
          if (config.videoUrl) setVideoUrl(config.videoUrl);
          if (config.canvaEmbedUrl) setCanvaEmbedUrl(config.canvaEmbedUrl);
          if (config.validadeDays) setValidadeDays(config.validadeDays);
        }
      } catch (err) {
        console.error('Erro ao buscar configuração completa:', err);
      } finally {
        setLoadingFullConfig(false);
      }
    }
    loadFullConfig();
  }, [documentoId]);

  // Carregar as minutas disponíveis no sistema
  useEffect(() => {
    async function loadTemplates() {
      try {
        const res = await getTemplates();
        if (res.success && res.data) {
          setTemplates(res.data);
          // Se não houver template selecionado, seleciona o primeiro
          if (!minutaTemplateId && res.data.length > 0) {
            setMinutaTemplateId(res.data[0].id);
          }
        }
      } catch (err) {
        console.error('Erro ao carregar minutas de contrato:', err);
      }
    }
    loadTemplates();
  }, [minutaTemplateId]);

  const handleFotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingFotos(true);
    try {
      const urls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        const base64Data = await base64Promise;
        const res = await uploadClientFileAction(base64Data, file.name);
        if (res.success && res.fileUrl) {
          urls.push(res.fileUrl);
        } else {
          alert(`Erro ao subir foto: ${res.error || 'Erro desconhecido'}`);
        }
      }
      setFotosList(prev => [...prev, ...urls]);
    } catch (err: any) {
      console.error(err);
      alert('Erro ao carregar arquivos: ' + err.message);
    } finally {
      setUploadingFotos(false);
      e.target.value = '';
    }
  };

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingDocs(true);
    try {
      const docs: { name: string; url: string }[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        const base64Data = await base64Promise;
        const res = await uploadClientFileAction(base64Data, file.name);
        if (res.success && res.fileUrl) {
          docs.push({ name: file.name, url: res.fileUrl });
        } else {
          alert(`Erro ao subir documento: ${res.error || 'Erro desconhecido'}`);
        }
      }
      setDocumentosList(prev => [...prev, ...docs]);
    } catch (err: any) {
      console.error(err);
      alert('Erro ao carregar arquivos: ' + err.message);
    } finally {
      setUploadingDocs(false);
      e.target.value = '';
    }
  };

  const handleSaveAndCopy = async () => {
    const days = Number(validadeDays);
    if (!validadeDays || isNaN(days) || days <= 0) {
      alert('Por favor, informe um prazo de validade em dias (número maior que zero).');
      return;
    }

    setLoading(true);
    try {
      const newConfig = {
        ...(configApresentacao || {}),
        useCanva: apresentacao && !!canvaEmbedUrl.trim(),
        canvaEmbedUrl: canvaEmbedUrl.trim(),
        clientTabs: {
          apresentacao,
          proposta,
          fpv,
          minuta,
          minutaTemplateId,
          video,
          fotos,
          documentos,
          faq
        },
        videoUrl: videoUrl.trim(),
        fotosList,
        documentosList,
        faqList,
        validadeDays: days,
        linkCreatedAt: new Date().toISOString(),
        linkExpiresAt: new Date(new Date().getTime() + days * 24 * 60 * 60 * 1000).toISOString()
      };

      const res = await updateConfigApresentacao(documentoId, newConfig);
      if (res.success) {
        // Copiar o link do cliente para a área de transferência
        const shareUrl = `https://smartbidhub.com.br/proposta/ver/${documentoId}`;
        await navigator.clipboard.writeText(shareUrl);
        
        setCopied(true);
        if (onSaveSuccess) {
          onSaveSuccess(newConfig);
        }
        setTimeout(() => {
          setCopied(false);
          onClose();
        }, 1500);
      } else {
        alert('Erro ao salvar as configurações: ' + res.error);
      }
    } catch (err: any) {
      alert('Erro inesperado: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const shareUrl = `https://smartbidhub.com.br/proposta/ver/${documentoId}`;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200 text-slate-800 font-sans">
        
        {/* HEADER */}
        <div className="bg-[#1B4D3E] px-6 py-4 border-b border-[#13382D] flex justify-between items-center text-white shrink-0">
          <h2 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
            <Share2 size={16} /> Configurar Link do Cliente
          </h2>
          <button onClick={onClose} className="text-white/60 hover:text-white transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* BODY */}
        <div className="p-6 md:p-8 space-y-6 overflow-y-auto flex-1 scrollbar-thin">
          {loadingFullConfig ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-500">
              <Loader2 className="animate-spin text-[#1B4D3E]" size={32} />
              <span className="text-sm font-bold uppercase tracking-wider">Carregando Configurações...</span>
            </div>
          ) : (
            <>
              <div className="space-y-1">
                <h3 className="text-sm font-extrabold uppercase tracking-wide text-slate-800">
                  O que o cliente visualizará no link?
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Marque os itens que deseja disponibilizar no menu de navegação do cliente final.
                </p>
              </div>

          {/* CHECKBOX LIST */}
          <div className="space-y-3">
            
            {/* 1. APRESENTAÇÃO CANVA */}
            <div className={`p-4 border rounded-2xl transition-all ${apresentacao ? 'border-indigo-500/30 bg-indigo-50/5' : 'border-slate-200 bg-white'}`}>
              <label className="flex items-start gap-4 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  className="mt-1 w-4 h-4 text-indigo-650 focus:ring-indigo-500 border-slate-300 rounded cursor-pointer"
                  checked={apresentacao}
                  onChange={(e) => setApresentacao(e.target.checked)}
                />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-1.5 font-black text-xs uppercase tracking-wider text-slate-800">
                    <Presentation size={14} className="text-indigo-600" />
                    1. Apresentação (Slides / Canva)
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                    Renderiza os slides widescreen incorporados do Canva com alta fidelidade gráfica.
                  </p>
                </div>
              </label>

              {apresentacao && (
                <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                    Código de Incorporação (Embed HTML) ou Link do Canva
                  </label>
                  <input 
                    type="text"
                    placeholder="Cole o link inteligente (https://www.canva.com/design/.../view?embed) ou o código iframe do Canva..."
                    value={canvaEmbedUrl}
                    onChange={(e) => {
                      let val = e.target.value;
                      if (val.includes('<iframe')) {
                        const match = val.match(/src="([^"]+)"/);
                        if (match && match[1]) {
                          val = match[1];
                        }
                      }
                      setCanvaEmbedUrl(val);
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              )}
            </div>

            {/* 2. PROPOSTA COMERCIAL A4 */}
            <label className={`flex items-start gap-4 p-4 border rounded-2xl cursor-pointer transition-all hover:bg-slate-50 select-none ${proposta ? 'border-emerald-500/30 bg-emerald-50/5' : 'border-slate-200 bg-white'}`}>
              <input 
                type="checkbox" 
                className="mt-1 w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded cursor-pointer"
                checked={proposta}
                onChange={(e) => setProposta(e.target.checked)}
              />
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-1.5 font-black text-xs uppercase tracking-wider text-slate-800">
                  <FileText size={14} className="text-emerald-600" />
                  2. Proposta Comercial (Contrato A4)
                </div>
                <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                  Contrato comercial completo em A4 contendo o escopo básico, condições e aceite do cliente.
                </p>
              </div>
            </label>

            {/* 3. FPV DETALHADO (ABAS 2 A 9) */}
            <label className={`flex items-start gap-4 p-4 border rounded-2xl cursor-pointer transition-all hover:bg-slate-50 select-none ${fpv ? 'border-amber-500/30 bg-amber-50/5' : 'border-slate-200 bg-white'}`}>
              <input 
                type="checkbox" 
                className="mt-1 w-4 h-4 text-amber-600 focus:ring-amber-500 border-slate-300 rounded cursor-pointer"
                checked={fpv}
                onChange={(e) => setFpv(e.target.checked)}
              />
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-1.5 font-black text-xs uppercase tracking-wider text-slate-800">
                  <Calculator size={14} className="text-amber-600" />
                  3. FPV Detalhado (Abas de Posto Fixo)
                </div>
                <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                  Permite o cliente navegar nas planilhas financeiras (Premissas, Encargos, Quadro, Insumos e Resumos).
                </p>
              </div>
            </label>

            {/* 4. MINUTA DO CONTRATO */}
            <div className={`p-4 border rounded-2xl transition-all ${minuta ? 'border-sky-500/30 bg-sky-50/5' : 'border-slate-200 bg-white'}`}>
              <label className="flex items-start gap-4 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  className="mt-1 w-4 h-4 text-sky-600 focus:ring-sky-500 border-slate-300 rounded cursor-pointer"
                  checked={minuta}
                  onChange={(e) => setMinuta(e.target.checked)}
                />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-1.5 font-black text-xs uppercase tracking-wider text-slate-800">
                    <BookOpen size={14} className="text-sky-600" />
                    4. Minuta de Contrato Padrão
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                    Minuta formal pré-preenchida com dados do cliente e da empresa emissora relacionados.
                  </p>
                </div>
              </label>

              {/* SELETOR DE TEMPLATE DE MINUTA SE HABILITADO */}
              {minuta && (
                <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                    Selecione o Modelo de Minuta Padrão
                  </label>
                  <select 
                    value={minutaTemplateId}
                    onChange={(e) => setMinutaTemplateId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-1 focus:ring-sky-500"
                  >
                    {templates.map(t => (
                      <option key={t.id} value={t.id}>{t.nome}</option>
                    ))}
                    {templates.length === 0 && (
                      <option value="">Nenhuma minuta cadastrada no sistema</option>
                    )}
                  </select>
                </div>
              )}
            </div>
 
            {/* 5. VÍDEO APRESENTATIVO */}
            <div className={`p-4 border rounded-2xl transition-all ${video ? 'border-red-500/30 bg-red-50/5' : 'border-slate-200 bg-white'}`}>
              <label className="flex items-start gap-4 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  className="mt-1 w-4 h-4 text-red-650 focus:ring-red-500 border-slate-300 rounded cursor-pointer"
                  checked={video}
                  onChange={(e) => setVideo(e.target.checked)}
                />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-1.5 font-black text-xs uppercase tracking-wider text-slate-800">
                    <Video size={14} className="text-red-600" />
                    5. Vídeo de Apresentação da Proposta
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                    Insira o link de um vídeo de apresentação ou explicação da proposta para engajar o cliente.
                  </p>
                </div>
              </label>

              {video && (
                <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                    Link do Vídeo (YouTube, Vimeo ou link direto MP4)
                  </label>
                  <input 
                    type="text"
                    placeholder="Cole o link (ex: https://www.youtube.com/watch?v=... ou Vimeo)..."
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-1 focus:ring-red-500"
                  />
                </div>
              )}
            </div>

            {/* 6. FOTOS DA VISITA TÉCNICA */}
            <div className={`p-4 border rounded-2xl transition-all ${fotos ? 'border-purple-500/30 bg-purple-50/5' : 'border-slate-200 bg-white'}`}>
              <label className="flex items-start gap-4 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  className="mt-1 w-4 h-4 text-purple-600 focus:ring-purple-500 border-slate-300 rounded cursor-pointer"
                  checked={fotos}
                  onChange={(e) => setFotos(e.target.checked)}
                />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-1.5 font-black text-xs uppercase tracking-wider text-slate-800">
                    <Image size={14} className="text-purple-600" />
                    6. Fotos da Visita Técnica
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                    Disponibilize uma galeria de fotos da visita técnica ou vistoria para validação visual pelo cliente.
                  </p>
                </div>
              </label>

              {fotos && (
                <div className="mt-4 pt-4 border-t border-slate-100 space-y-4">
                  
                  {/* Grid de Fotos já enviadas */}
                  {fotosList.length > 0 && (
                    <div className="grid grid-cols-4 gap-2">
                      {fotosList.map((url, idx) => (
                        <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                          <img 
                            src={url} 
                            alt={`Foto da visita ${idx + 1}`} 
                            className="w-full h-full object-cover" 
                          />
                          <button
                            type="button"
                            onClick={() => setFotosList(prev => prev.filter((_, i) => i !== idx))}
                            className="absolute top-1 right-1 bg-red-650 hover:bg-red-700 text-white p-1 rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Upload Dropzone */}
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-purple-500/50 rounded-xl p-4 cursor-pointer hover:bg-slate-50 transition-all text-center">
                    <input 
                      type="file" 
                      multiple 
                      accept="image/*"
                      onChange={handleFotoUpload}
                      disabled={uploadingFotos}
                      className="hidden"
                    />
                    {uploadingFotos ? (
                      <div className="flex flex-col items-center gap-1.5 text-slate-500 font-bold uppercase tracking-widest text-[9px]">
                        <Loader2 size={20} className="animate-spin text-purple-600" />
                        Fazendo upload das fotos...
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-slate-500">
                        <Plus size={16} className="text-purple-600 mb-1" />
                        <span className="text-[10px] font-black uppercase tracking-wider">Clique para adicionar fotos</span>
                        <span className="text-[9px] text-slate-400 font-bold">Imagens PNG, JPG, WEBP (Máx. 15MB)</span>
                      </div>
                    )}
                  </label>
                </div>
              )}
            </div>

            {/* 7. DOCUMENTOS E CERTIDÕES (PDF) */}
            <div className={`p-4 border rounded-2xl transition-all ${documentos ? 'border-blue-500/30 bg-blue-50/5' : 'border-slate-200 bg-white'}`}>
              <label className="flex items-start gap-4 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  className="mt-1 w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded cursor-pointer"
                  checked={documentos}
                  onChange={(e) => setDocumentos(e.target.checked)}
                />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-1.5 font-black text-xs uppercase tracking-wider text-slate-800">
                    <Paperclip size={14} className="text-blue-600" />
                    7. Documentos e Certidões (PDF)
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                    Anexe certidões negativas, comprovantes de regularidade fiscal ou arquivos complementares em PDF.
                  </p>
                </div>
              </label>

              {documentos && (
                <div className="mt-4 pt-4 border-t border-slate-100 space-y-4">
                  
                  {/* Lista de documentos já enviados */}
                  {documentosList.length > 0 && (
                    <div className="space-y-1.5">
                      {documentosList.map((docItem, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-slate-50 border border-slate-200 p-2 rounded-xl text-xs">
                          <div className="flex items-center gap-2 text-slate-700 font-bold max-w-[80%]">
                            <FileText size={14} className="text-slate-400 shrink-0" />
                            <span className="truncate">{docItem.name}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setDocumentosList(prev => prev.filter((_, i) => i !== idx))}
                            className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Upload Dropzone */}
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-blue-500/50 rounded-xl p-4 cursor-pointer hover:bg-slate-50 transition-all text-center">
                    <input 
                      type="file" 
                      multiple 
                      accept=".pdf,.doc,.docx,.xls,.xlsx"
                      onChange={handleDocUpload}
                      disabled={uploadingDocs}
                      className="hidden"
                    />
                    {uploadingDocs ? (
                      <div className="flex flex-col items-center gap-1.5 text-slate-500 font-bold uppercase tracking-widest text-[9px]">
                        <Loader2 size={20} className="animate-spin text-blue-600" />
                        Fazendo upload dos documentos...
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-slate-500">
                        <Plus size={16} className="text-blue-600 mb-1" />
                        <span className="text-[10px] font-black uppercase tracking-wider">Clique para adicionar documentos</span>
                        <span className="text-[9px] text-slate-400 font-bold">Formatos: PDF, Word (doc/docx) e Excel (xls/xlsx) (Máx. 15MB)</span>
                      </div>
                    )}
                  </label>
                </div>
              )}
            </div>

            {/* 9. PERGUNTAS FREQUENTES (FAQ) */}
            <div className={`p-4 border rounded-2xl transition-all ${faq ? 'border-teal-500/30 bg-teal-50/5' : 'border-slate-200 bg-white'}`}>
              <label className="flex items-start gap-4 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  className="mt-1 w-4 h-4 text-teal-600 focus:ring-teal-500 border-slate-300 rounded cursor-pointer"
                  checked={faq}
                  onChange={(e) => setFaq(e.target.checked)}
                />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-1.5 font-black text-xs uppercase tracking-wider text-slate-800">
                    <HelpCircle size={14} className="text-teal-600" />
                    9. Perguntas Frequentes (FAQ)
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                    Inclua uma aba de Perguntas Frequentes para sanar as principais dúvidas do cliente.
                  </p>
                </div>
              </label>

              {faq && (
                <div className="mt-4 pt-4 border-t border-slate-100 space-y-4">
                  {loadingFaqs ? (
                    <div className="flex items-center justify-center py-4 text-slate-400 text-xs font-bold gap-2">
                      <Loader2 size={16} className="animate-spin text-teal-600" />
                      Carregando FAQs padrões...
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Lista de FAQs customizáveis */}
                      {faqList.length > 0 && (
                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-slate-450 uppercase tracking-widest block">
                            Lista de FAQs desta proposta (você pode editar ou remover)
                          </label>
                          <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                            {faqList.map((item, idx) => (
                              <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs relative group">
                                <div className="space-y-1">
                                  <input 
                                    type="text"
                                    value={item.pergunta}
                                    onChange={(e) => {
                                      const updated = [...faqList];
                                      updated[idx].pergunta = e.target.value;
                                      setFaqList(updated);
                                    }}
                                    placeholder="Pergunta"
                                    className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none focus:ring-1 focus:ring-teal-500"
                                  />
                                  <textarea 
                                    value={item.resposta}
                                    onChange={(e) => {
                                      const updated = [...faqList];
                                      updated[idx].resposta = e.target.value;
                                      setFaqList(updated);
                                    }}
                                    placeholder="Resposta"
                                    rows={2}
                                    className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs text-slate-650 outline-none focus:ring-1 focus:ring-teal-500"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setFaqList(prev => prev.filter((_, i) => i !== idx))}
                                  className="absolute top-2 right-2 text-red-500 hover:text-red-700 p-1 rounded-lg hover:bg-red-50 transition-colors"
                                  title="Remover pergunta"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Adicionar nova FAQ na hora */}
                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-150 space-y-2">
                        <span className="text-[9px] font-black text-slate-450 uppercase tracking-widest block">
                          Adicionar nova pergunta ao link
                        </span>
                        <div className="space-y-2">
                          <input 
                            type="text"
                            placeholder="Pergunta (ex: Como funciona a rescisão?)"
                            value={newFaqQuestion}
                            onChange={(e) => setNewFaqQuestion(e.target.value)}
                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-1 focus:ring-teal-500"
                          />
                          <textarea 
                            placeholder="Resposta..."
                            value={newFaqAnswer}
                            onChange={(e) => setNewFaqAnswer(e.target.value)}
                            rows={2}
                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-600 outline-none focus:ring-1 focus:ring-teal-500"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (!newFaqQuestion.trim() || !newFaqAnswer.trim()) return;
                            setFaqList(prev => [...prev, { pergunta: newFaqQuestion.trim(), resposta: newFaqAnswer.trim() }]);
                            setNewFaqQuestion('');
                            setNewFaqAnswer('');
                          }}
                          disabled={!newFaqQuestion.trim() || !newFaqAnswer.trim()}
                          className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-white py-1.5 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Plus size={12} /> Adicionar Pergunta
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 8. PRAZO DE VALIDADE DO LINK */}
            <div className="p-4 border rounded-2xl border-slate-200 bg-white space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-black text-xs uppercase tracking-wider text-slate-800">
                  <Clock size={14} className="text-amber-600" />
                  Validade do Link Comercial
                </div>
                <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest bg-red-50 text-red-650 border border-red-200">
                  Obrigatório
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium leading-relaxed font-sans">
                Insira obrigatoriamente a quantidade de dias para a validade desta proposta. Após esse prazo, o link de acesso público expirará automaticamente.
              </p>
              
              <div className="flex items-center gap-2 max-w-[200px]">
                <div className="relative flex items-center w-full">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    placeholder="Ex: 10"
                    value={validadeDays}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '') {
                        setValidadeDays('');
                      } else {
                        const parsed = parseInt(val, 10);
                        if (!isNaN(parsed)) {
                          setValidadeDays(parsed >= 1 ? parsed : 1);
                        }
                      }
                    }}
                    className="w-full pl-3 pr-12 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-700 outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all font-mono"
                  />
                  <div className="absolute right-3 text-[10px] font-black uppercase tracking-wider text-slate-400 pointer-events-none">
                    dias
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* VISUALIZADOR DE LINK */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 space-y-1.5">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">
              Endereço do Link Interativo do Cliente
            </span>
            <div className="flex gap-2 items-center bg-white border border-slate-250 p-1.5 pl-3 rounded-xl">
              <span className="text-[10px] text-slate-500 font-bold truncate flex-1 font-mono select-all">
                {shareUrl}
              </span>
              <button 
                type="button"
                onClick={async () => {
                  await navigator.clipboard.writeText(shareUrl);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="p-2 hover:bg-slate-50 text-slate-500 hover:text-slate-800 rounded-lg transition-all"
                title="Copiar Link"
              >
                {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
              </button>
            </div>
          </div>
            </>
          )}
        </div>

        {/* FOOTER */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 shrink-0">
          <button 
            onClick={onClose}
            className="px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider text-slate-500 bg-white border border-slate-350 hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSaveAndCopy}
            disabled={loading || !validadeDays || Number(validadeDays) <= 0}
            className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
              loading || !validadeDays || Number(validadeDays) <= 0
                ? 'bg-slate-150 text-slate-400 border border-slate-250 cursor-not-allowed shadow-none opacity-60'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/10 active:scale-[0.98]'
            }`}
          >
            {copied ? (
              <>
                <Check size={14} /> Link Copiado!
              </>
            ) : (
              <>
                🔗 Salvar e Copiar Link
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
