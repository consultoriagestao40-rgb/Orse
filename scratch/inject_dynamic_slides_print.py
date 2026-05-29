import os

target_file = os.path.join(os.path.dirname(__file__), '..', 'components', 'PropostaApresentacaoPrint.tsx')
with open(target_file, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Inserir a detecção de slides dinâmicos e a função replaceTags
slide_state_placeholder = "  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);"
replacement_state = """  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

  const rawSlides = proposta.cliente?.clausulasA4 || [];
  const hasDynamicSlides = rawSlides.length > 0 && rawSlides.some((s: any) => s.texto.trim().startsWith('{'));
  const totalSlides = hasDynamicSlides ? rawSlides.length : 13;

  const replaceTags = (text: string) => {
    if (!text) return '';
    let replaced = text;
    
    const clienteNome = proposta.cliente?.nomeFantasia || proposta.cliente?.razaoSocial || proposta.cliente?.cliente || '';
    const numProposta = proposta.cliente?.numeroProposta || `FPV-${String(proposta.numero || 'XXX').padStart(3, '0')}`;
    const revisao = proposta.cliente?.revisao || 'R01';
    const objeto = proposta.cliente?.objetoProposta || proposta.cliente?.tipoServicos || 'Prestação de serviços especializados de limpeza, conservação e facilities.';
    const escopo = proposta.cliente?.escopoTecnico || 'Detalhamento das atividades operacionais conforme solicitação e cronograma alinhado.';
    
    replaced = replaced.replace(/\\[CLIENTE_NOME\\]/g, clienteNome);
    replaced = replaced.replace(/\\[NUMERO_PROPOSTA\\]/g, numProposta);
    replaced = replaced.replace(/\\[REVISAO\\]/g, revisao);
    replaced = replaced.replace(/\\[OBJETO_PROPOSTA\\]/g, objeto);
    replaced = replaced.replace(/\\[ESCOPO_TECNICO\\]/g, escopo);
    
    const divisorTributos = resultado?.divisor || 1;
    const txAdm = (proposta.premissas?.taxaAdm || 0) / 100;
    const txLucro = (proposta.premissas?.margemLucro || 0) / 100;
    const isSpot = proposta.equipe?.some((e: any) => e.tipoItem === 'SPOT');
    
    const normalizeText = (text: string) => {
      if (!text) return "";
      return text.normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").toLowerCase().trim();
    };

    const isLocado = (desc: string) => {
      if (!desc) return false;
      const normalized = normalizeText(desc);
      return normalized.includes('locado') || normalized.includes('locada') || normalized.includes('locacao') || normalized.includes('locaco') || normalized.includes('locação');
    };

    const detalheMaquinas = proposta.insumos?.detalheMaquinas || [];
    const totalMaquinasLocadas = detalheMaquinas
      .filter((item: any) => isLocado(item.descricao))
      .reduce((acc: number, item: any) => acc + (item.custoMensal || 0), 0);
    const totalMaquinasNaoLocadas = detalheMaquinas
      .filter((item: any) => !isLocado(item.descricao))
      .reduce((acc: number, item: any) => acc + (item.custoMensal || 0), 0);

    const applyCascata = (custo: any) => {
      const cD = Number(custo) || 0;
      const comAdm = cD * (1 + txAdm);
      const comLucro = comAdm * (1 + txLucro);
      return divisorTributos > 0 ? (comLucro / divisorTributos) : comLucro;
    };

    const maoDeObraSubtotal = resultado?.items?.reduce((acc: any, i: any) => acc + (i.precoVenda || 0), 0) || 0;
    const insumosSubtotal = applyCascata(
      Number(proposta.insumos?.materiais || 0) + 
      Number(isSpot ? (totalMaquinasNaoLocadas + totalMaquinasLocadas) : proposta.insumos?.maquinas || 0) + 
      Number(proposta.insumos?.descartaveis || 0) + 
      Number(isSpot ? 0 : proposta.insumos?.servicos || 0)
    );

    const valorTotal = formatCurrency(maoDeObraSubtotal + insumosSubtotal);
    replaced = replaced.replace(/\\[VALOR_TOTAL\\]/g, valorTotal);
    
    return replaced;
  };"""

content = content.replace(slide_state_placeholder, replacement_state)

# 3. Inserir a renderização do bloco dinâmico ou estático no print container
target_div = '<div className="print-slide-deck hidden print:block">'

dynamic_block = """
                        {hasDynamicSlides ? (
                           rawSlides.map((slide: any, slideIdx: number) => {
                              let slideData: any = {};
                              try {
                                 slideData = JSON.parse(slide.texto);
                              } catch (e) {
                                 slideData = { layout: 'texto', tituloSlide: slide.titulo, subtitulo: '', conteudo: slide.texto };
                              }
                              
                              const layout = slideData.layout || 'texto';
                              const tituloSlide = slideData.tituloSlide || slide.titulo;
                              const subtitulo = slideData.subtitulo || '';
                              const conteudo = slideData.conteudo || '';
                              const bgImage = slideData.bgImage || '';
                              const slideNum = slideIdx + 1;
                              
                              if (layout === 'cobertura') {
                                 const finalBgImage = bgImage || "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=1200";
                                 return (
                                    <div key={slideIdx} className="print-slide w-full aspect-[16/9] border border-slate-200 bg-[#020617] p-16 flex flex-col justify-between relative overflow-hidden h-[100vh] text-white">
                                       <img 
                                          src={finalBgImage} 
                                          alt="Capa Fundo" 
                                          className="absolute inset-0 w-full h-full object-cover opacity-40 scale-105 filter blur-[0.5px]"
                                       />
                                       <div className="absolute inset-0 bg-[#1e4480]/85 backdrop-blur-[1px]"></div>
                                       
                                       <div className="relative z-20 flex flex-col justify-center items-center h-full w-full space-y-12">
                                          <div className="flex flex-col items-center space-y-4">
                                             <img 
                                                src={companyLogo} 
                                                alt="Silva Consultoria Logo" 
                                                className="max-h-32 w-auto object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.25)]"
                                             />
                                             <div className="text-[11px] font-black tracking-[0.3em] text-white/90 uppercase pl-1.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]">FACILITIES</div>
                                          </div>
                                          <div className="w-full max-w-2xl border-2 border-white rounded-full bg-white/10 px-12 py-4 shadow-xl backdrop-blur-md text-center">
                                             <span className="text-white text-base font-black tracking-[0.25em] uppercase">
                                                {replaceTags(tituloSlide)}
                                             </span>
                                          </div>
                                       </div>
                                       
                                       <div className="relative z-20 flex justify-between items-end w-full text-white/70 text-[10px] font-extrabold uppercase tracking-wider pr-4 mt-auto">
                                          <div className="flex justify-start gap-16 text-white/70 text-[10px] font-extrabold uppercase tracking-wider">
                                             <div className="space-y-1">
                                                <div>Cliente: <strong className="text-white">{proposta.cliente?.nomeFantasia || proposta.cliente?.razaoSocial || "Nome do Cliente"}</strong></div>
                                                <div>Nº Proposta: <strong className="text-white">{proposta.cliente?.numeroProposta || `FPV-${String(proposta.numero || 'XXX').padStart(3, '0')}`}</strong></div>
                                             </div>
                                             <div className="space-y-1">
                                                <div>Data: <strong className="text-white">
                                                   {proposta.cliente?.dataElaboracao 
                                                      ? new Date(proposta.cliente.dataElaboracao + 'T12:00:00').toLocaleDateString('pt-BR') 
                                                      : new Date().toLocaleDateString('pt-BR')}
                                                </strong></div>
                                                <div>Revisão: <strong className="text-white">{proposta.cliente?.revisao || "R01"}</strong></div>
                                             </div>
                                          </div>
                                          <span className="text-[9px] font-black text-white bg-white/10 px-2.5 py-0.5 rounded backdrop-blur-xs">{String(slideNum).padStart(2, '0')}</span>
                                       </div>
                                    </div>
                                 );
                              }

                              if (layout === 'agradecimento') {
                                 return (
                                    <div key={slideIdx} className="print-slide w-full aspect-[16/9] border border-slate-200 bg-white p-16 flex flex-col justify-between relative overflow-hidden h-[100vh]">
                                       <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40" xmlns="http://www.w3.org/2000/svg">
                                          <line x1="-50" y1="150" x2="350" y2="-250" stroke="#E2E8F0" strokeWidth="10" />
                                          <line x1="-50" y1="200" x2="400" y2="-250" stroke="#E2E8F0" strokeWidth="6" />
                                          <line x1="-50" y1="250" x2="450" y2="-250" stroke="#E2E8F0" strokeWidth="3" />
                                          <line x1="600" y1="800" x2="1100" y2="300" stroke="#E2E8F0" strokeWidth="10" />
                                          <line x1="650" y1="800" x2="1150" y2="300" stroke="#E2E8F0" strokeWidth="6" />
                                          <line x1="700" y1="800" x2="1200" y2="300" stroke="#E2E8F0" strokeWidth="3" />
                                       </svg>

                                       <div className="grid grid-cols-12 gap-8 items-center h-full relative z-10">
                                          <div className="col-span-8 flex flex-col justify-center space-y-5 pr-4">
                                             <h2 className="text-3xl font-black text-[#1E3A8A] tracking-tight leading-none uppercase">
                                                {replaceTags(tituloSlide)}
                                             </h2>
                                             {subtitulo && <p className="text-slate-500 text-sm font-bold uppercase tracking-wider -mt-2">{replaceTags(subtitulo)}</p>}
                                             
                                             <div className="text-slate-600 text-xs leading-relaxed space-y-4 font-medium">
                                                <p className="whitespace-pre-line">{replaceTags(conteudo)}</p>
                                             </div>

                                             <div className="space-y-4">
                                                <span className="text-xs font-bold text-slate-500 block">Att,</span>
                                                <div className="bg-[#2B547E] text-white px-5 py-3 rounded-2xl inline-flex flex-row items-center gap-4 shadow-md max-w-md">
                                                   {proposta.cliente?.vendedorAvatarUrl ? (
                                                      <img 
                                                         src={proposta.cliente.vendedorAvatarUrl} 
                                                         alt={proposta.cliente.vendedorNome} 
                                                         className="w-12 h-12 rounded-full object-cover border border-white/20 shadow-sm shrink-0"
                                                      />
                                                   ) : null}
                                                   <div className="flex flex-col space-y-0.5 overflow-hidden">
                                                      <span className="text-sm font-black tracking-tight">{proposta.cliente?.vendedorNome || "Ádamo Quadros"}</span>
                                                      <span className="text-[10px] text-slate-200/80 font-bold uppercase tracking-wider">{proposta.cliente?.vendedorCargo || "Novos Negócios"}</span>
                                                      <span className="text-[10px] text-slate-200/80 font-bold">{proposta.cliente?.vendedorTelefone || "(41) 9 9737-0880"}</span>
                                                      <span className="text-[10px] text-slate-200/80 font-bold truncate">{proposta.cliente?.vendedorEmail || "contato@silvaconsultoria.com.br"}</span>
                                                   </div>
                                                </div>
                                             </div>
                                          </div>

                                          <div className="col-span-4 flex flex-col justify-center items-center pl-8 border-l border-slate-100 h-full">
                                             <img 
                                                src={companyLogo} 
                                                alt="Logo" 
                                                className="max-h-24 w-auto object-contain mb-4"
                                             />
                                             <div className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">FACILITIES</div>
                                          </div>
                                       </div>

                                       <div className="flex justify-between items-center border-t border-slate-100 pt-4 mt-auto pr-28">
                                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">www.smartbidhub.com.br</span>
                                          <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded">{String(slideNum).padStart(2, '0')}</span>
                                       </div>
                                    </div>
                                 );
                              }

                              if (layout === 'valores') {
                                 return (
                                    <div key={slideIdx} className="print-slide w-full aspect-[16/9] border border-slate-200 bg-white p-16 flex flex-col justify-between relative overflow-hidden h-[100vh]">
                                       <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40" xmlns="http://www.w3.org/2000/svg">
                                          <line x1="-50" y1="150" x2="350" y2="-250" stroke="#E2E8F0" strokeWidth="10" />
                                          <line x1="-50" y1="200" x2="400" y2="-250" stroke="#E2E8F0" strokeWidth="6" />
                                          <line x1="-50" y1="250" x2="450" y2="-250" stroke="#E2E8F0" strokeWidth="3" />
                                          <line x1="600" y1="800" x2="1100" y2="300" stroke="#E2E8F0" strokeWidth="10" />
                                          <line x1="650" y1="800" x2="1150" y2="300" stroke="#E2E8F0" strokeWidth="6" />
                                          <line x1="700" y1="800" x2="1200" y2="300" stroke="#E2E8F0" strokeWidth="3" />
                                       </svg>
                                       
                                       <div className="grid grid-cols-12 gap-8 items-center h-[calc(100%-40px)] relative z-10">
                                          <div className="col-span-7 flex flex-col justify-center space-y-4 pl-2 h-full">
                                             <div>
                                                <h2 className="text-4xl font-black text-[#1E3A8A] tracking-tight leading-none uppercase">
                                                   {replaceTags(tituloSlide)}
                                                </h2>
                                                {subtitulo && <p className="text-slate-500 text-sm font-bold uppercase tracking-wider mt-1">{replaceTags(subtitulo)}</p>}
                                                <p className="text-slate-600 text-[14px] font-semibold leading-relaxed mt-5 text-justify whitespace-pre-line">
                                                   {replaceTags(conteudo)}
                                                </p>
                                             </div>
                                          </div>

                                          <div className="col-span-5 h-full w-full flex items-center justify-center relative">
                                             <div className="relative w-full h-[220px] z-20">
                                                <img 
                                                   src="/hand-support.png" 
                                                   alt="Mão de suporte"
                                                   className="absolute right-[-10px] bottom-[-85px] w-[320px] h-auto pointer-events-none opacity-90 z-0 mix-blend-multiply"
                                                />
                                                <div className="absolute top-[-12px] left-1/2 -translate-x-1/2 flex items-center justify-center w-20 h-20 rounded-full bg-[#1e4480] text-white shadow-2xl z-10 transition-all duration-300 hover:scale-105">
                                                   <Trophy size={36} className="text-white shrink-0" />
                                                </div>

                                                <div className="absolute bottom-[100px] left-4 flex items-center justify-center w-20 h-20 rounded-full bg-[#1e4480] text-white shadow-2xl z-10 transition-all duration-300 hover:scale-105">
                                                   <Lightbulb size={36} className="text-white shrink-0" />
                                                </div>

                                                <div className="absolute bottom-[100px] right-4 flex items-center justify-center w-20 h-20 rounded-full bg-[#1e4480] text-white shadow-2xl z-10 transition-all duration-300 hover:scale-105">
                                                   <Users size={36} className="text-white shrink-0" />
                                                </div>
                                             </div>
                                          </div>
                                       </div>

                                       <div className="flex justify-between items-center border-t border-slate-100 pt-4 mt-auto pr-28">
                                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">www.smartbidhub.com.br</span>
                                          <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded">{String(slideNum).padStart(2, '0')}</span>
                                       </div>
                                    </div>
                                 );
                              }

                              if (layout === 'servicos') {
                                 return (
                                    <div key={slideIdx} className="print-slide w-full aspect-[16/9] border border-slate-200 bg-white p-16 flex flex-col justify-between relative overflow-hidden h-[100vh]">
                                       <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-50" xmlns="http://www.w3.org/2000/svg">
                                          <line x1="-100" y1="100" x2="400" y2="-400" stroke="#F1F5F9" strokeWidth="18" />
                                          <line x1="-100" y1="150" x2="450" y2="-400" stroke="#F1F5F9" strokeWidth="12" />
                                          <line x1="-100" y1="200" x2="500" y2="-400" stroke="#F1F5F9" strokeWidth="6" />
                                          <line x1="-100" y1="250" x2="550" y2="-400" stroke="#F1F5F9" strokeWidth="3" />
                                          <line x1="500" y1="900" x2="1200" y2="200" stroke="#F1F5F9" strokeWidth="18" />
                                          <line x1="550" y1="900" x2="1250" y2="200" stroke="#F1F5F9" strokeWidth="12" />
                                       </svg>
                                       
                                       <div className="relative z-10 flex flex-col h-[calc(100%-30px)] justify-between">
                                          <div>
                                             <h2 className="text-3xl font-black text-[#1e4480] uppercase tracking-tight leading-none mb-2">
                                                {replaceTags(tituloSlide)}
                                             </h2>
                                             {subtitulo && <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-6">{replaceTags(subtitulo)}</p>}

                                             <p className="text-slate-600 text-[14px] font-semibold leading-relaxed mt-2 text-justify whitespace-pre-line max-w-4xl">
                                                {replaceTags(conteudo)}
                                             </p>
                                          </div>

                                          <div className="flex justify-around items-center w-full pt-4 mt-auto border-t border-slate-100 relative z-20">
                                             <div className="flex flex-col items-center justify-center">
                                                <div className="bg-[#1e4480] text-white w-16 h-16 flex items-center justify-center rounded-full shadow-xl">
                                                   <ConciergeBell size={24} className="text-white" />
                                                </div>
                                                <span className="text-[#1e4480] text-[10px] font-black tracking-wider uppercase mt-2">
                                                   FACILITIES
                                                </span>
                                             </div>

                                             <div className="flex flex-col items-center justify-center">
                                                <div className="bg-[#1e4480] text-white w-16 h-16 flex items-center justify-center rounded-full shadow-xl">
                                                   <ShieldCheck size={24} className="text-white" />
                                                </div>
                                                <span className="text-[#1e4480] text-[10px] font-black tracking-wider uppercase mt-2">
                                                   PORTARIA
                                                </span>
                                             </div>

                                             <div className="flex flex-col items-center justify-center">
                                                <div className="bg-[#1e4480] text-white w-16 h-16 flex items-center justify-center rounded-full shadow-xl">
                                                   <Sparkles size={24} className="text-white" />
                                                </div>
                                                <span className="text-[#1e4480] text-[10px] font-black tracking-wider uppercase mt-2">
                                                   LIMPEZA
                                                </span>
                                             </div>

                                             <div className="flex flex-col items-center justify-center">
                                                <div className="bg-[#1e4480] text-white w-16 h-16 flex items-center justify-center rounded-full shadow-xl">
                                                   <Wrench size={24} className="text-white" />
                                                </div>
                                                <span className="text-[#1e4480] text-[10px] font-black tracking-wider uppercase mt-2">
                                                   MANUTENÇÃO
                                                </span>
                                             </div>

                                             <div className="flex flex-col items-center justify-center">
                                                <div className="bg-[#1e4480] text-white w-16 h-16 flex items-center justify-center rounded-full shadow-xl">
                                                   <Trees size={24} className="text-white" />
                                                </div>
                                                <span className="text-[#1e4480] text-[10px] font-black tracking-wider uppercase mt-2">
                                                   JARDINAGEM
                                                </span>
                                             </div>
                                          </div>
                                       </div>

                                       <div className="flex justify-between items-center border-t border-slate-100 pt-4 mt-auto pr-28">
                                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">www.smartbidhub.com.br</span>
                                          <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded">{String(slideNum).padStart(2, '0')}</span>
                                       </div>
                                    </div>
                                 );
                              }

                              if (layout === 'texto') {
                                 return (
                                    <div key={slideIdx} className="print-slide w-full aspect-[16/9] border border-slate-200 bg-white p-16 flex flex-col justify-between relative overflow-hidden h-[100vh]">
                                       <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40" xmlns="http://www.w3.org/2000/svg">
                                          <line x1="-50" y1="150" x2="350" y2="-250" stroke="#E2E8F0" strokeWidth="10" />
                                          <line x1="-50" y1="200" x2="400" y2="-250" stroke="#E2E8F0" strokeWidth="6" />
                                          <line x1="600" y1="800" x2="1100" y2="300" stroke="#E2E8F0" strokeWidth="10" />
                                          <line x1="650" y1="800" x2="1150" y2="300" stroke="#E2E8F0" strokeWidth="6" />
                                       </svg>

                                       <div className="flex flex-col justify-between h-full relative z-10">
                                          <div className="flex justify-between items-start pb-4 border-b border-slate-100">
                                             <div className="flex flex-col">
                                                <h2 className="text-3xl font-black text-[#1e4480] tracking-tight leading-none uppercase">
                                                   {replaceTags(tituloSlide)}
                                                </h2>
                                                {subtitulo && <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-1">{replaceTags(subtitulo)}</p>}
                                             </div>
                                             <img 
                                                src={companyLogo} 
                                                alt="Logo" 
                                                className="max-h-10 w-auto object-contain"
                                             />
                                          </div>

                                          <div className="my-auto w-full max-w-4xl mx-auto py-4">
                                             <p className="text-sm font-semibold leading-relaxed text-slate-700 whitespace-pre-line text-justify font-bold">
                                                {replaceTags(conteudo)}
                                             </p>
                                          </div>

                                          <div className="flex justify-between items-center w-full text-slate-400 text-[9px] font-bold uppercase tracking-wider pt-2 border-t border-slate-100 pr-28">
                                             <span>www.smartbidhub.com.br</span>
                                             <span className="text-[#1e4480] bg-slate-100 px-2.5 py-0.5 rounded font-black">{String(slideNum).padStart(2, '0')}</span>
                                          </div>
                                       </div>
                                    </div>
                                 );
                              }

                              if (layout === 'tabela') {
                                 const fc = formatCurrency;
                                 const divisorTributos = resultado?.divisor || 1;
                                 const txAdm = (proposta.premissas?.taxaAdm || 0) / 100;
                                 const txLucro = (proposta.premissas?.margemLucro || 0) / 100;
                                 
                                 const isSpot = proposta.equipe?.some((e: any) => e.tipoItem === 'SPOT');
                                 
                                 const normalizeText = (text: string) => {
                                   if (!text) return "";
                                   return text.normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").toLowerCase().trim();
                                 };

                                 const isLocado = (desc: string) => {
                                   if (!desc) return false;
                                   const normalized = normalizeText(desc);
                                   return normalized.includes('locado') || normalized.includes('locada') || normalized.includes('locacao') || normalized.includes('locaco') || normalized.includes('locação');
                                 };

                                 const detalheMaquinas = proposta.insumos?.detalheMaquinas || [];
                                 const totalMaquinasLocadas = detalheMaquinas
                                   .filter((item: any) => isLocado(item.descricao))
                                   .reduce((acc: number, item: any) => acc + (item.custoMensal || 0), 0);
                                 const totalMaquinasNaoLocadas = detalheMaquinas
                                   .filter((item: any) => !isLocado(item.descricao))
                                   .reduce((acc: number, item: any) => acc + (item.custoMensal || 0), 0);

                                 const applyCascata = (custo: any) => {
                                   const cD = Number(custo) || 0;
                                   const comAdm = cD * (1 + txAdm);
                                   const comLucro = comAdm * (1 + txLucro);
                                   return divisorTributos > 0 ? (comLucro / divisorTributos) : comLucro;
                                 };

                                 const maoDeObraSubtotal = resultado?.items?.reduce((acc: any, i: any) => acc + (i.precoVenda || 0), 0) || 0;
                                 const insumosSubtotal = applyCascata(
                                   Number(proposta.insumos?.materiais || 0) + 
                                   Number(isSpot ? (totalMaquinasNaoLocadas + totalMaquinasLocadas) : proposta.insumos?.maquinas || 0) + 
                                   Number(proposta.insumos?.descartaveis || 0) + 
                                   Number(isSpot ? 0 : proposta.insumos?.servicos || 0)
                                 );

                                 const renderInsumoRow = (label: string, value: number) => {
                                    const isZero = value === 0;
                                    return (
                                       <tr key={label} className={`border-b border-slate-100 ${isZero ? 'opacity-40 text-slate-400 bg-slate-50/10' : 'text-slate-700 font-bold'}`}>
                                          <td className="py-2.5 px-4 font-semibold">{label}</td>
                                          <td className={`py-2.5 px-4 text-right font-black ${isZero ? 'text-slate-300' : 'text-slate-800'}`}>
                                             {isZero ? '-' : fc(value)}
                                          </td>
                                       </tr>
                                    );
                                 };

                                 return (
                                    <div key={slideIdx} className="print-slide w-full aspect-[16/9] border border-slate-200 bg-white p-12 flex flex-col justify-between relative overflow-hidden h-[100vh]">
                                       <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30" xmlns="http://www.w3.org/2000/svg">
                                          <line x1="-100" y1="100" x2="400" y2="-400" stroke="#F1F5F9" strokeWidth="18" />
                                          <line x1="500" y1="900" x2="1200" y2="200" stroke="#F1F5F9" strokeWidth="18" />
                                       </svg>

                                       <div className="relative z-10 flex flex-col h-full justify-between">
                                          <div className="flex justify-between items-center w-full pb-4 border-b border-slate-100">
                                             <div className="flex flex-col">
                                                <h2 className="text-xl font-black text-[#1e4480] uppercase tracking-tight">{replaceTags(tituloSlide)}</h2>
                                                {subtitulo && <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mt-0.5">{replaceTags(subtitulo)}</p>}
                                             </div>
                                             <img src={companyLogo} alt="Logo" className="max-h-10 w-auto object-contain" />
                                          </div>

                                          <div className="my-auto w-full max-w-4xl mx-auto grid grid-cols-12 gap-8 items-stretch">
                                             <div className="col-span-7 bg-white rounded-2xl border border-slate-150 shadow-lg overflow-hidden flex flex-col justify-between">
                                                <table className="w-full text-left border-collapse text-[10px]">
                                                   <thead>
                                                      <tr className="bg-[#1e4480] text-white text-[10px] font-black uppercase tracking-wider border-b border-slate-200">
                                                         <th className="py-3 px-4">Grupo de Custo</th>
                                                         <th className="py-3 px-4 text-right">{isSpot ? 'Valor' : 'Valor Mensal'}</th>
                                                      </tr>
                                                   </thead>
                                                   <tbody>
                                                      <tr className="border-b border-slate-100 text-slate-700 font-bold">
                                                         <td className="py-2.5 px-4 font-black">Mão de Obra Efetiva (Postos)</td>
                                                         <td className="py-2.5 px-4 text-right font-black text-[#1e4480]">{fc(maoDeObraSubtotal)}</td>
                                                      </tr>
                                                      {renderInsumoRow('Materiais e Equipamentos', applyCascata(Number(proposta.insumos?.materiais || 0) + Number(isSpot ? totalMaquinasNaoLocadas : proposta.insumos?.maquinas || 0)))}
                                                      {renderInsumoRow('Descartáveis e Higiene', applyCascata(Number(proposta.insumos?.descartaveis || 0)))}
                                                      {renderInsumoRow(isSpot ? 'Equipamentos Locados' : 'Outros Serviços / Operações', applyCascata(Number(isSpot ? totalMaquinasLocadas : proposta.insumos?.servicos || 0)))}
                                                   </tbody>
                                                </table>
                                                
                                                <div className="bg-slate-50 border-t border-slate-150 p-3.5 flex justify-between items-center mt-auto">
                                                   <span className="text-[10px] font-black text-[#1e4480] uppercase tracking-wider">{isSpot ? 'Valor Total Proposto' : 'Valor Total Mensal Proposto'}</span>
                                                   <span className="text-base font-black text-[#1b4d3e] bg-emerald-50 border border-emerald-250 px-4 py-1 rounded-xl shadow-xs">
                                                      {fc(maoDeObraSubtotal + insumosSubtotal)}
                                                   </span>
                                                </div>
                                             </div>

                                             <div className="col-span-5 flex flex-col justify-center">
                                                <div className="bg-slate-50/70 border border-slate-150 rounded-2xl p-5 shadow-xs space-y-4">
                                                   <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                                                      <div className="w-2 h-4 bg-[#1e4480] rounded-full shrink-0"></div>
                                                      <h4 className="text-[10px] font-black text-[#1e4480] uppercase tracking-wider">Premissas do Investimento</h4>
                                                   </div>
                                                   <div className="space-y-3">
                                                      <div className="flex items-start gap-2">
                                                         <svg className="w-4 h-4 text-[#1e4480] shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                                         </svg>
                                                         <p className="text-slate-600 text-[8.5px] font-semibold leading-relaxed">Os valores propostos contemplam todos os encargos sociais, tributos (PIS, COFINS, ISS), taxas de administração e insumos descritos na proposta;</p>
                                                      </div>
                                                      <div className="flex items-start gap-2">
                                                         <svg className="w-4 h-4 text-[#1e4480] shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                                         </svg>
                                                         <p className="text-slate-600 text-[8.5px] font-semibold leading-relaxed">Faturamento mensal com vencimento a ser pactuado nas condições gerais da contratação, emitido após a prestação dos serviços.</p>
                                                      </div>
                                                   </div>
                                                </div>
                                             </div>
                                          </div>

                                          <div className="flex justify-between items-center border-t border-slate-100 pt-4 mt-auto">
                                             <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">www.smartbidhub.com.br</span>
                                             <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded font-black">{String(slideNum).padStart(2, '0')}</span>
                                          </div>
                                       </div>
                                    </div>
                                 );
                              }

                              if (layout === 'itens') {
                                 return (
                                    <div key={slideIdx} className="print-slide w-full aspect-[16/9] border border-slate-200 bg-white p-12 flex flex-col justify-between relative overflow-hidden h-[100vh]">
                                       <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30" xmlns="http://www.w3.org/2000/svg">
                                          <line x1="-100" y1="100" x2="400" y2="-400" stroke="#F1F5F9" strokeWidth="18" />
                                          <line x1="500" y1="900" x2="1200" y2="200" stroke="#F1F5F9" strokeWidth="18" />
                                       </svg>

                                       <div className="relative z-10 flex flex-col h-full justify-between">
                                          <div className="flex justify-between items-center w-full pb-4 border-b border-slate-100">
                                             <div className="flex flex-col">
                                                <h2 className="text-xl font-black text-[#1e4480] uppercase tracking-tight">{replaceTags(tituloSlide)}</h2>
                                                {subtitulo && <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mt-0.5">{replaceTags(subtitulo)}</p>}
                                             </div>
                                             <img src={companyLogo} alt="Logo" className="max-h-10 w-auto object-contain" />
                                          </div>

                                          <div className="my-auto w-full max-w-4xl mx-auto">
                                             <div className="w-full bg-white rounded-2xl border border-slate-150 shadow-lg overflow-hidden max-h-[220px] overflow-y-auto">
                                                <table className="w-full text-left border-collapse">
                                                   <thead>
                                                      <tr className="bg-[#1e4480] text-white text-[10px] font-black uppercase tracking-wider border-b border-slate-200">
                                                         <th className="px-6 py-3 w-32">Item</th>
                                                         <th className="px-6 py-3">Descrição</th>
                                                         <th className="px-6 py-3 text-center w-40">Status</th>
                                                      </tr>
                                                   </thead>
                                                   <tbody>
                                                      {(proposta.itensInclusosExcluidos || []).map((p: any, idx: number) => (
                                                         <tr key={p.id || idx} className={`border-b border-slate-100 text-[10px] font-bold text-slate-700 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/20'}`}>
                                                            <td className="px-6 py-2.5 font-black text-slate-500">{String(idx + 1).padStart(2, '0')}</td>
                                                            <td className="px-6 py-2.5 font-semibold text-slate-800 leading-normal">{p.descricao}</td>
                                                            <td className="px-6 py-2.5 text-center">
                                                               {p.incluso ? (
                                                                  <div className="w-6 h-6 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mx-auto shadow-xs">
                                                                     <svg className="w-3.5 h-3.5 stroke-[3.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path>
                                                                     </svg>
                                                                  </div>
                                                               ) : (
                                                                  <div className="w-6 h-6 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-400 mx-auto opacity-90 shadow-xs">
                                                                     <svg className="w-3 h-3 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path>
                                                                     </svg>
                                                                  </div>
                                                               )}
                                                            </td>
                                                         </tr>
                                                      ))}
                                                   </tbody>
                                                </table>
                                             </div>
                                          </div>

                                          <div className="flex justify-between items-center border-t border-slate-100 pt-4 mt-auto">
                                             <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">www.smartbidhub.com.br</span>
                                             <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded font-black">{String(slideNum).padStart(2, '0')}</span>
                                          </div>
                                       </div>
                                    </div>
                                 );
                              }

                              if (layout === 'aceite') {
                                 return (
                                    <div key={slideIdx} className="print-slide w-full aspect-[16/9] border border-slate-200 bg-[#1e4480] p-12 flex flex-col justify-between relative overflow-hidden h-[100vh] text-white">
                                       <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" xmlns="http://www.w3.org/2000/svg">
                                          <line x1="-50" y1="150" x2="350" y2="-250" stroke="#FFFFFF" strokeWidth="10" />
                                          <line x1="600" y1="800" x2="1100" y2="300" stroke="#FFFFFF" strokeWidth="10" />
                                       </svg>

                                       <div className="relative z-10 flex flex-col h-full justify-between">
                                          <div className="flex justify-between items-center w-full pb-4 border-b border-white/20">
                                             <div className="flex flex-col">
                                                <h2 className="text-xl font-black text-white uppercase tracking-tight">{replaceTags(tituloSlide)}</h2>
                                                {subtitulo && <p className="text-white/70 text-[10px] font-bold uppercase tracking-wider mt-0.5">{replaceTags(subtitulo)}</p>}
                                             </div>
                                             <img src={companyLogo} alt="Logo" className="max-h-10 w-auto object-contain" />
                                          </div>

                                          <div className="my-auto w-full max-w-4xl mx-auto grid grid-cols-12 gap-8 items-center text-white">
                                             <div className="col-span-6 space-y-4">
                                                <h3 className="text-lg font-black tracking-tight leading-snug">Estamos prontos para iniciar a nossa parceria de sucesso!</h3>
                                                <div className="text-white/80 text-[10px] leading-relaxed space-y-2 font-semibold text-justify">
                                                   <p>Ao assinar este termo de aceite, o <strong className="text-white font-extrabold">{proposta.cliente?.nomeFantasia || proposta.cliente?.razaoSocial || "Cliente Não Informado"}</strong> manifesta sua concordância com os valores descritos, premissas de investimento e condições comerciais apresentadas nesta proposta comercial.</p>
                                                   <p>Este documento servirá como base oficial para a elaboração do instrumento jurídico definitivo (Contrato de Prestação de Serviços) entre as partes.</p>
                                                </div>
                                                <div className="bg-white/5 border border-white/10 rounded-xl p-3 mt-3.5 space-y-2 text-[9px] font-semibold text-white/90">
                                                   <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                                      <div className="flex flex-col">
                                                         <span className="text-[7.5px] font-black text-white/55 uppercase tracking-wider">Razão Social</span>
                                                         <span className="truncate text-white font-bold">{proposta.cliente?.razaoSocial || proposta.cliente?.cliente || "Não informada"}</span>
                                                      </div>
                                                      <div className="flex flex-col">
                                                         <span className="text-[7.5px] font-black text-white/55 uppercase tracking-wider">CNPJ</span>
                                                         <span className="text-white font-bold">{proposta.cliente?.cnpj || "Não informado"}</span>
                                                      </div>
                                                      <div className="flex flex-col">
                                                         <span className="text-[7.5px] font-black text-white/55 uppercase tracking-wider">Data de Início</span>
                                                         <span className="text-white font-bold">{proposta.cliente?.dataInicio ? proposta.cliente.dataInicio.split(\'-\').reverse().join(\'/\') : "A definir"}</span>
                                                      </div>
                                                      <div className="flex flex-col">
                                                         <span className="text-[7.5px] font-black text-white/55 uppercase tracking-wider">Data de Vencimento</span>
                                                         <span className="text-white font-bold">{proposta.cliente?.dataVencimento ? proposta.cliente.dataVencimento.split(\'-\').reverse().join(\'/\') : "A definir"}</span>
                                                      </div>
                                                   </div>
                                                </div>
                                             </div>

                                             <div className="col-span-6 grid grid-cols-2 gap-4">
                                                <div className="bg-white/10 rounded-2xl p-5 border border-white/15 shadow-md flex flex-col justify-between h-40">
                                                   <div className="flex flex-col">
                                                      <span className="text-[10px] font-black tracking-[0.2em] uppercase text-white/90">CONTRATANTE</span>
                                                      <span className="text-[8.5px] text-white/70 font-semibold mt-1 truncate">{proposta.cliente?.nomeFantasia || proposta.cliente?.razaoSocial || "Cliente Não Informado"}</span>
                                                   </div>
                                                   <div className="border-t border-white/30 pt-3 mt-auto flex flex-col text-center">
                                                      <div className="h-6 w-full mb-1"></div>
                                                      <span className="text-[9px] font-black text-white">Assinatura / Carimbo</span>
                                                      <span className="text-[8px] text-white/50 font-bold uppercase mt-0.5">Representante Legal</span>
                                                   </div>
                                                </div>

                                                <div className="bg-white/10 rounded-2xl p-5 border border-white/15 shadow-md flex flex-col justify-between h-40">
                                                   <div className="flex flex-col">
                                                      <span className="text-[10px] font-black tracking-[0.2em] uppercase text-white/90">CONTRATADA</span>
                                                      <span className="text-[8.5px] text-white/70 font-semibold mt-1 truncate">{empresaEmissora?.razaoSocial || empresaEmissora?.nomeFantasia || "Silva Consultoria Empresarial LTDA"}</span>
                                                   </div>
                                                   <div className="border-t border-white/30 pt-3 mt-auto flex flex-col text-center">
                                                      <div className="h-6 w-full mb-1 flex items-center justify-center">
                                                         <span className="text-[8px] text-emerald-300 font-extrabold tracking-wider bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/35 uppercase select-none">Assinado Digitalmente</span>
                                                      </div>
                                                      <span className="text-[9px] font-black text-white">{proposta.cliente?.vendedorNome || "Ádamo Quadros"}</span>
                                                      <span className="text-[8px] text-white/50 font-bold uppercase mt-0.5">{proposta.cliente?.vendedorCargo || "Novos Negócios"}</span>
                                                   </div>
                                                </div>
                                             </div>
                                          </div>

                                          <div className="flex justify-between items-center border-t border-white/20 pt-4 mt-auto">
                                             <span className="text-[9px] font-bold text-white/70 uppercase tracking-widest">www.smartbidhub.com.br</span>
                                             <span className="text-[9px] font-black text-white bg-white/10 px-2.5 py-0.5 rounded font-black">{String(slideNum).padStart(2, '0')}</span>
                                          </div>
                                       </div>
                                    </div>
                                 );
                              }

                              return null;
                           })
                        ) : (
"""

content = content.replace(target_div, target_div + dynamic_block)

# Localizar o fechamento do slide 13 por índice de chaves ou comentários
# No print deck, o slide 13 é o último. O seu fechamento é o segundo </div> depois de 'SLIDE 13 PRINT'
slide13_start = content.find('SLIDE 13 PRINT')
if slide13_start == -1:
    print("SLIDE 13 PRINT not found!")
    exit(1)

idx = content.find('www.smartbidhub.com.br', slide13_start)
first_close = content.find('</div>', idx)
second_close = content.find('</div>', first_close + 6)

content = content[:second_close + 6] + '\n                        )}' + content[second_close + 6:]

with open(target_file, 'w', encoding='utf-8') as f:
    f.write(content)

print("PropostaApresentacaoPrint.tsx successfully modified programmatically!")
