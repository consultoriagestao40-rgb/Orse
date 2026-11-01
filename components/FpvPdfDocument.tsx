'use client';

import React from 'react';

interface FpvPdfDocumentProps {
  mode: 'ALL' | string; // 'ALL' para todas as telas ou id da aba ('dados', 'premissas', etc.)
  proposta: any;
  resultado: any;
  empresaEmissora?: any;
  companyLogo?: string;
  companyName?: string;
  escalasDb?: any[];
}

function formatCurrency(val: any): string {
  const n = Number(val) || 0;
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatPercent(val: any): string {
  const n = Number(val) || 0;
  return `${n.toFixed(2)}%`;
}

export default function FpvPdfDocument({
  mode,
  proposta,
  resultado,
  empresaEmissora,
  companyLogo,
  companyName = 'SmartBid Hub',
  escalasDb = []
}: FpvPdfDocumentProps) {
  if (!mode) return null;

  const numRaw = proposta?.cliente?.numeroProposta;
  const num = numRaw ? `FPV-${String(numRaw).padStart(3, '0')}` : 'FPV-XXX';
  const rev = proposta?.cliente?.revisao || 'R01';
  const clientName = proposta?.cliente?.cliente || proposta?.cliente?.razaoSocial || 'Cliente';
  const isSpot = proposta?.cliente?.tipoProposta === 'SPOT';

  const shouldRender = (tabId: string) => {
    if (mode === 'ALL') return true;
    return mode === tabId;
  };

  // Barra de título de seção compacta e colada com a tabela seguinte (evita quebra órfã)
  const renderSectionHeader = (sectionTitle: string, sectionNumber: string) => (
    <div className="fpv-header-banner bg-[#1B4D3E] text-white px-2.5 py-0.5 font-bold text-[10px] uppercase tracking-wider rounded-t flex items-center justify-between mt-2 mb-0">
      <span>{sectionNumber}. {sectionTitle}</span>
      <span className="text-[8px] text-emerald-200 font-mono font-medium">{num} • Rev. {rev}</span>
    </div>
  );

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @media screen {
          #fpv-pdf-export-root {
            display: none !important;
          }
        }

        @media print {
          body * {
            visibility: hidden !important;
          }
          #fpv-pdf-export-root, #fpv-pdf-export-root * {
            visibility: visible !important;
          }
          #fpv-pdf-export-root {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: white !important;
            display: block !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          @page {
            size: A4 portrait;
            margin: 7mm 7mm 7mm 7mm !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          /* Fluxo 100% contínuo: sem forçar quebras de página nem bloquear blocos grandes */
          .fpv-header-banner {
            break-after: avoid !important;
            page-break-after: avoid !important;
          }
          thead {
            display: table-header-group !important;
          }
          tr {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          table {
            break-inside: auto !important;
            page-break-inside: auto !important;
            border-collapse: collapse !important;
            width: 100% !important;
          }
        }
      `}} />

      <div id="fpv-pdf-export-root" className="text-slate-900 font-sans text-xs">
        
        {/* CABEÇALHO CORPORATIVO PRINCIPAL */}
        <div className="border-b-2 border-[#1B4D3E] pb-1.5 mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {companyLogo ? (
              <img src={companyLogo} alt={companyName} className="h-8 max-w-[130px] object-contain" />
            ) : (
              <div className="font-black text-xs text-[#1B4D3E] uppercase tracking-wider">{companyName}</div>
            )}
            <div className="border-l border-slate-300 pl-2.5">
              <div className="text-[10px] font-black uppercase text-[#1B4D3E]">
                FPV • Formação de Preço de Vendas
              </div>
              <div className="text-[8.5px] text-slate-500 font-semibold">
                {num} • Rev. {rev} • {clientName}
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="bg-[#1B4D3E] text-white px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider">
              {mode === 'ALL' ? 'FPV Completo' : `Aba: ${mode.toUpperCase()}`}
            </span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 1. IDENTIFICAÇÃO DO PROJETO & CLIENTE */}
        {/* ========================================================================= */}
        {shouldRender('dados') && (
          <div className="mb-2">
            {renderSectionHeader('Identificação do Projeto & Cliente', '01')}

            <div className="grid grid-cols-2 gap-1.5 bg-slate-50 p-2 rounded-b border border-slate-200">
              <div>
                <span className="text-[8px] uppercase font-bold text-slate-400 block">Cliente / Razão Social</span>
                <span className="text-[11px] font-black text-slate-800">{clientName}</span>
                {proposta.cliente.cnpj && (
                  <span className="text-[8.5px] text-slate-500 block font-mono">CNPJ: {proposta.cliente.cnpj}</span>
                )}
              </div>
              <div>
                <span className="text-[8px] uppercase font-bold text-slate-400 block">Cidade Base & Data</span>
                <span className="text-[11px] font-bold text-slate-800">{proposta.cliente.cidadeBase || 'Curitiba'}</span>
                <span className="text-[8.5px] text-slate-500 block">Data de Elaboração: {proposta.cliente.dataElaboracao || '-'}</span>
              </div>
              <div>
                <span className="text-[8px] uppercase font-bold text-slate-400 block">Segmento do Cliente</span>
                <span className="text-[10px] font-bold text-slate-700">{proposta.cliente.segmento || 'Geral'}</span>
              </div>
              <div>
                <span className="text-[8px] uppercase font-bold text-slate-400 block">Tipo dos Serviços</span>
                <span className="text-[10px] font-bold text-slate-700">{proposta.cliente.tipoServicos || 'Limpeza e Conservação'}</span>
              </div>
              <div>
                <span className="text-[8px] uppercase font-bold text-slate-400 block">Contato / Responsável</span>
                <span className="text-[10px] font-bold text-slate-700">{proposta.cliente.contato || '-'} {proposta.cliente.contatoCargo ? `(${proposta.cliente.contatoCargo})` : ''}</span>
                <span className="text-[8.5px] text-slate-500 block">{proposta.cliente.celular} • {proposta.cliente.email}</span>
              </div>
              <div>
                <span className="text-[8px] uppercase font-bold text-slate-400 block">Consultor Comercial</span>
                <span className="text-[10px] font-bold text-slate-700">{proposta.cliente.vendedorNome || '-'}</span>
                <span className="text-[8.5px] text-slate-500 block">{proposta.cliente.vendedorTelefone} • {proposta.cliente.vendedorEmail}</span>
              </div>
            </div>

            {proposta.cliente.objetoProposta && (
              <div className="bg-white p-1.5 rounded border border-slate-200 mt-1">
                <span className="text-[8px] uppercase font-black text-slate-500 block mb-0.5">Objeto da Proposta</span>
                <p className="text-[9px] text-slate-700 leading-snug whitespace-pre-wrap">{proposta.cliente.objetoProposta}</p>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. TAXAS E TRIBUTOS / BDI */}
        {/* ========================================================================= */}
        {shouldRender('premissas') && (
          <div className="mb-2">
            {renderSectionHeader('Taxas, Tributos e Premissas de BDI', '02')}

            <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-slate-50 border-x border-slate-200">
              <div className="bg-emerald-50 border border-emerald-200 p-1 rounded text-center">
                <span className="text-[7.5px] uppercase font-bold text-emerald-800 block">BDI Total / Markup</span>
                <span className="text-sm font-black text-emerald-900">{formatPercent(proposta.premissas?.taxaAdministracao || 0)}</span>
              </div>
              <div className="bg-blue-50 border border-blue-200 p-1 rounded text-center">
                <span className="text-[7.5px] uppercase font-bold text-blue-800 block">Impostos s/ Faturamento</span>
                <span className="text-sm font-black text-blue-900">
                  {formatPercent(
                    Array.isArray(proposta.premissas?.tributos)
                      ? proposta.premissas.tributos.reduce((a: number, b: any) => a + (Number(b.aliquota) || 0), 0)
                      : 0
                  )}
                </span>
              </div>
              <div className="bg-amber-50 border border-amber-200 p-1 rounded text-center">
                <span className="text-[7.5px] uppercase font-bold text-amber-800 block">Margem / Lucro</span>
                <span className="text-sm font-black text-amber-900">{formatPercent(proposta.premissas?.lucro || 0)}</span>
              </div>
            </div>

            <div className="border border-slate-200 rounded-b overflow-hidden">
              <table className="w-full text-left border-collapse text-[8.5px]">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 font-bold text-slate-700">
                    <th className="py-0.5 px-2">Tributo</th>
                    <th className="py-0.5 px-2 text-right w-20">Alíquota (%)</th>
                    <th className="py-0.5 px-2">Descrição / Enquadramento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {Array.isArray(proposta.premissas?.tributos) && proposta.premissas.tributos.map((t: any, idx: number) => (
                    <tr key={idx}>
                      <td className="py-0.5 px-2 font-semibold text-slate-800">{t.nome || t.tributo || `Tributo ${idx + 1}`}</td>
                      <td className="py-0.5 px-2 text-right font-black text-slate-900">{formatPercent(t.aliquota)}</td>
                      <td className="py-0.5 px-2 text-slate-500">{t.descricao || 'Imposto incidente sobre faturamento bruto'}</td>
                    </tr>
                  ))}
                  {(!proposta.premissas?.tributos || proposta.premissas.tributos.length === 0) && (
                    <tr>
                      <td colSpan={3} className="py-1 px-2 text-center text-slate-400">Nenhum tributo individual configurado.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. ENCARGOS SOCIAIS CLT */}
        {/* ========================================================================= */}
        {shouldRender('encargos') && !isSpot && (
          <div className="mb-2">
            {renderSectionHeader('Encargos Sociais & Provisões Trabalhistas CLT', '03')}

            <div className="border border-slate-200 rounded-b overflow-hidden">
              <table className="w-full text-left border-collapse text-[8.5px]">
                <thead>
                  <tr className="bg-slate-100 font-bold text-slate-700 border-b border-slate-200">
                    <th className="py-0.5 px-2">Grupo / Verba Trabalhista</th>
                    <th className="py-0.5 px-2 text-right w-24">Percentual (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {proposta.encargos && typeof proposta.encargos === 'object' && Object.entries(proposta.encargos).map(([grupoKey, grupoVal]: [string, any]) => {
                    if (!grupoVal || typeof grupoVal !== 'object') return null;
                    const subtotal = Object.values(grupoVal).reduce((a: number, b: any) => a + (Number(b) || 0), 0);
                    return (
                      <React.Fragment key={grupoKey}>
                        <tr className="bg-slate-50 font-black text-slate-800">
                          <td className="py-0.5 px-2 uppercase">{grupoKey}</td>
                          <td className="py-0.5 px-2 text-right font-black text-[#1B4D3E]">{formatPercent(subtotal)}</td>
                        </tr>
                        {Object.entries(grupoVal).map(([itemKey, itemVal]: [string, any]) => (
                          <tr key={itemKey} className="text-slate-600">
                            <td className="py-0.5 px-4 pl-5">{itemKey}</td>
                            <td className="py-0.5 px-2 text-right font-semibold">{formatPercent(itemVal)}</td>
                          </tr>
                        ))}
                      </React.Fragment>
                    );
                  })}
                  <tr className="bg-[#1B4D3E] text-white font-black text-[9px]">
                    <td className="py-1 px-2 uppercase tracking-wider">Total Geral de Encargos Sociais</td>
                    <td className="py-1 px-2 text-right font-black">
                      {formatPercent(
                        Object.values(proposta.encargos || {}).reduce((acc: number, g: any) => {
                          if (g && typeof g === 'object') {
                            return acc + Object.values(g).reduce((s: number, v: any) => s + (Number(v) || 0), 0);
                          }
                          return acc;
                        }, 0)
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 4. QUADRO DE EQUIPE / COLABORADORES */}
        {/* ========================================================================= */}
        {shouldRender('quadro') && (
          <div className="mb-2">
            {renderSectionHeader('Quadro de Colaboradores & Postos de Trabalho', '04')}

            <div className="border border-slate-200 rounded-b overflow-hidden">
              <table className="w-full text-left border-collapse text-[8.5px]">
                <thead>
                  <tr className="bg-slate-100 font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200">
                    <th className="py-0.5 px-1.5 w-8 text-center">Qtd</th>
                    <th className="py-0.5 px-1.5">Função Vinculada à CCT</th>
                    <th className="py-0.5 px-1.5 w-16">Escala</th>
                    <th className="py-0.5 px-1.5 text-right w-16">Piso CCT</th>
                    <th className="py-0.5 px-1.5 text-right w-16">Adicionais</th>
                    <th className="py-0.5 px-1.5 text-right w-20">Remuneração</th>
                    <th className="py-0.5 px-1.5 text-right w-20">Custo Mensal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {proposta.equipe.map((p: any, idx: number) => {
                    const itemRes = resultado?.items?.find((x: any) => x.id === p.id);
                    const qty = Number(p.quantidade || 1);
                    const piso = Number(p.cargo?.pisoSalarial || 0);
                    const remu = itemRes?.detalhes?.remuneracao || 0;
                    const custoTot = itemRes?.custoTotalDireto || ((itemRes?.custoTotal || 0) * qty);
                    const extraVal = Number(p.parametrosPosto?.adicionalExtraValor) || 0;
                    const extraNome = p.parametrosPosto?.adicionalExtraNome;

                    return (
                      <tr key={p.id || idx}>
                        <td className="py-0.5 px-1.5 text-center font-black bg-slate-50">{qty}</td>
                        <td className="py-0.5 px-1.5 font-bold text-slate-800">
                          <div>{p.nomeCargo}</div>
                          {p.cctBase?.nome && (
                            <div className="text-[7.5px] text-slate-400 font-semibold">{p.cctBase.nome} ({p.cctBase.uf})</div>
                          )}
                          {extraVal > 0 && (
                            <div className="text-[7.5px] text-amber-700 font-black">
                              ⭐ +{formatCurrency(extraVal)} ({extraNome || 'Adicional Extra'}) [{p.parametrosPosto?.adicionalExtraIncideEncargos !== false ? 'CLT' : 'Indenizatório'}]
                            </div>
                          )}
                        </td>
                        <td className="py-0.5 px-1.5 text-slate-600 font-semibold">{p.escala || '5x2 (44h)'}</td>
                        <td className="py-0.5 px-1.5 text-right text-slate-700">{formatCurrency(piso)}</td>
                        <td className="py-0.5 px-1.5 text-right text-slate-700">{formatCurrency(remu > piso ? remu - piso : 0)}</td>
                        <td className="py-0.5 px-1.5 text-right font-bold text-slate-900">{formatCurrency(remu)}</td>
                        <td className="py-0.5 px-1.5 text-right font-black text-[#1B4D3E] bg-emerald-50/40">{formatCurrency(custoTot)}</td>
                      </tr>
                    );
                  })}
                  <tr className="bg-slate-100 font-black text-slate-900">
                    <td className="py-0.5 px-1.5 text-center">{proposta.equipe.reduce((a: number, b: any) => a + Number(b.quantidade || 1), 0)}</td>
                    <td colSpan={5} className="py-0.5 px-1.5 uppercase text-right">Total Mão de Obra</td>
                    <td className="py-0.5 px-1.5 text-right text-[#1B4D3E] font-black">
                      {formatCurrency(resultado?.items?.reduce((a: number, b: any) => a + (b.custoTotalDireto || ((b.custoTotal || 0) * (b.quantidade || 1))), 0) || 0)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 5, 6, 7. INSUMOS (MATERIAIS, MÁQUINAS, DESCARTÁVEIS) */}
        {/* ========================================================================= */}
        {(shouldRender('materiais') || shouldRender('maquinas') || shouldRender('descartaveis')) && (
          <div className="mb-2">
            
            {/* Materiais */}
            {shouldRender('materiais') && (
              <div className="mb-2">
                {renderSectionHeader('Materiais e Produtos de Limpeza', '05')}
                <table className="w-full text-left border border-slate-200 border-collapse text-[8.5px]">
                  <thead>
                    <tr className="bg-slate-100 font-bold text-slate-600 border-b border-slate-200">
                      <th className="py-0.5 px-1.5 w-12">Cód.</th>
                      <th className="py-0.5 px-1.5">Descrição</th>
                      <th className="py-0.5 px-1.5 text-right w-16">Preço Unit.</th>
                      <th className="py-0.5 px-1.5 text-center w-10">Qtd.</th>
                      <th className="py-0.5 px-1.5 text-center w-12">Vida Útil</th>
                      <th className="py-0.5 px-1.5 text-right w-20">Custo Mensal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(proposta.insumos?.detalheMateriais || []).map((m: any, i: number) => (
                      <tr key={i}>
                        <td className="py-0.5 px-1.5 font-mono text-slate-500">{m.codigo}</td>
                        <td className="py-0.5 px-1.5 font-semibold text-slate-800">{m.descricao}</td>
                        <td className="py-0.5 px-1.5 text-right">{formatCurrency(m.precoUnitario)}</td>
                        <td className="py-0.5 px-1.5 text-center">{m.quantidade}</td>
                        <td className="py-0.5 px-1.5 text-center">{m.vidaUtil}m</td>
                        <td className="py-0.5 px-1.5 text-right font-bold text-slate-900">{formatCurrency((Number(m.precoUnitario) * Number(m.quantidade)) / (Number(m.vidaUtil) || 1))}</td>
                      </tr>
                    ))}
                    {(!proposta.insumos?.detalheMateriais || proposta.insumos.detalheMateriais.length === 0) && (
                      <tr><td colSpan={6} className="py-0.5 px-1.5 text-center text-slate-400">Nenhum material cadastrado.</td></tr>
                    )}
                    <tr className="bg-slate-50 font-bold border-t border-slate-200">
                      <td colSpan={5} className="py-0.5 px-1.5 text-right uppercase">Total Materiais Mensal:</td>
                      <td className="py-0.5 px-1.5 text-right font-black text-[#1B4D3E]">{formatCurrency(proposta.insumos?.materiais || 0)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* Máquinas - Somente renderiza se houver itens ou se for a tela específica de máquinas */}
            {shouldRender('maquinas') && (mode === 'maquinas' || (proposta.insumos?.detalheMaquinas && proposta.insumos.detalheMaquinas.length > 0)) && (
              <div className="mb-2">
                {renderSectionHeader('Máquinas e Equipamentos', '06')}
                <table className="w-full text-left border border-slate-200 border-collapse text-[8.5px]">
                  <thead>
                    <tr className="bg-slate-100 font-bold text-slate-600 border-b border-slate-200">
                      <th className="py-0.5 px-1.5 w-12">Cód.</th>
                      <th className="py-0.5 px-1.5">Descrição</th>
                      <th className="py-0.5 px-1.5 text-right w-16">Preço Unit.</th>
                      <th className="py-0.5 px-1.5 text-center w-10">Qtd.</th>
                      <th className="py-0.5 px-1.5 text-center w-12">Vida Útil</th>
                      <th className="py-0.5 px-1.5 text-right w-20">Custo Mensal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(proposta.insumos?.detalheMaquinas || []).map((m: any, i: number) => (
                      <tr key={i}>
                        <td className="py-0.5 px-1.5 font-mono text-slate-500">{m.codigo}</td>
                        <td className="py-0.5 px-1.5 font-semibold text-slate-800">{m.descricao}</td>
                        <td className="py-0.5 px-1.5 text-right">{formatCurrency(m.precoUnitario)}</td>
                        <td className="py-0.5 px-1.5 text-center">{m.quantidade}</td>
                        <td className="py-0.5 px-1.5 text-center">{m.vidaUtil}m</td>
                        <td className="py-0.5 px-1.5 text-right font-bold text-slate-900">{formatCurrency((Number(m.precoUnitario) * Number(m.quantidade)) / (Number(m.vidaUtil) || 1))}</td>
                      </tr>
                    ))}
                    {(!proposta.insumos?.detalheMaquinas || proposta.insumos.detalheMaquinas.length === 0) && (
                      <tr><td colSpan={6} className="py-0.5 px-1.5 text-center text-slate-400">Nenhuma máquina cadastrada.</td></tr>
                    )}
                    <tr className="bg-slate-50 font-bold border-t border-slate-200">
                      <td colSpan={5} className="py-0.5 px-1.5 text-right uppercase">Total Máquinas Mensal:</td>
                      <td className="py-0.5 px-1.5 text-right font-black text-[#1B4D3E]">{formatCurrency(proposta.insumos?.maquinas || 0)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* Descartáveis - Somente renderiza se houver itens ou se for a tela específica de descartáveis */}
            {shouldRender('descartaveis') && (mode === 'descartaveis' || (proposta.insumos?.detalheDescartaveis && proposta.insumos.detalheDescartaveis.length > 0)) && (
              <div className="mb-2">
                {renderSectionHeader('Descartáveis e Higiene', '07')}
                <table className="w-full text-left border border-slate-200 border-collapse text-[8.5px]">
                  <thead>
                    <tr className="bg-slate-100 font-bold text-slate-600 border-b border-slate-200">
                      <th className="py-0.5 px-1.5 w-12">Cód.</th>
                      <th className="py-0.5 px-1.5">Descrição</th>
                      <th className="py-0.5 px-1.5 text-right w-16">Preço Unit.</th>
                      <th className="py-0.5 px-1.5 text-center w-10">Qtd.</th>
                      <th className="py-0.5 px-1.5 text-center w-12">Vida Útil</th>
                      <th className="py-0.5 px-1.5 text-right w-20">Custo Mensal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(proposta.insumos?.detalheDescartaveis || []).map((m: any, i: number) => (
                      <tr key={i}>
                        <td className="py-0.5 px-1.5 font-mono text-slate-500">{m.codigo}</td>
                        <td className="py-0.5 px-1.5 font-semibold text-slate-800">{m.descricao}</td>
                        <td className="py-0.5 px-1.5 text-right">{formatCurrency(m.precoUnitario)}</td>
                        <td className="py-0.5 px-1.5 text-center">{m.quantidade}</td>
                        <td className="py-0.5 px-1.5 text-center">{m.vidaUtil}m</td>
                        <td className="py-0.5 px-1.5 text-right font-bold text-slate-900">{formatCurrency((Number(m.precoUnitario) * Number(m.quantidade)) / (Number(m.vidaUtil) || 1))}</td>
                      </tr>
                    ))}
                    {(!proposta.insumos?.detalheDescartaveis || proposta.insumos.detalheDescartaveis.length === 0) && (
                      <tr><td colSpan={6} className="py-0.5 px-1.5 text-center text-slate-400">Nenhum descartável cadastrado.</td></tr>
                    )}
                    <tr className="bg-slate-50 font-bold border-t border-slate-200">
                      <td colSpan={5} className="py-0.5 px-1.5 text-right uppercase">Total Descartáveis Mensal:</td>
                      <td className="py-0.5 px-1.5 text-right font-black text-[#1B4D3E]">{formatCurrency(proposta.insumos?.descartaveis || 0)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 8. EXTRATO DE CUSTOS (MONTANTES A, B, C) */}
        {/* ========================================================================= */}
        {shouldRender('extrato') && (
          <div className="mb-2">
            {renderSectionHeader('Planilha de Custos / Extrato Detalhado', '08')}

            {/* Montante A */}
            <div className="border border-slate-200 rounded-b overflow-hidden mb-1.5">
              <div className="bg-slate-100 text-slate-800 px-2 py-0.5 font-bold text-[8.5px] uppercase border-b border-slate-200">
                Montante "A" - Mão de Obra
              </div>
              <table className="w-full text-left border-collapse text-[8.5px]">
                <thead>
                  <tr className="bg-slate-50 font-semibold border-b border-slate-200 text-slate-600">
                    <th className="py-0.5 px-2">Função / Discriminação</th>
                    <th className="py-0.5 px-2 text-center w-12">Qtd</th>
                    <th className="py-0.5 px-2 text-right w-20">Custo Unitário</th>
                    <th className="py-0.5 px-2 text-right w-24">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {proposta.equipe.map((p: any, idx: number) => {
                    const itemRes = resultado?.items?.find((x: any) => x.id === p.id);
                    const qty = Number(p.quantidade || 1);
                    const custoTot = itemRes?.detalhes?.remuneracao || 0;
                    return (
                      <tr key={idx}>
                        <td className="py-0.5 px-2 font-semibold text-slate-800">{p.nomeCargo}</td>
                        <td className="py-0.5 px-2 text-center font-bold">{qty}</td>
                        <td className="py-0.5 px-2 text-right">{formatCurrency(custoTot)}</td>
                        <td className="py-0.5 px-2 text-right font-bold text-slate-900 bg-emerald-50/20">{formatCurrency(custoTot * qty)}</td>
                      </tr>
                    );
                  })}
                  <tr className="bg-slate-50 font-bold">
                    <td colSpan={3} className="py-0.5 px-2 text-right">1) Total Remuneração Função</td>
                    <td className="py-0.5 px-2 text-right font-bold text-slate-900">
                      {formatCurrency(resultado?.items?.reduce((a: any, i: any) => a + ((i.detalhes?.remuneracao || 0) * (i.quantidade || 1)), 0) || 0)}
                    </td>
                  </tr>
                  {!isSpot && (
                    <>
                      <tr>
                        <td className="py-0.5 px-2 font-semibold text-slate-700">2) Encargos Sociais</td>
                        <td className="py-0.5 px-2 text-center text-slate-400">-</td>
                        <td className="py-0.5 px-2 text-right text-slate-400">-</td>
                        <td className="py-0.5 px-2 text-right font-bold text-slate-900">
                          {formatCurrency(resultado?.items?.reduce((a: any, i: any) => a + ((i.detalhes?.encargos || 0) * (i.quantidade || 1)), 0) || 0)}
                        </td>
                      </tr>
                      {(() => {
                        const totalOutros = resultado?.items?.reduce((a: any, i: any) => a + ((i.detalhes?.outrosBlocoA || 0) * (i.quantidade || 1)), 0) || 0;
                        const itemExtra = proposta.equipe.find((p: any) => p.parametrosPosto?.adicionalExtraIncideEncargos === false && Number(p.parametrosPosto?.adicionalExtraValor) > 0);
                        const labelOutros = totalOutros > 0 
                          ? `3) Outros (${itemExtra?.parametrosPosto?.adicionalExtraNome || 'Adicional Extra / Verba Indenizatória'})`
                          : '3) Outros (Especificar)';
                        return (
                          <tr>
                            <td className="py-0.5 px-2 font-semibold text-slate-700">{labelOutros}</td>
                            <td className="py-0.5 px-2 text-center text-slate-400">-</td>
                            <td className="py-0.5 px-2 text-right text-slate-400">-</td>
                            <td className="py-0.5 px-2 text-right font-bold text-slate-900">{formatCurrency(totalOutros)}</td>
                          </tr>
                        );
                      })()}
                    </>
                  )}
                  <tr className="bg-[#1B4D3E] text-white font-black text-[9px]">
                    <td colSpan={3} className="py-0.5 px-2 uppercase text-right">Total Montante "A" (Mão de Obra)</td>
                    <td className="py-0.5 px-2 text-right font-black">
                      {formatCurrency(resultado?.items?.reduce((a: any, i: any) => a + ((i.detalhes?.blocoA || 0) * (i.quantidade || 1)), 0) || 0)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Montante B */}
            <div className="border border-slate-200 rounded overflow-hidden mb-1.5">
              <div className="bg-slate-100 text-slate-800 px-2 py-0.5 font-bold text-[8.5px] uppercase border-b border-slate-200">
                Montante "B" - Insumos
              </div>
              <table className="w-full text-left border-collapse text-[8.5px]">
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-0.5 px-2 font-semibold">1) Uniformes e EPIs</td>
                    <td className="py-0.5 px-2 text-right font-bold text-slate-900 w-24">{formatCurrency(resultado?.items?.reduce((a: any, i: any) => a + ((i.detalhes?.ativos || 0) * (i.quantidade || 1)), 0) || 0)}</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 px-2 font-semibold">2) Materiais e Produtos de Limpeza</td>
                    <td className="py-0.5 px-2 text-right font-bold text-slate-900">{formatCurrency(proposta.insumos?.materiais || 0)}</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 px-2 font-semibold">3) Máquinas e Equipamentos</td>
                    <td className="py-0.5 px-2 text-right font-bold text-slate-900">{formatCurrency(proposta.insumos?.maquinas || 0)}</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 px-2 font-semibold">4) Descartáveis</td>
                    <td className="py-0.5 px-2 text-right font-bold text-slate-900">{formatCurrency(proposta.insumos?.descartaveis || 0)}</td>
                  </tr>
                  <tr className="bg-[#1B4D3E] text-white font-black text-[9px]">
                    <td className="py-0.5 px-2 uppercase text-right">Total Montante "B" (Insumos)</td>
                    <td className="py-0.5 px-2 text-right font-black">
                      {formatCurrency(
                        (resultado?.items?.reduce((a: any, i: any) => a + ((i.detalhes?.ativos || 0) * (i.quantidade || 1)), 0) || 0) +
                        (proposta.insumos?.materiais || 0) +
                        (proposta.insumos?.maquinas || 0) +
                        (proposta.insumos?.descartaveis || 0)
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Montante C */}
            {!isSpot && (
              <div className="border border-slate-200 rounded overflow-hidden">
                <div className="bg-slate-100 text-slate-800 px-2 py-0.5 font-bold text-[8.5px] uppercase border-b border-slate-200">
                  Montante "C" - Benefícios
                </div>
                <table className="w-full text-left border-collapse text-[8.5px]">
                  <tbody className="divide-y divide-slate-100">
                    {(() => {
                      const b = resultado?.items?.reduce((acc: any, i: any) => {
                        const d = i.detalhes?.detalheBlocoC;
                        return {
                          va: acc.va + (d?.va || 0) * i.quantidade,
                          vt: acc.vt + (d?.vt || 0) * i.quantidade,
                          sindicato: acc.sindicato + (d?.custosSindicato || 0) * i.quantidade,
                          cesta: acc.cesta + (d?.cestaBasica || 0) * i.quantidade,
                          outros: acc.outros + (d?.outros || 0) * i.quantidade,
                          descontos: acc.descontos + ((d?.descontoVA || 0) + (d?.descontoVT || 0)) * i.quantidade
                        };
                      }, { va: 0, vt: 0, sindicato: 0, cesta: 0, outros: 0, descontos: 0 }) || { va: 0, vt: 0, sindicato: 0, cesta: 0, outros: 0, descontos: 0 };
                      return (
                        <>
                          <tr><td className="py-0.5 px-2">Vale Alimentação / Refeição</td><td className="py-0.5 px-2 text-right font-bold w-24">{formatCurrency(b.va)}</td></tr>
                          <tr><td className="py-0.5 px-2">Vale Transporte</td><td className="py-0.5 px-2 text-right font-bold">{formatCurrency(b.vt)}</td></tr>
                          <tr><td className="py-0.5 px-2">Cesta Básica / Benefício Social</td><td className="py-0.5 px-2 text-right font-bold">{formatCurrency(b.cesta)}</td></tr>
                          <tr><td className="py-0.5 px-2">Custos Sindicato / Assistencial</td><td className="py-0.5 px-2 text-right font-bold">{formatCurrency(b.sindicato)}</td></tr>
                          {b.outros > 0 && <tr><td className="py-0.5 px-2">Outros Benefícios</td><td className="py-0.5 px-2 text-right font-bold">{formatCurrency(b.outros)}</td></tr>}
                          <tr className="bg-[#1B4D3E] text-white font-black text-[9px]">
                            <td className="py-0.5 px-2 uppercase text-right">Total Montante "C" (Benefícios)</td>
                            <td className="py-0.5 px-2 text-right font-black">
                              {formatCurrency(resultado?.items?.reduce((a: any, i: any) => a + ((i.detalhes?.beneficios || 0) * (i.quantidade || 1)), 0) || 0)}
                            </td>
                          </tr>
                        </>
                      );
                    })()}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 9. RESUMO DA PROPOSTA / INDICADORES */}
        {/* ========================================================================= */}
        {shouldRender('resumo') && (
          <div className="mb-2">
            {renderSectionHeader('Resumo Executivo da Proposta Comercial', '09')}

            <div className="grid grid-cols-2 gap-1.5 p-1.5 bg-slate-50 border-x border-slate-200">
              <div className="bg-emerald-900 text-white p-1.5 rounded text-center">
                <span className="text-[7.5px] uppercase font-bold tracking-widest text-emerald-200 block">
                  Preço Mensal Sugerido (Faturamento Bruto)
                </span>
                <span className="text-base font-black">{formatCurrency(resultado?.faturamentoBruto || 0)}</span>
                <span className="text-[7.5px] text-emerald-300 block">Anual: {formatCurrency((resultado?.faturamentoBruto || 0) * 12)}</span>
              </div>
              <div className="bg-slate-800 text-white p-1.5 rounded text-center">
                <span className="text-[7.5px] uppercase font-bold tracking-widest text-slate-300 block">
                  Custo Operacional Total Mensal
                </span>
                <span className="text-base font-black">{formatCurrency(resultado?.custoTotal || 0)}</span>
                <span className="text-[7.5px] text-slate-300 block">Anual: {formatCurrency((resultado?.custoTotal || 0) * 12)}</span>
              </div>
            </div>

            <div className="border border-slate-200 rounded-b overflow-hidden">
              <table className="w-full text-left border-collapse text-[8.5px]">
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-0.5 px-2 font-semibold text-slate-700">Total Montante A (Mão de Obra e Encargos)</td>
                    <td className="py-0.5 px-2 text-right font-bold text-slate-900">{formatCurrency(resultado?.items?.reduce((a: any, i: any) => a + ((i.detalhes?.blocoA || 0) * (i.quantidade || 1)), 0) || 0)}</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 px-2 font-semibold text-slate-700">Total Montante B (Insumos, Máquinas e Uniformes)</td>
                    <td className="py-0.5 px-2 text-right font-bold text-slate-900">
                      {formatCurrency(
                        (resultado?.items?.reduce((a: any, i: any) => a + ((i.detalhes?.ativos || 0) * (i.quantidade || 1)), 0) || 0) +
                        (proposta.insumos?.materiais || 0) +
                        (proposta.insumos?.maquinas || 0) +
                        (proposta.insumos?.descartaveis || 0)
                      )}
                    </td>
                  </tr>
                  {!isSpot && (
                    <tr>
                      <td className="py-0.5 px-2 font-semibold text-slate-700">Total Montante C (Benefícios)</td>
                      <td className="py-0.5 px-2 text-right font-bold text-slate-900">{formatCurrency(resultado?.items?.reduce((a: any, i: any) => a + ((i.detalhes?.beneficios || 0) * (i.quantidade || 1)), 0) || 0)}</td>
                    </tr>
                  )}
                  <tr className="bg-slate-50 font-bold">
                    <td className="py-0.5 px-2 uppercase">Custo Direto Total</td>
                    <td className="py-0.5 px-2 text-right font-black text-slate-900">{formatCurrency(resultado?.custoTotal || 0)}</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 px-2 text-slate-700">Tributos e Impostos Fiscais</td>
                    <td className="py-0.5 px-2 text-right font-bold text-red-700">{formatCurrency(resultado?.impostosValor || 0)}</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 px-2 text-slate-700">Margem Bruta / Contribuição</td>
                    <td className="py-0.5 px-2 text-right font-bold text-emerald-700">{formatCurrency(resultado?.lucroValor || 0)}</td>
                  </tr>
                  <tr className="bg-[#1B4D3E] text-white font-black text-[9px]">
                    <td className="py-1 px-2 uppercase">Faturamento Bruto Mensal Sugerido</td>
                    <td className="py-1 px-2 text-right font-black">{formatCurrency(resultado?.faturamentoBruto || 0)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 10. DRE DO PROJETO (12 MESES) */}
        {/* ========================================================================= */}
        {shouldRender('dre') && !isSpot && (
          <div className="mb-2">
            {renderSectionHeader('DRE - Demonstrativo de Resultado do Exercício (12 Meses)', '10')}

            <div className="border border-slate-200 rounded-b overflow-hidden">
              <table className="w-full text-left border-collapse text-[8px]">
                <thead>
                  <tr className="bg-slate-100 font-bold text-slate-700 border-b border-slate-200">
                    <th className="py-0.5 px-1.5">Conta / Descrição</th>
                    <th className="py-0.5 px-1.5 text-right w-20">Mensal (R$)</th>
                    <th className="py-0.5 px-1.5 text-right w-20">Anual (R$)</th>
                    <th className="py-0.5 px-1.5 text-right w-14">% Rec.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(() => {
                    const rec = resultado?.faturamentoBruto || 0;
                    const imp = resultado?.impostosValor || 0;
                    const recLiq = rec - imp;
                    const custoTot = resultado?.custoTotal || 0;
                    const margem = recLiq - custoTot;

                    const row = (label: string, val: number, isHeader = false, isHighlight = false) => {
                      const pct = rec > 0 ? (val / rec) * 100 : 0;
                      return (
                        <tr className={`${isHeader ? 'bg-slate-50 font-bold' : ''} ${isHighlight ? 'bg-emerald-50/60 font-black text-[#1B4D3E]' : ''}`}>
                          <td className="py-0.5 px-1.5">{label}</td>
                          <td className="py-0.5 px-1.5 text-right">{formatCurrency(val)}</td>
                          <td className="py-0.5 px-1.5 text-right">{formatCurrency(val * 12)}</td>
                          <td className="py-0.5 px-1.5 text-right">{pct.toFixed(1)}%</td>
                        </tr>
                      );
                    };

                    return (
                      <>
                        {row('01. RECEITA OPERACIONAL BRUTA', rec, true, true)}
                        {row('02. DEDUÇÕES DA RECEITA (IMPOSTOS)', imp, false)}
                        {row('02.1 - RECEITA OPERACIONAL LÍQUIDA', recLiq, true)}
                        {row('03. CUSTOS OPERACIONAIS DIRETOS', custoTot, false)}
                        {row('04. MARGEM BRUTA CONTRIBUÍDA', margem, true, true)}
                      </>
                    );
                  })()}
                </tbody>
              </table>
            </div>

            <div className="mt-2 text-center text-[8px] text-slate-400 border-t border-slate-200 pt-0.5">
              Documento gerado eletronicamente pelo SmartBid Hub • Sistema de Formação de Preço de Vendas (FPV)
            </div>
          </div>
        )}

      </div>
    </>
  );
}
