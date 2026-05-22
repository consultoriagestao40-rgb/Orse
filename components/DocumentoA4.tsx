import React from 'react';

export default function DocumentoA4({ proposta, empresaEmissora }: { proposta: any, empresaEmissora: any }) {
  if (!proposta || !proposta.cliente) return <div className="p-10 text-center">Carregando dados da proposta...</div>;
  if (!empresaEmissora) return <div className="p-10 text-center">Selecione uma Empresa Emissora para visualizar o documento.</div>;

  // Calculos e formatadores
  const fmt = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  
  const equipe = proposta.equipe || [];
  const totalEquipe = equipe.reduce((acc: number, item: any) => acc + (item.custoTotalItem || 0), 0);
  const totalInsumos = (proposta.insumos?.materiais || 0) + (proposta.insumos?.maquinas || 0) + (proposta.insumos?.descartaveis || 0) + (proposta.insumos?.servicos || 0);
  const totalGeral = totalEquipe + totalInsumos;

  return (
    <div className="w-full bg-slate-100 flex flex-col items-center py-10 print:py-0 print:bg-white overflow-y-auto">
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { size: A4 portrait; margin: 15mm; }
          body, html, #root, [class*="layout"], [class*="sidebar"], [class*="main"], header, nav, button, .no-print {
            background-color: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
          }
          .sidebar, header, nav, button, .no-print { display: none !important; }
          .print-a4-page {
            width: 100% !important;
            height: auto !important;
            min-height: 100vh !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            page-break-after: always;
          }
        }
      `}} />

      <div className="print-a4-page bg-white w-[210mm] min-h-[297mm] shadow-2xl print:shadow-none mx-auto relative p-12 text-slate-900 text-xs">
        
        {/* CABEÇALHO */}
        <div className="flex flex-col items-center text-center border-b-2 border-slate-900 pb-6 mb-6">
          <img src="https://grupojvsserv.com.br/wp-content/uploads/2023/11/logo-horizontal-300px.png" alt="Logo" className="h-14 object-contain mb-4" />
          <h1 className="text-xl font-black uppercase tracking-widest">{empresaEmissora.nomeFantasia}</h1>
          <p className="font-bold mt-1">CNPJ: {empresaEmissora.cnpj}</p>
          {empresaEmissora.endereco && <p>{empresaEmissora.endereco}</p>}
          {empresaEmissora.telefone && <p>Telefone: {empresaEmissora.telefone}</p>}
          {empresaEmissora.email && <p>Email: {empresaEmissora.email}</p>}
        </div>

        {/* TÍTULO */}
        <div className="text-center mb-8">
          <h2 className="text-lg font-black uppercase tracking-tight">PROPOSTA COMERCIAL DE PRESTAÇÃO DE SERVIÇOS</h2>
          <p className="font-bold mt-2">Proposta nº {(proposta.numero || "0000").toString().padStart(4, '0')} - Rev. {String(proposta.versao || 1).padStart(2, '0')}</p>
          <p>Data: {proposta.cliente?.dataElaboracao || new Date().toLocaleDateString('pt-BR')}</p>
        </div>

        {/* DADOS DO CLIENTE */}
        <div className="bg-slate-100 border-l-4 border-slate-900 p-4 mb-8">
          <h3 className="font-black uppercase mb-3 text-sm">DADOS DO CLIENTE</h3>
          <div className="grid grid-cols-2 gap-2">
            <p><strong>Cliente:</strong> {proposta.cliente?.razaoSocial || proposta.cliente?.cliente}</p>
            <p><strong>CNPJ/CPF:</strong> {proposta.cliente?.cnpj}</p>
            <p className="col-span-2"><strong>Endereço:</strong> {proposta.cliente?.cidade}</p>
            <p><strong>Contato:</strong> {proposta.cliente?.contato}</p>
            <p><strong>Cargo:</strong> {proposta.cliente?.contatoCargo}</p>
            <p><strong>Telefone:</strong> {proposta.cliente?.celular}</p>
            <p><strong>Email:</strong> {proposta.cliente?.email}</p>
          </div>
        </div>

        {/* QUADRO EFETIVO */}
        <h3 className="font-black uppercase mb-2 text-sm mt-8">QUADRO EFETIVO / SERVIÇOS</h3>
        <table className="w-full text-left border-collapse border border-slate-300 mb-8">
          <thead>
            <tr className="bg-slate-900 text-white font-bold text-[10px] uppercase">
              <th className="p-2 border border-slate-300">Cargo / Função</th>
              <th className="p-2 border border-slate-300 text-center">Escala</th>
              <th className="p-2 border border-slate-300 text-center">Qtd</th>
              <th className="p-2 border border-slate-300 text-right">Valor Unit.</th>
              <th className="p-2 border border-slate-300 text-right">Valor Mensal</th>
            </tr>
          </thead>
          <tbody>
            {equipe.map((item: any, idx: number) => (
              <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                <td className="p-2 border border-slate-300 font-bold">{item.nomeCargo}</td>
                <td className="p-2 border border-slate-300 text-center">{item.escala}</td>
                <td className="p-2 border border-slate-300 text-center">{item.quantidade}</td>
                <td className="p-2 border border-slate-300 text-right">{fmt(item.custoTotalItem / item.quantidade)}</td>
                <td className="p-2 border border-slate-300 text-right font-bold">{fmt(item.custoTotalItem)}</td>
              </tr>
            ))}
            {equipe.length === 0 && (
              <tr><td colSpan={5} className="p-4 text-center text-slate-500">Nenhum posto de serviço adicionado.</td></tr>
            )}
          </tbody>
          <tfoot>
            <tr className="bg-slate-200 font-black">
              <td colSpan={4} className="p-2 border border-slate-300 text-right">Total dos Serviços:</td>
              <td className="p-2 border border-slate-300 text-right">{fmt(totalEquipe)}</td>
            </tr>
          </tfoot>
        </table>

        {/* INSUMOS E MATERIAIS */}
        <h3 className="font-black uppercase mb-2 text-sm mt-8">EQUIPAMENTOS E INSUMOS</h3>
        <table className="w-full text-left border-collapse border border-slate-300 mb-8">
          <thead>
            <tr className="bg-slate-900 text-white font-bold text-[10px] uppercase">
              <th className="p-2 border border-slate-300">Descrição</th>
              <th className="p-2 border border-slate-300 text-right">Valor Mensal</th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-white">
              <td className="p-2 border border-slate-300 font-bold">Materiais de Limpeza e Consumo</td>
              <td className="p-2 border border-slate-300 text-right">{fmt(proposta.insumos?.materiais || 0)}</td>
            </tr>
            <tr className="bg-slate-50">
              <td className="p-2 border border-slate-300 font-bold">Máquinas e Equipamentos</td>
              <td className="p-2 border border-slate-300 text-right">{fmt(proposta.insumos?.maquinas || 0)}</td>
            </tr>
            <tr className="bg-white">
              <td className="p-2 border border-slate-300 font-bold">Materiais Descartáveis</td>
              <td className="p-2 border border-slate-300 text-right">{fmt(proposta.insumos?.descartaveis || 0)}</td>
            </tr>
            {proposta.insumos?.servicos > 0 && (
              <tr className="bg-slate-50">
                <td className="p-2 border border-slate-300 font-bold">{proposta.insumos?.servicosDescricao || "Serviços Terceirizados"}</td>
                <td className="p-2 border border-slate-300 text-right">{fmt(proposta.insumos?.servicos || 0)}</td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr className="bg-slate-200 font-black">
              <td className="p-2 border border-slate-300 text-right">Total de Equipamentos e Insumos:</td>
              <td className="p-2 border border-slate-300 text-right">{fmt(totalInsumos)}</td>
            </tr>
          </tfoot>
        </table>

        {/* VALOR TOTAL */}
        <div className="w-full p-4 bg-green-50 border-2 border-green-600 text-center text-green-900 font-black text-lg mb-12">
          VALOR TOTAL DO CONTRATO: {fmt(totalGeral)}
        </div>

        {/* CLÁUSULAS */}
        <h3 className="font-black uppercase mb-4 text-sm text-center border-b-2 border-slate-900 pb-2">CLÁUSULAS E CONDIÇÕES</h3>
        <div className="space-y-4 text-justify">
          <div>
            <h4 className="font-bold uppercase">CLÁUSULA 01 - DO OBJETO E ESCOPO:</h4>
            <div className="pl-4 mt-2">
              <p>1.1. O presente contrato tem como objeto a prestação de serviços de <strong className="font-bold">{proposta.cliente?.tipoServicos || "serviços gerais"}</strong>.</p>
              {proposta.cliente?.hasEscopoTecnico && proposta.cliente?.escopoTecnico && (
                <div className="mt-2 whitespace-pre-wrap">{proposta.cliente.escopoTecnico}</div>
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
