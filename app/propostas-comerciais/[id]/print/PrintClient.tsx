'use client';

import React, { useEffect } from 'react';

const replaceTags = (text: string, doc: any) => {
  if (!text) return '';
  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v || 0);
  
  let replaced = text;
  replaced = replaced.replace(/\[CLIENTE_NOME\]/g, doc.client?.nomeFantasia || doc.client?.razaoSocial || '');
  replaced = replaced.replace(/\[VALOR_TOTAL\]/g, fmt(doc.valorTotal));
  return replaced;
};

export default function PrintClient({ doc }: { doc: any }) {
  useEffect(() => {
    // Timeout para garantir que todas as fontes e imagens carregaram
    const timer = setTimeout(() => {
      window.print();
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="bg-white min-h-screen text-black font-sans">
      <style dangerouslySetInnerHTML={{__html: `
        @page {
          size: A4;
          margin: 0mm !important; /* ISSO FORÇA O NAVEGADOR A REMOVER A URL E A DATA */
        }
        body {
          margin: 0;
          padding: 0;
          -webkit-print-color-adjust: exact;
        }
        .page-header-space {
          height: 35mm;
        }
        .page-footer-space {
          height: 25mm;
        }
        @media screen {
          .page-header-space, .page-footer-space {
            display: none;
          }
        }
      `}} />
      
      <table className="w-full">
        <thead>
          <tr>
            <td>
              <div className="page-header-space"></div>
            </td>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <div className="max-w-[800px] mx-auto px-12 pb-12 text-justify">
                <div className="text-center mb-12 mt-8 print:mt-0">
                  <h1 className="text-xl font-bold uppercase tracking-widest mb-2">PROPOSTA COMERCIAL</h1>
                  <p className="text-sm font-semibold uppercase">{doc.empresaEmissora?.nomeFantasia} E {doc.client?.nomeFantasia}</p>
                </div>

                <div className="space-y-8">
                  {doc.secoes?.map((s: any, idx: number) => (
                    <div key={idx} className="space-y-3">
                      <h2 className="text-sm font-bold uppercase">{replaceTags(s.titulo, doc)}</h2>
                      <div className="text-sm whitespace-pre-wrap leading-relaxed">
                        {replaceTags(s.texto, doc)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td>
              <div className="page-footer-space"></div>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
