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

  const renderHeader = (sectionTitle: string, sectionNumber: string) => (
    <div className="border-b-2 border-[#1B4D3E] pb-2 mb-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {companyLogo ? (
          <img src={companyLogo} alt={companyName} className="h-9 max-w-[140px] object-contain" />
        ) : (
          <div className="font-black text-sm text-[#1B4D3E] uppercase tracking-wider">{companyName}</div>
        )}
        <div className="border-l border-slate-300 pl-3">
          <div className="text-[11px] font-black uppercase text-[#1B4D3E]">
            FPV • Formação de Preço de Vendas
          </div>
          <div className="text-[9px] text-slate-500 font-semibold">
            {num} • Rev. {rev} • {clientName}
          </div>
        </div>
      </div>
      <div className="text-right">
        <span className="bg-[#1B4D3E] text-white px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wider">
          {sectionNumber}. {sectionTitle}
        </span>
      </div>
    </div>
  );

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
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
          .fpv-page-section {
            page-break-after: always !important;
            break-after: page !important;
            margin-bottom: 24px !important;
          }
          .fpv-page-section:last-child {
            page-break-after: auto !important;
            break-after: auto !important;
          }
          @page {
            size: A4 portrait;
            margin: 12mm 10mm 12mm 10mm;
          }
        }
      `}} />

      <div id="fpv-pdf-export-root" className="hidden print:block text-slate-900 font-sans text-xs">
        
        {/* ========================================================================= */}
        {/* 1. IDENTIFICAÇÃO DO PROJETO & CLIENTE */}
        {/* ========================================================================= */}
        {shouldRender('dados') && (
          <div className="fpv-page-section">
            {renderHeader('Identificação do Projeto & Cliente', '01')}

            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 mb-4">
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400 block">Cliente / Razão Social</span>
                <span className="text-xs font-black text-slate-800">{clientName}</span>
                {proposta.cliente.cnpj && (
                  <span className="text-[10px] text-slate-500 block">CNPJ: {proposta.cliente.cnpj}</span>
                )}
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400 block">Número do Projeto & Versão</span>
                <span className="text-xs font-black text-[#1B4D3E]">{num} — {rev}</span>
                <span className="text-[10px] text-slate-500 block">Modalidade: {isSpot ? 'SPOT / Demanda' : 'CLT Recorrente'}</span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400 block">Cidade Base / UF</span>
                <span className="text-xs font-bold text-slate-700">{proposta.cliente.cidade || 'Não informada'}</span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400 block">Data de Elaboração</span>
                <span className="text-xs font-bold text-slate-700">{proposta.cliente.dataElaboracao || 'Não informada'}</span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400 block">Segmento do Cliente</span>
                <span className="text-xs font-bold text-slate-700">{proposta.cliente.segmento || 'Geral'}</span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400 block">Tipo dos Serviços</span>
                <span className="text-xs font-bold text-slate-700">{proposta.cliente.tipoServicos || 'Limpeza e Conservação'}</span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400 block">Contato / Responsável</span>
                <span className="text-xs font-bold text-slate-700">{proposta.cliente.contato || '-'} {proposta.cliente.contatoCargo ? `(${proposta.cliente.contatoCargo})` : ''}</span>
                <span className="text-[10px] text-slate-500 block">{proposta.cliente.celular} • {proposta.cliente.email}</span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400 block">Vendedor / Consultor Comercial</span>
                <span className="text-xs font-bold text-slate-700">{proposta.cliente.vendedorNome || '-'}</span>
                <span className="text-[10px] text-slate-500 block">{proposta.cliente.vendedorTelefone} • {proposta.cliente.vendedorEmail}</span>
              </div>
            </div>

            {proposta.cliente.objetoProposta && (
              <div className="bg-white p-3 rounded-lg border border-slate-200 mb-4">
                <span className="text-[9px] uppercase font-black text-slate-500 block mb-1">Objeto da Proposta</span>
                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{proposta.cliente.objetoProposta}</p>
              </div>
            )}

            {/* Condições e Diretrizes */}
            <div className="grid grid-cols-2 gap-3 text-[10px]">
              <div className="border border-slate-200 rounded p-2.5 bg-slate-50/50">
                <span className="font-black uppercase text-[#1B4D3E] block mb-1.5">Diretrizes do Efetivo</span>
                <ul className="list-disc pl-3.5 space-y-1 text-slate-600">
                  {proposta.cliente.quadroEfetivoClausula1 && <li>{proposta.cliente.quadroEfetivoClausula1}</li>}
                  {proposta.cliente.quadroEfetivoClausula2 && <li>{proposta.cliente.quadroEfetivoClausula2}</li>}
                  {proposta.cliente.quadroEfetivoClausula3 && <li>{proposta.cliente.quadroEfetivoClausula3}</li>}
                </ul>
              </div>
              <div className="border border-slate-200 rounded p-2.5 bg-slate-50/50">
                <span className="font-black uppercase text-[#1B4D3E] block mb-1.5">Condições Comerciais</span>
                <ul className="list-disc pl-3.5 space-y-1 text-slate-600">
                  {proposta.cliente.condicaoCliente1 && <li>{proposta.cliente.condicaoCliente1}</li>}
                  {proposta.cliente.condicaoCliente2 && <li>{proposta.cliente.condicaoCliente2}</li>}
                  {proposta.cliente.condicaoCliente3 && <li>{proposta.cliente.condicaoCliente3}</li>}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. TAXAS E TRIBUTOS / BDI */}
        {/* ========================================================================= */}
        {shouldRender('premissas') && (
          <div className="fpv-page-section">
            {renderHeader('Taxas e Tributos / Premissas de Formação de Preço', '02')}

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg text-center">
                <span className="text-[9px] uppercase font-bold text-emerald-800 block">BDI Total / Markup</span>
                <span className="text-lg font-black text-emerald-900">{formatPercent(proposta.premissas?.taxaAdministracao || 0)}</span>
              </div>
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-center">
                <span className="text-[9px] uppercase font-bold text-blue-800 block">Total de Impostos s/ Faturamento</span>
                <span className="text-lg font-black text-blue-900">
                  {formatPercent(
                    Array.isArray(proposta.premissas?.tributos)
                      ? proposta.premissas.tributos.reduce((a: number, b: any) => a + (Number(b.aliquota) || 0), 0)
                      : 0
                  )}
                </span>
              </div>
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-center">
                <span className="text-[9px] uppercase font-bold text-amber-800 block">Margem / Lucro Estimado</span>
                <span className="text-lg font-black text-amber-900">{formatPercent(proposta.premissas?.lucro || 0)}</span>
              </div>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden mb-4">
              <div className="bg-slate-100 px-3 py-1.5 font-bold text-[10px] uppercase tracking-wider text-slate-700">
                Discriminação dos Tributos e Encargos Fiscais
              </div>
              <table className="w-full text-left border-collapse text-[10px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600">
                    <th className="py-1.5 px-3">Tributo</th>
                    <th className="py-1.5 px-3 text-right">Alíquota (%)</th>
                    <th className="py-1.5 px-3">Descrição / Enquadramento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {Array.isArray(proposta.premissas?.tributos) && proposta.premissas.tributos.map((t: any, idx: number) => (
                    <tr key={idx}>
                      <td className="py-1.5 px-3 font-semibold text-slate-800">{t.nome || t.tributo || `Tributo ${idx + 1}`}</td>
                      <td className="py-1.5 px-3 text-right font-black text-slate-900">{formatPercent(t.aliquota)}</td>
                      <td className="py-1.5 px-3 text-slate-500">{t.descricao || 'Imposto incidente sobre faturamento bruto'}</td>
                    </tr>
                  ))}
                  {(!proposta.premissas?.tributos || proposta.premissas.tributos.length === 0) && (
                    <tr>
                      <td colSpan={3} className="py-3 px-3 text-center text-slate-400">Nenhum tributo individual configurado.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-2 gap-3 text-[10px]">
              <div className="border border-slate-200 rounded p-2.5">
                <span className="font-bold text-slate-700 block mb-1">Reserva Técnica de Mão de Obra</span>
                <span className="text-xs font-black text-slate-900">{formatPercent(proposta.premissas?.reservaTecnicaPct || 0)}</span>
              </div>
              <div className="border border-slate-200 rounded p-2.5">
                <span className="font-bold text-slate-700 block mb-1">Manutenção e Reposição de Máquinas</span>
                <span className="text-xs font-black text-slate-900">{formatPercent(proposta.premissas?.manutencaoPct || 0)}</span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. ENCARGOS SOCIAIS CLT */}
        {/* ========================================================================= */}
        {shouldRender('encargos') && !isSpot && (
          <div className="fpv-page-section">
            {renderHeader('Encargos Sociais & Provisões Trabalhistas CLT', '03')}

            <div className="border border-slate-200 rounded-lg overflow-hidden mb-4">
              <table className="w-full text-left border-collapse text-[10px]">
                <thead>
                  <tr className="bg-[#1B4D3E] text-white font-bold">
                    <th className="py-2 px-3">Grupo / Verba Trabalhista</th>
                    <th className="py-2 px-3 text-right">Percentual (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {proposta.encargos && typeof proposta.encargos === 'object' && Object.entries(proposta.encargos).map(([grupoKey, grupoVal]: [string, any]) => {
                    if (!grupoVal || typeof grupoVal !== 'object') return null;
                    const subtotal = Object.values(grupoVal).reduce((a: number, b: any) => a + (Number(b) || 0), 0);
                    return (
                      <React.Fragment key={grupoKey}>
                        <tr className="bg-slate-100 font-black text-slate-800">
                          <td className="py-1.5 px-3 uppercase">{grupoKey}</td>
                          <td className="py-1.5 px-3 text-right font-black text-[#1B4D3E]">{formatPercent(subtotal)}</td>
                        </tr>
                        {Object.entries(grupoVal).map(([itemKey, itemVal]: [string, any]) => (
                          <tr key={itemKey} className="text-slate-600">
                            <td className="py-1 px-5 pl-6">{itemKey}</td>
                            <td className="py-1 px-3 text-right font-semibold">{formatPercent(itemVal)}</td>
                          </tr>
                        ))}
                      </React.Fragment>
                    );
                  })}
                  <tr className="bg-[#1B4D3E] text-white font-black text-xs">
                    <td className="py-2 px-3 uppercase tracking-wider">Total Geral de Encargos Sociais</td>
                    <td className="py-2 px-3 text-right font-black">
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
          <div className="fpv-page-section">
            {renderHeader('Quadro de Colaboradores & Postos de Trabalho', '04')}

            <div className="border border-slate-200 rounded-lg overflow-hidden mb-4">
              <table className="w-full text-left border-collapse text-[10px]">
                <thead>
                  <tr className="bg-[#1B4D3E] text-white font-bold uppercase tracking-wider">
                    <th className="py-2 px-3 w-12 text-center">Qtd</th>
                    <th className="py-2 px-3">Função Vinculada à CCT</th>
                    <th className="py-2 px-3">Escala</th>
                    <th className="py-2 px-3 text-right">Piso CCT</th>
                    <th className="py-2 px-3 text-right">Adicionais</th>
                    <th className="py-2 px-3 text-right">Remuneração</th>
                    <th className="py-2 px-3 text-right">Custo Mensal Posto</th>
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
                      <tr key={p.id || idx} className="hover:bg-slate-50">
                        <td className="py-2 px-3 text-center font-black bg-slate-50">{qty}</td>
                        <td className="py-2 px-3 font-bold text-slate-800">
                          <div>{p.nomeCargo}</div>
                          {p.cctBase?.nome && (
                            <div className="text-[8.5px] text-slate-400 font-semibold">{p.cctBase.nome} ({p.cctBase.uf})</div>
                          )}
                          {extraVal > 0 && (
                            <div className="text-[8.5px] text-amber-700 font-black mt-0.5">
                              ⭐ +{formatCurrency(extraVal)} ({extraNome || 'Adicional Extra'}) [{p.parametrosPosto?.adicionalExtraIncideEncargos !== false ? 'CLT' : 'Indenizatório'}]
                            </div>
                          )}
                        </td>
                        <td className="py-2 px-3 text-slate-600 font-semibold">{p.escala || '5x2 (44h)'}</td>
                        <td className="py-2 px-3 text-right text-slate-700">{formatCurrency(piso)}</td>
                        <td className="py-2 px-3 text-right text-slate-700">{formatCurrency(remu > piso ? remu - piso : 0)}</td>
                        <td className="py-2 px-3 text-right font-bold text-slate-900">{formatCurrency(remu)}</td>
                        <td className="py-2 px-3 text-right font-black text-[#1B4D3E] bg-emerald-50/40">{formatCurrency(custoTot)}</td>
                      </tr>
                    );
                  })}
                  <tr className="bg-slate-100 font-black text-slate-900">
                    <td className="py-2 px-3 text-center">{proposta.equipe.reduce((a: number, b: any) => a + Number(b.quantidade || 1), 0)}</td>
                    <td colSpan={5} className="py-2 px-3 uppercase text-right">Total Mão de Obra</td>
                    <td className="py-2 px-3 text-right text-[#1B4D3E] font-black text-xs">
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
          <div className="fpv-page-section">
            {renderHeader('Insumos, Materiais, Máquinas & Descartáveis', '05-07')}

            {/* Materiais */}
            {shouldRender('materiais') && (
              <div className="mb-4">
                <div className="bg-[#1B4D3E] text-white px-3 py-1 font-bold text-[10px] uppercase flex justify-between rounded-t">
                  <span>Materiais e Produtos de Limpeza</span>
                  <span>Total Mensal: {formatCurrency(proposta.insumos?.materiais || 0)}</span>
                </div>
                <table className="w-full text-left border border-slate-200 border-collapse text-[9.5px]">
                  <thead>
                    <tr className="bg-slate-100 font-bold text-slate-600 border-b border-slate-200">
                      <th className="py-1 px-3 w-16">Cód.</th>
                      <th className="py-1 px-3">Descrição</th>
                      <th className="py-1 px-3 text-right">Preço Unit.</th>
                      <th className="py-1 px-3 text-center w-14">Qtd.</th>
                      <th className="py-1 px-3 text-center w-16">Vida Útil</th>
                      <th className="py-1 px-3 text-right">Custo Mensal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(proposta.insumos?.detalheMateriais || []).map((m: any, i: number) => (
                      <tr key={i}>
                        <td className="py-1 px-3 font-mono text-slate-500">{m.codigo}</td>
                        <td className="py-1 px-3 font-semibold text-slate-800">{m.descricao}</td>
                        <td className="py-1 px-3 text-right">{formatCurrency(m.precoUnitario)}</td>
                        <td className="py-1 px-3 text-center">{m.quantidade}</td>
                        <td className="py-1 px-3 text-center">{m.vidaUtil}m</td>
                        <td className="py-1 px-3 text-right font-bold text-slate-900">{formatCurrency((Number(m.precoUnitario) * Number(m.quantidade)) / (Number(m.vidaUtil) || 1))}</td>
                      </tr>
                    ))}
                    {(!proposta.insumos?.detalheMateriais || proposta.insumos.detalheMateriais.length === 0) && (
                      <tr><td colSpan={6} className="py-2 text-center text-slate-400">Nenhum material cadastrado.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Máquinas */}
            {shouldRender('maquinas') && (
              <div className="mb-4">
                <div className="bg-[#1B4D3E] text-white px-3 py-1 font-bold text-[10px] uppercase flex justify-between rounded-t">
                  <span>Máquinas e Equipamentos</span>
                  <span>Total Mensal: {formatCurrency(proposta.insumos?.maquinas || 0)}</span>
                </div>
                <table className="w-full text-left border border-slate-200 border-collapse text-[9.5px]">
                  <thead>
                    <tr className="bg-slate-100 font-bold text-slate-600 border-b border-slate-200">
                      <th className="py-1 px-3 w-16">Cód.</th>
                      <th className="py-1 px-3">Descrição</th>
                      <th className="py-1 px-3 text-right">Preço Unit.</th>
                      <th className="py-1 px-3 text-center w-14">Qtd.</th>
                      <th className="py-1 px-3 text-center w-16">Vida Útil</th>
                      <th className="py-1 px-3 text-right">Custo Mensal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(proposta.insumos?.detalheMaquinas || []).map((m: any, i: number) => (
                      <tr key={i}>
                        <td className="py-1 px-3 font-mono text-slate-500">{m.codigo}</td>
                        <td className="py-1 px-3 font-semibold text-slate-800">{m.descricao}</td>
                        <td className="py-1 px-3 text-right">{formatCurrency(m.precoUnitario)}</td>
                        <td className="py-1 px-3 text-center">{m.quantidade}</td>
                        <td className="py-1 px-3 text-center">{m.vidaUtil}m</td>
                        <td className="py-1 px-3 text-right font-bold text-slate-900">{formatCurrency((Number(m.precoUnitario) * Number(m.quantidade)) / (Number(m.vidaUtil) || 1))}</td>
                      </tr>
                    ))}
                    {(!proposta.insumos?.detalheMaquinas || proposta.insumos.detalheMaquinas.length === 0) && (
                      <tr><td colSpan={6} className="py-2 text-center text-slate-400">Nenhuma máquina cadastrada.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Descartáveis */}
            {shouldRender('descartaveis') && (
              <div>
                <div className="bg-[#1B4D3E] text-white px-3 py-1 font-bold text-[10px] uppercase flex justify-between rounded-t">
                  <span>Descartáveis</span>
                  <span>Total Mensal: {formatCurrency(proposta.insumos?.descartaveis || 0)}</span>
                </div>
                <table className="w-full text-left border border-slate-200 border-collapse text-[9.5px]">
                  <thead>
                    <tr className="bg-slate-100 font-bold text-slate-600 border-b border-slate-200">
                      <th className="py-1 px-3 w-16">Cód.</th>
                      <th className="py-1 px-3">Descrição</th>
                      <th className="py-1 px-3 text-right">Preço Unit.</th>
                      <th className="py-1 px-3 text-center w-14">Qtd.</th>
                      <th className="py-1 px-3 text-center w-16">Vida Útil</th>
                      <th className="py-1 px-3 text-right">Custo Mensal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(proposta.insumos?.detalheDescartaveis || []).map((m: any, i: number) => (
                      <tr key={i}>
                        <td className="py-1 px-3 font-mono text-slate-500">{m.codigo}</td>
                        <td className="py-1 px-3 font-semibold text-slate-800">{m.descricao}</td>
                        <td className="py-1 px-3 text-right">{formatCurrency(m.precoUnitario)}</td>
                        <td className="py-1 px-3 text-center">{m.quantidade}</td>
                        <td className="py-1 px-3 text-center">{m.vidaUtil}m</td>
                        <td className="py-1 px-3 text-right font-bold text-slate-900">{formatCurrency((Number(m.precoUnitario) * Number(m.quantidade)) / (Number(m.vidaUtil) || 1))}</td>
                      </tr>
                    ))}
                    {(!proposta.insumos?.detalheDescartaveis || proposta.insumos.detalheDescartaveis.length === 0) && (
                      <tr><td colSpan={6} className="py-2 text-center text-slate-400">Nenhum descartável cadastrado.</td></tr>
                    )}
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
          <div className="fpv-page-section">
            {renderHeader('Planilha de Custos / Extrato Detalhado', '08')}

            {/* Montante A */}
            <div className="border border-slate-300 rounded overflow-hidden mb-3">
              <div className="bg-[#1B4D3E] text-white px-3 py-1 font-bold text-[10px] uppercase text-center">
                Montante "A" - Mão de Obra
              </div>
              <table className="w-full text-left border-collapse text-[9.5px]">
                <thead>
                  <tr className="bg-slate-100 font-bold border-b border-slate-200">
                    <th className="py-1 px-3">Função / Discriminação</th>
                    <th className="py-1 px-3 text-center w-16">Qtd</th>
                    <th className="py-1 px-3 text-right">Custo Unitário</th>
                    <th className="py-1 px-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {proposta.equipe.map((p: any, idx: number) => {
                    const itemRes = resultado?.items?.find((x: any) => x.id === p.id);
                    const qty = Number(p.quantidade || 1);
                    const custoTot = itemRes?.detalhes?.remuneracao || 0;
                    return (
                      <tr key={idx}>
                        <td className="py-1 px-3 font-semibold text-slate-800">{p.nomeCargo}</td>
                        <td className="py-1 px-3 text-center font-bold">{qty}</td>
                        <td className="py-1 px-3 text-right">{formatCurrency(custoTot)}</td>
                        <td className="py-1 px-3 text-right font-bold text-slate-900 bg-emerald-50/30">{formatCurrency(custoTot * qty)}</td>
                      </tr>
                    );
                  })}
                  <tr className="bg-slate-50 font-bold">
                    <td colSpan={3} className="py-1 px-3 text-right">1) Total Remuneração Função</td>
                    <td className="py-1 px-3 text-right font-bold text-slate-900">
                      {formatCurrency(resultado?.items?.reduce((a: any, i: any) => a + ((i.detalhes?.remuneracao || 0) * (i.quantidade || 1)), 0) || 0)}
                    </td>
                  </tr>
                  {!isSpot && (
                    <>
                      <tr>
                        <td className="py-1 px-3 font-bold text-slate-700">2) Encargos Sociais</td>
                        <td className="py-1 px-3 text-center font-bold text-slate-500">-</td>
                        <td className="py-1 px-3 text-right">-</td>
                        <td className="py-1 px-3 text-right font-bold text-slate-900">
                          {formatCurrency(resultado?.items?.reduce((a: any, i: any) => a + ((i.detalhes?.encargos || 0) * (i.quantidade || 1)), 0) || 0)}
                        </td>
                      </tr>
                      {(() => {
                        const totalOutros = resultado?.items?.reduce((a: any, i: any) => a + ((i.detalhes?.outrosBlocoA || 0) * (i.quantidade || 1)), 0) || 0;
                        const itemExtra = proposta.equipe.find((p: any) => p.parametrosPosto?.adicionalExtraIncideEncargos === false && Number(p.parametrosPosto?.adicionalExtraValor) > 0);
                        const labelOutros = totalOutros > 0 
                          ? `3) Outros (${itemExtra?.parametrosPosto?.adicionalExtraNome || 'Adicional Extra do Contrato / Verba Indenizatória'})`
                          : '3) Outros (Especificar)';
                        return (
                          <tr>
                            <td className="py-1 px-3 font-bold text-slate-700">{labelOutros}</td>
                            <td className="py-1 px-3 text-center">-</td>
                            <td className="py-1 px-3 text-right">-</td>
                            <td className="py-1 px-3 text-right font-bold text-slate-900">{formatCurrency(totalOutros)}</td>
                          </tr>
                        );
                      })()}
                    </>
                  )}
                  <tr className="bg-[#1B4D3E] text-white font-black">
                    <td colSpan={3} className="py-1.5 px-3 uppercase text-right">Total Montante "A" (Bloco A)</td>
                    <td className="py-1.5 px-3 text-right font-black">
                      {formatCurrency(resultado?.items?.reduce((a: any, i: any) => a + ((i.detalhes?.blocoA || 0) * (i.quantidade || 1)), 0) || 0)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Montante B */}
            <div className="border border-slate-300 rounded overflow-hidden mb-3">
              <div className="bg-[#1B4D3E] text-white px-3 py-1 font-bold text-[10px] uppercase text-center">
                Montante "B" - Insumos
              </div>
              <table className="w-full text-left border-collapse text-[9.5px]">
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-1 px-3 font-semibold">1) Uniformes e EPIs</td>
                    <td className="py-1 px-3 text-right font-bold text-slate-900">{formatCurrency(resultado?.items?.reduce((a: any, i: any) => a + ((i.detalhes?.ativos || 0) * (i.quantidade || 1)), 0) || 0)}</td>
                  </tr>
                  <tr>
                    <td className="py-1 px-3 font-semibold">2) Materiais e Produtos de Limpeza</td>
                    <td className="py-1 px-3 text-right font-bold text-slate-900">{formatCurrency(proposta.insumos?.materiais || 0)}</td>
                  </tr>
                  <tr>
                    <td className="py-1 px-3 font-semibold">3) Máquinas e Equipamentos</td>
                    <td className="py-1 px-3 text-right font-bold text-slate-900">{formatCurrency(proposta.insumos?.maquinas || 0)}</td>
                  </tr>
                  <tr>
                    <td className="py-1 px-3 font-semibold">4) Descartáveis</td>
                    <td className="py-1 px-3 text-right font-bold text-slate-900">{formatCurrency(proposta.insumos?.descartaveis || 0)}</td>
                  </tr>
                  <tr className="bg-[#1B4D3E] text-white font-black">
                    <td className="py-1.5 px-3 uppercase text-right">Total Montante "B"</td>
                    <td className="py-1.5 px-3 text-right font-black">
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
              <div className="border border-slate-300 rounded overflow-hidden">
                <div className="bg-[#1B4D3E] text-white px-3 py-1 font-bold text-[10px] uppercase text-center">
                  Montante "C" - Benefícios
                </div>
                <table className="w-full text-left border-collapse text-[9.5px]">
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
                          <tr><td className="py-1 px-3">Vale Alimentação / Refeição</td><td className="py-1 px-3 text-right font-bold">{formatCurrency(b.va)}</td></tr>
                          <tr><td className="py-1 px-3">Vale Transporte</td><td className="py-1 px-3 text-right font-bold">{formatCurrency(b.vt)}</td></tr>
                          <tr><td className="py-1 px-3">Cesta Básica / Benefício Social</td><td className="py-1 px-3 text-right font-bold">{formatCurrency(b.cesta)}</td></tr>
                          <tr><td className="py-1 px-3">Custos Sindicato / Assistencial</td><td className="py-1 px-3 text-right font-bold">{formatCurrency(b.sindicato)}</td></tr>
                          {b.outros > 0 && <tr><td className="py-1 px-3">Outros Benefícios</td><td className="py-1 px-3 text-right font-bold">{formatCurrency(b.outros)}</td></tr>}
                          <tr className="bg-[#1B4D3E] text-white font-black">
                            <td className="py-1.5 px-3 uppercase text-right">Total Montante "C" (Benefícios)</td>
                            <td className="py-1.5 px-3 text-right font-black">
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
          <div className="fpv-page-section">
            {renderHeader('Resumo Executivo da Proposta Comercial', '09')}

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-emerald-900 text-white p-4 rounded-xl text-center shadow-sm">
                <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-200 block mb-1">
                  Preço Mensal Sugerido (Faturamento Bruto)
                </span>
                <span className="text-2xl font-black">{formatCurrency(resultado?.faturamentoBruto || 0)}</span>
                <span className="text-[10px] text-emerald-300 block mt-1">Valor Anual: {formatCurrency((resultado?.faturamentoBruto || 0) * 12)}</span>
              </div>
              <div className="bg-slate-800 text-white p-4 rounded-xl text-center shadow-sm">
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-300 block mb-1">
                  Custo Operacional Total Mensal
                </span>
                <span className="text-2xl font-black">{formatCurrency(resultado?.custoTotal || 0)}</span>
                <span className="text-[10px] text-slate-300 block mt-1">Total Anual: {formatCurrency((resultado?.custoTotal || 0) * 12)}</span>
              </div>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="bg-slate-100 px-3 py-1.5 font-bold text-[10px] uppercase tracking-wider text-slate-700">
                Demonstrativo Sintético de Formação de Preço
              </div>
              <table className="w-full text-left border-collapse text-[10px]">
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-2 px-3 font-semibold text-slate-700">Total Montante A (Mão de Obra e Encargos)</td>
                    <td className="py-2 px-3 text-right font-bold text-slate-900">{formatCurrency(resultado?.items?.reduce((a: any, i: any) => a + ((i.detalhes?.blocoA || 0) * (i.quantidade || 1)), 0) || 0)}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-semibold text-slate-700">Total Montante B (Insumos, Máquinas e Uniformes)</td>
                    <td className="py-2 px-3 text-right font-bold text-slate-900">
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
                      <td className="py-2 px-3 font-semibold text-slate-700">Total Montante C (Benefícios)</td>
                      <td className="py-2 px-3 text-right font-bold text-slate-900">{formatCurrency(resultado?.items?.reduce((a: any, i: any) => a + ((i.detalhes?.beneficios || 0) * (i.quantidade || 1)), 0) || 0)}</td>
                    </tr>
                  )}
                  <tr className="bg-slate-50 font-bold">
                    <td className="py-2 px-3 uppercase">Custo Direto Total</td>
                    <td className="py-2 px-3 text-right font-black text-slate-900">{formatCurrency(resultado?.custoTotal || 0)}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-slate-700">Tributos e Impostos Fiscais</td>
                    <td className="py-2 px-3 text-right font-bold text-red-700">{formatCurrency(resultado?.impostosValor || 0)}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-slate-700">Margem Bruta / Contribuição</td>
                    <td className="py-2 px-3 text-right font-bold text-emerald-700">{formatCurrency(resultado?.lucroValor || 0)}</td>
                  </tr>
                  <tr className="bg-[#1B4D3E] text-white font-black text-xs">
                    <td className="py-2.5 px-3 uppercase">Faturamento Bruto Mensal Sugerido</td>
                    <td className="py-2.5 px-3 text-right font-black">{formatCurrency(resultado?.faturamentoBruto || 0)}</td>
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
          <div className="fpv-page-section">
            {renderHeader('DRE - Demonstrativo de Resultado do Exercício (12 Meses)', '10')}

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left border-collapse text-[9px]">
                <thead>
                  <tr className="bg-[#1B4D3E] text-white font-bold">
                    <th className="py-1.5 px-2">Conta / Descrição</th>
                    <th className="py-1.5 px-2 text-right">Mensal (R$)</th>
                    <th className="py-1.5 px-2 text-right">Anual (R$)</th>
                    <th className="py-1.5 px-2 text-right">% Rec.</th>
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
                        <tr className={`${isHeader ? 'bg-slate-100 font-bold' : ''} ${isHighlight ? 'bg-emerald-50/60 font-black text-[#1B4D3E]' : ''}`}>
                          <td className="py-1 px-2">{label}</td>
                          <td className="py-1 px-2 text-right">{formatCurrency(val)}</td>
                          <td className="py-1 px-2 text-right">{formatCurrency(val * 12)}</td>
                          <td className="py-1 px-2 text-right">{pct.toFixed(1)}%</td>
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

            <div className="mt-6 text-center text-[9px] text-slate-400 border-t border-slate-200 pt-2">
              Documento gerado eletronicamente pelo SmartBid Hub • Sistema de Formação de Preço de Vendas (FPV)
            </div>
          </div>
        )}

      </div>
    </>
  );
}
