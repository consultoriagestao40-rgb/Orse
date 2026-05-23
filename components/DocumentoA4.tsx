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
          /* Garante 2cm de margem física em TODAS as páginas (Página 1, 2, 3...) */
          @page { margin: 20mm !important; size: A4; }
          
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
            margin: 0 !important;
            padding: 0 !important;
            box-sizing: border-box !important;
            box-shadow: none !important;
            border: none !important;
            page-break-after: always;
          }
        }
      `}} />

      <div className="print-a4-page bg-white w-[210mm] min-h-[297mm] shadow-2xl print:shadow-none mx-auto relative px-16 py-12 text-slate-900 text-xs">
        
        {/* CABEÇALHO HORIZONTAL */}
        <div className="flex items-center justify-between border-b-2 border-slate-900 pb-6 mb-6">
          {/* Espaçador invisível na esquerda para manter o texto 100% centralizado */}
          <div className="w-40 invisible">Espaçador</div>
          
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
            <p><strong>Código:</strong> {proposta.cliente?.codigo || ''}</p>
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
               {proposta.cliente.clausulasA4.map((clausula: any, idx: number) => (
                 <div key={idx} className={idx > 0 ? "mt-6" : ""}>
                   <h4 className="font-bold uppercase">{clausula.titulo}</h4>
                   <div className="pl-4 mt-2 whitespace-pre-wrap">
                     {clausula.texto !== '[TABELA]' && clausula.texto}
                   </div>
                   {(clausula.texto.includes('[TABELA]') || clausula.titulo.includes('COMERCIAIS')) && renderTabelaComercial()}
                 </div>
               ))}
               
               {/* Se não encontrou a tabela nas cláusulas e tem menos de 3 (ex. o cara fez só a 1 e a 2), força no final! */}
               {proposta.cliente.clausulasA4.length > 0 && !proposta.cliente.clausulasA4.some((c:any) => c.texto.includes('[TABELA]') || c.titulo.includes('COMERCIAIS')) && (
                 <div className="mt-6">
                   <h4 className="font-bold uppercase">CLÁUSULA 03 - RESUMO COMERCIAL DA PROPOSTA</h4>
                   <div className="pl-4 mt-2 whitespace-pre-wrap">
                     Valores referentes aos serviços prestados, equipe alocada e insumos, conforme detalhamento a seguir:
                   </div>
                   {renderTabelaComercial()}
                 </div>
               )}
             </>
          ) : (
            <>
              <div>
                <h4 className="font-bold uppercase">CLÁUSULA 01 - DO OBJETO E ESCOPO:</h4>
                <div className="pl-4 mt-2 whitespace-pre-wrap">
                  {proposta.cliente?.objetoProposta && (
                    <div className="mb-2">{proposta.cliente.objetoProposta}</div>
                  )}
                  {proposta.cliente?.hasEscopoTecnico && proposta.cliente?.escopoTecnico && (
                    <div>{proposta.cliente.escopoTecnico}</div>
                  )}
                </div>
              </div>
              
              <div>
                <h4 className="font-bold uppercase mt-6">CLÁUSULA 02 - DAS CONDIÇÕES COMERCIAIS:</h4>
                <div className="pl-4 mt-2">
                   {proposta.cliente?.condicoesCliente?.map((c: string, i: number) => (
                      <p key={i} className="mb-1">2.{i+1}. {c}</p>
                   ))}
                   {!proposta.cliente?.condicoesCliente?.length && (
                     <p>As condições comerciais seguirão o padrão estipulado em contrato, com vencimento conforme acordado e validade da proposta de 30 dias.</p>
                   )}
                </div>
              </div>

              <div className="mt-6">
                <h4 className="font-bold uppercase">CLÁUSULA 03 - RESUMO COMERCIAL DA PROPOSTA</h4>
                <div className="pl-4 mt-2 whitespace-pre-wrap">
                  Valores referentes aos serviços prestados, equipe alocada e insumos, conforme detalhamento a seguir:
                </div>
                {renderTabelaComercial()}
              </div>
            </>
          )}
        </div>

        {/* ASSINATURAS / ACEITE */}
        <div className="mt-32 pt-10 border-t-2 border-slate-200 grid grid-cols-2 gap-16 text-center page-break-inside-avoid">
           <div>
              <div className="border-t border-black pt-2 font-black">CONTRATANTE</div>
              <div className="mt-1 font-bold text-[10px]">{proposta.cliente?.razaoSocial || proposta.cliente?.cliente || "Cliente"}</div>
              <div className="text-[10px] text-slate-500 uppercase">{proposta.cliente?.contato || "Representante Legal"}</div>
           </div>
           <div>
              <div className="border-t border-black pt-2 font-black">CONTRATADA</div>
              <div className="mt-1 font-bold text-[10px]">{empresaEmissora.razaoSocial}</div>
              <div className="text-[10px] text-slate-500 uppercase">{proposta.cliente?.vendedorNome || "Representante Legal"}</div>
           </div>
        </div>

      </div>
    </div>
  );
}
