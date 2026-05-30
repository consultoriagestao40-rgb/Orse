import React, { useState, useEffect, useRef } from 'react';
import numeroPorExtenso from '@/lib/numeroPorExtenso';

export default function DocumentoA4({ proposta, resultado, empresaEmissora, templates, onUpdateClausulas, onUpdateCliente, onUpdateItens, isPublicView = false }: { proposta: any, resultado: any, empresaEmissora: any, templates?: any[], onUpdateClausulas?: (c: any[]) => void, onUpdateCliente?: (c: any) => void, onUpdateItens?: (i: any[]) => void, isPublicView?: boolean }) {
  const [companyLogo, setCompanyLogo] = useState<string>(
    proposta.tenant?.logoUrl || 'https://via.placeholder.com/300x80?text=Silva+Consultoria'
  );

  useEffect(() => {
    if (proposta.tenant?.logoUrl) {
      setCompanyLogo(proposta.tenant.logoUrl);
    } else if (typeof window !== 'undefined') {
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
  }, [proposta.tenant?.logoUrl]);

  const [showEditorModal, setShowEditorModal] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [scaledHeight, setScaledHeight] = useState<string | number>('auto');
  
  const docRef = useRef<HTMLDivElement | null>(null);

  // Auto-responsividade para telas menores de 840px
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleResize = () => {
        if (window.innerWidth < 840) {
          const computedZoom = (window.innerWidth - 32) / 794;
          setZoomLevel(Math.max(0.35, computedZoom));
        } else {
          setZoomLevel(1);
        }
      };
      
      handleResize();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  // Observador de redimensionamento do documento para ajustar a altura da caixa pai
  useEffect(() => {
    if (docRef.current && typeof window !== 'undefined') {
      const docEl = docRef.current;
      const updateHeight = () => {
        setScaledHeight(docEl.offsetHeight * zoomLevel);
      };
      
      const resizeObserver = new ResizeObserver(updateHeight);
      resizeObserver.observe(docEl);
      
      updateHeight();
      
      return () => resizeObserver.disconnect();
    }
  }, [zoomLevel]);

  if (!proposta || !proposta.cliente) return <div className="p-10 text-center">Carregando dados da proposta...</div>;
  if (!empresaEmissora) return <div className="p-10 text-center">Selecione uma Empresa Emissora para visualizar o documento.</div>;

  // Calculos e formatadores
  const fmt = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  const formatBRDate = (d: string) => {
    if (!d || !d.includes('-')) return d || "-";
    return d.split('-').reverse().join('/');
  };
  
  const equipe = proposta.equipe || [];
  
  // Cascata
  const divisorTributos = resultado?.divisor || 1;
  const txAdm = (proposta.premissas?.taxaAdm || 0) / 100;
  const txLucro = (proposta.premissas?.margemLucro || 0) / 100;
  
  const applyCascata = (custo: any) => {
    const cD = Number(custo) || 0;
    const comAdm = cD * (1 + txAdm);
    const comLucro = comAdm * (1 + txLucro);
    return divisorTributos > 0 ? (comLucro / divisorTributos) : comLucro;
  };

   const isSpot = equipe.some((e: any) => e.tipoItem === 'SPOT');

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

  const totalEquipe = resultado?.items?.reduce((acc: any, i: any) => acc + (i.precoVenda || 0), 0) || 0;
  
  const vMateriais = applyCascata(proposta.insumos?.materiais || 0);
  const vMaquinas = applyCascata(isSpot ? totalMaquinasNaoLocadas : (proposta.insumos?.maquinas || 0));
  const vDescartaveis = applyCascata(proposta.insumos?.descartaveis || 0);
  const vServicos = applyCascata(isSpot ? totalMaquinasLocadas : (proposta.insumos?.servicos || 0));
  
  const totalInsumos = vMateriais + vMaquinas + vDescartaveis + vServicos;
  
  const totalGeral = totalEquipe + totalInsumos;

  const renderTabelaComercial = () => (
    <div className="mt-8 pr-2 font-sans">
        {/* QUADRO EFETIVO */}
        <div className="break-inside-avoid print:break-inside-avoid mb-6">
          <h5 className="font-black uppercase mb-2 text-[10px]">QUADRO EFETIVO / SERVIÇOS</h5>
          <table className="w-full text-left border-collapse border border-slate-300 text-xs">
          <thead>
            <tr className="bg-slate-900 text-white font-bold uppercase text-[10px]">
              <th className="p-2 border border-slate-300">Cargo / Função</th>
              <th className="p-2 border border-slate-300 text-center">Escala</th>
              <th className="p-2 border border-slate-300 text-center">Qtd</th>
              <th className="p-2 border border-slate-300 text-right">Valor Unit.</th>
              <th className="p-2 border border-slate-300 text-right">{isSpot ? 'Valor' : 'Valor Mensal'}</th>
            </tr>
          </thead>
          <tbody>
            {equipe.map((item: any, idx: number) => {
              const precoVendaTotal = resultado?.items?.[idx]?.precoVenda || 0;
              const isSpotItem = item.tipoItem === 'SPOT';
              const qty = isSpotItem ? (item.quantidadeDemanda || 1) : (item.quantidade || 1);
              const precoUnitario = isSpotItem ? (precoVendaTotal / qty) : (item.quantidade > 0 ? precoVendaTotal / item.quantidade : 0);
              
              return (
                <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                  <td className="p-2 border border-slate-300 font-bold text-slate-800">{item.nomeCargo}</td>
                  <td className="p-2 border border-slate-300 text-center text-slate-600">{item.escala}</td>
                  <td className="p-2 border border-slate-300 text-center text-slate-600">{qty}</td>
                  <td className="p-2 border border-slate-300 text-right text-slate-600">{fmt(precoUnitario)}</td>
                  <td className="p-2 border border-slate-300 text-right font-bold text-slate-800">{fmt(precoVendaTotal)}</td>
                </tr>
              );
            })}
            {equipe.length === 0 && (
              <tr><td colSpan={5} className="p-4 text-center text-slate-500 italic">Nenhum posto de serviço adicionado.</td></tr>
            )}
          </tbody>
          <tfoot>
            <tr className="bg-slate-200 font-black text-slate-900">
              <td colSpan={4} className="p-2 border border-slate-300 text-right uppercase">Total dos Serviços:</td>
              <td className="p-2 border border-slate-300 text-right">{fmt(totalEquipe)}</td>
            </tr>
          </tfoot>
        </table>
        </div>

        {/* INSUMOS E MATERIAIS */}
        <div className="break-inside-avoid print:break-inside-avoid mb-6">
          <h5 className="font-black uppercase mb-2 text-[10px]">EQUIPAMENTOS E INSUMOS</h5>
          <table className="w-full text-left border-collapse border border-slate-300 text-xs">
          <thead>
            <tr className="bg-slate-900 text-white font-bold uppercase text-[10px]">
              <th className="p-2 border border-slate-300">Descrição</th>
              <th className="p-2 border border-slate-300 text-right">{isSpot ? 'Valor' : 'Valor Mensal'}</th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-white border-b border-slate-300">
              <td className="p-2 border-r border-slate-300 font-bold text-slate-800">Materiais de Limpeza e Consumo</td>
              <td className="p-2 text-right text-slate-700">{fmt(vMateriais)}</td>
            </tr>
            <tr className="bg-slate-50 border-b border-slate-300">
              <td className="p-2 border-r border-slate-300 font-bold text-slate-800">Máquinas e Equipamentos</td>
              <td className="p-2 text-right text-slate-700">{fmt(vMaquinas)}</td>
            </tr>
            <tr className="bg-white border-b border-slate-300">
              <td className="p-2 border-r border-slate-300 font-bold text-slate-800">Materiais Descartáveis</td>
              <td className="p-2 text-right text-slate-700">{fmt(vDescartaveis)}</td>
            </tr>
            {vServicos > 0 && (
              <tr className="bg-slate-50 border-b border-slate-300">
                <td className="p-2 border-r border-slate-300 font-bold text-slate-800">{isSpot ? "Equipamentos Locados" : (proposta.insumos?.servicosDescricao || "Serviços Terceirizados")}</td>
                <td className="p-2 text-right text-slate-700">{fmt(vServicos)}</td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr className="bg-slate-200 font-black text-slate-900">
              <td className="p-2 border border-slate-300 text-right uppercase">Total de Equipamentos e Insumos:</td>
              <td className="p-2 border border-slate-300 text-right">{fmt(totalInsumos)}</td>
            </tr>
          </tfoot>
        </table>
        </div>

        {/* VALOR TOTAL */}
        <div className="w-full mt-8 p-5 bg-[#1B4D3E] total-premium-card text-white flex justify-between items-center text-center font-black text-base mb-2 uppercase tracking-wide rounded-none border border-emerald-950 shadow-md">
          <span className="text-emerald-300 tracking-wider">VALOR TOTAL DA PROPOSTA:</span>
          <span className="text-2xl text-emerald-400 font-black tracking-tight">{fmt(totalGeral)} {isSpot ? '' : 'Mensal'}</span>
        </div>
        {totalGeral > 0 && (
          <div className="text-center text-[#1B4D3E] font-bold text-[10px] uppercase mb-12 tracking-wider">
            ({numeroPorExtenso.porExtenso(totalGeral, numeroPorExtenso.estilo.monetario)})
          </div>
        )}
    </div>
  );

  const renderTabelaItensInclusosExcluidos = () => {
    return (
      <div className="w-full mt-4 break-inside-avoid print:break-inside-avoid">
        <table className="w-full text-left border-collapse border border-slate-300 break-inside-avoid print:break-inside-avoid">
          <thead>
            <tr className="bg-slate-100 text-[10px] font-bold uppercase tracking-wider border-b border-slate-300">
              <th className="px-4 py-2 border-r border-slate-300 w-16">Item</th>
              <th className="px-4 py-2 border-r border-slate-300">Descrição</th>
              <th className="px-4 py-2 text-center w-32">Status</th>
            </tr>
          </thead>
          <tbody>
            {(proposta.itensInclusosExcluidos || []).map((p: any, idx: number) => (
              <tr key={p.id || idx} className="border-b border-slate-300 text-[10px] text-slate-800">
                <td className="px-4 py-2 border-r border-slate-300 text-slate-600">{String(idx + 1).padStart(2, '0')}</td>
                <td className="px-4 py-2 border-r border-slate-300 font-semibold">{p.descricao}</td>
                <td className="px-4 py-2 text-center font-bold">
                  {p.incluso ? (
                    <span className="text-emerald-600">INCLUSO</span>
                  ) : (
                    <span className="text-rose-600">NÃO INCLUSO</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderTermoDeAceite = (clauseNum: number, startIdx: number) => (
    <div className="mt-4">
      <div className="text-[13px] text-justify space-y-4 mb-6 text-slate-800 leading-relaxed pl-4">
         <p><span className="font-bold mr-1">{clauseNum}.{startIdx + 1}.</span>Ao assinar este termo de aceite, o <strong>{proposta.cliente?.cliente?.toUpperCase() || proposta.cliente?.razaoSocial?.toUpperCase() || "CLIENTE"}</strong> manifesta sua concordância com os valores descritos, premissas de investimento e condições comerciais apresentadas nesta proposta comercial.</p>
         <p><span className="font-bold mr-1">{clauseNum}.{startIdx + 2}.</span>Este documento servirá como base oficial para a elaboração do instrumento jurídico definitivo (Contrato de Prestação de Serviços) entre as partes.</p>
      </div>
      
      <div className="w-full mt-4">
        <table className="w-full text-left border-collapse border border-slate-300 break-inside-avoid print:break-inside-avoid">
          <tbody>
            <tr className="border-b border-slate-300 text-[10px] text-slate-800">
              <td className="px-4 py-2 border-r border-slate-300 font-bold bg-slate-100 w-1/4 uppercase">Razão Social</td>
              <td className="px-4 py-2 font-semibold">{proposta.cliente?.razaoSocial || ""}</td>
            </tr>
            <tr className="border-b border-slate-300 text-[10px] text-slate-800">
              <td className="px-4 py-2 border-r border-slate-300 font-bold bg-slate-100 uppercase">Nome Fantasia</td>
              <td className="px-4 py-2 font-semibold">{proposta.cliente?.cliente || ""}</td>
            </tr>
            <tr className="border-b border-slate-300 text-[10px] text-slate-800">
              <td className="px-4 py-2 border-r border-slate-300 font-bold bg-slate-100 uppercase">CNPJ</td>
              <td className="px-4 py-2 font-semibold">{proposta.cliente?.cnpj || ""}</td>
            </tr>
            <tr className="border-b border-slate-300 text-[10px] text-slate-800">
              <td className="px-4 py-2 border-r border-slate-300 font-bold bg-slate-100 uppercase">Valor</td>
              <td className="px-4 py-2 font-black text-slate-900">{fmt(totalGeral)} {totalGeral > 0 ? `(${numeroPorExtenso.porExtenso(totalGeral, numeroPorExtenso.estilo.monetario)})` : ''}</td>
            </tr>
            <tr className="border-b border-slate-300 text-[10px] text-slate-800">
              <td className="px-4 py-2 border-r border-slate-300 font-bold bg-slate-100 uppercase">Início</td>
              <td className="px-4 py-2 font-semibold">{formatBRDate(proposta.cliente?.dataInicio)}</td>
            </tr>
            <tr className="border-b border-slate-300 text-[10px] text-slate-800">
              <td className="px-4 py-2 border-r border-slate-300 font-bold bg-slate-100 uppercase">Vencimento</td>
              <td className="px-4 py-2 font-semibold">{formatBRDate(proposta.cliente?.dataVencimento)}</td>
            </tr>
            <tr className="border-b border-slate-300 text-[10px] text-slate-800">
              <td className="px-4 py-2 border-r border-slate-300 font-bold bg-slate-100 uppercase">Contato</td>
              <td className="px-4 py-2 font-semibold">{proposta.cliente?.contato || ""}</td>
            </tr>
            <tr className="border-b border-slate-300 text-[10px] text-slate-800">
              <td className="px-4 py-2 border-r border-slate-300 font-bold bg-slate-100 uppercase">Cargo</td>
              <td className="px-4 py-2 font-semibold">{proposta.cliente?.contatoCargo || ""}</td>
            </tr>
            <tr className="border-b border-slate-300 text-[10px] text-slate-800">
              <td className="px-4 py-2 border-r border-slate-300 font-bold bg-slate-100 uppercase">Celular</td>
              <td className="px-4 py-2 font-semibold">{proposta.cliente?.celular || ""}</td>
            </tr>
            <tr className="border-b border-slate-300 text-[10px] text-slate-800">
              <td className="px-4 py-2 border-r border-slate-300 font-bold bg-slate-100 uppercase">E-mail</td>
              <td className="px-4 py-2 font-semibold">{proposta.cliente?.email || ""}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-24 pt-10 grid grid-cols-2 gap-12 text-center break-inside-avoid print:break-inside-avoid max-w-2xl mx-auto font-sans">
         {/* ISSUER / SELLER SIGNATURE */}
         <div className="flex flex-col items-center justify-end">
            {proposta.cliente?.vendedorAvatarUrl ? (
               <img 
                  src={proposta.cliente.vendedorAvatarUrl} 
                  alt={proposta.cliente.vendedorNome || "Vendedor"} 
                  className="w-14 h-14 rounded-full object-cover border border-slate-300 shadow-xs mb-3 shrink-0"
               />
            ) : (
               <div className="w-14 h-14 rounded-full border border-dashed border-slate-300 flex items-center justify-center text-slate-300 text-[10px] mb-3 shrink-0">
                  Foto
               </div>
            )}
            <div className="w-full border-t border-slate-900 pt-2 font-black text-[10px] uppercase">
               {empresaEmissora?.nomeFantasia || "CONTRATADA"}
            </div>
            <div className="mt-1 font-bold text-[10px] text-slate-800">
               {proposta.cliente?.vendedorNome || "Ádamo Quadros"}
            </div>
            <div className="text-[9px] text-slate-500 uppercase tracking-wider">
               {proposta.cliente?.vendedorCargo || "Novos Negócios"}
            </div>
         </div>

         {/* CLIENT SIGNATURE */}
         <div className="flex flex-col items-center justify-end">
            <div className="w-14 h-14 mb-3 shrink-0"></div> {/* Spacer to align with the seller signature */}
            <div className="w-full border-t border-slate-900 pt-2 font-black text-[10px] uppercase">
               {proposta.cliente?.razaoSocial || proposta.cliente?.cliente || "CLIENTE"}
            </div>
            <div className="mt-1 font-bold text-[10px] text-slate-800">
               {proposta.cliente?.contato || "Representante Legal"}
            </div>
            <div className="text-[9px] text-slate-500 uppercase tracking-wider">
               {proposta.cliente?.contatoCargo || "Testemunha / Aceite"}
            </div>
         </div>
      </div>
    </div>
  );

  const moveClausula = (idx: number, dir: 'up' | 'down') => {
    if (!onUpdateClausulas || !proposta.cliente.clausulasA4) return;
    const list = [...proposta.cliente.clausulasA4];
    if (dir === 'up' && idx > 0) {
      [list[idx], list[idx - 1]] = [list[idx - 1], list[idx]];
    } else if (dir === 'down' && idx < list.length - 1) {
      [list[idx], list[idx + 1]] = [list[idx + 1], list[idx]];
    } else {
      return;
    }
    
    const renumbered = list.map((c, newIdx) => {
       const clauseNum = newIdx + 1;
       const rawTitulo = c.titulo.replace(/^(?:CL[ÁA]US[U]?L[A]?|CL[ÁA]US[U]?|CL[ÁA]US)?\s*\d*\s*[\.\-–]?\s*/i, '').trim();
       const novoTitulo = `CLÁUSULA ${String(clauseNum).padStart(2,'0')} - ${rawTitulo}`;
       
       const novoTexto = c.texto.split('\n').map((linha: string) => {
         return linha.replace(/^(\s*)\d+\.(\d+)\.?(\s*)/, (m: any, p1: any, minor: any, p3: any) => {
           return `${p1}${clauseNum}.${minor}.${p3}`;
         });
       }).join('\n');
       
       return { ...c, titulo: novoTitulo, texto: novoTexto };
    });
    
    onUpdateClausulas(renumbered);
  };

  if (isPublicView) {
    return (
      <div className="w-full text-slate-900 text-xs">
        <style dangerouslySetInnerHTML={{__html: `
          /* Overrides globais para modelo sem bordas idêntico ao da minuta */
          table, th, td {
            border: none !important;
          }
          table {
            width: 100% !important;
          }
          thead tr {
            background: transparent !important;
            color: #0f172a !important;
            border-bottom: 2px solid #0f172a !important;
          }
          thead th {
            color: #0f172a !important;
            font-weight: 950 !important;
            text-transform: uppercase !important;
            padding: 8px 4px !important;
          }
          tbody tr {
            background: transparent !important;
            border-bottom: 1px solid #e2e8f0 !important;
          }
          tbody tr:hover {
            background-color: #f8fafc !important;
          }
          tbody td {
            padding: 8px 4px !important;
          }
          tfoot tr {
            background: #f8fafc !important;
            color: #0f172a !important;
            border-top: 2px solid #0f172a !important;
            font-weight: 900 !important;
          }
          tfoot td {
            padding: 8px 4px !important;
          }
          .bg-slate-100 {
            background-color: transparent !important;
          }
          .bg-slate-900 {
            background-color: transparent !important;
            color: #0f172a !important;
          }
          .text-white {
            color: #0f172a !important;
          }
          
          /* Preservar a estilização do bloco de total premium */
          .total-premium-card {
            background-color: #1B4D3E !important;
            border: 1px solid #10b981 !important;
          }
          .total-premium-card span {
            color: #10B981 !important;
          }
          .total-premium-card span.text-2xl {
            color: #10B981 !important;
          }

          @media print {
            @page { margin: 0 !important; size: auto; }
            .no-print, [class*="no-print"] { display: none !important; }
            * {
               -webkit-print-color-adjust: exact !important;
               print-color-adjust: exact !important;
               color-adjust: exact !important;
            }
            html, body, #__next, 
            [class*="min-h-screen"], 
            [class*="overflow-auto"] {
              background: white !important;
              background-color: white !important;
              height: auto !important;
              min-height: 0 !important;
              max-height: none !important;
              overflow: visible !important;
              display: block !important;
              position: static !important;
              padding: 0 !important;
              margin: 0 !important;
            }
            .print-a4-page {
              display: block !important;
              position: relative !important;
              width: 210mm !important;
              margin: 0 auto !important;
              padding: 0 !important;
              box-sizing: border-box !important;
              box-shadow: none !important;
              border: none !important;
              height: auto !important;
              min-height: 0 !important;
              max-height: none !important;
              overflow: visible !important;
            }
            .print-margin-header, .print-margin-footer { height: 20mm; }
            .print-content-cell { padding: 0 20mm !important; }
          }
        `}} />

        <div className="bg-white w-full relative text-slate-900 text-xs">
          <table className="w-full border-collapse">
            <thead>
              <tr><td className="print-margin-header border-none p-0"></td></tr>
            </thead>
            <tbody>
              <tr>
                <td className="print-content-cell px-4 py-6 md:px-12 md:py-10 border-none align-top">
                  
                  {/* CABEÇALHO HORIZONTAL */}
                  <div className="flex items-center justify-between border-b-2 border-slate-900 pb-6 mb-6">
                    <div className="w-32 hidden sm:block"></div>
                    <div className="flex flex-col items-center text-center flex-1">
                      <h1 className="text-lg font-black uppercase tracking-widest">{empresaEmissora.nomeFantasia}</h1>
                      <p className="font-bold mt-1 text-[10px]">CNPJ: {empresaEmissora.cnpj}</p>
                      {empresaEmissora.endereco && <p className="text-[10px]">{empresaEmissora.endereco}</p>}
                      {empresaEmissora.telefone && <p className="text-[10px]">Telefone: {empresaEmissora.telefone}</p>}
                      {empresaEmissora.email && <p className="text-[10px]">Email: {empresaEmissora.email}</p>}
                    </div>
                    <div className="w-32 flex justify-end">
                      <img src={companyLogo} alt="Logo" className="h-12 object-contain" />
                    </div>
                  </div>

                  {/* TÍTULO */}
                  <div className="text-center mb-8">
                    <h2 className="text-base font-black uppercase tracking-tight">PROPOSTA COMERCIAL DE PRESTAÇÃO DE SERVIÇOS</h2>
                    <p className="font-bold mt-2 text-[10px]">Proposta nº {(proposta.cliente?.numeroProposta || "0000").toString().padStart(4, '0')} - Rev. {String(proposta.cliente?.revisao || "01").padStart(2, '0')}</p>
                    <p className="text-[10px]">Data: {proposta.cliente?.dataElaboracao ? proposta.cliente.dataElaboracao.split('-').reverse().join('/') : new Date().toLocaleDateString('pt-BR')}</p>
                  </div>

                  {/* DADOS DO CLIENTE */}
                  <div className="bg-slate-100 border-l-4 border-slate-900 p-4 mb-8">
                    <h3 className="font-bold uppercase mb-3 text-xs text-slate-900">DADOS DO CLIENTE</h3>
                    <div className="flex flex-col gap-1 text-xs text-slate-900">
                      <p><strong>Cliente:</strong> {proposta.cliente?.cliente || proposta.cliente?.razaoSocial}</p>
                      <p><strong>Código:</strong> {proposta.cliente?.codigo ? `CLI-${String(proposta.cliente.codigo).padStart(4, '0')}` : 'Não cadastrado'}</p>
                      <p><strong>CNPJ/CPF:</strong> {proposta.cliente?.cnpj}</p>
                      <p><strong>Endereço:</strong> {proposta.cliente?.endereco || proposta.cliente?.logradouro ? `${proposta.cliente?.logradouro || proposta.cliente?.endereco}${proposta.cliente?.numero ? `, ${proposta.cliente?.numero}` : ''}${proposta.cliente?.bairro ? `, ${proposta.cliente?.bairro}` : ''}${proposta.cliente?.cidade ? `, ${proposta.cliente?.cidade} - ${proposta.cliente?.uf}` : ''}` : proposta.cliente?.cidade}</p>
                      <p><strong>Cidade:</strong> {proposta.cliente?.cidade || ''}</p>
                      <p><strong>Telefone:</strong> {proposta.cliente?.celular || proposta.cliente?.telefone}</p>
                      <p><strong>Email:</strong> {proposta.cliente?.email}</p>
                      <p><strong>Contato:</strong> {proposta.cliente?.contato}</p>
                    </div>
                  </div>

                  {/* CLÁUSULAS */}
                  <h3 className="font-black uppercase mb-4 text-xs text-center border-b-2 border-slate-900 pb-2 mt-8">CLÁUSULAS E CONDIÇÕES</h3>
                  <div className="space-y-4 text-justify">
                    {proposta.cliente?.clausulasA4 && proposta.cliente.clausulasA4.length > 0 ? (
                       <>
                         {proposta.cliente.clausulasA4.map((clausula: any, idx: number) => {
                            const clauseNum = idx + 1;
                            let rawTitulo = clausula.titulo.replace(/^(?:CL[ÁA]US[U]?L[A]?|CL[ÁA]US[U]?|CL[ÁA]US)?\s*\d*\s*[\.\-–]?\s*/i, '').trim();
                            rawTitulo = rawTitulo.replace(/^[\d.\s-]*\s*/, '').trim();
                            const tituloFinal = `${String(clauseNum).padStart(2,'0')} - ${rawTitulo}`;
                            const txt = clausula.texto || '';
                            const hasTabela = txt.includes('[TABELA]');
                            const hasItens = txt.includes('[ITENS]');
                            const hasAceite = txt.includes('[TERMO_ACEITE]');

                            const nomeCliente = proposta.cliente?.nomeFantasia || proposta.cliente?.razaoSocial || '';
                            const textoLimpo = txt
                              .replace(/\[CLIENTE_NOME\]/g, nomeCliente)
                              .replace(/\[NUMERO_PROPOSTA\]/g, proposta.numero || '')
                              .replace(/\[REVISAO\]/g, proposta.cliente?.revisao || `R${String(proposta.versao || 1).padStart(2, '0')}`)
                              .replace(/\[TABELA\]/g, '')
                              .replace(/\[ITENS\]/g, '')
                              .replace(/\[TERMO_ACEITE\]/g, '')
                              .replace(/\[OBJETO_PROPOSTA\]/g, proposta.cliente?.objetoProposta || '')
                              .replace(/\[ESCOPO_TECNICO\]/g, (proposta.cliente?.hasEscopoTecnico && proposta.cliente?.escopoTecnico) ? proposta.cliente.escopoTecnico : '')
                              .replace(/\[CONDICOES_COMERCIAIS\]/g, (proposta.cliente?.condicoesCliente || []).join('\n'))
                              .replace(/\[VALOR_TOTAL\]/g, fmt(totalGeral))
                              .trim();

                            let paragrafos = textoLimpo
                              ? textoLimpo.split(/\n/).filter((p: string) => p.trim() !== '')
                              : [];
                              
                            return (
                              <div key={idx} className={idx > 0 ? "mt-6 break-inside-avoid print:break-inside-avoid" : ""}>
                                <h4 className="font-bold uppercase border-b-2 border-slate-900 pb-2 mb-4">{tituloFinal}</h4>
                                {paragrafos.length > 0 && (
                                  <div className="pl-4 mt-2 mb-4">
                                    {paragrafos.map((p: string, pIdx: number) => (
                                      <p key={pIdx} className="mb-2 text-justify">
                                        <span className="font-bold mr-1">{clauseNum}.{pIdx + 1}.</span>{p.replace(/^\d+\.\d+\.?\s*/, '')}
                                      </p>
                                    ))}
                                  </div>
                                )}
                                
                                {hasTabela && renderTabelaComercial()}
                                {hasItens && renderTabelaItensInclusosExcluidos()}
                                {hasAceite && renderTermoDeAceite(clauseNum, paragrafos.length)}
                              </div>
                            );
                          })}
                       </>
                    ) : (
                      <>
                        {/* Fallback original */}
                        <div>
                          <h4 className="font-bold uppercase">01 - DO OBJETO E ESCOPO</h4>
                          <div className="pl-4 mt-2">
                            {proposta.cliente?.objetoProposta && (
                              <p className="mb-2 text-justify">
                                <span className="font-bold mr-1">1.1.</span>{proposta.cliente.objetoProposta}
                              </p>
                            )}
                            {proposta.cliente?.hasEscopoTecnico && proposta.cliente?.escopoTecnico && (
                              <p className="text-justify">
                                <span className="font-bold mr-1">1.2.</span>{proposta.cliente.escopoTecnico}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-bold uppercase mt-6">02 - DAS CONDIÇÕES COMERCIAIS</h4>
                          <div className="pl-4 mt-2">
                             {proposta.cliente?.condicoesCliente?.map((c: string, i: number) => (
                                <p key={i} className="mb-2 text-justify">
                                  <span className="font-bold mr-1">2.{i+1}.</span>{c}
                                </p>
                             ))}
                             {!proposta.cliente?.condicoesCliente?.length && (
                               <p className="text-justify"><span className="font-bold mr-1">2.1.</span>As condições comerciais seguirão o padrão estipulado em contrato, com vencimento conforme acordado e validade da proposta de 30 dias.</p>
                             )}
                          </div>
                        </div>

                        <div className="mt-6">
                          <h4 className="font-bold uppercase">03 - RESUMO COMERCIAL DA PROPOSTA</h4>
                          <div className="pl-4 mt-2">
                            <p className="text-justify"><span className="font-bold mr-1">3.1.</span>Valores referentes aos serviços prestados, equipe alocada e insumos, conforme detalhamento a seguir:</p>
                          </div>
                          {renderTabelaComercial()}
                        </div>

                        <div className="mt-6 break-inside-avoid print:break-inside-avoid">
                          <h4 className="font-bold uppercase border-b-2 border-slate-900 pb-2 mb-4">04 - ITENS INCLUSOS E EXCLUSOS</h4>
                          {renderTabelaItensInclusosExcluidos()}
                        </div>

                        <div className="mt-16">
                          <h4 className="font-bold uppercase border-b-2 border-slate-900 pb-2 mb-4">05 - TERMO DE ACEITE</h4>
                          {renderTermoDeAceite(5, 0)}
                        </div>
                      </>
                    )}

                    {/* Fallback de Segurança */}
                    {(() => {
                      if (!proposta.cliente?.clausulasA4 || proposta.cliente.clausulasA4.length === 0) return null;
                      const textStr = JSON.stringify(proposta.cliente?.clausulasA4 || []);
                      const temObjeto = proposta.cliente.clausulasA4.some((c: any) => c.titulo.toUpperCase().includes('OBJETO') || c.titulo.toUpperCase().includes('ESCOPO'));
                      const temCondicoes = proposta.cliente.clausulasA4.some((c: any) => c.titulo.toUpperCase().includes('CONDI'));
                      const temAceite = proposta.cliente.clausulasA4.some((c: any) => c.titulo.toUpperCase().includes('ACEITE'));
                      
                      const missObjeto = !textStr.includes('[OBJETO_PROPOSTA]') && !textStr.includes('[ESCOPO_TECNICO]') && !temObjeto;
                      const missCondicoes = !textStr.includes('[CONDICOES_COMERCIAIS]') && !temCondicoes;
                      const missTabela = !textStr.includes('[TABELA]');
                      const missItens = !textStr.includes('[ITENS]');
                      const missAceite = !textStr.includes('[TERMO_ACEITE]') && !temAceite;
                      
                      const clauseOffset = proposta.cliente.clausulasA4.length + 1;
                      let currentFallbackClause = clauseOffset;
                      
                      return (
                        <div className="mt-8 space-y-8">
                          {missObjeto && (
                            <div className="break-inside-avoid print:break-inside-avoid">
                              <h4 className="font-bold uppercase border-b-2 border-slate-900 pb-2 mb-4">
                                {String(currentFallbackClause++).padStart(2,'0')} - DO OBJETO E ESCOPO
                              </h4>
                              <div className="pl-4 mt-2">
                                {proposta.cliente?.objetoProposta && (
                                  <p className="mb-2 text-justify">
                                    <span className="font-bold mr-1">{currentFallbackClause - 1}.1.</span>{proposta.cliente.objetoProposta}
                                  </p>
                                )}
                                {proposta.cliente?.hasEscopoTecnico && proposta.cliente?.escopoTecnico && (
                                  <p className="text-justify">
                                    <span className="font-bold mr-1">{currentFallbackClause - 1}.2.</span>{proposta.cliente.escopoTecnico}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                          {missCondicoes && (
                            <div className="break-inside-avoid print:break-inside-avoid">
                              <h4 className="font-bold uppercase border-b-2 border-slate-900 pb-2 mb-4">
                                {String(currentFallbackClause++).padStart(2,'0')} - DAS CONDIÇÕES COMERCIAIS
                              </h4>
                              <div className="pl-4 mt-2">
                                 {proposta.cliente?.condicoesCliente?.map((c: string, i: number) => (
                                    <p key={i} className="mb-2 text-justify">
                                      <span className="font-bold mr-1">{currentFallbackClause - 1}.{i+1}.</span>{c}
                                    </p>
                                 ))}
                                 {!proposta.cliente?.condicoesCliente?.length && (
                                   <p className="text-justify"><span className="font-bold mr-1">{currentFallbackClause - 1}.1.</span>As condições comerciais seguirão o padrão estipulado em contrato, com vencimento conforme acordado e validade da proposta de 30 dias.</p>
                                 )}
                              </div>
                            </div>
                          )}
                          {missTabela && (
                            <div className="break-inside-avoid print:break-inside-avoid">
                              <h4 className="font-bold uppercase border-b-2 border-slate-900 pb-2 mb-4">
                                {String(currentFallbackClause++).padStart(2,'0')} - RESUMO FINANCEIRO
                              </h4>
                              {renderTabelaComercial()}
                            </div>
                          )}
                          {missItens && (
                            <div className="break-inside-avoid print:break-inside-avoid">
                              <h4 className="font-bold uppercase border-b-2 border-slate-900 pb-2 mb-4">
                                {String(currentFallbackClause++).padStart(2,'0')} - ITENS INCLUSOS E EXCLUSOS
                              </h4>
                              {renderTabelaItensInclusosExcluidos()}
                            </div>
                          )}
                          {missAceite && (
                            <div className="break-inside-avoid print:break-inside-avoid">
                              <h4 className="font-bold uppercase border-b-2 border-slate-900 pb-2 mb-4">
                                {String(currentFallbackClause++).padStart(2,'0')} - TERMO DE ACEITE
                              </h4>
                              {renderTermoDeAceite(currentFallbackClause - 1, 0)}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr><td className="print-margin-footer border-none p-0"></td></tr>
            </tfoot>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-200 min-h-screen py-8 flex flex-col items-center overflow-x-hidden overflow-y-auto print:bg-white print:py-0 w-full">
      
      {/* Botão de Voltar para não bugar o fluxo - Só aparece na tela, não na impressão */}
      <div className="w-full max-w-[210mm] px-4 mb-4 flex justify-between items-center no-print">
        <button onClick={() => window.history.back()} className="px-4 py-2 bg-white rounded-lg shadow text-sm font-bold text-slate-600 hover:bg-slate-50 shrink-0">
          ← Voltar
        </button>
        <div className="flex gap-2 items-center no-mobile-controls">
          <div className="flex items-center gap-1 bg-white rounded-lg shadow px-2 py-1 mr-4 no-print border border-slate-200">
            <button onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.1))} className="w-8 h-8 flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-800 rounded-md font-bold transition-colors" title="Reduzir Zoom">-</button>
            <span className="text-xs font-bold text-slate-600 w-12 text-center">{Math.round(zoomLevel * 100)}%</span>
            <button onClick={() => setZoomLevel(prev => Math.min(2, prev + 0.1))} className="w-8 h-8 flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-800 rounded-md font-bold transition-colors" title="Aumentar Zoom">+</button>
          </div>
          {onUpdateClausulas && (
            <button 
              onClick={() => {
                if (!proposta.cliente.clausulasA4 || proposta.cliente.clausulasA4.length === 0) {
                   const defaultCondicoes = proposta.cliente?.condicoesCliente?.length > 0 
                     ? proposta.cliente.condicoesCliente.join('\n') 
                     : 'As condições comerciais seguirão o padrão estipulado em contrato, com vencimento conforme acordado e validade da proposta de 30 dias.';
                   
                   const txtObjeto = proposta.cliente?.objetoProposta || '';
                   const txtEscopo = (proposta.cliente?.hasEscopoTecnico && proposta.cliente?.escopoTecnico) ? `\n\n${proposta.cliente.escopoTecnico}` : '';
                   
                   onUpdateClausulas([
                     { titulo: 'CLÁUSULA 01 - DO OBJETO E ESCOPO', texto: `${txtObjeto}${txtEscopo}`.trim() },
                     { titulo: 'CLÁUSULA 02 - DAS CONDIÇÕES COMERCIAIS', texto: defaultCondicoes },
                     { titulo: 'CLÁUSULA 03 - RESUMO COMERCIAL DA PROPOSTA', texto: '[TABELA]' },
                     { titulo: 'CLÁUSULA 04 - ITENS INCLUSOS E EXCLUSOS', texto: '[ITENS]' },
                     { titulo: 'CLÁUSULA 05 - TERMO DE ACEITE', texto: '[TERMO_ACEITE]' }
                   ]);
                }
                setShowEditorModal(true);
              }} 
              className="px-6 py-2 bg-amber-500 rounded-lg shadow text-sm font-black text-white hover:bg-amber-600 transition-colors"
            >
              ✏️ Editar Cláusulas
            </button>
          )}
          <button onClick={() => window.print()} className="px-6 py-2 bg-[#1B4D3E] rounded-lg shadow text-sm font-black text-white hover:bg-[#143d31]">
            🖨️ Imprimir PDF
          </button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 840px) {
          .no-mobile-controls {
            display: none !important;
          }
        }
        @media print {
          /* Zera a margem nativa e remove cabeçalho/rodapé do navegador */
          @page { margin: 0 !important; size: auto; }
          
          /* Oculta completamente a barra de controle superior */
          .no-print, [class*="no-print"] {
            display: none !important;
          }
          
          * {
             -webkit-print-color-adjust: exact !important;
             print-color-adjust: exact !important;
             color-adjust: exact !important;
          }

          /* Força todas as tags ancestrais a permitirem altura dinâmica e overflow visível na impressão */
          html, body, #__next, 
          [class*="min-h-screen"], 
          [class*="overflow-auto"], 
          [class*="bg-slate-200"] {
            background: white !important;
            background-color: white !important;
            height: auto !important;
            min-height: 0 !important;
            max-height: none !important;
            overflow: visible !important;
            display: block !important;
            position: static !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          .print-a4-page {
            display: block !important;
            position: relative !important; /* Importante para quebra de página fluida em multiplas folhas! */
            width: 210mm !important;
            margin: 0 auto !important;
            padding: 0 !important;
            box-sizing: border-box !important;
            box-shadow: none !important;
            border: none !important;
            height: auto !important;
            min-height: 0 !important;
            max-height: none !important;
            overflow: visible !important;
          }

          /* Margens e preenchimentos da célula de conteúdo */
          .print-margin-header, .print-margin-footer {
             height: 20mm;
          }
          .print-content-cell {
              padding: 0 20mm !important;
          }
          
          /* Neutralizar os wrappers de escala para a impressão */
          .no-print-height {
            height: auto !important;
            display: block !important;
            overflow: visible !important;
          }
          .no-print-transform {
            transform: none !important;
            display: block !important;
            height: auto !important;
            overflow: visible !important;
          }
        }
      `}} />

      <div 
        className="w-full flex justify-center no-print-height print:h-auto print:overflow-visible" 
        style={{ height: scaledHeight }}
      >
        <div 
          ref={docRef}
          className="transition-transform duration-200 origin-top flex justify-center print:block print:transform-none no-print-transform"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          <div className="print-a4-page bg-white w-[210mm] min-h-[297mm] print:min-h-0 shadow-2xl print:shadow-none relative text-slate-900 text-xs">
          <table className="w-full border-collapse break-inside-avoid print:break-inside-avoid">
          <thead>
            <tr><td className="print-margin-header border-none p-0"></td></tr>
          </thead>
          <tbody>
            <tr>
              <td className="print-content-cell px-16 py-12 print:py-0 border-none align-top">
                
        {/* CABEÇALHO HORIZONTAL */}
        <div className="flex items-center justify-between border-b-2 border-slate-900 pb-6 mb-6">
          {/* Espaçador invisível na esquerda para manter o texto 100% centralizado */}
          <div className="w-40"></div>
          
          {/* DADOS DA EMPRESA CENTRALIZADOS */}
          <div className="flex flex-col items-center text-center flex-1">
            <h1 className="text-xl font-black uppercase tracking-widest">{empresaEmissora.nomeFantasia}</h1>
            <p className="font-bold mt-1">CNPJ: {empresaEmissora.cnpj}</p>
            {empresaEmissora.endereco && <p>{empresaEmissora.endereco}</p>}
            {empresaEmissora.telefone && <p>Telefone: {empresaEmissora.telefone}</p>}
            {empresaEmissora.email && <p>Email: {empresaEmissora.email}</p>}
          </div>

          {/* LOGOTIPO NA DIREITA */}
          <div className="w-40 flex justify-end">
            <img src={companyLogo} alt="Logo" className="h-16 object-contain" />
          </div>
        </div>

        {/* TÍTULO */}
        <div className="text-center mb-8">
          <h2 className="text-lg font-black uppercase tracking-tight">PROPOSTA COMERCIAL DE PRESTAÇÃO DE SERVIÇOS</h2>
          <p className="font-bold mt-2">Proposta nº {(proposta.cliente?.numeroProposta || "0000").toString().padStart(4, '0')} - Rev. {String(proposta.cliente?.revisao || "01").padStart(2, '0')}</p>
          <p>Data: {proposta.cliente?.dataElaboracao ? proposta.cliente.dataElaboracao.split('-').reverse().join('/') : new Date().toLocaleDateString('pt-BR')}</p>
        </div>

        {/* DADOS DO CLIENTE - EXATO MODELO ORIGINAL */}
        <div className="bg-slate-100 border-l-4 border-slate-900 p-4 mb-8">
          <h3 className="font-bold uppercase mb-3 text-sm text-slate-900">DADOS DO CLIENTE</h3>
          <div className="flex flex-col gap-1 text-[13px] text-slate-900">
            <p><strong>Cliente:</strong> {proposta.cliente?.cliente || proposta.cliente?.razaoSocial}</p>
            <p><strong>Código:</strong> {proposta.cliente?.codigo ? `CLI-${String(proposta.cliente.codigo).padStart(4, '0')}` : 'Não cadastrado'}</p>
            <p><strong>CNPJ/CPF:</strong> {proposta.cliente?.cnpj}</p>
            <p><strong>Endereço:</strong> {proposta.cliente?.endereco || proposta.cliente?.logradouro ? `${proposta.cliente?.logradouro || proposta.cliente?.endereco}${proposta.cliente?.numero ? `, ${proposta.cliente?.numero}` : ''}${proposta.cliente?.bairro ? `, ${proposta.cliente?.bairro}` : ''}${proposta.cliente?.cidade ? `, ${proposta.cliente?.cidade} - ${proposta.cliente?.uf}` : ''}` : proposta.cliente?.cidade}</p>
            <p><strong>Cidade:</strong> {proposta.cliente?.cidade || ''}</p>
            <p><strong>Telefone:</strong> {proposta.cliente?.celular || proposta.cliente?.telefone}</p>
            <p><strong>Email:</strong> {proposta.cliente?.email}</p>
            <p><strong>Contato:</strong> {proposta.cliente?.contato}</p>
          </div>
        </div>

        {/* CLÁUSULAS */}
        <h3 className="font-black uppercase mb-4 text-sm text-center border-b-2 border-slate-900 pb-2 mt-8">CLÁUSULAS E CONDIÇÕES</h3>
        <div className="space-y-4 text-justify">
          {proposta.cliente?.clausulasA4 && proposta.cliente.clausulasA4.length > 0 ? (
             <>
               {proposta.cliente.clausulasA4.map((clausula: any, idx: number) => {
                  const clauseNum = idx + 1;
                  // Limpa prefixos como "CLÁUSULA 1 -", "1.", "1 -", etc.
                  let rawTitulo = clausula.titulo.replace(/^(?:CL[ÁA]US[U]?L[A]?|CL[ÁA]US[U]?|CL[ÁA]US)?\s*\d*\s*[\.\-–]?\s*/i, '').trim();
                  rawTitulo = rawTitulo.replace(/^[\d.\s-]*\s*/, '').trim();
                  
                  const tituloFinal = `${String(clauseNum).padStart(2,'0')} - ${rawTitulo}`;
                  
                  const txt = clausula.texto || '';
                  const hasTabela = txt.includes('[TABELA]');
                  const hasItens = txt.includes('[ITENS]');
                  const hasAceite = txt.includes('[TERMO_ACEITE]');

                  // Substituir todas as tags dinâmicas
                  const nomeCliente = proposta.cliente?.nomeFantasia || proposta.cliente?.razaoSocial || '';
                  
                  const textoLimpo = txt
                    .replace(/\[CLIENTE_NOME\]/g, nomeCliente)
                    .replace(/\[NUMERO_PROPOSTA\]/g, proposta.numero || '')
                    .replace(/\[REVISAO\]/g, proposta.cliente?.revisao || `R${String(proposta.versao || 1).padStart(2, '0')}`)
                    .replace(/\[TABELA\]/g, '')
                    .replace(/\[ITENS\]/g, '')
                    .replace(/\[TERMO_ACEITE\]/g, '')
                    .replace(/\[OBJETO_PROPOSTA\]/g, proposta.cliente?.objetoProposta || '')
                    .replace(/\[ESCOPO_TECNICO\]/g, (proposta.cliente?.hasEscopoTecnico && proposta.cliente?.escopoTecnico) ? proposta.cliente.escopoTecnico : '')
                    .replace(/\[CONDICOES_COMERCIAIS\]/g, (proposta.cliente?.condicoesCliente || []).join('\n'))
                    .replace(/\[VALOR_TOTAL\]/g, fmt(totalGeral))
                    .trim();

                  let paragrafos = textoLimpo
                    ? textoLimpo.split(/\n/).filter((p: string) => p.trim() !== '')
                    : [];
                    
                  return (
                    <div key={idx} className={idx > 0 ? "mt-6 break-inside-avoid print:break-inside-avoid" : ""}>
                      <h4 className="font-bold uppercase border-b-2 border-slate-900 pb-2 mb-4">{tituloFinal}</h4>
                      {paragrafos.length > 0 && (
                        <div className="pl-4 mt-2 mb-4">
                          {paragrafos.map((p: string, pIdx: number) => (
                            <p key={pIdx} className="mb-2 text-justify">
                              <span className="font-bold mr-1">{clauseNum}.{pIdx + 1}.</span>{p.replace(/^\d+\.\d+\.?\s*/, '')}
                            </p>
                          ))}
                        </div>
                      )}
                      
                      {hasTabela && renderTabelaComercial()}
                      {hasItens && renderTabelaItensInclusosExcluidos()}
                      {hasAceite && renderTermoDeAceite(clauseNum, paragrafos.length)}
                    </div>
                  );
                })}
             </>
          ) : (
            <>
              <div>
                <h4 className="font-bold uppercase">01 - DO OBJETO E ESCOPO</h4>
                <div className="pl-4 mt-2">
                  {proposta.cliente?.objetoProposta && (
                    <p className="mb-2 text-justify">
                      <span className="font-bold mr-1">1.1.</span>{proposta.cliente.objetoProposta}
                    </p>
                  )}
                  {proposta.cliente?.hasEscopoTecnico && proposta.cliente?.escopoTecnico && (
                    <p className="text-justify">
                      <span className="font-bold mr-1">1.2.</span>{proposta.cliente.escopoTecnico}
                    </p>
                  )}
                </div>
              </div>
              
              <div>
                <h4 className="font-bold uppercase mt-6">02 - DAS CONDIÇÕES COMERCIAIS</h4>
                <div className="pl-4 mt-2">
                   {proposta.cliente?.condicoesCliente?.map((c: string, i: number) => (
                      <p key={i} className="mb-2 text-justify">
                        <span className="font-bold mr-1">2.{i+1}.</span>{c}
                      </p>
                   ))}
                   {!proposta.cliente?.condicoesCliente?.length && (
                     <p className="text-justify"><span className="font-bold mr-1">2.1.</span>As condições comerciais seguirão o padrão estipulado em contrato, com vencimento conforme acordado e validade da proposta de 30 dias.</p>
                   )}
                </div>
              </div>

              <div className="mt-6">
                <h4 className="font-bold uppercase">03 - RESUMO COMERCIAL DA PROPOSTA</h4>
                <div className="pl-4 mt-2">
                  <p className="text-justify"><span className="font-bold mr-1">3.1.</span>Valores referentes aos serviços prestados, equipe alocada e insumos, conforme detalhamento a seguir:</p>
                </div>
                {renderTabelaComercial()}
              </div>

              <div className="mt-6 break-inside-avoid print:break-inside-avoid">
                <h4 className="font-bold uppercase border-b-2 border-slate-900 pb-2 mb-4">04 - ITENS INCLUSOS E EXCLUSOS</h4>
                {renderTabelaItensInclusosExcluidos()}
              </div>

              <div className="mt-16">
                <h4 className="font-bold uppercase border-b-2 border-slate-900 pb-2 mb-4">05 - TERMO DE ACEITE</h4>
                {renderTermoDeAceite(5, 0)}
              </div>
            </>
          )}

          {/* Fallback de Segurança: Se as tabelas não foram injetadas pelas tags, injetamos no final (apenas se houver clausulas) */}
          {(() => {
            if (!proposta.cliente?.clausulasA4 || proposta.cliente.clausulasA4.length === 0) return null;
            
            const textStr = JSON.stringify(proposta.cliente?.clausulasA4 || []);
            const temObjeto = proposta.cliente.clausulasA4.some((c: any) => c.titulo.toUpperCase().includes('OBJETO') || c.titulo.toUpperCase().includes('ESCOPO'));
            const temCondicoes = proposta.cliente.clausulasA4.some((c: any) => c.titulo.toUpperCase().includes('CONDI'));
            const temAceite = proposta.cliente.clausulasA4.some((c: any) => c.titulo.toUpperCase().includes('ACEITE'));
            
            const missObjeto = !textStr.includes('[OBJETO_PROPOSTA]') && !textStr.includes('[ESCOPO_TECNICO]') && !temObjeto;
            const missCondicoes = !textStr.includes('[CONDICOES_COMERCIAIS]') && !temCondicoes;
            const missTabela = !textStr.includes('[TABELA]');
            const missItens = !textStr.includes('[ITENS]');
            const missAceite = !textStr.includes('[TERMO_ACEITE]') && !temAceite;
            
            const clauseOffset = proposta.cliente.clausulasA4.length + 1;
            let currentFallbackClause = clauseOffset;
            
            return (
              <div className="mt-8 space-y-8">
                {missObjeto && (
                  <div className="break-inside-avoid print:break-inside-avoid">
                    <h4 className="font-bold uppercase border-b-2 border-slate-900 pb-2 mb-4">
                      {String(currentFallbackClause++).padStart(2,'0')} - DO OBJETO E ESCOPO
                    </h4>
                    <div className="pl-4 mt-2">
                      {proposta.cliente?.objetoProposta && (
                        <p className="mb-2 text-justify">
                          <span className="font-bold mr-1">{currentFallbackClause - 1}.1.</span>{proposta.cliente.objetoProposta}
                        </p>
                      )}
                      {proposta.cliente?.hasEscopoTecnico && proposta.cliente?.escopoTecnico && (
                        <p className="text-justify">
                          <span className="font-bold mr-1">{currentFallbackClause - 1}.2.</span>{proposta.cliente.escopoTecnico}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                {missCondicoes && (
                  <div className="break-inside-avoid print:break-inside-avoid">
                    <h4 className="font-bold uppercase border-b-2 border-slate-900 pb-2 mb-4">
                      {String(currentFallbackClause++).padStart(2,'0')} - DAS CONDIÇÕES COMERCIAIS
                    </h4>
                    <div className="pl-4 mt-2">
                       {proposta.cliente?.condicoesCliente?.map((c: string, i: number) => (
                          <p key={i} className="mb-2 text-justify">
                            <span className="font-bold mr-1">{currentFallbackClause - 1}.{i+1}.</span>{c}
                          </p>
                       ))}
                       {!proposta.cliente?.condicoesCliente?.length && (
                         <p className="text-justify"><span className="font-bold mr-1">{currentFallbackClause - 1}.1.</span>As condições comerciais seguirão o padrão estipulado em contrato, com vencimento conforme acordado e validade da proposta de 30 dias.</p>
                       )}
                    </div>
                  </div>
                )}
                {missTabela && (
                  <div className="break-inside-avoid print:break-inside-avoid">
                    <h4 className="font-bold uppercase border-b-2 border-slate-900 pb-2 mb-4">
                      {String(currentFallbackClause++).padStart(2,'0')} - RESUMO FINANCEIRO
                    </h4>
                    {renderTabelaComercial()}
                  </div>
                )}
                {missItens && (
                  <div className="break-inside-avoid print:break-inside-avoid">
                    <h4 className="font-bold uppercase border-b-2 border-slate-900 pb-2 mb-4">
                      {String(currentFallbackClause++).padStart(2,'0')} - ITENS INCLUSOS E EXCLUSOS
                    </h4>
                    {renderTabelaItensInclusosExcluidos()}
                  </div>
                )}
                {missAceite && (
                  <div className="break-inside-avoid print:break-inside-avoid">
                    <h4 className="font-bold uppercase border-b-2 border-slate-900 pb-2 mb-4">
                      {String(currentFallbackClause++).padStart(2,'0')} - TERMO DE ACEITE
                    </h4>
                    {renderTermoDeAceite(currentFallbackClause - 1, 0)}
                  </div>
                )}
              </div>
            );
          })()}

        </div>
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr><td className="print-margin-footer border-none p-0"></td></tr>
          </tfoot>
        </table>
        </div>
      </div>
    </div>

      {/* MODAL DE EDIÇÃO DE CLÁUSULAS */}
      {showEditorModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-6 no-print">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-[#1e4480] px-6 py-4 border-b border-[#16325e] flex justify-between items-center shrink-0">
               <h3 className="text-white text-sm font-extrabold uppercase tracking-wider flex items-center gap-2">
                  ✏️ Editar Cláusulas do Contrato
               </h3>
               <button 
                 onClick={() => setShowEditorModal(false)}
                 className="text-white hover:text-red-300 font-bold text-xl leading-none"
               >
                 ×
               </button>
            </div>
            
            <div className="p-6 overflow-y-auto bg-slate-100 flex-1 space-y-6">
              
              {/* Template Selector */}
              {templates && templates.length > 0 && (
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                  <label className="text-[10px] font-black text-[#1e4480] uppercase tracking-widest block mb-2">Carregar Template Rápido</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2 text-xs text-slate-800 font-bold focus:outline-none focus:border-[#1e4480]"
                    onChange={(e) => {
                      const t = templates.find(x => x.id === e.target.value);
                      if (t && onUpdateClausulas) {
                        if(confirm('Isso vai substituir suas cláusulas atuais. Continuar?')) {
                          const base = t.clausulas.map((c:any) => ({ titulo: c.titulo, texto: c.texto }));
                          if (base.length > 0) {
                            base[0] = { titulo: 'CLÁUSULA 01 - DO OBJETO E ESCOPO', texto: proposta.cliente.objetoProposta || '' };
                            if (base.length > 1) {
                              base[1] = { titulo: 'CLÁUSULA 02 - DO ESCOPO TÉCNICO', texto: proposta.cliente.escopoTecnico || '' };
                            }
                            if (base.length > 2 && !base.some((c:any) => c.texto.includes('[TABELA]'))) {
                              base[2] = { titulo: 'CLÁUSULA 03 - DAS CONDIÇÕES COMERCIAIS', texto: '[TABELA]' };
                            }
                            // Preserva ou adiciona as tags especiais
                            if (!base.some((c:any) => c.texto.includes('[ITENS]'))) {
                              base.push({ titulo: 'CLÁUSULA 04 - ITENS INCLUSOS E EXCLUSOS', texto: '[ITENS]' });
                            }
                            if (!base.some((c:any) => c.texto.includes('[TERMO_ACEITE]'))) {
                              base.push({ titulo: 'CLÁUSULA 05 - TERMO DE ACEITE', texto: '[TERMO_ACEITE]' });
                            }
                          }
                          onUpdateClausulas(base);
                        }
                      }
                      e.target.value = "";
                    }}
                  >
                    <option value="" className="text-slate-800 bg-white">-- Selecione para substituir --</option>
                    {templates.map(t => <option key={t.id} value={t.id} className="text-slate-800 bg-white">{t.nome}</option>)}
                  </select>
                </div>
              )}

              {/* Lista de Cláusulas */}
              <div className="space-y-4">
                 <div className="flex justify-between items-center border-b border-slate-300 pb-2">
                    <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                       Cláusulas Atuais
                    </h4>
                    <button 
                      onClick={() => {
                        if (onUpdateClausulas) {
                          const list = [...(proposta.cliente.clausulasA4 || [])];
                          list.push({ titulo: `NOVA CLÁUSULA`, texto: '' });
                          onUpdateClausulas(list);
                        }
                      }}
                      className="text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-colors"
                    >
                      + Adicionar Cláusula
                    </button>
                 </div>
                 
                 {(proposta.cliente.clausulasA4 || []).map((clausula: any, idx: number) => (
                   <div key={idx} className="bg-white border border-slate-300 p-4 rounded-xl space-y-3 relative shadow-sm">
                      <div className="absolute top-4 right-4 flex items-center gap-2">
                        <button 
                          onClick={() => moveClausula(idx, 'up')}
                          disabled={idx === 0}
                          className="text-slate-400 hover:text-blue-500 disabled:opacity-30 transition-colors"
                          title="Mover para cima"
                        >
                          ⬆️
                        </button>
                        <button 
                          onClick={() => moveClausula(idx, 'down')}
                          disabled={idx === (proposta.cliente.clausulasA4.length - 1)}
                          className="text-slate-400 hover:text-blue-500 disabled:opacity-30 transition-colors"
                          title="Mover para baixo"
                        >
                          ⬇️
                        </button>
                        <button 
                          onClick={() => {
                            if (onUpdateClausulas) {
                              const list = [...proposta.cliente.clausulasA4];
                              list.splice(idx, 1);
                              onUpdateClausulas(list);
                            }
                          }}
                          className="text-slate-400 hover:text-red-500 ml-2 transition-colors"
                          title="Remover Cláusula"
                        >
                          ✕
                        </button>
                      </div>
                      <div>
                        <input 
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg text-sm px-4 py-2.5 font-bold focus:outline-none focus:border-[#1e4480]"
                          value={clausula.titulo}
                          placeholder="Ex: DO OBJETO"
                          onChange={(e) => {
                            if (onUpdateClausulas) {
                              const list = [...proposta.cliente.clausulasA4];
                              list[idx] = { ...list[idx], titulo: e.target.value };
                              onUpdateClausulas(list);
                            }
                          }}
                        />
                      </div>
                      <div>
                        <textarea 
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg text-sm px-4 py-3 min-h-[120px] resize-y focus:outline-none focus:border-[#1e4480]"
                          value={clausula.texto}
                          placeholder="Digite o texto da cláusula... Ou use as tags: [TABELA], [ITENS], [TERMO_ACEITE]"
                          onChange={(e) => {
                            if (onUpdateClausulas) {
                              const list = [...proposta.cliente.clausulasA4];
                              list[idx].texto = e.target.value;
                              onUpdateClausulas(list);
                            }
                          }}
                        />
                      </div>
                      {clausula.texto.includes('[TERMO_ACEITE]') && onUpdateCliente && (
                         <div className="mt-4 bg-indigo-50/50 border border-indigo-100 p-4 rounded-xl shadow-sm">
                            <h5 className="text-[10px] font-black text-indigo-800 uppercase mb-3 flex items-center gap-1.5">
                              <span className="text-sm">📝</span> Dados Exclusivos do Termo de Aceite
                            </h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                               <div>
                                 <label className="text-[9px] font-bold text-slate-500 uppercase ml-1">Razão Social</label>
                                 <input className="w-full text-xs px-3 py-2 bg-white rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-300 font-semibold" value={proposta.cliente.razaoSocial || ''} onChange={e => onUpdateCliente({...proposta.cliente, razaoSocial: e.target.value})} />
                               </div>
                               <div>
                                 <label className="text-[9px] font-bold text-slate-500 uppercase ml-1">Nome Fantasia</label>
                                 <input className="w-full text-xs px-3 py-2 bg-white rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-300 font-semibold" value={proposta.cliente.cliente || ''} onChange={e => onUpdateCliente({...proposta.cliente, cliente: e.target.value})} />
                               </div>
                               <div>
                                 <label className="text-[9px] font-bold text-slate-500 uppercase ml-1">CNPJ</label>
                                 <input className="w-full text-xs px-3 py-2 bg-white rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-300 font-semibold" value={proposta.cliente.cnpj || ''} onChange={e => onUpdateCliente({...proposta.cliente, cnpj: e.target.value})} />
                               </div>
                               <div>
                                 <label className="text-[9px] font-bold text-slate-500 uppercase ml-1">E-mail</label>
                                 <input className="w-full text-xs px-3 py-2 bg-white rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-300 font-semibold" value={proposta.cliente.email || ''} onChange={e => onUpdateCliente({...proposta.cliente, email: e.target.value})} />
                               </div>
                               <div>
                                 <label className="text-[9px] font-bold text-slate-500 uppercase ml-1">Data de Início</label>
                                 <input type="date" className="w-full text-xs px-3 py-2 bg-white rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-300 font-semibold" value={proposta.cliente.dataInicio || ''} onChange={e => onUpdateCliente({...proposta.cliente, dataInicio: e.target.value})} placeholder="DD/MM/AAAA" />
                               </div>
                               <div>
                                 <label className="text-[9px] font-bold text-slate-500 uppercase ml-1">Data de Vencimento</label>
                                 <input type="date" className="w-full text-xs px-3 py-2 bg-white rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-300 font-semibold" value={proposta.cliente.dataVencimento || ''} onChange={e => onUpdateCliente({...proposta.cliente, dataVencimento: e.target.value})} placeholder="DD/MM/AAAA" />
                               </div>
                               <div>
                                 <label className="text-[9px] font-bold text-slate-500 uppercase ml-1">Nome do Contato</label>
                                 <input className="w-full text-xs px-3 py-2 bg-white rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-300 font-semibold" value={proposta.cliente.contato || ''} onChange={e => onUpdateCliente({...proposta.cliente, contato: e.target.value})} />
                               </div>
                               <div>
                                 <label className="text-[9px] font-bold text-slate-500 uppercase ml-1">Cargo do Contato</label>
                                 <input className="w-full text-xs px-3 py-2 bg-white rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-300 font-semibold" value={proposta.cliente.contatoCargo || ''} onChange={e => onUpdateCliente({...proposta.cliente, contatoCargo: e.target.value})} />
                               </div>
                               <div>
                                 <label className="text-[9px] font-bold text-slate-500 uppercase ml-1">Celular</label>
                                 <input className="w-full text-xs px-3 py-2 bg-white rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-300 font-semibold" value={proposta.cliente.celular || ''} onChange={e => onUpdateCliente({...proposta.cliente, celular: e.target.value})} />
                               </div>
                            </div>
                         </div>
                      )}
                      
                      {clausula.texto.includes('[ITENS]') && onUpdateItens && (
                         <div className="mt-4 bg-emerald-50/50 border border-emerald-100 p-4 rounded-xl shadow-sm">
                            <div className="flex justify-between items-center mb-3">
                               <h5 className="text-[10px] font-black text-emerald-800 uppercase flex items-center gap-1.5">
                                 <span className="text-sm">📦</span> Itens Inclusos e Exclusos
                               </h5>
                               <button 
                                  onClick={() => {
                                    const newId = String(Date.now());
                                    const newList = [...(proposta.itensInclusosExcluidos || []), { id: newId, descricao: 'Novo Item...', incluso: true }];
                                    onUpdateItens(newList);
                                  }}
                                  className="text-[9px] font-bold bg-emerald-600 text-white px-3 py-1.5 rounded-md hover:bg-emerald-700 transition-colors shadow-sm"
                               >
                                 + NOVO ITEM
                               </button>
                            </div>
                            <div className="space-y-2">
                               {(proposta.itensInclusosExcluidos || []).map((item: any, iIdx: number) => (
                                  <div key={item.id || iIdx} className="flex items-center gap-3 bg-white p-2.5 rounded-lg border border-emerald-100 shadow-sm">
                                     <span className="text-[10px] font-black text-emerald-800 w-5 text-center">{String(iIdx + 1).padStart(2,'0')}</span>
                                     <input 
                                        className="flex-1 text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded focus:outline-none focus:border-emerald-500 font-medium text-slate-700" 
                                        value={item.descricao || ''}
                                        onChange={e => {
                                           const newList = [...proposta.itensInclusosExcluidos];
                                           newList[iIdx] = { ...newList[iIdx], descricao: e.target.value };
                                           onUpdateItens(newList);
                                        }}
                                     />
                                     <label className="flex items-center gap-1.5 cursor-pointer select-none">
                                        <input 
                                           type="checkbox" 
                                           className="w-3.5 h-3.5 text-emerald-600 focus:ring-emerald-600 border-slate-300 rounded cursor-pointer" 
                                           checked={!!item.incluso}
                                           onChange={e => {
                                              const newList = [...proposta.itensInclusosExcluidos];
                                              newList[iIdx] = { ...newList[iIdx], incluso: e.target.checked };
                                              onUpdateItens(newList);
                                           }}
                                        />
                                        <span className="text-[9px] font-bold text-slate-600 tracking-wide uppercase">Incluso</span>
                                     </label>
                                     <button 
                                        onClick={() => {
                                           const newList = [...proposta.itensInclusosExcluidos];
                                           newList.splice(iIdx, 1);
                                           onUpdateItens(newList);
                                        }}
                                        className="text-rose-400 hover:text-rose-600 font-bold text-sm px-2 transition-colors"
                                        title="Remover Item"
                                     >✕</button>
                                  </div>
                               ))}
                            </div>
                         </div>
                      )}
                   </div>
                 ))}
                 
                 {(proposta.cliente.clausulasA4?.length || 0) === 0 && (
                   <div className="text-center p-8 bg-white border border-slate-200 rounded-xl">
                     <p className="text-slate-500 text-sm font-medium">Nenhuma cláusula definida.</p>
                     <p className="text-slate-400 text-xs mt-1">Carregue um template acima ou adicione manualmente.</p>
                   </div>
                 )}
              </div>
            </div>
            
            <div className="bg-white p-4 border-t border-slate-200 flex justify-end shrink-0">
               <button 
                 onClick={() => setShowEditorModal(false)}
                 className="px-6 py-2.5 bg-[#1e4480] text-white font-bold rounded-lg hover:bg-[#16325e] transition-colors"
               >
                 Concluído
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
