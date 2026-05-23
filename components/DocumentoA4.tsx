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
    <div className="mt-8 pr-2">
        {/* QUADRO EFETIVO */}
        <h5 className="font-bold uppercase mb-3 text-xs tracking-widest text-slate-800">1. Quadro de Efetivo e Serviços</h5>
        <table className="w-full text-left border-collapse mb-8 text-[11px]">
          <thead>
            <tr className="border-b-2 border-slate-800 text-slate-800 font-bold uppercase">
              <th className="py-2 pr-2">Cargo / Função</th>
              <th className="py-2 px-2 text-center">Escala</th>
              <th className="py-2 px-2 text-center">Qtd</th>
              <th className="py-2 px-2 text-right">Valor Unit.</th>
              <th className="py-2 pl-2 text-right">Valor Mensal</th>
            </tr>
          </thead>
          <tbody>
            {equipe.map((item: any, idx: number) => {
              const precoVendaTotal = resultado?.items?.[idx]?.precoVenda || 0;
              const precoUnitario = item.quantidade > 0 ? precoVendaTotal / item.quantidade : 0;
              
              return (
                <tr key={idx} className="border-b border-slate-200">
                  <td className="py-2 pr-2 font-semibold text-slate-700">{item.nomeCargo}</td>
                  <td className="py-2 px-2 text-center text-slate-600">{item.escala}</td>
                  <td className="py-2 px-2 text-center text-slate-600">{item.quantidade}</td>
                  <td className="py-2 px-2 text-right text-slate-600">{fmt(precoUnitario)}</td>
                  <td className="py-2 pl-2 text-right font-bold text-slate-800">{fmt(precoVendaTotal)}</td>
                </tr>
              );
            })}
            {equipe.length === 0 && (
              <tr><td colSpan={5} className="py-4 text-center text-slate-400 italic">Nenhum posto de serviço adicionado.</td></tr>
            )}
          </tbody>
          <tfoot>
            <tr className="font-bold text-slate-800 bg-slate-50">
              <td colSpan={4} className="py-3 pr-2 text-right uppercase text-[10px] tracking-wider">Subtotal Serviços:</td>
              <td className="py-3 pl-2 text-right">{fmt(totalEquipe)}</td>
            </tr>
          </tfoot>
        </table>

        {/* INSUMOS E MATERIAIS */}
        <h5 className="font-bold uppercase mb-3 text-xs tracking-widest text-slate-800">2. Equipamentos e Insumos</h5>
        <table className="w-full text-left border-collapse mb-8 text-[11px]">
          <thead>
            <tr className="border-b-2 border-slate-800 text-slate-800 font-bold uppercase">
              <th className="py-2 pr-2">Descrição</th>
              <th className="py-2 pl-2 text-right">Valor Mensal</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-200">
              <td className="py-2 pr-2 font-semibold text-slate-700">Materiais de Limpeza e Consumo</td>
              <td className="py-2 pl-2 text-right text-slate-600">{fmt(vMateriais)}</td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="py-2 pr-2 font-semibold text-slate-700">Máquinas e Equipamentos</td>
              <td className="py-2 pl-2 text-right text-slate-600">{fmt(vMaquinas)}</td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="py-2 pr-2 font-semibold text-slate-700">Materiais Descartáveis</td>
              <td className="py-2 pl-2 text-right text-slate-600">{fmt(vDescartaveis)}</td>
            </tr>
            {vServicos > 0 && (
              <tr className="border-b border-slate-200">
                <td className="py-2 pr-2 font-semibold text-slate-700">{proposta.insumos?.servicosDescricao || "Serviços Terceirizados"}</td>
                <td className="py-2 pl-2 text-right text-slate-600">{fmt(vServicos)}</td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr className="font-bold text-slate-800 bg-slate-50">
              <td className="py-3 pr-2 text-right uppercase text-[10px] tracking-wider">Subtotal Insumos:</td>
              <td className="py-3 pl-2 text-right">{fmt(totalInsumos)}</td>
            </tr>
          </tfoot>
        </table>

        {/* VALOR TOTAL */}
        <div className="w-full mt-6 p-5 border border-slate-800 flex justify-between items-center bg-slate-50">
          <span className="font-bold uppercase tracking-widest text-slate-800 text-xs">Valor Mensal da Proposta</span>
          <span className="font-black text-xl text-slate-900">{fmt(totalGeral)}</span>
        </div>
    </div>
  );

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
          @page { margin: 0; size: A4; }
          
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

          /* Arranca o A4 do fluxo do layout e joga pro topo da página de impressão */
          .print-a4-page {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            min-height: 100vh !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            page-break-after: always;
          }
        }
      `}} />

      <div className="print-a4-page bg-white w-[210mm] min-h-[297mm] shadow-2xl print:shadow-none mx-auto relative px-16 py-12 text-slate-900 text-[13px] print:p-0 print:text-[12px] font-serif leading-relaxed">
        
        {/* CABEÇALHO OFICIAL */}
        <div className="flex flex-col items-center text-center border-b-[3px] border-slate-900 pb-8 mb-10 mt-4">
          <img src="https://grupojvsserv.com.br/wp-content/uploads/2023/11/logo-horizontal-300px.png" alt="Logo" className="h-16 object-contain mb-6" />
          <h1 className="text-xl font-bold uppercase tracking-widest text-slate-900">{empresaEmissora.nomeFantasia}</h1>
          <div className="text-[11px] text-slate-600 mt-2 font-sans tracking-wide">
             <p>CNPJ: {empresaEmissora.cnpj}</p>
             {empresaEmissora.endereco && <p>{empresaEmissora.endereco}</p>}
             {empresaEmissora.telefone && <p>Tel: {empresaEmissora.telefone} | Email: {empresaEmissora.email}</p>}
          </div>
        </div>

        {/* TÍTULO */}
        <div className="text-center mb-10">
          <h2 className="text-xl font-black uppercase tracking-tight text-slate-900">PROPOSTA COMERCIAL DE PRESTAÇÃO DE SERVIÇOS</h2>
          <div className="flex justify-center items-center gap-4 mt-3 text-sm font-bold text-slate-700 font-sans">
             <span>Proposta nº {(proposta.numero || "0000").toString().padStart(4, '0')}</span>
             <span>|</span>
             <span>Revisão {String(proposta.versao || 1).padStart(2, '0')}</span>
             <span>|</span>
             <span>Data: {proposta.cliente?.dataElaboracao || new Date().toLocaleDateString('pt-BR')}</span>
          </div>
        </div>

        {/* DADOS DO CLIENTE - QUADRO FORMAL */}
        <div className="border border-slate-400 p-5 mb-10 text-xs font-sans">
          <h3 className="font-bold uppercase mb-4 text-sm border-b border-slate-300 pb-2 text-slate-800">DADOS DO CONTRATANTE</h3>
          <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-slate-700">
            <p className="col-span-2"><strong className="text-slate-900">Razão Social / Cliente:</strong> {proposta.cliente?.cliente || proposta.cliente?.razaoSocial}</p>
            <p><strong className="text-slate-900">CNPJ / CPF:</strong> {proposta.cliente?.cnpj}</p>
            <p><strong className="text-slate-900">Telefone:</strong> {proposta.cliente?.celular}</p>
            <p className="col-span-2"><strong className="text-slate-900">Endereço de Implantação:</strong> {proposta.cliente?.cidade}</p>
            <p><strong className="text-slate-900">A/C:</strong> {proposta.cliente?.contato} {proposta.cliente?.contatoCargo ? `(${proposta.cliente.contatoCargo})` : ''}</p>
            <p><strong className="text-slate-900">E-mail:</strong> {proposta.cliente?.email}</p>
          </div>
        </div>

        {/* CLÁUSULAS */}
        <div className="text-justify mb-16">
          <h3 className="font-bold uppercase mb-6 text-base text-center text-slate-900">TERMOS E CONDIÇÕES</h3>
          {proposta.cliente?.clausulasA4 && proposta.cliente.clausulasA4.length > 0 ? (
             <div className="space-y-6">
               {proposta.cliente.clausulasA4.map((clausula: any, idx: number) => (
                 <div key={idx}>
                   <h4 className="font-bold uppercase text-sm mb-2 text-slate-800">{clausula.titulo}</h4>
                   <div className="whitespace-pre-wrap font-serif">
                     {clausula.texto !== '[TABELA]' && clausula.texto}
                   </div>
                   {(clausula.texto.includes('[TABELA]') || clausula.titulo.includes('COMERCIAIS')) && renderTabelaComercial()}
                 </div>
               ))}
               
               {/* Se não encontrou a tabela nas cláusulas e tem menos de 3 (ex. o cara fez só a 1 e a 2), força no final! */}
               {proposta.cliente.clausulasA4.length > 0 && !proposta.cliente.clausulasA4.some((c:any) => c.texto.includes('[TABELA]') || c.titulo.includes('COMERCIAIS')) && (
                 <div className="mt-8">
                   <h4 className="font-bold uppercase text-sm mb-2 text-slate-800">CLÁUSULA 03 - RESUMO COMERCIAL DA PROPOSTA</h4>
                   <div className="whitespace-pre-wrap font-serif">
                     Valores referentes aos serviços prestados, equipe alocada e insumos, conforme detalhamento a seguir:
                   </div>
                   {renderTabelaComercial()}
                 </div>
               )}
             </div>
          ) : (
             <div className="space-y-6">
              <div>
                <h4 className="font-bold uppercase text-sm mb-2 text-slate-800">CLÁUSULA 01 - DO OBJETO E ESCOPO</h4>
                <div className="whitespace-pre-wrap font-serif">
                  {proposta.cliente?.objetoProposta && (
                    <div className="mb-2">{proposta.cliente.objetoProposta}</div>
                  )}
                  {proposta.cliente?.hasEscopoTecnico && proposta.cliente?.escopoTecnico && (
                    <div>{proposta.cliente.escopoTecnico}</div>
                  )}
                </div>
              </div>
              
              <div>
                <h4 className="font-bold uppercase text-sm mb-2 text-slate-800 mt-8">CLÁUSULA 02 - DAS CONDIÇÕES COMERCIAIS</h4>
                <div className="font-serif">
                   {proposta.cliente?.condicoesCliente?.map((c: string, i: number) => (
                      <p key={i} className="mb-1">2.{i+1}. {c}</p>
                   ))}
                   {!proposta.cliente?.condicoesCliente?.length && (
                     <p>As condições comerciais seguirão o padrão estipulado em contrato, com vencimento conforme acordado e validade da proposta de 30 dias.</p>
                   )}
                </div>
              </div>

              <div className="mt-8">
                <h4 className="font-bold uppercase text-sm mb-2 text-slate-800">CLÁUSULA 03 - RESUMO COMERCIAL DA PROPOSTA</h4>
                <div className="whitespace-pre-wrap font-serif">
                  Valores referentes aos serviços prestados, equipe alocada e insumos, conforme detalhamento a seguir:
                </div>
                {renderTabelaComercial()}
              </div>
            </div>
          )}
        </div>

        {/* ASSINATURAS / ACEITE */}
        <div className="mt-24 pt-16 border-t border-slate-300 grid grid-cols-2 gap-16 text-center page-break-inside-avoid font-sans">
           <div>
              <div className="border-t border-black pt-3 font-bold uppercase text-xs">CONTRATANTE</div>
              <div className="mt-2 font-bold text-xs text-slate-800">{proposta.cliente?.razaoSocial || proposta.cliente?.cliente || "Cliente"}</div>
              <div className="text-[10px] text-slate-500 uppercase mt-1">{proposta.cliente?.contato || "Representante Legal"}</div>
           </div>
           <div>
              <div className="border-t border-black pt-3 font-bold uppercase text-xs">CONTRATADA</div>
              <div className="mt-2 font-bold text-xs text-slate-800">{empresaEmissora.razaoSocial}</div>
              <div className="text-[10px] text-slate-500 uppercase mt-1">{proposta.cliente?.vendedorNome || "Representante Legal"}</div>
           </div>
        </div>

      </div>
    </div>
  );
}
