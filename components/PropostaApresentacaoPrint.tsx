import React, { useState, useEffect } from 'react';
import { Box, Drill, Trash, Presentation, Award, Sparkles, Users, Trophy, Lightbulb, Wrench, Trees, HardHat, ConciergeBell, ChevronLeft, Factory, Store, Bus, Building, Hospital, ShoppingBag, GraduationCap, Share2, Clock, Smartphone, Cpu, CreditCard, User, Calendar, UserCheck, Briefcase, MapPin, ShieldCheck } from 'lucide-react';
import BrazilMap from '@/components/BrazilMap';

export default function PropostaApresentacaoPrint({ proposta, resultado, empresaEmissora }: { proposta: any, resultado?: any, empresaEmissora?: any }) {
  const [companyLogo, setCompanyLogo] = useState<string>('https://via.placeholder.com/300x80?text=Silva+Consultoria');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const cookie = document.cookie.split('; ').find(row => row.startsWith('sb_user='));
      if (cookie) {
        try {
          const parsed = JSON.parse(decodeURIComponent(cookie.split('=')[1]));
          if (parsed.tenantLogoUrl) {
            setCompanyLogo(parsed.tenantLogoUrl);
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);
  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

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
    
    replaced = replaced.replace(/\[CLIENTE_NOME\]/g, clienteNome);
    replaced = replaced.replace(/\[NUMERO_PROPOSTA\]/g, numProposta);
    replaced = replaced.replace(/\[REVISAO\]/g, revisao);
    replaced = replaced.replace(/\[OBJETO_PROPOSTA\]/g, objeto);
    replaced = replaced.replace(/\[ESCOPO_TECNICO\]/g, escopo);
    
    const divisorTributos = resultado?.divisor || 1;
    const txAdm = (proposta.premissas?.taxaAdm || 0) / 100;
    const txLucro = (proposta.premissas?.margemLucro || 0) / 100;
    const isSpot = proposta.equipe?.some((e: any) => e.tipoItem === 'SPOT');
    
    const normalizeText = (text: string) => {
      if (!text) return "";
      return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
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
    replaced = replaced.replace(/\[VALOR_TOTAL\]/g, valorTotal);
    
    return replaced;
  };
  
  // Variáveis falsas que o FPV antigo usava no slide DRE (que não usamos mais para impressão)
  const margemBrutaMensal = 0;
  const impostosValor = 0;
  const lucroLiquidoMensal = 0;
  const totalBeneficiosSubtotal = 0;
  const insumosEquipamentosTotal = 0;
  const totalSalariosEncargos = 0;
  const despesasOperacionaisFixas = 0;
  const mdoExtraMensal = 0;
  const provisaoRescisao = 0;
  const outrosCustosSubtotal = 0;
  
  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;800;900&family=Montserrat:wght@300;400;600;700;800;900&family=Inter:wght@300;400;600;700;800;900&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Roboto:wght@300;400;500;700;900&display=swap');
        .font-outfit { font-family: 'Outfit', sans-serif !important; }
        .font-montserrat { font-family: 'Montserrat', sans-serif !important; }
        .font-inter { font-family: 'Inter', sans-serif !important; }
        .font-playfair { font-family: 'Playfair Display', serif !important; }
        .font-roboto { font-family: 'Roboto', sans-serif !important; }
        
        @media print {
            @page {
                size: 297mm 167mm !important;
                margin: 0 !important;
            }
            
            * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
            }

            body {
                margin: 0 !important;
                padding: 0 !important;
                background: white !important;
            }

            body * {
                visibility: hidden !important;
            }

            .print-slide-deck, .print-slide-deck * {
                visibility: visible !important;
            }

            .print-slide-deck {
                display: block !important;
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 297mm !important;
                height: auto !important;
                background: transparent !important;
                margin: 0 !important;
                padding: 0 !important;
                border: none !important;
            }

            .print-slide {
                display: flex !important;
                page-break-after: always !important;
                break-after: page !important;
                page-break-inside: avoid !important;
                break-inside: avoid !important;
                width: 297mm !important;
                height: 167mm !important;
                max-height: 167mm !important;
                box-sizing: border-box !important;
                margin: 0 !important;
                padding: 2.5rem 3.5rem !important;
                position: relative !important;
                overflow: hidden !important;
                border: none !important;
            }

            .print-slide-deck .text-[7.5px] { font-size: 16px !important; line-height: 22px !important; }
            .print-slide-deck .text-[8px] { font-size: 17px !important; line-height: 23px !important; }
            .print-slide-deck .text-[8.5px] { font-size: 18px !important; line-height: 24px !important; }
            .print-slide-deck .text-[9px] { font-size: 19px !important; line-height: 25px !important; }
            .print-slide-deck .text-[9.5px] { font-size: 20px !important; line-height: 26px !important; }
            .print-slide-deck .text-[10px] { font-size: 21px !important; line-height: 27px !important; }
            .print-slide-deck .text-[11px] { font-size: 22px !important; line-height: 28px !important; }
            .print-slide-deck .text-[12px] { font-size: 23px !important; line-height: 29px !important; }
            .print-slide-deck .text-[13px] { font-size: 24px !important; line-height: 30px !important; }
            .print-slide-deck .text-[14px] { font-size: 25px !important; line-height: 31px !important; }
            .print-slide-deck .text-[15px] { font-size: 26px !important; line-height: 32px !important; }
            
            .print-slide-deck .text-xs { font-size: 21px !important; line-height: 28px !important; }
            .print-slide-deck .text-sm { font-size: 24px !important; line-height: 32px !important; }
            .print-slide-deck .text-base { font-size: 28px !important; line-height: 38px !important; }
            .print-slide-deck .text-lg { font-size: 32px !important; line-height: 42px !important; }
            .print-slide-deck .text-xl { font-size: 36px !important; line-height: 46px !important; }
            .print-slide-deck .text-2xl { font-size: 42px !important; line-height: 52px !important; }
            .print-slide-deck .text-3xl { font-size: 50px !important; line-height: 60px !important; }
            .print-slide-deck .text-4xl { font-size: 64px !important; line-height: 76px !important; }
            .print-slide-deck .text-5xl { font-size: 78px !important; line-height: 90px !important; }

            .print-slide-deck .p-16 { padding: 2.5rem 3.5rem !important; }
            .print-slide-deck .p-8 { padding: 1.5rem 2rem !important; }
            .print-slide-deck .p-6 { padding: 1rem 1.5rem !important; }
            .print-slide-deck .gap-8 { gap: 2rem !important; }
            .print-slide-deck .gap-6 { gap: 1.5rem !important; }

            .print-slide-deck .w-10 { width: 4rem !important; height: 4rem !important; }
            .print-slide-deck .h-10 { height: 4rem !important; }
            .print-slide-deck .w-12 { width: 5rem !important; height: 5rem !important; }
            .print-slide-deck .h-12 { height: 5rem !important; }
            
            .print-slide-deck svg[viewBox="0 0 24 24"] { 
                width: 2.2rem !important; 
                height: 2.2rem !important; 
                stroke-width: 2.5 !important;
            }

            .print-slide-deck .gap-1.5 { gap: 2rem !important; }
            .print-slide-deck .max-w-\[65px\] { max-width: 130px !important; }
            .print-slide-deck .max-w-\[80px\] { max-width: 160px !important; }
            .print-slide-deck .max-w-\[90px\] { max-width: 170px !important; }
            .print-slide-deck .max-w-\[100px\] { max-width: 190px !important; }

            .print-slide-deck table th, 
            .print-slide-deck table td {
                padding: 0.75rem 1rem !important;
            }
        }
      `}} />
      <div className="print-slide-deck hidden print:block">
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
                              
                              const align = slideData.align || 'left';
                              const fontFamily = slideData.fontFamily || 'Outfit';
                              const titleColor = slideData.titleColor || '';
                              const textColor = slideData.textColor || '';
                              const bgColor = slideData.bgColor || '#ffffff';
                              const coverStyle = slideData.coverStyle || 'full';
                              const badgeText = slideData.badgeText || '';
                              const badgeColor = slideData.badgeColor || '#ef4444';
                              const sideImage = slideData.sideImage || '';
                              const sideImage2 = slideData.sideImage2 || '';
                              const servicosStyle = slideData.servicosStyle || 'simple';
                              const slideNum = slideIdx + 1;

                              // Stats controls
                              const stat1_num = slideData.stat1_num || '+$2M';
                              const stat1_text = slideData.stat1_text || 'Investidos em tecnologia, segurança e qualidade dos nossos serviços entregues.';
                              const stat2_num = slideData.stat2_num || '+10M';
                              const stat2_text = slideData.stat2_text || 'Novos empregos gerados a partir das nossas implementações.';
                              const stat3_num = slideData.stat3_num || '+330';
                              const stat3_text = slideData.stat3_text || 'Clientes que são beneficiados pelos nossos serviços de forma direta.';
                              const stat4_num = slideData.stat4_num || '82%';
                              const stat4_text = slideData.stat4_text || 'De redução em custos operacionais, graças à qualidade e ao controle dos nossos processos.';

                              // Values controls
                              const val1_title = slideData.val1_title || 'Compromisso com a Qualidade';
                              const val1_text = slideData.val1_text || 'Entregamos serviços com excelência, priorizando a segurança, a padronização e a eficiência operacional em cada detalhe.';
                              const val2_title = slideData.val2_title || 'Valorização do relacionamento';
                              const val2_text = slideData.val2_text || 'Valorizamos as pessoas por trás dos processos — nossos colaboradores, clientes e parceiros. Acreditamos que relações duradouras se constroem com respeito, transparência e empatia em todas as interações.';
                              const val3_title = slideData.val3_title || 'Evolução Contínua';
                              const val3_text = slideData.val3_text || 'Buscamos sempre melhorar. Investimos em inovação, capacitação e tecnologia para oferecer soluções cada vez mais modernas, ágeis e alinhadas às necessidades do mercado.';

                              // Founders controls
                              const f1_name = slideData.f1_name || 'Ádamo Quadros';
                              const f1_role = slideData.f1_role || 'Chief Executive Officer (CEO)';
                              const f1_photo = slideData.f1_photo || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=300';
                              const f2_name = slideData.f2_name || 'Guilherme França';
                              const f2_role = slideData.f2_role || 'Chief Product Officer (CPO)';
                              const f2_photo = slideData.f2_photo || 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=300';
                              const f3_name = slideData.f3_name || 'Giovanna Castro';
                              const f3_role = slideData.f3_role || 'Chief Technology Officer (CTO)';
                              const f3_photo = slideData.f3_photo || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=300';

                              // Styling maps
                              const fontClass = fontFamily === 'Outfit' ? 'font-outfit' : 
                                                fontFamily === 'Montserrat' ? 'font-montserrat' : 
                                                fontFamily === 'Inter' ? 'font-inter' : 
                                                fontFamily === 'Playfair' ? 'font-playfair' : 'font-roboto';

                              const baseStyle: any = {
                                 fontFamily: fontFamily === 'Outfit' ? 'Outfit, sans-serif' : 
                                             fontFamily === 'Montserrat' ? 'Montserrat, sans-serif' : 
                                             fontFamily === 'Inter' ? 'Inter, sans-serif' : 
                                             fontFamily === 'Playfair' ? 'Playfair Display, serif' : 'Roboto, sans-serif',
                                 textAlign: align,
                                 color: textColor || undefined
                              };

                              if (layout === 'cobertura') {
                                 if (coverStyle === 'provelo_split') {
                                    const finalSideImage = sideImage || "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=1200";
                                    return (
                                       <div key={slideIdx} className={`print-slide w-full aspect-[16/9] border border-slate-200 p-16 flex flex-col justify-between relative overflow-hidden h-[100vh] text-slate-800 bg-white select-none ${fontClass}`} style={{ ...baseStyle, backgroundColor: bgColor }}>
                                          {/* Faixa Vermelha Vertical à Esquerda */}
                                          <div className="absolute left-0 top-0 bottom-0 w-4 bg-[#ef4444] rounded-r-2xl"></div>
                                          {/* Forma Rosa Superior Direita */}
                                          <div className="absolute right-[33%] top-10 w-24 h-40 bg-rose-100/60 rounded-[40px] transform rotate-[15deg] pointer-events-none"></div>
                                          {/* Forma Rosa Inferior */}
                                          <div className="absolute right-[38%] bottom-6 w-28 h-28 border-8 border-rose-100/60 rounded-full pointer-events-none"></div>

                                          <div className="relative z-20 flex flex-col justify-between h-full w-full">
                                             <div className="flex justify-between items-center w-full pb-4 border-b border-slate-100">
                                                <div className="flex items-center gap-3">
                                                   <img 
                                                      src={companyLogo} 
                                                      alt="Logo" 
                                                      className="max-h-12 w-auto object-contain"
                                                   />
                                                   <span className="text-[10px] font-black tracking-[0.3em] text-slate-400">FACILITIES</span>
                                                </div>
                                             </div>

                                             <div className="grid grid-cols-12 gap-8 my-auto items-center">
                                                <div className="col-span-7 flex flex-col space-y-4 text-left">
                                                   <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#ef4444] block">MODELO DE PROPOSTA</span>
                                                   <h2 className="text-5xl font-black uppercase leading-none tracking-tight text-slate-900" style={{ color: titleColor || undefined }}>{replaceTags(tituloSlide)}</h2>
                                                   <p className="text-[11px] font-bold text-slate-500 leading-relaxed max-w-lg">{replaceTags(subtitulo)}</p>
                                                   
                                                   <div className="text-[10px] text-slate-600 font-bold space-y-0.5 pt-2">
                                                      <div className="text-slate-400 font-black tracking-widest text-[8px] uppercase">Cliente</div>
                                                      <div className="text-slate-950 font-black text-[12px]">{proposta.cliente?.nomeFantasia || proposta.cliente?.razaoSocial || "Empresa XPTO"}</div>
                                                      <div>Nº Proposta: <span className="font-extrabold text-slate-800">{proposta.cliente?.numeroProposta || `FPV-${String(proposta.numero || 'XXX').padStart(3, '0')}`}</span> | Revisão: <span className="font-extrabold text-slate-800">{proposta.cliente?.revisao || "R01"}</span></div>
                                                   </div>

                                                   {badgeText && (
                                                      <div className="pt-2">
                                                         <span className="text-[10px] font-black text-white px-6 py-2 rounded-full shadow-md select-none inline-block uppercase tracking-wider" style={{ backgroundColor: badgeColor }}>
                                                            {badgeText}
                                                         </span>
                                                      </div>
                                                   )}
                                                </div>

                                                <div className="col-span-5 h-full relative flex items-center justify-end overflow-hidden">
                                                   <div className="w-[85%] h-[240px] rounded-l-[120px] overflow-hidden border-4 border-slate-100/50 shadow-2xl relative">
                                                      <img 
                                                         src={finalSideImage} 
                                                         alt="Capa Apresentação" 
                                                         className="w-full h-full object-cover"
                                                      />
                                                   </div>
                                                </div>
                                             </div>

                                             <div className="pt-4 border-t border-slate-100 flex justify-between items-center w-full text-[9px] font-extrabold text-slate-400">
                                                <div className="flex gap-8">
                                                   <div className="flex items-center gap-2">
                                                      <div className="w-5 h-5 rounded-full bg-[#ef4444] text-white flex items-center justify-center text-[7px] font-black shadow-sm">✉</div>
                                                      <span className="text-slate-600">contato@provelo.com.br</span>
                                                   </div>
                                                   <div className="flex items-center gap-2">
                                                      <div className="w-5 h-5 rounded-full bg-[#ef4444] text-white flex items-center justify-center text-[7px] font-black shadow-sm">🌐</div>
                                                      <span className="text-slate-600">www.provelo.com.br</span>
                                                   </div>
                                                </div>
                                                <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded">{String(slideNum).padStart(2, '0')}</span>
                                             </div>
                                          </div>
                                       </div>
                                    );
                                 } else {
                                    const finalBgImage = bgImage || "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=1200";
                                    return (
                                       <div key={slideIdx} className={`print-slide w-full aspect-[16/9] border border-slate-200 bg-[#020617] p-16 flex flex-col justify-between relative overflow-hidden h-[100vh] text-white ${fontClass}`} style={baseStyle}>
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
                                                <div className="space-y-1 text-left">
                                                   <div>Cliente: <strong className="text-white">{proposta.cliente?.nomeFantasia || proposta.cliente?.razaoSocial || "Nome do Cliente"}</strong></div>
                                                   <div>Nº Proposta: <strong className="text-white">{proposta.cliente?.numeroProposta || `FPV-${String(proposta.numero || 'XXX').padStart(3, '0')}`}</strong></div>
                                                </div>
                                                <div className="space-y-1 text-left">
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
                              }

                              if (layout === 'quem_somos') {
                                 const finalSideImage = sideImage || "https://images.unsplash.com/photo-1606857521015-7f9fcf423740?q=80&w=500";
                                 const finalSideImage2 = sideImage2 || "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=500";
                                 const finalBg = bgImage || "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1000";
                                 
                                 return (
                                    <div key={slideIdx} className={`print-slide w-full aspect-[16/9] border border-slate-200 z-10 overflow-hidden bg-slate-900 select-none text-white h-[100vh] grid grid-cols-12 ${fontClass}`} style={baseStyle}>
                                       {/* Faixa Vermelha Vertical à Esquerda */}
                                       <div className="absolute left-0 top-0 bottom-0 w-4 bg-[#ef4444] rounded-r-2xl z-30"></div>
                                       
                                       <div className="col-span-5 bg-[#ef4444] p-16 flex flex-col justify-center space-y-6 z-20 pl-20 relative text-left">
                                          <h2 className="text-5xl font-black uppercase tracking-tight text-white leading-none" style={{ color: titleColor || undefined }}>{replaceTags(tituloSlide)}</h2>
                                          <p className="text-[11px] font-semibold leading-relaxed text-white/95 whitespace-pre-line text-justify">{replaceTags(conteudo)}</p>
                                          <div className="absolute bottom-6 left-20 text-[8px] font-bold text-white/50 tracking-widest">PROVELO SERVIÇOS</div>
                                       </div>

                                       <div className="col-span-7 h-full relative flex items-center justify-center p-12 z-10">
                                          <img 
                                             src={finalBg} 
                                             alt="Office Facade" 
                                             className="absolute inset-0 w-full h-full object-cover opacity-15 filter grayscale"
                                          />
                                          <div className="absolute inset-0 bg-slate-950/40"></div>

                                          <div className="relative z-20 flex gap-8 w-full max-w-xl justify-center items-center">
                                             <div className="w-1/2 aspect-[3/4] rounded-3xl overflow-hidden border-[6px] border-[#ef4444] shadow-2xl">
                                                <img src={finalSideImage} alt="Workspace 1" className="w-full h-full object-cover" />
                                             </div>
                                             <div className="w-1/2 aspect-[3/4] rounded-3xl overflow-hidden border-[6px] border-[#ef4444] shadow-2xl mt-12">
                                                <img src={finalSideImage2} alt="Workspace 2" className="w-full h-full object-cover" />
                                             </div>
                                          </div>
                                       </div>
                                    </div>
                                 );
                              }

                              if (layout === 'agradecimento') {
                                 return (
                                    <div key={slideIdx} className={`print-slide w-full aspect-[16/9] border border-slate-200 bg-white p-16 flex flex-col justify-between relative overflow-hidden h-[100vh] ${fontClass}`} style={{ ...baseStyle, backgroundColor: bgColor }}>
                                       <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40" xmlns="http://www.w3.org/2000/svg">
                                          <line x1="-50" y1="150" x2="350" y2="-250" stroke="#E2E8F0" strokeWidth="10" />
                                          <line x1="-50" y1="200" x2="400" y2="-250" stroke="#E2E8F0" strokeWidth="6" />
                                          <line x1="-50" y1="250" x2="450" y2="-250" stroke="#E2E8F0" strokeWidth="3" />
                                          <line x1="600" y1="800" x2="1100" y2="300" stroke="#E2E8F0" strokeWidth="10" />
                                          <line x1="650" y1="800" x2="1150" y2="300" stroke="#E2E8F0" strokeWidth="6" />
                                          <line x1="700" y1="800" x2="1200" y2="300" stroke="#E2E8F0" strokeWidth="3" />
                                       </svg>

                                       <div className="grid grid-cols-12 gap-8 items-center h-full relative z-10">
                                          <div className="col-span-8 flex flex-col justify-center space-y-5 pr-4 text-left">
                                             <h2 className="text-3xl font-black text-[#1E3A8A] tracking-tight leading-none uppercase" style={{ color: titleColor || undefined }}>
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
                                 if (coverStyle === 'provelo_split') {
                                    const finalSideImage = sideImage || "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=600";
                                    return (
                                       <div key={slideIdx} className={`print-slide w-full aspect-[16/9] border border-slate-200 p-16 flex flex-col justify-between relative overflow-hidden h-[100vh] text-slate-800 bg-white select-none ${fontClass}`} style={{ ...baseStyle, backgroundColor: bgColor }}>
                                          <div className="absolute left-0 top-0 bottom-0 w-4 bg-[#ef4444] rounded-r-2xl z-30"></div>
                                          
                                          <div className="relative z-20 flex flex-col justify-between h-full w-full">
                                             <div className="grid grid-cols-12 gap-8 my-auto items-center">
                                                <div className="col-span-7 flex flex-col space-y-4 text-left pl-6">
                                                   <h2 className="text-4xl font-black uppercase text-slate-900 tracking-tight leading-none mb-4" style={{ color: titleColor || undefined }}>{replaceTags(tituloSlide)}</h2>
                                                   
                                                   <div className="space-y-4">
                                                      <div className="space-y-1">
                                                         <h4 className="text-[12px] font-black text-[#ef4444] uppercase tracking-wide">{val1_title}</h4>
                                                         <p className="text-[9.5px] font-semibold leading-relaxed text-slate-500">{val1_text}</p>
                                                      </div>
                                                      <div className="space-y-1">
                                                         <h4 className="text-[12px] font-black text-[#ef4444] uppercase tracking-wide">{val2_title}</h4>
                                                         <p className="text-[9.5px] font-semibold leading-relaxed text-slate-500">{val2_text}</p>
                                                      </div>
                                                      <div className="space-y-1">
                                                         <h4 className="text-[12px] font-black text-[#ef4444] uppercase tracking-wide">{val3_title}</h4>
                                                         <p className="text-[9.5px] font-semibold leading-relaxed text-slate-500">{val3_text}</p>
                                                      </div>
                                                   </div>
                                                </div>

                                                <div className="col-span-5 h-[240px] relative flex items-center justify-end overflow-hidden">
                                                   <div className="absolute right-0 bottom-0 top-0 w-[45%] bg-[#ef4444] rounded-l-[100px] z-10"></div>
                                                   <div className="w-[85%] h-[95%] rounded-l-[120px] overflow-hidden border-4 border-slate-100/50 shadow-2xl relative z-20 mr-4">
                                                      <img 
                                                         src={finalSideImage} 
                                                         alt="Values Image" 
                                                         className="w-full h-full object-cover"
                                                      />
                                                   </div>
                                                </div>
                                             </div>

                                             <div className="pt-4 border-t border-slate-100 flex justify-between items-center w-full text-[9px] font-extrabold text-slate-400 pl-6">
                                                <span>www.smartbidhub.com.br</span>
                                                <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded">{String(slideNum).padStart(2, '0')}</span>
                                             </div>
                                          </div>
                                       </div>
                                    );
                                 } else {
                                    return (
                                       <div key={slideIdx} className={`print-slide w-full aspect-[16/9] border border-slate-200 bg-white p-16 flex flex-col justify-between relative overflow-hidden h-[100vh] ${fontClass}`} style={{ ...baseStyle, backgroundColor: bgColor }}>
                                          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40" xmlns="http://www.w3.org/2000/svg">
                                             <line x1="-50" y1="150" x2="350" y2="-250" stroke="#E2E8F0" strokeWidth="10" />
                                             <line x1="-50" y1="200" x2="400" y2="-250" stroke="#E2E8F0" strokeWidth="6" />
                                             <line x1="-50" y1="250" x2="450" y2="-250" stroke="#E2E8F0" strokeWidth="3" />
                                             <line x1="600" y1="800" x2="1100" y2="300" stroke="#E2E8F0" strokeWidth="10" />
                                             <line x1="650" y1="800" x2="1150" y2="300" stroke="#E2E8F0" strokeWidth="6" />
                                             <line x1="700" y1="800" x2="1200" y2="300" stroke="#E2E8F0" strokeWidth="3" />
                                          </svg>
                                          
                                          <div className="grid grid-cols-12 gap-8 items-center h-[calc(100%-40px)] relative z-10">
                                             <div className="col-span-7 flex flex-col justify-center space-y-4 pl-2 h-full text-left">
                                                <div>
                                                   <h2 className="text-4xl font-black text-[#1E3A8A] tracking-tight leading-none uppercase" style={{ color: titleColor || undefined }}>
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
                                             <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded">{String(currentSlide).padStart(2, '0')}</span>
                                          </div>
                                       </div>
                                    );
                                 }
                              }

                              if (layout === 'performance') {
                                 const finalSideImage = sideImage || "https://images.unsplash.com/photo-1542362567-b07eac79094d?q=80&w=600";
                                 const val1_title = slideData.val1_title || "29 MIL HORAS DE SERVIÇO";
                                 const val1_text = slideData.val1_text || "Em 2022, movimentamos mais de 29 mil horas de serviços prestados em contratos ativos, comprovando nossa capacidade de atuação em larga escala com controle e eficiência.";
                                 const val2_title = slideData.val2_title || "1.220 VISITAS TÉCNICAS";
                                 const val2_text = slideData.val2_text || "No mesmo ano, realizamos mais de 1.220 atendimentos e visitas técnicas, sempre com equipes treinadas, processos padronizados e foco na satisfação do cliente.";
                                 
                                 return (
                                    <div key={slideIdx} className={`print-slide w-full aspect-[16/9] border border-slate-200 p-16 flex flex-col justify-between relative overflow-hidden h-[100vh] bg-[#fafafa] select-none text-slate-800 animate-fadeIn ${fontClass}`} style={baseStyle}>
                                       <div className="absolute left-0 top-0 bottom-0 w-4 bg-[#ef4444] rounded-r-2xl z-30"></div>
                                       
                                       <div className="grid grid-cols-12 gap-8 my-auto items-center h-full w-full text-left pl-6">
                                          <div className="col-span-5 flex flex-col justify-between h-full pr-4 relative">
                                             <div className="space-y-3">
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block">NOSSA PERFORMANCE</span>
                                                <h2 className="text-4xl font-black uppercase text-slate-900 tracking-tight leading-none" style={{ color: titleColor || undefined }}>{replaceTags(tituloSlide)}</h2>
                                                <p className="text-[9px] font-bold text-slate-500 leading-normal text-justify">{replaceTags(subtitulo)}</p>
                                             </div>

                                             <div className="w-full aspect-[16/10] rounded-2xl overflow-hidden shadow-md border-2 border-white mt-4">
                                                <img src={finalSideImage} alt="Performance Building" className="w-full h-full object-cover" />
                                             </div>
                                          </div>

                                          <div className="col-span-7 flex flex-col justify-center space-y-6 pl-6">
                                             <div className="flex items-center gap-6">
                                                <div className="bg-[#ef4444] text-white w-44 py-4 rounded-3xl flex flex-col items-center justify-center shadow-lg shrink-0 text-center px-4">
                                                   <span className="text-lg font-black leading-tight tracking-tight uppercase">{val1_title.split(' ')[0]} {val1_title.split(' ')[1]}</span>
                                                   <span className="text-[7.5px] font-black tracking-widest text-white/80 uppercase mt-0.5">{val1_title.split(' ').slice(2).join(' ')}</span>
                                                </div>
                                                <p className="text-[9.5px] font-semibold leading-relaxed text-slate-500">{val1_text}</p>
                                             </div>

                                             <div className="flex items-center gap-6">
                                                <div className="bg-[#ef4444] text-white w-44 py-4 rounded-3xl flex flex-col items-center justify-center shadow-lg shrink-0 text-center px-4">
                                                   <span className="text-lg font-black leading-tight tracking-tight uppercase">{val2_title.split(' ')[0]} {val2_title.split(' ')[1]}</span>
                                                   <span className="text-[7.5px] font-black tracking-widest text-white/80 uppercase mt-0.5">{val2_title.split(' ').slice(2).join(' ')}</span>
                                                </div>
                                                <p className="text-[9.5px] font-semibold leading-relaxed text-slate-500">{val2_text}</p>
                                             </div>

                                             <div className="pt-4 border-t border-slate-200 flex justify-between items-center w-full mt-4">
                                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">www.smartbidhub.com.br</span>
                                                <span className="text-[8px] font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{String(slideNum).padStart(2, '0')}</span>
                                             </div>
                                          </div>
                                       </div>
                                    </div>
                                 );
                              }

                              if (layout === 'servicos') {
                                 if (servicosStyle === 'provelo_grid') {
                                    return (
                                       <div key={slideIdx} className={`print-slide w-full aspect-[16/9] border border-slate-200 p-16 flex flex-col justify-between relative overflow-hidden h-[100vh] bg-[#fafafa] select-none text-slate-800 animate-fadeIn ${fontClass}`} style={baseStyle}>
                                          <div className="absolute left-0 top-0 bottom-0 w-4 bg-[#ef4444] rounded-r-2xl z-30"></div>
                                          
                                          <div className="relative z-20 grid grid-cols-12 gap-8 my-auto items-center h-full w-full text-left pl-6">
                                             <div className="col-span-4 flex flex-col justify-center h-full pr-4">
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#ef4444] block">NOSSOS SERVIÇOS</span>
                                                <h2 className="text-4xl font-black uppercase text-slate-900 tracking-tight leading-none mb-4" style={{ color: titleColor || undefined }}>{replaceTags(tituloSlide)}</h2>
                                                <p className="text-[9.5px] font-bold text-slate-500 leading-relaxed text-justify">{replaceTags(subtitulo || conteudo)}</p>
                                                <img src={companyLogo} alt="Logo" className="max-h-8 w-auto object-contain mt-8 self-start" />
                                             </div>

                                             <div className="col-span-8 grid grid-cols-3 gap-6 items-center py-2">
                                                {[
                                                   { label: "LIMPEZA", img: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=200" },
                                                   { label: "SEGURANÇA", img: "https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?q=80&w=200" },
                                                   { label: "COPEIRA", img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200" },
                                                   { label: "MANUTENÇÃO", img: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=200" },
                                                   { label: "RECEPÇÃO", img: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=200" },
                                                   { label: "PORTARIA", img: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=200" }
                                                ].map((serv, sIdx) => (
                                                   <div key={sIdx} className="bg-white rounded-[24px] border border-slate-200/50 shadow-md p-2 text-center flex flex-col items-center justify-between hover:scale-105 transition-all duration-300 transform aspect-[4/5] overflow-hidden">
                                                      <div className="w-full h-[70%] rounded-[20px] overflow-hidden mb-2">
                                                         <img src={serv.img} alt={serv.label} className="w-full h-full object-cover" />
                                                      </div>
                                                      <span className="text-[7.5px] font-black text-white bg-[#ef4444] px-4 py-1.5 rounded-full uppercase tracking-wider block mb-1 shadow-sm w-[90%] truncate">
                                                         {serv.label}
                                                      </span>
                                                   </div>
                                                ))}
                                             </div>
                                          </div>
                                       </div>
                                    );
                                 } else {
                                    return (
                                       <div key={slideIdx} className={`print-slide w-full aspect-[16/9] border border-slate-200 bg-white p-16 flex flex-col justify-between relative overflow-hidden h-[100vh] ${fontClass}`} style={{ ...baseStyle, backgroundColor: bgColor }}>
                                          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-50" xmlns="http://www.w3.org/2000/svg">
                                             <line x1="-100" y1="100" x2="400" y2="-400" stroke="#F1F5F9" strokeWidth="18" />
                                             <line x1="-100" y1="150" x2="450" y2="-400" stroke="#F1F5F9" strokeWidth="12" />
                                             <line x1="-100" y1="200" x2="500" y2="-400" stroke="#F1F5F9" strokeWidth="6" />
                                             <line x1="-100" y1="250" x2="550" y2="-400" stroke="#F1F5F9" strokeWidth="3" />
                                             <line x1="500" y1="900" x2="1200" y2="200" stroke="#F1F5F9" strokeWidth="18" />
                                             <line x1="550" y1="900" x2="1250" y2="200" stroke="#F1F5F9" strokeWidth="12" />
                                          </svg>
                                          
                                          <div className="relative z-10 flex flex-col h-[calc(100%-30px)] justify-between text-left">
                                             <div>
                                                <h2 className="text-3xl font-black text-[#1e4480] uppercase tracking-tight leading-none mb-2" style={{ color: titleColor || undefined }}>
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
                                             <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded">{String(currentSlide).padStart(2, '0')}</span>
                                          </div>
                                       </div>
                                    );
                                 }
                              }

                              if (layout === 'atuacao') {
                                 return (
                                    <div key={slideIdx} className={`print-slide w-full aspect-[16/9] border border-slate-200 p-16 flex flex-col justify-between relative overflow-hidden h-[100vh] bg-white select-none text-slate-800 ${fontClass}`} style={baseStyle}>
                                       <div className="absolute left-0 top-0 bottom-0 w-4 bg-[#ef4444] rounded-r-2xl z-30"></div>
                                       
                                       <div className="relative z-20 grid grid-cols-12 gap-8 my-auto items-center h-full w-full text-left pl-6">
                                          <div className="col-span-6 flex flex-col justify-between h-full pr-8">
                                             <div className="space-y-2">
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#ef4444] block">ATUAÇÃO NACIONAL</span>
                                                <h2 className="text-4xl font-black uppercase text-slate-900 tracking-tight leading-none" style={{ color: titleColor || undefined }}>{replaceTags(tituloSlide)}</h2>
                                                <p className="text-[9.5px] font-semibold leading-relaxed text-slate-500 text-justify">{replaceTags(subtitulo || conteudo)}</p>
                                             </div>

                                             <div className="space-y-2.5 my-auto pt-4">
                                                {[
                                                   { num: stat1_num, text: stat1_text },
                                                   { num: stat2_num, text: stat2_text },
                                                   { num: stat3_num, text: stat3_text },
                                                   { num: stat4_num, text: stat4_text }
                                                ].map((st, sIdx) => (
                                                   <div key={sIdx} className="bg-[#ef4444] text-white px-5 py-2.5 rounded-2xl flex items-center gap-4 shadow-md w-full border border-white/10">
                                                      <span className="text-xl font-black tracking-tighter w-20 shrink-0 text-center border-r border-white/20 pr-4">{st.num}</span>
                                                      <span className="text-[8px] font-bold text-white/90 leading-tight text-left">{st.text}</span>
                                                   </div>
                                                ))}
                                             </div>

                                             <div className="flex justify-between items-center border-t border-slate-100 pt-3">
                                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">www.smartbidhub.com.br</span>
                                                <span className="text-[8px] font-black text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded">{String(slideNum).padStart(2, '0')}</span>
                                             </div>
                                          </div>

                                          <div className="col-span-6 h-full relative flex items-center justify-center p-4 z-20">
                                             <div className="absolute right-0 bottom-0 top-0 w-[45%] bg-[#ef4444] rounded-l-[100px] z-10"></div>
                                             
                                             <div className="w-[85%] h-[240px] bg-[#fafafa]/80 rounded-[40px] border border-slate-200/50 shadow-2xl p-6 relative z-20 flex flex-col justify-center items-center">
                                                <div className="flex items-center gap-2 bg-white px-4 py-1.5 rounded-full border border-slate-200 shadow-sm mb-4 self-center">
                                                   <img src={companyLogo} alt="Logo" className="max-h-5 w-auto object-contain" />
                                                   <span className="text-[8px] font-black text-slate-800">SERVICES</span>
                                                </div>
                                                <div className="w-full h-[80%] flex items-center justify-center relative">
                                                   <BrazilMap highlightedStates={['SP', 'RJ', 'MG', 'PR']} className="w-full h-full text-[#ef4444]" />
                                                </div>
                                             </div>
                                          </div>
                                       </div>
                                    </div>
                                 );
                              }

                              if (layout === 'gestao') {
                                 const finalSideImage = sideImage || "https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=800";
                                 return (
                                    <div key={slideIdx} className={`print-slide w-full aspect-[16/9] border border-slate-200 p-16 flex flex-col justify-between relative overflow-hidden h-[100vh] bg-white select-none text-slate-800 ${fontClass}`} style={baseStyle}>
                                       <div className="absolute left-0 top-0 bottom-0 w-4 bg-[#ef4444] rounded-r-2xl z-30"></div>
                                       <div className="absolute right-0 top-0 bottom-0 w-4 bg-[#ef4444] rounded-l-2xl z-30"></div>

                                       <div className="relative z-20 grid grid-cols-12 gap-8 my-auto items-center h-full w-full text-left pl-6 pr-6">
                                          <div className="col-span-7 flex flex-col justify-between h-full pr-8">
                                             <div className="space-y-4 my-auto">
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#ef4444] block">TECNOLOGIA OPERACIONAL</span>
                                                <h2 className="text-4xl font-black uppercase text-slate-900 tracking-tight leading-none" style={{ color: titleColor || undefined }}>{replaceTags(tituloSlide)}</h2>
                                                <p className="text-[9.5px] font-semibold leading-relaxed text-slate-500 text-justify mb-4">{replaceTags(subtitulo)}</p>

                                                <ul className="space-y-2.5 text-[9.5px] font-bold text-slate-600 pl-1">
                                                   {conteudo.split('
').map((bullet, bIdx) => (
                                                      <li key={bIdx} className="flex items-start gap-2.5">
                                                         <span className="w-4 h-4 rounded-full bg-[#ef4444] text-white flex items-center justify-center text-[7px] font-black shrink-0 mt-0.5 shadow-sm">✓</span>
                                                         <span className="leading-snug">{replaceTags(bullet)}</span>
                                                      </li>
                                                   ))}
                                                </ul>
                                             </div>

                                             <div className="flex justify-between items-center border-t border-slate-100 pt-3">
                                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">www.smartbidhub.com.br</span>
                                                <span className="text-[8px] font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{String(slideNum).padStart(2, '0')}</span>
                                             </div>
                                          </div>

                                          <div className="col-span-5 h-[240px] relative flex items-center justify-center p-4">
                                             <div className="w-full relative shadow-2xl rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 p-2 transform hover:rotate-[-1deg]">
                                                <div className="w-full aspect-[16/10] bg-white rounded-lg overflow-hidden relative shadow-inner border border-slate-350">
                                                   <img src={finalSideImage} alt="Dashboard Screen" className="w-full h-full object-cover" />
                                                </div>
                                                <div className="w-full h-2.5 bg-slate-800 mt-1.5 rounded-b-xl border-t border-slate-700"></div>
                                             </div>
                                          </div>
                                       </div>
                                    </div>
                                 );
                              }

                              if (layout === 'fundadores') {
                                 return (
                                    <div key={slideIdx} className={`print-slide w-full aspect-[16/9] border border-slate-200 z-10 overflow-hidden bg-white select-none text-slate-800 h-[100vh] flex flex-col justify-between ${fontClass}`} style={baseStyle}>
                                       <div className="absolute left-0 top-0 bottom-0 w-4 bg-[#ef4444] rounded-r-2xl z-30"></div>
                                       <div className="absolute right-0 top-0 bottom-0 w-4 bg-[#ef4444] rounded-l-2xl z-30"></div>

                                       <div className="h-[45%] flex flex-col justify-center items-center text-center px-16 pl-20 pr-20 pt-8 z-20">
                                          <span className="text-[9px] font-black uppercase tracking-[0.25em] text-[#ef4444] block mb-1">CONHEÇA NOSSOS</span>
                                          <h2 className="text-4xl font-black uppercase text-slate-900 tracking-tight leading-none mb-3" style={{ color: titleColor || undefined }}>{replaceTags(tituloSlide)}</h2>
                                          <p className="text-[10px] font-bold text-slate-500 max-w-xl leading-normal">{replaceTags(subtitulo || conteudo)}</p>
                                       </div>

                                       <div className="h-[55%] bg-[#ef4444] relative flex items-center justify-around px-16 pl-20 pr-20 z-20 border-t-4 border-white shadow-inner">
                                          {[
                                             { name: f1_name, role: f1_role, img: f1_photo },
                                             { name: f2_name, role: f2_role, img: f2_photo },
                                             { name: f3_name, role: f3_role, img: f3_photo }
                                          ].map((fnd, fIdx) => (
                                             <div key={fIdx} className="flex flex-col items-center text-center space-y-2">
                                                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-2xl relative bg-white">
                                                   <img src={fnd.img} alt={fnd.name} className="w-full h-full object-cover" />
                                                </div>
                                                <div className="flex flex-col text-white">
                                                   <span className="text-[11px] font-black tracking-tight leading-none">{fnd.name}</span>
                                                   <span className="text-[8px] font-bold text-white/80 uppercase mt-0.5 tracking-wider">{fnd.role}</span>
                                                </div>
                                             </div>
                                          ))}
                                       </div>
                                    </div>
                                 );
                              }

                              if (layout === 'texto') {
                                 return (
                                    <div key={slideIdx} className={`print-slide w-full aspect-[16/9] border border-slate-200 bg-white p-16 flex flex-col justify-between relative overflow-hidden h-[100vh] ${fontClass}`} style={{ ...baseStyle, backgroundColor: bgColor }}>
                                       <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40" xmlns="http://www.w3.org/2000/svg">
                                          <line x1="-50" y1="150" x2="350" y2="-250" stroke="#E2E8F0" strokeWidth="10" />
                                          <line x1="-50" y1="200" x2="400" y2="-250" stroke="#E2E8F0" strokeWidth="6" />
                                          <line x1="600" y1="800" x2="1100" y2="300" stroke="#E2E8F0" strokeWidth="10" />
                                          <line x1="650" y1="800" x2="1150" y2="300" stroke="#E2E8F0" strokeWidth="6" />
                                       </svg>

                                       <div className="flex flex-col justify-between h-full relative z-10 text-left">
                                          <div className="flex justify-between items-start pb-4 border-b border-slate-100">
                                             <div className="flex flex-col">
                                                <h2 className="text-3xl font-black text-[#1e4480] tracking-tight leading-none uppercase" style={{ color: titleColor || undefined }}>
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
                                   return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
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
                                    <div key={slideIdx} className={`print-slide w-full aspect-[16/9] border border-slate-200 bg-white p-12 flex flex-col justify-between relative overflow-hidden h-[100vh] ${fontClass}`} style={baseStyle}>
                                       <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30" xmlns="http://www.w3.org/2000/svg">
                                          <line x1="-100" y1="100" x2="400" y2="-400" stroke="#F1F5F9" strokeWidth="18" />
                                          <line x1="500" y1="900" x2="1200" y2="200" stroke="#F1F5F9" strokeWidth="18" />
                                       </svg>

                                       <div className="relative z-10 flex flex-col h-full justify-between text-left">
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
                                                      {renderInsumoRow('Materiais e Equipamentos', applyCascata(Number(proposta.insumos?.materials || 0) + Number(isSpot ? totalMaquinasNaoLocadas : proposta.insumos?.maquinas || 0)))}
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
                                    <div key={slideIdx} className={`print-slide w-full aspect-[16/9] border border-slate-200 bg-white p-12 flex flex-col justify-between relative overflow-hidden h-[100vh] ${fontClass}`} style={baseStyle}>
                                       <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30" xmlns="http://www.w3.org/2000/svg">
                                          <line x1="-100" y1="100" x2="400" y2="-400" stroke="#F1F5F9" strokeWidth="18" />
                                          <line x1="500" y1="900" x2="1200" y2="200" stroke="#F1F5F9" strokeWidth="18" />
                                       </svg>

                                       <div className="relative z-10 flex flex-col h-full justify-between text-left">
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
                                             <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded font-black">{String(currentSlide).padStart(2, '0')}</span>
                                          </div>
                                       </div>
                                    </div>
                                 );
                              }

                              if (layout === 'aceite') {
                                 return (
                                    <div key={slideIdx} className={`print-slide w-full aspect-[16/9] border border-slate-200 bg-[#1e4480] p-12 flex flex-col justify-between relative overflow-hidden h-[100vh] text-white ${fontClass}`} style={baseStyle}>
                                       <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" xmlns="http://www.w3.org/2000/svg">
                                          <line x1="-50" y1="150" x2="350" y2="-250" stroke="#FFFFFF" strokeWidth="10" />
                                          <line x1="600" y1="800" x2="1100" y2="300" stroke="#FFFFFF" strokeWidth="10" />
                                       </svg>

                                       <div className="relative z-10 flex flex-col h-full justify-between text-left">
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
                                                         <span className="text-white font-bold">{proposta.cliente?.dataInicio ? proposta.cliente.dataInicio.split('-').reverse().join('/') : "A definir"}</span>
                                                      </div>
                                                      <div className="flex flex-col">
                                                         <span className="text-[7.5px] font-black text-white/55 uppercase tracking-wider">Data de Vencimento</span>
                                                         <span className="text-white font-bold">{proposta.cliente?.dataVencimento ? proposta.cliente.dataVencimento.split('-').reverse().join('/') : "A definir"}</span>
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

                                          <div className="flex justify-between items-center border-t border-white/20 pt-4 mt-auto pr-28">
                                             <span className="text-[9px] font-bold text-white/70 uppercase tracking-widest">www.smartbidhub.com.br</span>
                                             <span className="text-[9px] font-black text-white bg-white/10 px-2.5 py-0.5 rounded">{String(slideNum).padStart(2, '0')}</span>
                                          </div>
                                       </div>
                                    </div>
                                 );
                              }

                              return null;
                           })
                        ) : (
                           <>
                     {/* SLIDE 01 PRINT - CAPA COMERCIAL */}
                     <div className="print-slide w-full aspect-[16/9] border border-slate-200 bg-[#020617] p-16 flex flex-col justify-between relative overflow-hidden h-[100vh]">
                        {/* Imagem de Fundo Nativa HTML para Garantir Renderização */}
                        <img 
                           src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=1200" 
                           alt="Capa Fundo" 
                           className="absolute inset-0 w-full h-full object-cover opacity-40 scale-105 filter blur-[0.5px]"
                        />
                        {/* Overlay Azul */}
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
                                 PROPOSTA COMERCIAL
                              </span>
                           </div>
                        </div>
                        <div className="relative z-20 flex justify-between items-end w-full text-white/70 text-[10px] font-extrabold uppercase tracking-wider pr-4 mt-auto">
                           <div className="flex justify-start gap-16 text-white/70 text-[10px] font-extrabold uppercase tracking-wider">
                              <div className="space-y-1">
                                 <div>Cliente: <strong className="text-white">{proposta.cliente.cliente || "Nome do Cliente"}</strong></div>
                                 <div>Nº Proposta: <strong className="text-white">{proposta.cliente.numeroProposta || "FPV-XXXX"}</strong></div>
                              </div>
                              <div className="space-y-1">
                                 <div>Data: <strong className="text-white">
                                    {proposta.cliente.dataElaboracao 
                                       ? new Date(proposta.cliente.dataElaboracao + 'T12:00:00').toLocaleDateString('pt-BR') 
                                       : new Date().toLocaleDateString('pt-BR')}
                                 </strong></div>
                                 <div>Revisão: <strong className="text-white">{proposta.cliente.revisao || "R01"}</strong></div>
                              </div>
                           </div>
                           <span className="text-[9px] font-black text-white bg-white/10 px-2.5 py-0.5 rounded backdrop-blur-xs">01</span>
                        </div>
                     </div>

                     {/* SLIDE 02 PRINT - MENSAGEM COMERCIAL */}
                     <div className="print-slide w-full aspect-[16/9] border border-slate-200 bg-white p-16 flex flex-col justify-between relative overflow-hidden h-[100vh]">
                        {/* Stripes de fundo */}
                        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40" xmlns="http://www.w3.org/2000/svg">
                           <line x1="-50" y1="150" x2="350" y2="-250" stroke="#E2E8F0" strokeWidth="10" />
                           <line x1="-50" y1="200" x2="400" y2="-250" stroke="#E2E8F0" strokeWidth="6" />
                           <line x1="-50" y1="250" x2="450" y2="-250" stroke="#E2E8F0" strokeWidth="3" />
                           <line x1="600" y1="800" x2="1100" y2="300" stroke="#E2E8F0" strokeWidth="10" />
                           <line x1="650" y1="800" x2="1150" y2="300" stroke="#E2E8F0" strokeWidth="6" />
                           <line x1="700" y1="800" x2="1200" y2="300" stroke="#E2E8F0" strokeWidth="3" />
                        </svg>
                        
                        <div className="grid grid-cols-12 gap-8 items-center h-full relative z-10">
                           <div className="col-span-8 flex flex-col justify-center space-y-6 pr-4">
                              <h2 className="text-3xl font-black text-[#1E3A8A] tracking-tight leading-none">
                                 Olá, {proposta.cliente.contato || "Karin"}!
                              </h2>
                              <div className="text-slate-600 text-xs leading-relaxed space-y-4 font-medium">
                                 <p>
                                    O desenvolvimento deste projeto teve como base as informações reunidas por meio da visita técnica realizada, com o objetivo de corresponder, da forma mais eficaz possível, às necessidades do <strong className="underline decoration-[#1B4D3E] decoration-2 font-black text-slate-800">{proposta.cliente.nomeFantasia || proposta.cliente.razaoSocial || "Cliente Não Informado"}</strong> no que se refere aos serviços de <strong className="font-extrabold text-slate-800">{proposta.cliente.tipoServicos || proposta.cliente.objetoProposta || "Limpeza e conservação"}</strong>.
                                 </p>
                                 <p className="font-semibold text-slate-700">
                                    Estamos imensamente gratos desde já pela oportunidade!
                                 </p>
                              </div>
                              <div className="space-y-4">
                                 <span className="text-xs font-bold text-slate-500 block">Att,</span>
                                 <div className="bg-[#2B547E] text-white px-5 py-3 rounded-2xl inline-flex flex-row items-center gap-4 shadow-md max-w-sm">
                                    {proposta.cliente.vendedorAvatarUrl ? (
                                       <img 
                                          src={proposta.cliente.vendedorAvatarUrl} 
                                          alt={proposta.cliente.vendedorNome} 
                                          className="w-12 h-12 rounded-full object-cover border border-white/20 shadow-sm shrink-0"
                                       />
                                    ) : null}
                                    <div className="flex flex-col space-y-0.5 overflow-hidden">
                                       <span className="text-sm font-black tracking-tight">{proposta.cliente.vendedorNome || "Ádamo Quadros"}</span>
                                       <span className="text-[10px] text-slate-200/80 font-bold uppercase tracking-wider">{proposta.cliente.vendedorCargo || "Novos Negócios"}</span>
                                       <span className="text-[10px] text-slate-200/80 font-bold">{proposta.cliente.vendedorTelefone || "(41) 9 9737-0880"}</span>
                                       <span className="text-[10px] text-slate-200/80 font-bold truncate">{proposta.cliente.vendedorEmail || "contato@silvaconsultoria.com.br"}</span>
                                    </div>
                                 </div>
                              </div>
                           </div>
                           <div className="col-span-4 flex flex-col justify-center items-center pl-8 border-l border-slate-100 h-full">
                              <img 
                                 src={companyLogo} 
                                 alt="Silva Consultoria" 
                                 className="max-h-24 w-auto object-contain mb-4"
                              />
                              <div className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">FACILITIES</div>
                           </div>
                        </div>
                        <div className="flex justify-between items-center border-t border-slate-100 pt-4 mt-auto">
                           <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">www.smartbidhub.com.br</span>
                           <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded">02</span>
                        </div>
                     </div>

                     
                      <div className="print-slide w-full aspect-[16/9] border border-slate-200 bg-[#1e4480] p-16 flex flex-col justify-between relative overflow-hidden h-[100vh] text-white">
                         <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" xmlns="http://www.w3.org/2000/svg">
                            <line x1="-50" y1="150" x2="350" y2="-250" stroke="#FFFFFF" strokeWidth="10" />
                            <line x1="-50" y1="200" x2="400" y2="-250" stroke="#FFFFFF" strokeWidth="6" />
                            <line x1="-50" y1="250" x2="450" y2="-250" stroke="#FFFFFF" strokeWidth="3" />
                            
                            <line x1="600" y1="800" x2="1100" y2="300" stroke="#FFFFFF" strokeWidth="10" />
                            <line x1="650" y1="800" x2="1150" y2="300" stroke="#FFFFFF" strokeWidth="6" />
                            <line x1="700" y1="800" x2="1200" y2="300" stroke="#FFFFFF" strokeWidth="3" />
                         </svg>

                         <div className="grid grid-cols-12 gap-8 items-center h-[calc(100%-40px)] relative z-10">
                            <div className="col-span-7 flex flex-col justify-center space-y-5 pl-2 h-full text-white">
                               <div>
                                  <h2 className="text-4xl font-black text-white tracking-tight leading-none uppercase">
                                     QUEM SOMOS
                                  </h2>
                                  <p className="text-white/95 text-[14px] font-semibold leading-relaxed mt-4 max-w-xl">
                                     Há mais de 30 anos no mercado de Facilities, somos especialistas em prestações de serviços de limpeza profissional e similares.
                                  </p>
                               </div>

                               <div className="grid grid-cols-5 gap-4 pt-6 border-t border-white/15">
                                  <div className="flex flex-col items-center text-center">
                                     <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mb-2 shadow-md">
                                        <Award size={26} className="text-white shrink-0" />
                                     </div>
                                     <span className="text-[14px] font-bold text-white leading-none whitespace-nowrap">+de <strong className="text-xl font-black">30</strong></span>
                                     <span className="text-[10px] font-extrabold text-white/90 uppercase mt-1 leading-tight tracking-wide block max-w-[85px]">
                                        Anos de atuação em Facilities
                                     </span>
                                  </div>

                                  <div className="flex flex-col items-center text-center">
                                     <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mb-2 shadow-md">
                                        <MapPin size={26} className="text-white shrink-0" />
                                     </div>
                                     <span className="text-[14px] font-bold text-white leading-none whitespace-nowrap"><strong className="text-xl font-black">+100</strong></span>
                                     <span className="text-[10px] font-extrabold text-white/90 uppercase mt-1 leading-tight tracking-wide block max-w-[85px]">
                                        postos ativos
                                     </span>
                                  </div>

                                  <div className="flex flex-col items-center text-center">
                                     <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mb-2 shadow-md">
                                        <Users size={26} className="text-white shrink-0" />
                                     </div>
                                     <span className="text-[14px] font-bold text-white leading-none whitespace-nowrap">+ <strong className="text-xl font-black">200</strong></span>
                                     <span className="text-[10px] font-extrabold text-white/90 uppercase mt-1 leading-tight tracking-wide block max-w-[85px]">
                                        Clientes atendidos
                                     </span>
                                  </div>

                                  <div className="flex flex-col items-center text-center">
                                     <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mb-2 shadow-md">
                                        <ShieldCheck size={26} className="text-white shrink-0" />
                                     </div>
                                     <span className="text-[11px] font-bold text-white leading-none whitespace-nowrap block w-full text-center"><strong className="text-base font-black">+100</strong> mil m²</span>
                                     <span className="text-[10px] font-extrabold text-white/90 uppercase mt-1 leading-tight tracking-wide block max-w-[85px]">
                                        de limpeza em altura
                                     </span>
                                  </div>

                                  <div className="flex flex-col items-center text-center">
                                     <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mb-2 shadow-md">
                                        <Sparkles size={26} className="text-white shrink-0" />
                                     </div>
                                     <span className="text-[11px] font-bold text-white leading-none whitespace-nowrap block w-full text-center"><strong className="text-base font-black">+500</strong> mil m²</span>
                                     <span className="text-[10px] font-extrabold text-white/90 uppercase mt-1 leading-tight tracking-wide block max-w-[85px]">
                                        de Pisos tratados
                                     </span>
                                  </div>
                               </div>
                            </div>

                            <div className="col-span-5 h-full flex flex-col justify-center items-center relative pr-2">
                               <div style={{ width: '280px', height: '280px' }} className="relative drop-shadow-lg flex items-center justify-center">
                                  <BrazilMap highlightedStates={['PR', 'SC', 'RS']} className="w-full h-full" />
                               </div>
                               <div className="text-[11px] font-black text-white uppercase tracking-widest mt-4 bg-white/10 px-4 py-1 rounded-full shadow-sm">
                                  Atendimento em toda Região Sul
                               </div>
                            </div>
                         </div>

                         <div className="relative z-20 flex justify-between items-end w-full text-white/70 text-[10px] font-extrabold uppercase tracking-wider pr-4 mt-auto">
                            <span className="text-[9px] font-bold text-white/70 uppercase tracking-widest">www.smartbidhub.com.br</span>
                            <span className="text-[9px] font-black text-white bg-white/10 px-2.5 py-0.5 rounded backdrop-blur-xs">03</span>
                         </div>
                      </div>

                      {/* SLIDE 04 PRINT - NOSSOS VALORES */}
                      <div className="print-slide w-full aspect-[16/9] border border-slate-200 bg-white p-16 flex flex-col justify-between relative overflow-hidden h-[100vh]">
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
                                     NOSSOS VALORES
                                  </h2>
                                  <p className="text-slate-600 text-[14px] font-semibold leading-relaxed mt-5 text-justify">
                                     Nosso compromisso é guiado por princípios sólidos: agimos com <strong className="underline decoration-[#1B4D3E] decoration-2 font-black text-slate-800">ética</strong>, mantendo a integridade acima de benefícios momentâneos. Buscamos <strong className="underline decoration-[#1B4D3E] decoration-2 font-black text-slate-800">agilidade</strong>, <strong className="underline decoration-[#1B4D3E] decoration-2 font-black text-slate-800">eficiência</strong> e <strong className="underline decoration-[#1B4D3E] decoration-2 font-black text-slate-800">excelência</strong> através do aprimoramento contínuo de processos e sistemas. <strong className="underline decoration-[#1B4D3E] decoration-2 font-black text-slate-800">Valorizamos nossas pessoas</strong>, promovendo um ambiente humanizado e soluções que garantem a satisfação e a permanência dos colaboradores. Somos comprometidos com a <strong className="underline decoration-[#1B4D3E] decoration-2 font-black text-slate-800">entrega</strong> dos nossos acordos, mesmo diante de desafios. Além disso, investimos em <strong className="underline decoration-[#1B4D3E] decoration-2 font-black text-slate-800">inovação</strong> e <strong className="underline decoration-[#1B4D3E] decoration-2 font-black text-slate-800">tecnologia</strong> para otimizar a automação, produtividade e eficiência.
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

                         <div className="flex justify-between items-center border-t border-slate-100 pt-4 mt-auto">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">www.smartbidhub.com.br</span>
                            <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded">04</span>
                         </div>
                      </div>

                      {/* SLIDE 05 PRINT - PRINCIPAIS SERVIÇOS PRESTADOS */}
                      <div className="print-slide w-full aspect-[16/9] border border-slate-200 bg-white p-16 flex flex-col justify-between relative overflow-hidden h-[100vh]">
                         <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-50" xmlns="http://www.w3.org/2000/svg">
                            <line x1="-100" y1="100" x2="400" y2="-400" stroke="#F1F5F9" strokeWidth="18" />
                            <line x1="-100" y1="150" x2="450" y2="-400" stroke="#F1F5F9" strokeWidth="12" />
                            <line x1="-100" y1="200" x2="500" y2="-400" stroke="#F1F5F9" strokeWidth="6" />
                            <line x1="500" y1="900" x2="1200" y2="200" stroke="#F1F5F9" strokeWidth="18" />
                            <line x1="550" y1="900" x2="1250" y2="200" stroke="#F1F5F9" strokeWidth="12" />
                         </svg>
                         
                         <div className="relative z-10 flex flex-col h-[calc(100%-30px)] justify-between">
                            <div>
                               <h2 className="text-3xl font-black text-[#1e4480] uppercase tracking-tight leading-none mb-6">
                                  PRINCIPAIS SERVIÇOS PRESTADOS
                               </h2>

                               <div className="grid grid-cols-2 gap-12 mt-2">
                                  <div className="flex flex-col space-y-3">
                                     <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-2">
                                        <span className="text-[#1e4480] text-[15px] font-black tracking-wide uppercase leading-tight max-w-[300px]">
                                           TERCEIRIZAÇÃO DE SERVIÇOS DE FACILITIES
                                        </span>
                                        <div className="text-[#1e4480] shrink-0">
                                           <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-14 h-14 shrink-0">
                                              <path d="M12 52L24 40M52 52L40 40" stroke="#1e4480" strokeWidth="3" />
                                              <path d="M22 38L14 30M42 38L50 30" stroke="#1e4480" strokeWidth="3" />
                                              <line x1="24" y1="40" x2="36" y2="28" stroke="#1e4480" strokeWidth="2.5" />
                                              <line x1="40" y1="40" x2="28" y2="28" stroke="#1e4480" strokeWidth="2.5" />
                                              <path d="M18 42C18 42 22 46 28 46C34 46 38 42 38 36" stroke="#1e4480" strokeWidth="2.5" />
                                              <path d="M32 8L34 14L40 16L34 18L32 24L30 18L24 16L30 14Z" fill="#1e4480" />
                                           </svg>
                                        </div>
                                     </div>
                                     <p className="text-slate-600 text-[14px] font-semibold leading-relaxed mt-2 text-justify">
                                        Gestão e execução de serviços essenciais, como limpeza, manutenção e segurança, que garantem o bom funcionamento e organização de um ambiente de trabalho. Nossa função é cuidar de tudo isso para que a empresa possa focar no que faz de melhor, enquanto oferecemos um espaço eficiente, seguro e bem cuidado.
                                     </p>
                                  </div>

                                  <div className="flex flex-col space-y-3">
                                     <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-2">
                                        <span className="text-[#1e4480] text-[15px] font-black tracking-wide uppercase leading-tight">
                                           LIMPEZA EM ALTURA
                                        </span>
                                        <div className="text-[#1e4480] shrink-0">
                                           <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-14 h-14 shrink-0">
                                              <rect x="6" y="6" width="20" height="52" rx="2" stroke="#cbd5e1" strokeWidth="1.5" />
                                              <line x1="6" y1="20" x2="26" y2="20" stroke="#cbd5e1" strokeWidth="1.5" />
                                              <line x1="6" y1="36" x2="26" y2="36" stroke="#cbd5e1" strokeWidth="1.5" />
                                              <line x1="16" y1="6" x2="16" y2="58" stroke="#cbd5e1" strokeWidth="1.5" />
                                              <line x1="38" y1="2" x2="38" y2="62" stroke="#1e4480" strokeWidth="1.5" strokeDasharray="3 3" />
                                              <line x1="48" y1="2" x2="48" y2="62" stroke="#1e4480" strokeWidth="1.5" />
                                              <circle cx="48" cy="22" r="4" fill="#1e4480" />
                                              <path d="M44 20H48V24" stroke="#1e4480" strokeWidth="2" />
                                              <path d="M48 26L42 36" stroke="#1e4480" strokeWidth="4" />
                                           </svg>
                                        </div>
                                     </div>
                                     <p className="text-slate-600 text-[14px] font-semibold leading-relaxed mt-2 text-justify">
                                        Serviço que é realizado em áreas de difícil acesso, como fachadas de prédios, janelas externas e estruturas elevadas. Usamos equipamentos específicos e técnicas seguras para garantir que essas superfícies sejam limpas de maneira eficiente, mantendo a estética e a segurança dos espaços altos, onde o cuidado e a precisão são essenciais.
                                     </p>
                                  </div>
                               </div>
                            </div>

                            <div className="flex justify-around items-center w-full pt-4 mt-auto border-t border-slate-100 relative z-20">
                               <div className="flex flex-col items-center justify-center">
                                  <div className="bg-[#1e4480] text-white w-20 h-20 flex items-center justify-center rounded-full shadow-xl">
                                     <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-white">
                                        <circle cx="32" cy="16" r="6" fill="currentColor" />
                                        <path d="M26 14C26 12 30 10 34 10H38" stroke="currentColor" strokeWidth="2.5" />
                                        <path d="M22 28C22 24 25 24 32 24C39 24 42 24 42 28V46H22V28Z" fill="currentColor" />
                                        <path d="M28 24V46M36 24V46" stroke="#1e4480" strokeWidth="1.5" />
                                        <path d="M22 30L12 34L12 48" stroke="currentColor" strokeWidth="3.5" />
                                        <line x1="10" y1="12" x2="10" y2="54" stroke="currentColor" strokeWidth="2.5" />
                                        <path d="M4 54H16L18 58H2L4 54Z" fill="currentColor" />
                                        <path d="M42 30L50 36L50 44" stroke="currentColor" strokeWidth="3.5" />
                                        <path d="M46 44H54L56 56H44L46 44Z" fill="currentColor" />
                                        <path d="M46 44C46 44 48 40 50 40C52 40 54 44 54 44" stroke="currentColor" strokeWidth="1.5" />
                                     </svg>
                                  </div>
                                  <span className="text-[#1e4480] text-[12px] font-black tracking-wider uppercase mt-2.5">
                                     LIMPEZA
                                  </span>
                               </div>

                               <div className="flex flex-col items-center justify-center">
                                  <div className="bg-[#1e4480] text-white w-20 h-20 flex items-center justify-center rounded-full shadow-xl">
                                     <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-white">
                                        <path d="M18 18C18 10 24 8 32 8C40 8 46 10 46 18H18Z" fill="currentColor" />
                                        <path d="M14 18H50V20C50 20 40 22 32 22C24 22 14 20 14 20Z" fill="currentColor" />
                                        <path d="M32 10L35 13L32 16L29 13Z" fill="#eab308" />
                                        <circle cx="32" cy="25" r="6" fill="currentColor" />
                                        <path d="M16 38C16 33 20 32 32 32C44 32 48 33 48 38V52H16V38Z" fill="currentColor" />
                                        <path d="M28 32L32 40L36 32Z" fill="#ffffff" />
                                        <path d="M31 35L33 35L33 48L31 48Z" fill="#1e4480" />
                                        <path d="M22 36L25 38L24 41L20 41L19 38Z" fill="#eab308" />
                                        <path d="M16 34H22" stroke="#eab308" strokeWidth="2.5" />
                                        <path d="M42 34H48" stroke="#eab308" strokeWidth="2.5" />
                                     </svg>
                                  </div>
                                  <span className="text-[#1e4480] text-[12px] font-black tracking-wider uppercase mt-2.5">
                                     PORTARIA
                                  </span>
                                </div>

                               <div className="flex flex-col items-center justify-center">
                                  <div className="bg-[#1e4480] text-white w-20 h-20 flex items-center justify-center rounded-full shadow-xl">
                                     <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-white">
                                        <path d="M4 42H60V54H4V42Z" fill="currentColor" />
                                        <line x1="8" y1="46" x2="56" y2="46" stroke="#1e4480" strokeWidth="2" />
                                        <circle cx="22" cy="22" r="5" fill="currentColor" />
                                        <path d="M17 18C15 21 16 25 22 25C28 25 29 21 27 18" stroke="currentColor" strokeWidth="2.5" />
                                        <path d="M12 36C12 30 15 28 22 28C29 28 32 30 32 36V42H12V36Z" fill="currentColor" />
                                        <circle cx="42" cy="22" r="5" fill="currentColor" />
                                        <path d="M37 20C37 15 47 15 47 20" stroke="currentColor" strokeWidth="2" />
                                        <path d="M32 36C32 30 35 28 42 28C49 28 52 30 52 36V42H32V36Z" fill="currentColor" />
                                        <path d="M26 38L30 32H34L38 38H26Z" fill="#cbd5e1" stroke="currentColor" strokeWidth="1.5" />
                                        <line x1="24" y1="40" x2="40" y2="40" stroke="currentColor" strokeWidth="2" />
                                     </svg>
                                  </div>
                                  <span className="text-[#1e4480] text-[12px] font-black tracking-wider uppercase mt-2.5">
                                     RECEPÇÃO
                                  </span>
                               </div>

                               <div className="flex flex-col items-center justify-center">
                                  <div className="bg-[#1e4480] text-white w-20 h-20 flex items-center justify-center rounded-full shadow-xl">
                                     <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-white">
                                        <circle cx="48" cy="20" r="8" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
                                        <path d="M48 10V12M48 28V30M38 20H40M56 20H58" stroke="currentColor" strokeWidth="2" />
                                        <circle cx="28" cy="18" r="6" fill="currentColor" />
                                        <path d="M22 15C22 13 26 11 31 11H36" stroke="currentColor" strokeWidth="2.5" />
                                        <path d="M16 30C16 26 19 25 28 25C37 25 40 26 40 30V48H16V30Z" fill="currentColor" />
                                        <path d="M38 32L48 28L48 40" stroke="currentColor" strokeWidth="3.5" />
                                        <path d="M46 20L50 24" stroke="currentColor" strokeWidth="3.5" />
                                        <circle cx="45" cy="19" r="3" stroke="currentColor" strokeWidth="2" fill="#1e4480" />
                                        <circle cx="51" cy="25" r="3" stroke="currentColor" strokeWidth="2" fill="#1e4480" />
                                        <rect x="20" y="29" width="4" height="6" rx="0.5" fill="#ffffff" />
                                     </svg>
                                  </div>
                                  <span className="text-[#1e4480] text-[12px] font-black tracking-wider uppercase mt-2.5">
                                     MANUTENÇÃO
                                  </span>
                               </div>

                               <div className="flex flex-col items-center justify-center">
                                  <div className="bg-[#1e4480] text-white w-20 h-20 flex items-center justify-center rounded-full shadow-xl">
                                     <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-white">
                                        <path d="M14 20C14 20 22 12 32 12C42 12 50 20 50 20H14Z" fill="currentColor" stroke="currentColor" strokeWidth="1" />
                                        <ellipse cx="32" cy="20" rx="22" ry="3" fill="currentColor" />
                                        <circle cx="32" cy="26" r="5" fill="currentColor" />
                                        <path d="M18 36C18 32 21 31 32 31C43 31 46 32 46 36V50H18V36Z" fill="currentColor" />
                                        <path d="M24 31V50M40 31V50" stroke="#1e4480" strokeWidth="2.5" />
                                        <path d="M44 38C44 38 48 34 52 35C52 35 54 40 48 42" fill="currentColor" />
                                        <path d="M48 30C48 30 52 27 55 30C55 30 54 35 49 33" fill="currentColor" />
                                        <path d="M28 42H36L38 48H26L28 42Z" fill="currentColor" stroke="currentColor" strokeWidth="1.5" />
                                        <circle cx="32" cy="38" r="2" fill="#eab308" />
                                     </svg>
                                  </div>
                                  <span className="text-[#1e4480] text-[12px] font-black tracking-wider uppercase mt-2.5">
                                     JARDINAGEM
                                  </span>
                               </div>
                            </div>
                         </div>

                         <div className="flex justify-between items-center border-t border-slate-100 pt-4 mt-auto">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">www.smartbidhub.com.br</span>
                            <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded">05</span>
                         </div>
                      </div>

                      {/* SLIDE 06 PRINT - SETORES ATENDIDOS */}
                      <div className="print-slide w-full aspect-[16/9] border border-slate-200 bg-[#1e4480] p-16 flex flex-col justify-between relative overflow-hidden h-[100vh] text-white">
                         <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" xmlns="http://www.w3.org/2000/svg">
                            <line x1="-50" y1="150" x2="350" y2="-250" stroke="#FFFFFF" strokeWidth="10" />
                            <line x1="600" y1="800" x2="1100" y2="300" stroke="#FFFFFF" strokeWidth="10" />
                         </svg>
                         
                         <div className="relative z-10 flex flex-col h-[calc(100%-30px)] justify-between text-white">
                            <div>
                               <h2 className="text-3xl font-black text-white uppercase tracking-tight leading-none mb-6">
                                  SETORES ATENDIDOS
                               </h2>

                               <div className="grid grid-cols-2 gap-12 mt-2">
                                  <div className="flex flex-col space-y-3">
                                     <div className="flex flex-col border-b border-white/20 pb-2">
                                        <div style={{ width: '48px', height: '4px', backgroundColor: 'white', marginBottom: '8px' }}></div>
                                        <div className="flex items-center justify-between gap-4">
                                           <span className="text-white text-[15px] font-black tracking-wide uppercase leading-tight">
                                              INDÚSTRIA
                                           </span>
                                           <div className="bg-white/10 p-2 rounded-xl text-white shrink-0 shadow-sm">
                                              <Factory size={22} className="stroke-[2.5]" />
                                           </div>
                                        </div>
                                     </div>
                                     <p className="text-white/90 text-[14px] font-semibold leading-relaxed mt-2 text-justify">
                                        Com processos minuciosos e detalhados, o setor industrial trouxe para o escopo da Silva Consultoria a capacidade de atender clientes de alta exigência. Possuímos qualidade técnica validada no mercado para atender as mais variadas necessidades da indústria.
                                     </p>
                                  </div>

                                  <div className="flex flex-col space-y-3 pl-2">
                                     <div className="flex flex-col border-b border-white/20 pb-2">
                                        <div style={{ width: '48px', height: '4px', backgroundColor: 'white', marginBottom: '8px' }}></div>
                                        <div className="flex items-center justify-between gap-4">
                                           <span className="text-white text-[15px] font-black tracking-wide uppercase leading-tight">
                                              VAREJO
                                           </span>
                                           <div className="bg-white/10 p-2 rounded-xl text-white shrink-0 shadow-sm">
                                              <Store size={22} className="stroke-[2.5]" />
                                           </div>
                                        </div>
                                     </div>
                                     <p className="text-white/90 text-[14px] font-semibold leading-relaxed mt-2 text-justify">
                                        Um dos setores com maior participação em nossa carteira de clientes, o varejo exigiu resiliência e trabalho árduo em busca de superar os desafios operacionais, que por fim, resultaram in constantes avaliações positivas de satisfação e controle dos indicadores de rotatividade e absenteísmo.
                                     </p>
                                  </div>
                               </div>
                            </div>

                            <div className="flex justify-around items-center w-full pt-4 mt-auto border-t border-white/20 relative z-20">
                               <div className="flex flex-col items-center justify-center">
                                  <div className="bg-white text-[#1e4480] shadow-xl w-14 h-14 flex items-center justify-center rounded-full">
                                     <Bus size={22} className="stroke-[2]" />
                                  </div>
                                  <span className="text-white text-[11px] font-black tracking-wider uppercase mt-2.5 text-center max-w-[100px] leading-tight">
                                     TRANSPORTE<br />E LOGÍSTICA
                                  </span>
                               </div>

                               <div className="flex flex-col items-center justify-center">
                                  <div className="bg-white text-[#1e4480] shadow-xl w-14 h-14 flex items-center justify-center rounded-full">
                                     <Building size={22} className="stroke-[2]" />
                                  </div>
                                  <span className="text-white text-[11px] font-black tracking-wider uppercase mt-2.5 text-center max-w-[110px] leading-tight">
                                     CONDOMÍNIOS<br />E EDIFÍCIOS
                                  </span>
                               </div>

                               <div className="flex flex-col items-center justify-center">
                                  <div className="bg-white text-[#1e4480] shadow-xl w-14 h-14 flex items-center justify-center rounded-full">
                                     <Hospital size={22} className="stroke-[2]" />
                                  </div>
                                  <span className="text-white text-[11px] font-black tracking-wider uppercase mt-2.5 text-center max-w-[100px] leading-tight">
                                     CLÍNICAS E<br />HOSPITAIS
                                  </span>
                               </div>

                               <div className="flex flex-col items-center justify-center">
                                  <div className="bg-white text-[#1e4480] shadow-xl w-14 h-14 flex items-center justify-center rounded-full">
                                     <ShoppingBag size={22} className="stroke-[2]" />
                                  </div>
                                  <span className="text-white text-[11px] font-black tracking-wider uppercase mt-2.5 text-center max-w-[100px] leading-tight">
                                     SHOPPING<br />CENTERS
                                  </span>
                               </div>

                               <div className="flex flex-col items-center justify-center">
                                  <div className="bg-white text-[#1e4480] shadow-xl w-14 h-14 flex items-center justify-center rounded-full">
                                     <GraduationCap size={22} className="stroke-[2]" />
                                  </div>
                                  <span className="text-white text-[11px] font-black tracking-wider uppercase mt-2.5 text-center max-w-[120px] leading-tight">
                                     ESTABELECIMENTOS<br />EDUCACIONAIS
                                  </span>
                               </div>
                            </div>
                         </div>

                         <div className="flex justify-between items-center border-t border-white/20 pt-4 mt-auto">
                            <span className="text-[9px] font-bold text-white/60 uppercase tracking-widest">www.smartbidhub.com.br</span>
                            <span className="text-[9px] font-black text-white/80 bg-white/10 px-2.5 py-0.5 rounded">06</span>
                         </div>
                      </div>

                      {/* {/* SLIDE 07 PRINT - PRINCIPAIS FERRAMENTAS */}
                      <div className="print-slide w-full aspect-[16/9] border border-slate-200 bg-white grid grid-cols-2 relative overflow-hidden h-[100vh] text-slate-800">
                         {/* Metade Esquerda (Branca) */}
                         <div className="col-span-1 bg-white p-16 flex flex-col justify-between relative h-full border-r border-slate-100">
                            {/* Stripes de fundo */}
                            <svg className="absolute top-0 left-0 w-64 h-64 pointer-events-none opacity-20" xmlns="http://www.w3.org/2000/svg">
                               <line x1="-50" y1="150" x2="150" y2="-50" stroke="#1e4480" strokeWidth="10" />
                               <line x1="-50" y1="200" x2="200" y2="-50" stroke="#1e4480" strokeWidth="6" />
                               <line x1="-50" y1="250" x2="250" y2="-50" stroke="#1e4480" strokeWidth="3" />
                            </svg>
                            
                            <div className="relative z-10 flex flex-col h-full justify-between">
                               <div>
                                  <h2 className="text-3xl font-black text-[#1e4480] uppercase tracking-tight leading-none mb-8">
                                     PRINCIPAIS<br />
                                     FERRAMENTAS
                                  </h2>
                               </div>
                               
                               <div className="space-y-6 my-auto">
                                  {/* Bitrix24 */}
                                  <div className="flex gap-4 items-start">
                                     <div className="bg-[#1e4480]/10 p-2 rounded-xl text-[#1e4480] shrink-0 mt-1">
                                        <Share2 size={20} className="stroke-[2.5]" />
                                     </div>
                                     <div className="space-y-1">
                                        <h3 className="text-[#1e4480] text-xs font-black tracking-wider uppercase">BITRIX24</h3>
                                        <p className="text-slate-500 text-[8.5px] font-semibold leading-relaxed">
                                           CRM, armazenamento de dados e documentos, gestão de resultados, planejamento estratégico.
                                        </p>
                                        <div className="pt-2 flex items-center gap-1 select-none">
                                           <span className="text-[#00A4E4] font-black text-sm tracking-tight">Bitrix</span>
                                           <span className="text-[#435560] font-black text-sm tracking-tight">24</span>
                                           <div className="w-3.5 h-3.5 rounded-full border-2 border-[#00A4E4] flex items-center justify-center text-[7px] text-[#00A4E4] font-black ml-0.5">L</div>
                                        </div>
                                     </div>
                                  </div>
                                  
                                  {/* Secullum */}
                                  <div className="flex gap-4 items-start">
                                     <div className="bg-[#1e4480]/10 p-2 rounded-xl text-[#1e4480] shrink-0 mt-1">
                                        <Clock size={20} className="stroke-[2.5]" />
                                     </div>
                                     <div className="space-y-1">
                                        <h3 className="text-[#1e4480] text-xs font-black tracking-wider uppercase">SECULLUM</h3>
                                        <p className="text-slate-500 text-[8.5px] font-semibold leading-relaxed">
                                           Controle de ponto digital, envio e assinatura de holerites e documentos administrativos, controle e gestão de turnover.
                                        </p>
                                        <div className="pt-2 flex flex-col select-none">
                                           <div className="flex items-center gap-1">
                                              <Award size={14} className="text-amber-500 shrink-0" />
                                              <span className="text-slate-700 font-black text-xs tracking-tight lowercase">secullum</span>
                                           </div>
                                           <span className="text-slate-400 text-[7px] font-bold pl-5 leading-none">Ser fácil para ser humano.</span>
                                        </div>
                                     </div>
                                  </div>
                               </div>
                               
                               <div className="pt-4 border-t border-slate-100 flex items-center text-slate-400 text-[9px] font-bold uppercase tracking-widest">
                                  <span>www.smartbidhub.com.br</span>
                                </div>
                            </div>
                         </div>
                         
                         {/* Metade Direita (Azul) */}
                         <div className="col-span-1 bg-[#1e4480] p-16 flex flex-col justify-between relative h-full text-white">
                            {/* Stripes de fundo */}
                            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" xmlns="http://www.w3.org/2000/svg">
                               <line x1="150" y1="400" x2="400" y2="150" stroke="#FFFFFF" strokeWidth="10" />
                               <line x1="200" y1="400" x2="450" y2="150" stroke="#FFFFFF" strokeWidth="6" />
                               <line x1="250" y1="400" x2="500" y2="150" stroke="#FFFFFF" strokeWidth="3" />
                            </svg>
                            
                            <div className="relative z-10 flex flex-col h-full justify-between">
                               <div className="h-12"></div>
                               
                               <div className="space-y-4 my-auto">
                                  {/* Nexus Operacional (IA Core - Destaque Principal) */}
                                  <div className="flex gap-4 items-start border-b border-white/10 pb-3">
                                     <div className="bg-emerald-500/20 p-2 rounded-xl text-emerald-400 shrink-0 mt-1 border border-emerald-500/30">
                                        <Cpu size={20} className="stroke-[2.5] animate-pulse" />
                                     </div>
                                     <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                           <h3 className="text-white text-xs font-black tracking-wider uppercase">NEXUS OPERACIONAL</h3>
                                           <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[7px] px-1.5 py-0.5 rounded-full font-black tracking-widest uppercase">IA CORE</span>
                                        </div>
                                        <p className="text-white/80 text-[8px] font-semibold leading-relaxed">
                                           Mesa de operação inteligente baseada em IA, otimizando agendamentos de frotas, distribuição de escalas e monitoramento de services em tempo real.
                                        </p>
                                        <div className="pt-1 flex items-center gap-1 select-none">
                                           <span className="text-emerald-400 font-black text-xs tracking-tight">Nexus</span>
                                           <span className="text-white font-extrabold text-xs tracking-tight">Operacional</span>
                                        </div>
                                     </div>
                                  </div>
                                  
                                  {/* Onvio */}
                                  <div className="flex gap-4 items-start">
                                     <div className="bg-white/10 p-2 rounded-xl text-white shrink-0 mt-1">
                                        <User size={20} className="stroke-[2.5]" />
                                     </div>
                                     <div className="space-y-1">
                                        <h3 className="text-white text-xs font-black tracking-wider uppercase">ONVIO</h3>
                                        <p className="text-white/80 text-[8.5px] font-semibold leading-relaxed">
                                           Registro e gestão de documentação de funcionários.
                                        </p>
                                        <div className="pt-1.5 flex flex-col select-none">
                                           <span className="text-orange-400/80 text-[6px] font-extrabold tracking-widest uppercase">THOMSON REUTERS</span>
                                           <span className="text-orange-500 font-black text-sm tracking-tight leading-none mt-0.5">ONVIO</span>
                                        </div>
                                     </div>
                                  </div>
                                  
                                  {/* Check-List Fácil */}
                                  <div className="flex gap-4 items-start">
                                     <div className="bg-white/10 p-2 rounded-xl text-white shrink-0 mt-1">
                                        <Smartphone size={20} className="stroke-[2.5]" />
                                     </div>
                                     <div className="space-y-1">
                                        <h3 className="text-white text-xs font-black tracking-wider uppercase">CHECK-LIST FÁCIL</h3>
                                        <p className="text-white/80 text-[8.5px] font-semibold leading-relaxed">
                                           Plataforma digital de desenvolvimento e gestão de processos internos com registro fotográfico, SLA's etc.
                                        </p>
                                        <div className="pt-1.5 flex items-center gap-1 select-none text-[#10B981]">
                                           <span className="text-sm font-black tracking-tight flex items-center gap-1">✔ checklistfácil</span>
                                        </div>
                                     </div>
                                  </div>
                               </div>
                               
                               <div className="pt-4 border-t border-white/20 flex justify-between items-center text-white/60 text-[9px] font-bold">
                                  <span className="uppercase tracking-widest">www.smartbidhub.com.br</span>
                                  <span className="text-white/80 bg-white/10 px-2.5 py-0.5 rounded font-black">07</span>
                               </div>
                            </div>
                         </div>
                      </div>

{/* SLIDE 08 PRINT - OBJETO E ESCOPO TÉCNICO */}
                       <div className="print-slide w-full aspect-[16/9] border border-slate-200 bg-white p-16 flex flex-col justify-between relative overflow-hidden h-[100vh] text-slate-800">
                          {/* Linhas diagonais decorativas da marca */}
                          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" xmlns="http://www.w3.org/2000/svg">
                             <line x1="-50" y1="150" x2="350" y2="-250" stroke="#1e4480" strokeWidth="10" />
                             <line x1="-50" y1="200" x2="400" y2="-250" stroke="#1e4480" strokeWidth="6" />
                             <line x1="-50" y1="250" x2="450" y2="-250" stroke="#1e4480" strokeWidth="3" />
                             
                             <line x1="600" y1="800" x2="1100" y2="300" stroke="#1e4480" strokeWidth="10" />
                             <line x1="650" y1="800" x2="1150" y2="300" stroke="#1e4480" strokeWidth="6" />
                             <line x1="700" y1="800" x2="1200" y2="300" stroke="#1e4480" strokeWidth="3" />
                          </svg>

                          <div className="relative z-10 flex flex-col h-full justify-between">
                             {/* Header */}
                             <div className="flex justify-between items-start pb-4 border-b border-slate-100">
                                <h2 className="text-3xl font-black text-[#1e4480] tracking-tight leading-none uppercase">
                                   OBJETO & ESCOPO TÉCNICO
                                </h2>
                                <img 
                                   src={companyLogo} 
                                   alt="Silva Consultoria Logo" 
                                   className="max-h-10 w-auto object-contain"
                                />
                             </div>

                             {/* Content Area */}
                             <div className="my-auto w-full max-w-5xl mx-auto">
                                {proposta.cliente.hasEscopoTecnico ? (
                                   <div className="grid grid-cols-2 gap-12 items-stretch">
                                      {/* Left: Objeto da Proposta */}
                                      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-8 shadow-sm flex flex-col justify-between">
                                         <div>
                                            <span className="text-[12px] font-black text-[#1e4480] uppercase tracking-widest block mb-3">01. OBJETO DA PROPOSTA</span>
                                            <p className="text-sm font-semibold leading-relaxed text-slate-700 whitespace-pre-line">
                                               {proposta.cliente.objetoProposta || proposta.cliente.tipoServicos || 'Prestação de serviços especializados de limpeza, conservação e facilities.'}
                                            </p>
                                         </div>
                                      </div>

                                      {/* Right: Escopo Técnico */}
                                      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-8 shadow-sm flex flex-col justify-between">
                                         <div>
                                            <span className="text-[12px] font-black text-[#1e4480] uppercase tracking-widest block mb-3">02. ESCOPO TÉCNICO</span>
                                            <p className="text-sm font-semibold leading-relaxed text-slate-700 whitespace-pre-line overflow-y-auto max-h-[220px]">
                                               {proposta.cliente.escopoTecnico || 'Detalhamento das atividades operacionais conforme solicitação e cronograma alinhado.'}
                                            </p>
                                         </div>
                                      </div>
                                   </div>
                                ) : (
                                   <div className="max-w-3xl mx-auto bg-slate-50 border border-slate-200/80 rounded-2xl p-10 text-center shadow-sm">
                                      <span className="text-[12px] font-black text-[#1e4480] uppercase tracking-widest block mb-4">OBJETO DA PROPOSTA</span>
                                      <p className="text-base font-bold leading-relaxed text-slate-700 whitespace-pre-line">
                                         {proposta.cliente.objetoProposta || proposta.cliente.tipoServicos || 'Prestação de serviços especializados de limpeza, conservação e facilities.'}
                                      </p>
                                   </div>
                                )}
                             </div>

                             {/* Footer */}
                             <div className="flex justify-between items-center border-t border-slate-100 pt-4 mt-auto text-slate-400 text-[9px] font-bold">
                                <span className="uppercase tracking-widest">www.smartbidhub.com.br</span>
                                <span className="text-[#1e4480] bg-slate-100 px-2.5 py-0.5 rounded font-black">08</span>
                             </div>
                          </div>
                       </div>

                       
                      <div className="print-slide w-full aspect-[16/9] border border-slate-200 bg-white p-16 flex flex-col justify-between relative overflow-hidden h-[100vh] text-slate-800">
                         <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30" xmlns="http://www.w3.org/2000/svg">
                            <line x1="-100" y1="100" x2="400" y2="-400" stroke="#F1F5F9" strokeWidth="18" />
                            <line x1="500" y1="900" x2="1200" y2="200" stroke="#F1F5F9" strokeWidth="18" />
                         </svg>

                         <div className="flex flex-col justify-between h-full relative z-10 w-full">
                            <div className="flex justify-between items-center w-full pb-4 border-b border-slate-100">
                               <div className="flex flex-col">
                                  <span className="text-[#1e4480] text-[10px] font-black tracking-[0.2em] uppercase">SILVA CONSULTORIA</span>
                                  <h2 className="text-xl font-black text-[#1e4480] uppercase tracking-tight">QUADRO DE EQUIPE EFETIVO</h2>
                               </div>
                               <img src={companyLogo} alt="Silva Logo" className="max-h-10 w-auto object-contain" />
                            </div>

                            <div className="my-auto w-full max-w-4xl mx-auto grid grid-cols-12 gap-8 items-stretch">
                               <div className="col-span-8 bg-white rounded-2xl border border-slate-150 shadow-lg overflow-hidden flex flex-col">
                                  <div className="bg-[#1e4480] text-center py-3">
                                     <h3 className="text-white text-xs font-black tracking-widest uppercase">{proposta.cliente.quadroEfetivoSubtitulo || 'Quadro efetivo - Opções'}</h3>
                                  </div>
                                  <div className="flex-1">
                                     <table className="w-full text-left border-collapse">
                                        <thead>
                                           <tr className="bg-slate-50 text-[#1e4480] text-[10px] font-black uppercase tracking-wider border-b border-slate-200">
                                              <th className="px-5 py-3">Função</th>
                                              <th className="px-5 py-3 text-center w-24">Qtd.</th>
                                              <th className="px-5 py-3 text-center w-28">Escala</th>
                                              <th className="px-5 py-3 text-center w-36">Horário</th>
                                           </tr>
                                        </thead>
                                        <tbody>
                                           {proposta.equipe && proposta.equipe.length > 0 ? (
                                              proposta.equipe.map((p: any, idx: number) => (
                                                 <tr key={p.id || idx} className={`border-b border-slate-100 text-[10px] font-bold text-slate-700 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/20'}`}>
                                                    <td className="px-5 py-3.5 font-black text-slate-800">{p.nomeCargo || "Selecione a Função"}</td>
                                                    <td className="px-5 py-3.5 text-center font-black text-[#1e4480]">{(p.tipoItem === 'SPOT' ? p.quantidadeDemanda || 0 : p.quantidade || 0).toFixed(2).replace('.', ',')}</td>
                                                    <td className="px-5 py-3.5 text-center">{p.escala || "A definir"}</td>
                                                    <td className="px-5 py-3.5 text-center font-semibold text-slate-500">
                                                       {p.parametrosPosto?.horarioInicio && p.parametrosPosto?.horarioFim 
                                                          ? `${p.parametrosPosto.horarioInicio} às ${p.parametrosPosto.horarioFim}` 
                                                          : '08:00 às 17:00'}
                                                    </td>
                                                 </tr>
                                              ))
                                           ) : (
                                              <tr className="border-b border-slate-100 text-[10px] font-semibold text-slate-400 italic">
                                                 <td colSpan={4} className="px-5 py-8 text-center bg-slate-50/10">Nenhum posto de trabalho inserido.</td>
                                              </tr>
                                           )}
                                        </tbody>
                                     </table>
                                  </div>
                               </div>

                               <div className="col-span-4 flex flex-col justify-center">
                                  <div className="bg-slate-50/70 border border-slate-150 rounded-2xl p-6 shadow-xs space-y-4">
                                     <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                                        <div className="w-2 h-4 bg-[#1e4480] rounded-full shrink-0"></div>
                                        <h4 className="text-[10px] font-black text-[#1e4480] uppercase tracking-wider">Diretrizes Operacionais</h4>
                                     </div>
                                     <div className="space-y-3">
                                        {(() => {
                                           const clausulas = proposta.cliente.quadroEfetivoClausulas || [
                                              proposta.cliente.quadroEfetivoClausula1 || 'Em casos de trabalho em feriados ou necessidades de jornada fora do escopo o funcionário deverá ter duas folgas compensatórias em sequência;',
                                              proposta.cliente.quadroEfetivoClausula2 || 'Para reduções no efetivo prazo de 30 (trinta) dias;',
                                              proposta.cliente.quadroEfetivoClausula3 || 'Intervalo para jornadas acima de 6h diárias de no mínimo 60 minutos, entre 4h a 6h o intervalo será de 15 minutos (CLT).'
                                           ];
                                           return clausulas.map((c: string, cIdx: number) => (
                                              <div key={cIdx} className="flex items-start gap-2.5">
                                                 <svg className="w-4 h-4 text-[#1e4480] shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                                                 </svg>
                                                 <p className="text-slate-600 text-[8.5px] font-semibold leading-relaxed">{c}</p>
                                              </div>
                                           ));
                                        })()}
                                     </div>
                                  </div>
                               </div>
                            </div>

                            <div className="flex justify-between items-center border-t border-slate-100 pt-4 mt-auto">
                               <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">www.smartbidhub.com.br</span>
                               <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded">09</span>
                            </div>
                         </div>
                      </div>

                      {/* SLIDE 10 PRINT - ITENS INCLUSOS E EXCLUSÍDOS */}
                      <div className="print-slide w-full aspect-[16/9] border border-slate-200 bg-white p-16 flex flex-col justify-between relative overflow-hidden h-[100vh] text-slate-800">
                         <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30" xmlns="http://www.w3.org/2000/svg">
                            <line x1="-100" y1="100" x2="400" y2="-400" stroke="#F1F5F9" strokeWidth="18" />
                            <line x1="500" y1="900" x2="1200" y2="200" stroke="#F1F5F9" strokeWidth="18" />
                         </svg>

                         <div className="relative z-10 flex flex-col h-full justify-between">
                            <div className="flex justify-between items-center w-full pb-4 border-b border-slate-100">
                               <div className="flex flex-col">
                                  <span className="text-[#1e4480] text-[10px] font-black tracking-[0.2em] uppercase">SILVA CONSULTORIA</span>
                                  <h2 className="text-xl font-black text-[#1e4480] uppercase tracking-tight">ITENS INCLUSOS E EXCLUSÍDOS</h2>
                               </div>
                               <img src={companyLogo} alt="Silva Logo" className="max-h-10 w-auto object-contain" />
                            </div>

                            <div className="my-auto w-full max-w-4xl mx-auto">
                               <div className="w-full bg-white rounded-2xl border border-slate-150 shadow-lg overflow-hidden">
                                  <table className="w-full text-left border-collapse">
                                     <thead>
                                        <tr className="bg-[#1e4480] text-white text-[10px] font-black uppercase tracking-wider border-b border-slate-200">
                                           <th className="px-6 py-3.5 w-32">Item</th>
                                           <th className="px-6 py-3.5">Descrição</th>
                                           <th className="px-6 py-3.5 text-center w-40">Status</th>
                                        </tr>
                                     </thead>
                                     <tbody>
                                        {(proposta.itensInclusosExcluidos || []).map((p: any, idx: number) => (
                                           <tr key={p.id || idx} className={`border-b border-slate-100 text-[10px] font-bold text-slate-700 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/20'}`}>
                                              <td className="px-6 py-3.5 font-black text-slate-500">{String(idx + 1).padStart(2, '0')}</td>
                                              <td className="px-6 py-3.5 font-semibold text-slate-800 leading-normal">{p.descricao}</td>
                                              <td className="px-6 py-3.5 text-center">
                                                 {p.incluso ? (
                                                    <div className="w-7 h-7 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mx-auto shadow-xs">
                                                       <svg className="w-4 h-4 stroke-[3.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path>
                                                       </svg>
                                                    </div>
                                                 ) : (
                                                    <div className="w-7 h-7 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-400 mx-auto opacity-90 shadow-xs">
                                                       <svg className="w-3.5 h-3.5 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
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
                               <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded">10</span>
                            </div>
                         </div>
                      </div>

                      {/* SLIDE 11 PRINT - RESUMO DA PROPOSTA */}
                      {(() => {
                         const fc = formatCurrency;
                         const divisorTributos = resultado?.divisor || 1;
                         const txAdm = (proposta.premissas.taxaAdm || 0) / 100;
                         const txLucro = (proposta.premissas.margemLucro || 0) / 100;
                         
                         const applyCascata = (custo: any) => {
                           const cD = Number(custo) || 0;
                           const comAdm = cD * (1 + txAdm);
                           const comLucro = comAdm * (1 + txLucro);
                           return divisorTributos > 0 ? (comLucro / divisorTributos) : comLucro;
                         };

                         const maoDeObraSubtotal = resultado?.items?.reduce((acc: any, i: any) => acc + (i.precoVenda || 0), 0) || 0;
                         const insumosSubtotal = applyCascata(
                           Number(proposta.insumos.materiais || 0) + 
                           Number(proposta.insumos.maquinas || 0) + 
                           Number(proposta.insumos.descartaveis || 0) + 
                           Number(proposta.insumos.servicos || 0)
                         );

                         const renderInsumoRow = (label: string, value: number) => {
                            const isZero = value === 0;
                            return (
                               <tr key={label} className={`border-b border-slate-100 ${isZero ? 'opacity-40 text-slate-400 bg-slate-50/10' : 'text-slate-700 font-bold'}`}>
                                  <td className="py-3 px-4 font-semibold">{label}</td>
                                  <td className={`py-3 px-4 text-right font-black ${isZero ? 'text-slate-300' : 'text-slate-800'}`}>
                                     {isZero ? '-' : fc(value)}
                                  </td>
                               </tr>
                            );
                         };

                         return (
                            <div className="print-slide w-full aspect-[16/9] border border-slate-200 bg-white p-16 flex flex-col justify-between relative overflow-hidden h-[100vh] text-slate-800">
                               <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30" xmlns="http://www.w3.org/2000/svg">
                                  <line x1="-100" y1="100" x2="400" y2="-400" stroke="#F1F5F9" strokeWidth="18" />
                                  <line x1="500" y1="900" x2="1200" y2="200" stroke="#F1F5F9" strokeWidth="18" />
                               </svg>

                               <div className="relative z-10 flex flex-col h-full justify-between">
                                  <div className="flex justify-between items-center w-full pb-4 border-b border-slate-100">
                                     <div className="flex flex-col">
                                        <span className="text-[#1e4480] text-[10px] font-black tracking-[0.2em] uppercase">SILVA CONSULTORIA</span>
                                        <h2 className="text-xl font-black text-[#1e4480] uppercase tracking-tight">RESUMO DA PROPOSTA COMERCIAL</h2>
                                     </div>
                                     <img src={companyLogo} alt="Silva Logo" className="max-h-10 w-auto object-contain" />
                                  </div>

                                  <div className="my-auto w-full max-w-4xl mx-auto grid grid-cols-12 gap-8 items-stretch">
                                     <div className="col-span-7 bg-white rounded-2xl border border-slate-150 shadow-lg overflow-hidden flex flex-col justify-between">
                                        <table className="w-full text-left border-collapse text-[10px]">
                                           <thead>
                                              <tr className="bg-[#1e4480] text-white text-[10px] font-black uppercase tracking-wider border-b border-slate-200">
                                                 <th className="py-3.5 px-4">Grupo de Custo</th>
                                                 <th className="py-3.5 px-4 text-right">{isSpot ? 'Valor' : 'Valor Mensal'}</th>
                                              </tr>
                                           </thead>
                                           <tbody>
                                              <tr className="border-b border-slate-100 text-slate-700 font-bold">
                                                 <td className="py-3.5 px-4 font-black">Mão de Obra Efetiva (Postos)</td>
                                                 <td className="py-3.5 px-4 text-right font-black text-[#1e4480]">{fc(maoDeObraSubtotal)}</td>
                                              </tr>
                                              {renderInsumoRow('Materiais e Equipamentos', applyCascata(Number(proposta.insumos.materiais || 0) + Number(isSpot ? totalMaquinasNaoLocadas : proposta.insumos.maquinas || 0)))}
                                              {renderInsumoRow('Descartáveis e Higiene', applyCascata(Number(proposta.insumos.descartaveis || 0)))}
                                              {renderInsumoRow(isSpot ? 'Equipamentos Locados' : 'Outros Serviços / Operações', applyCascata(Number(isSpot ? totalMaquinasLocadas : proposta.insumos.servicos || 0)))}
                                           </tbody>
                                        </table>
                                        
                                        <div className="bg-slate-50 border-t border-slate-150 p-4 flex justify-between items-center mt-auto">
                                           <span className="text-[10px] font-black text-[#1e4480] uppercase tracking-wider">{isSpot ? 'Valor Total Proposto' : 'Valor Total Mensal Proposto'}</span>
                                           <span className="text-lg font-black text-[#1b4d3e] bg-emerald-50 border border-emerald-250 px-4 py-1.5 rounded-xl shadow-xs">
                                              {fc(maoDeObraSubtotal + insumosSubtotal)}
                                           </span>
                                        </div>
                                     </div>

                                     <div className="col-span-5 flex flex-col justify-center">
                                        <div className="bg-slate-50/70 border border-slate-150 rounded-2xl p-6 shadow-xs space-y-4">
                                           <div className="flex items-center gap-2 border-b border-slate-255 pb-2">
                                              <div className="w-2 h-4 bg-[#1e4480] rounded-full shrink-0"></div>
                                              <h4 className="text-[10px] font-black text-[#1e4480] uppercase tracking-wider">Premissas do Investimento</h4>
                                           </div>
                                           <div className="space-y-3.5">
                                              <div className="flex items-start gap-2.5">
                                                 <svg className="w-4 h-4 text-[#1e4480] shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                                 </svg>
                                                 <p className="text-slate-600 text-[8.5px] font-semibold leading-relaxed">Os valores propostos contemplam todos os encargos sociais, tributos (PIS, COFINS, ISS), taxas de administração e insumos descritos na proposta;</p>
                                              </div>
                                              <div className="flex items-start gap-2.5">
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
                                     <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded">11</span>
                                  </div>
                               </div>
                            </div>
                         );
                      })()}

                      {/* SLIDE 12 PRINT - CONDIÇÕES DA PROPOSTA */}
                      <div className="print-slide w-full aspect-[16/9] border border-slate-200 bg-white p-16 flex flex-col justify-between relative overflow-hidden h-[100vh] text-slate-800">
                         <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30" xmlns="http://www.w3.org/2000/svg">
                            <line x1="-100" y1="100" x2="400" y2="-400" stroke="#F1F5F9" strokeWidth="18" />
                            <line x1="500" y1="900" x2="1200" y2="200" stroke="#F1F5F9" strokeWidth="18" />
                         </svg>

                         <div className="relative z-10 flex flex-col h-full justify-between">
                            <div className="flex justify-between items-center w-full pb-4 border-b border-slate-100">
                               <div className="flex flex-col">
                                  <span className="text-[#1e4480] text-[10px] font-black tracking-[0.2em] uppercase">SILVA CONSULTORIA</span>
                                  <h2 className="text-xl font-black text-[#1e4480] uppercase tracking-tight">CONDIÇÕES GERAIS DA PROPOSTA</h2>
                               </div>
                               <img src={companyLogo} alt="Silva Logo" className="max-h-10 w-auto object-contain" />
                            </div>

                            
                                   {(() => {
                                      const condsColab = [
                                         proposta.cliente?.condicaoColaboradores1 || "Vale alimentação de R$900,00;",
                                         proposta.cliente?.condicaoColaboradores2 || "Cesta trimestral de assiduidade;",
                                         proposta.cliente?.condicaoColaboradores3 || "2 Vales transporte por dia."
                                      ].filter(Boolean);

                                      const condsCli = [
                                         proposta.cliente?.condicaoCliente1 || "Faturamento dos serviços aos dias 15 ou 30 de cada mês com vencimento nos próximos 15 dias;",
                                         proposta.cliente?.condicaoCliente2 || "Reajuste anual, automático e equivalente ao dissídio da categoria (SIEMACO) todo mês fevereiro de cada ano subsequente;",
                                         proposta.cliente?.condicaoCliente3 || "Próximo reajuste Fevereiro/2026."
                                      ].filter(Boolean);

                                      return (
                                         <div className="my-auto w-full max-w-4xl mx-auto grid grid-cols-2 gap-x-8 gap-y-4">
                                            <div className="bg-slate-50/70 border border-slate-150 rounded-2xl p-5 shadow-xs space-y-3">
                                               <div className="flex items-center gap-2 border-b border-slate-200 pb-1.5">
                                                  <Calendar size={16} className="text-[#1e4480]" />
                                                  <h4 className="text-[10px] font-black text-[#1e4480] uppercase tracking-wider">Prazos e Validade</h4>
                                               </div>
                                               <div className="space-y-2">
                                                  <div className="flex justify-between items-center text-[10px] border-b border-slate-100/50 pb-1.5">
                                                     <span className="text-slate-500 font-bold">Validade da Proposta:</span>
                                                     <span className="text-slate-800 font-black">{proposta.condicoes?.validadeProposta || "15 (quinze) dias"}</span>
                                                  </div>
                                                  <div className="flex justify-between items-center text-[10px] border-b border-slate-100/50 pb-1.5">
                                                     <span className="text-slate-500 font-bold">Prazo de Início dos Serviços:</span>
                                                     <span className="text-slate-800 font-black">{proposta.condicoes?.prazoInicio || "20 (vinte) dias"}</span>
                                                  </div>
                                                  <div className="flex justify-between items-center text-[10px] pb-0.5">
                                                     <span className="text-slate-500 font-bold">Vigência Contratual Mínima:</span>
                                                     <span className="text-slate-800 font-black">{proposta.condicoes?.vigenciaContratual || "12 (doze) meses"}</span>
                                                  </div>
                                               </div>
                                            </div>

                                            <div className="bg-slate-50/70 border border-slate-150 rounded-2xl p-5 shadow-xs space-y-3">
                                               <div className="flex items-center gap-2 border-b border-slate-200 pb-1.5">
                                                  <CreditCard size={16} className="text-[#1e4480]" />
                                                  <h4 className="text-[10px] font-black text-[#1e4480] uppercase tracking-wider">Faturamento e Reajuste</h4>
                                               </div>
                                               <div className="space-y-2">
                                                  <div className="flex justify-between items-center text-[10px] border-b border-slate-100/50 pb-1.5">
                                                     <span className="text-slate-500 font-bold">Prazo de Pagamento:</span>
                                                     <span className="text-slate-800 font-black">{proposta.condicoes?.prazoPagamento || "30 dias líquido"}</span>
                                                  </div>
                                                  <div className="flex justify-between items-center text-[10px] border-b border-slate-100/50 pb-1.5">
                                                     <span className="text-slate-500 font-bold">Base de Reajuste Anual:</span>
                                                     <span className="text-slate-800 font-black">{proposta.condicoes?.baseReajuste || "Convenção Coletiva (CCT) / IPCA"}</span>
                                                  </div>
                                                  <div className="flex justify-between items-center text-[10px] pb-0.5">
                                                     <span className="text-slate-500 font-bold">Garantias e Seguros:</span>
                                                     <span className="text-[#1b4d3e] font-black uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded border border-emerald-150 text-[9px]">Inclusos e Ativos</span>
                                                  </div>
                                               </div>
                                            </div>

                                            <div className="bg-slate-50/70 border border-slate-150 rounded-2xl p-5 shadow-xs space-y-3">
                                               <div className="flex items-center gap-2 border-b border-slate-200 pb-1.5">
                                                  <UserCheck size={16} className="text-[#1e4480]" />
                                                  <h4 className="text-[10px] font-black text-[#1e4480] uppercase tracking-wider">Condições dos Colaboradores</h4>
                                               </div>
                                               <div className="space-y-1">
                                                  {condsColab.map((cond, idx) => (
                                                     <div key={idx} className="text-slate-700 font-semibold text-[9.5px] leading-normal pl-1.5 relative before:content-['•'] before:absolute before:left-0 before:text-[#1b4d3e]">
                                                        {cond}
                                                     </div>
                                                  ))}
                                               </div>
                                            </div>

                                            <div className="bg-slate-50/70 border border-slate-150 rounded-2xl p-5 shadow-xs space-y-3">
                                               <div className="flex items-center gap-2 border-b border-slate-200 pb-1.5">
                                                  <Briefcase size={16} className="text-[#1e4480]" />
                                                  <h4 className="text-[10px] font-black text-[#1e4480] uppercase tracking-wider">Condições para o Cliente</h4>
                                               </div>
                                               <div className="space-y-1">
                                                  {condsCli.map((cond, idx) => (
                                                     <div key={idx} className="text-slate-700 font-semibold text-[9.5px] leading-normal pl-1.5 relative before:content-['•'] before:absolute before:left-0 before:text-[#1b4d3e]">
                                                        {cond}
                                                     </div>
                                                  ))}
                                               </div>
                                            </div>
                                         </div>
                                      );
                                   })()}
                            <div className="flex justify-between items-center border-t border-slate-100 pt-4 mt-auto">
                               <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">www.smartbidhub.com.br</span>
                               <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded font-black">12</span>
                            </div>
                         </div>
                      </div>

                      {/* SLIDE 13 PRINT - ACEITE */}
                      <div className="print-slide w-full aspect-[16/9] border border-slate-200 bg-[#1e4480] p-16 flex flex-col justify-between relative overflow-hidden h-[100vh] text-white">
                         <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" xmlns="http://www.w3.org/2000/svg">
                            <line x1="-50" y1="150" x2="350" y2="-250" stroke="#FFFFFF" strokeWidth="10" />
                            <line x1="600" y1="800" x2="1100" y2="300" stroke="#FFFFFF" strokeWidth="10" />
                         </svg>

                         <div className="relative z-10 flex flex-col h-full justify-between">
                            <div className="flex justify-between items-center w-full pb-4 border-b border-white/20">
                               <div className="flex flex-col">
                                  <span className="text-white/70 text-[10px] font-black tracking-[0.2em] uppercase">SILVA CONSULTORIA</span>
                                  <h2 className="text-xl font-black text-white uppercase tracking-tight">TERMO DE ACEITE E CONTRATAÇÃO</h2>
                               </div>
                               <img src={companyLogo} alt="Silva Logo" className="max-h-10 w-auto object-contain" />
                            </div>

                            <div className="my-auto w-full max-w-4xl mx-auto grid grid-cols-12 gap-8 items-center text-white">
                               <div className="col-span-6 space-y-4">
                                  <h3 className="text-lg font-black tracking-tight leading-snug">Estamos prontos para iniciar a nossa parceria de sucesso!</h3>
                                  <div className="text-white/80 text-[10px] leading-relaxed space-y-2 font-semibold text-justify">
                                     <p>Ao assinar este termo de aceite, o <strong className="text-white font-extrabold">{proposta.cliente.nomeFantasia || proposta.cliente.razaoSocial || "Cliente Não Informado"}</strong> manifesta sua concordância com os valores descritos, premissas de investimento e condições comerciais apresentadas nesta proposta comercial.</p>
                                     <p>Este documento servirá como base oficial para a elaboração do instrumento jurídico definitivo (Contrato de Prestação de Serviços) entre as partes.</p>
                                  </div>
                                  <div className="bg-white/5 border border-white/10 rounded-xl p-3 mt-3.5 space-y-2 text-[9px] font-semibold text-white/90">
                                     <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                        <div className="flex flex-col">
                                           <span className="text-[7.5px] font-black text-white/55 uppercase tracking-wider">Razão Social</span>
                                           <span className="truncate text-white font-bold">{proposta.cliente.razaoSocial || proposta.cliente.cliente || "Não informada"}</span>
                                        </div>
                                        <div className="flex flex-col">
                                           <span className="text-[7.5px] font-black text-white/55 uppercase tracking-wider">CNPJ</span>
                                           <span className="text-white font-bold">{proposta.cliente.cnpj || "Não informado"}</span>
                                        </div>
                                        <div className="flex flex-col">
                                           <span className="text-[7.5px] font-black text-white/55 uppercase tracking-wider">Data de Início</span>
                                           <span className="text-white font-bold">{proposta.cliente.dataInicio || "A definir"}</span>
                                        </div>
                                        <div className="flex flex-col">
                                           <span className="text-[7.5px] font-black text-white/55 uppercase tracking-wider">Data de Vencimento</span>
                                           <span className="text-white font-bold">{proposta.cliente.dataVencimento || "A definir"}</span>
                                        </div>
                                        <div className="flex flex-col col-span-2">
                                           <span className="text-[7.5px] font-black text-white/55 uppercase tracking-wider">Cargo do Contato / Representante</span>
                                           <span className="truncate text-white font-bold">{proposta.cliente.contatoCargo || "Representante Legal"}</span>
                                        </div>
                                     </div>
                                  </div>
                               </div>

                               <div className="col-span-6 grid grid-cols-2 gap-4">
                                  <div className="bg-white/10 rounded-2xl p-5 border border-white/15 shadow-md flex flex-col justify-between h-40">
                                     <div className="flex flex-col">
                                        <span className="text-[10px] font-black tracking-[0.2em] uppercase text-white/90">CONTRATANTE</span>
                                        <span className="text-[8.5px] text-white/70 font-semibold mt-1 truncate">{proposta.cliente.nomeFantasia || proposta.cliente.razaoSocial || "Cliente Não Informado"}</span>
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
                                        <span className="text-[9px] font-black text-white">{proposta.cliente.vendedorNome || "Ádamo Quadros"}</span>
                                        <span className="text-[8px] text-white/50 font-bold uppercase mt-0.5">{proposta.cliente.vendedorCargo || "Novos Negócios"}</span>
                                     </div>
                                  </div>
                               </div>
                            </div>

                            <div className="flex justify-between items-center border-t border-white/20 pt-4 mt-auto">
                               <span className="text-[9px] font-bold text-white/70 uppercase tracking-widest">www.smartbidhub.com.br</span>
                               <span className="text-[9px] font-black text-white bg-white/10 px-2.5 py-0.5 rounded">13</span>
                            </div>
                         </div>
                      </div>
                           </>
                        )}
                      </div>
    </>
  );
}
