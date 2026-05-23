import React from 'react';

export default function DocumentoA4({ proposta, resultado, empresaEmissora }: { proposta: any, resultado: any, empresaEmissora: any }) {
  if (!proposta || !proposta.cliente) return <div className="p-10 text-center">Carregando dados da proposta...</div>;
  if (!empresaEmissora) return <div className="p-10 text-center">Selecione uma Empresa Emissora para visualizar o documento.</div>;

  // Calculos e formatadores
  const fmt = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  
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

  const totalEquipe = resultado?.items?.reduce((acc: any, i: any) => acc + (i.precoVenda || 0), 0) || 0;
  
  const vMateriais = applyCascata(proposta.insumos?.materiais || 0);
  const vMaquinas = applyCascata(proposta.insumos?.maquinas || 0);
  const vDescartaveis = applyCascata(proposta.insumos?.descartaveis || 0);
  const vServicos = applyCascata(proposta.insumos?.servicos || 0);
  
  const totalInsumos = vMateriais + vMaquinas + vDescartaveis + vServicos;
  
  const totalGeral = totalEquipe + totalInsumos;

  const renderTabelaComercial = () => (
    <div className="mt-8 pr-2 font-sans">
        {/* QUADRO EFETIVO */}
        <h5 className="font-black uppercase mb-2 text-[10px]">QUADRO EFETIVO / SERVIÇOS</h5>
        <table className="w-full text-left border-collapse border border-slate-300 mb-6 text-xs">
          <thead>
            <tr className="bg-slate-900 text-white font-bold uppercase text-[10px]">
              <th className="p-2 border border-slate-300">Cargo / Função</th>
              <th className="p-2 border border-slate-300 text-center">Escala</th>
              <th className="p-2 border border-slate-300 text-center">Qtd</th>
              <th className="p-2 border border-slate-300 text-right">Valor Unit.</th>
              <th className="p-2 border border-slate-300 text-right">Valor Mensal</th>
            </tr>
          </thead>
          <tbody>
            {equipe.map((item: any, idx: number) => {
              const precoVendaTotal = resultado?.items?.[idx]?.precoVenda || 0;
              const precoUnitario = item.quantidade > 0 ? precoVendaTotal / item.quantidade : 0;
              
              return (
                <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                  <td className="p-2 border border-slate-300 font-bold text-slate-800">{item.nomeCargo}</td>
                  <td className="p-2 border border-slate-300 text-center text-slate-600">{item.escala}</td>
                  <td className="p-2 border border-slate-300 text-center text-slate-600">{item.quantidade}</td>
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

        {/* INSUMOS E MATERIAIS */}
        <h5 className="font-black uppercase mb-2 text-[10px]">EQUIPAMENTOS E INSUMOS</h5>
        <table className="w-full text-left border-collapse border border-slate-300 mb-6 text-xs">
          <thead>
            <tr className="bg-slate-900 text-white font-bold uppercase text-[10px]">
              <th className="p-2 border border-slate-300">Descrição</th>
              <th className="p-2 border border-slate-300 text-right">Valor Mensal</th>
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
                <td className="p-2 border-r border-slate-300 font-bold text-slate-800">{proposta.insumos?.servicosDescricao || "Serviços Terceirizados"}</td>
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

        {/* VALOR TOTAL */}
        <div className="w-full mt-8 p-4 bg-green-50 border-2 border-green-600 flex justify-center items-center text-center text-green-900 font-black text-lg mb-12 uppercase tracking-wide">
          Valor Total da Proposta: {fmt(totalGeral)}
        </div>
    </div>
  );

  const renderTabelaItensInclusosExcluidos = () => {
    return (
      <div className="w-full mt-4 page-break-inside-avoid">
        <table className="w-full text-left border-collapse border border-slate-300">
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

  return (
    <div className="bg-slate-200 min-h-screen py-8 flex flex-col items-center overflow-auto print:bg-white print:py-0">
      
      {/* Botão de Voltar para não bugar o fluxo - Só aparece na tela, não na impressão */}
      <div className="w-[210mm] mb-4 flex justify-between no-print">
        <button onClick={() => window.history.back()} className="px-4 py-2 bg-white rounded-lg shadow text-sm font-bold text-slate-600 hover:bg-slate-50">
          ← Voltar
        </button>
        <button onClick={() => window.print()} className="px-6 py-2 bg-[#1B4D3E] rounded-lg shadow text-sm font-black text-white hover:bg-[#143d31]">
          🖨️ Imprimir PDF
        </button>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          /* Zera a margem nativa para sumir com cabeçalhos/rodapés do Chrome automaticamente */
          @page { margin: 0 !important; size: auto; }
          
          * {
             -webkit-print-color-adjust: exact !important;
             print-color-adjust: exact !important;
             color-adjust: exact !important;
          }

          body {
            background-color: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          
          /* Esconde tudo na tela mantendo a árvore do DOM */
          body * {
            visibility: hidden !important;
          }

          /* Traz de volta o A4 e seus filhos */
          .print-a4-page, .print-a4-page * {
            visibility: visible !important;
          }

          .print-a4-page {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-sizing: border-box !important;
            box-shadow: none !important;
            border: none !important;
          }

          /* Ocultar o thead e tfoot na tela, só mostrar na impressão */
          .print-margin-header, .print-margin-footer {
             height: 20mm;
          }
          .print-content-cell {
             padding: 0 20mm !important;
          }
        }
      `}} />

      <div className="print-a4-page bg-white w-[210mm] min-h-[297mm] print:min-h-0 shadow-2xl print:shadow-none mx-auto relative text-slate-900 text-xs">
        <table className="w-full border-collapse">
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
            <img src="https://grupojvsserv.com.br/wp-content/uploads/2023/11/logo-horizontal-300px.png" alt="Logo" className="h-16 object-contain" />
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
                  const rawTitulo = clausula.titulo.replace(/^CLÁUSULA\s+\d+\s*[-–]?\s*/i, '').trim();
                  const tituloFinal = `CLÁUSULA ${String(clauseNum).padStart(2,'0')} - ${rawTitulo}`;
                  const paragrafos = clausula.texto !== '[TABELA]'
                    ? clausula.texto.split(/\n/).filter((p: string) => p.trim() !== '')
                    : [];
                  return (
                    <div key={idx} className={idx > 0 ? "mt-6" : ""}>
                      <h4 className="font-bold uppercase">{tituloFinal}</h4>
                      <div className="pl-4 mt-2">
                        {clausula.texto !== '[TABELA]' ? paragrafos.map((p: string, pIdx: number) => (
                          <p key={pIdx} className="mb-2 text-justify">
                            <span className="font-bold mr-1">{clauseNum}.{pIdx + 1}.</span>{p.replace(/^\d+\.\d+\.?\s*/, '')}
                          </p>
                        )) : null}
                      </div>
                      {(clausula.texto.includes('[TABELA]') || clausula.titulo.includes('COMERCIAIS')) && renderTabelaComercial()}
                    </div>
                  );
                })}
                
                {proposta.cliente.clausulasA4.length > 0 && !proposta.cliente.clausulasA4.some((c:any) => c.texto.includes('[TABELA]') || c.titulo.includes('COMERCIAIS')) && (() => {
                  const n = proposta.cliente.clausulasA4.length + 1;
                  return (
                    <div className="mt-6">
                      <h4 className="font-bold uppercase">CLÁUSULA {String(n).padStart(2,'0')} - RESUMO COMERCIAL DA PROPOSTA</h4>
                      <div className="pl-4 mt-2">
                        <p><span className="font-bold mr-1">{n}.1.</span>Valores referentes aos serviços prestados, equipe alocada e insumos, conforme detalhamento a seguir:</p>
                      </div>
                      {renderTabelaComercial()}
                    </div>
                  );
                })()}

                {(() => {
                  const hasTabela = proposta.cliente.clausulasA4.some((c:any) => c.texto.includes('[TABELA]') || c.titulo.includes('COMERCIAIS'));
                  const n = hasTabela
                    ? proposta.cliente.clausulasA4.length + 1
                    : proposta.cliente.clausulasA4.length + 2;
                  return (
                    <div className="mt-6">
                      <h4 className="font-bold uppercase border-b-2 border-slate-900 pb-2 mb-4">CLÁUSULA {String(n).padStart(2,'0')} - ITENS INCLUSOS E EXCLUSOS</h4>
                      {renderTabelaItensInclusosExcluidos()}
                    </div>
                  );
                })()}
             </>
          ) : (
            <>
              <div>
                <h4 className="font-bold uppercase">CLÁUSULA 01 - DO OBJETO E ESCOPO</h4>
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
                <h4 className="font-bold uppercase mt-6">CLÁUSULA 02 - DAS CONDIÇÕES COMERCIAIS</h4>
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
                <h4 className="font-bold uppercase">CLÁUSULA 03 - RESUMO COMERCIAL DA PROPOSTA</h4>
                <div className="pl-4 mt-2">
                  <p className="text-justify"><span className="font-bold mr-1">3.1.</span>Valores referentes aos serviços prestados, equipe alocada e insumos, conforme detalhamento a seguir:</p>
                </div>
                {renderTabelaComercial()}
              </div>

              <div className="mt-6">
                <h4 className="font-bold uppercase">CLÁUSULA 04 - ITENS INCLUSOS E EXCLUSOS</h4>
                {renderTabelaItensInclusosExcluidos()}
              </div>
            </>
          )}
        </div>

        <div className="mt-16 page-break-inside-avoid">
          <h4 className="font-bold uppercase">CLÁUSULA 05 - TERMO DE ACEITE</h4>
          
          <div className="text-[13px] text-justify space-y-4 my-6 text-slate-800 leading-relaxed pl-4">
             <p>Ao assinar este termo de aceite, o <strong>{proposta.cliente?.cliente?.toUpperCase() || proposta.cliente?.razaoSocial?.toUpperCase() || "CLIENTE"}</strong> manifesta sua concordância com os valores descritos, premissas de investimento e condições comerciais apresentadas nesta proposta comercial.</p>
             <p>Este documento servirá como base oficial para a elaboração do instrumento jurídico definitivo (Contrato de Prestação de Serviços) entre as partes.</p>
          </div>
          
          <div className="w-full mt-4">
            <table className="w-full text-left border-collapse border border-slate-300">
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
                  <td className="px-4 py-2 font-black text-slate-900">{fmt(totalGeral)}</td>
                </tr>
                <tr className="border-b border-slate-300 text-[10px] text-slate-800">
                  <td className="px-4 py-2 border-r border-slate-300 font-bold bg-slate-100 uppercase">Início</td>
                  <td className="px-4 py-2 font-semibold">{proposta.cliente?.dataInicio || "-"}</td>
                </tr>
                <tr className="border-b border-slate-300 text-[10px] text-slate-800">
                  <td className="px-4 py-2 border-r border-slate-300 font-bold bg-slate-100 uppercase">Vencimento</td>
                  <td className="px-4 py-2 font-semibold">{proposta.cliente?.dataVencimento || "-"}</td>
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

          <div className="mt-20 pt-10 grid grid-cols-1 gap-16 text-center page-break-inside-avoid max-w-md mx-auto">
             <div>
                <div className="border-t border-black pt-2 font-black">CLIENTE</div>
                <div className="mt-1 font-bold text-[10px]">{proposta.cliente?.razaoSocial || proposta.cliente?.cliente || "Cliente"}</div>
                <div className="text-[10px] text-slate-500 uppercase">{proposta.cliente?.contato || "Representante Legal"}</div>
             </div>
          </div>
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
