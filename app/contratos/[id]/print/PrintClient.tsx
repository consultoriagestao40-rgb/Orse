'use client';

import React, { useEffect } from 'react';

export default function PrintClient({ contrato }: { contrato: any }) {
  useEffect(() => {
    // Timeout para garantir que todas as fontes e imagens carregaram
    const timer = setTimeout(() => {
      window.print();
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="bg-white min-h-screen text-black">
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
                  <h1 className="text-xl font-bold uppercase tracking-widest mb-2">CONTRATO DE PRESTAÇÃO DE SERVIÇOS</h1>
                  <p className="text-sm font-semibold uppercase">{contrato.empresaEmissora?.razaoSocial} E {contrato.client?.razaoSocial}</p>
                </div>

                <div className="space-y-8">
                  {contrato.clausulas?.map((c: any, idx: number) => (
                    <div key={idx} className="space-y-3">
                      <h2 className="text-sm font-bold uppercase">{c.titulo}</h2>
                      <div className="text-sm whitespace-pre-wrap leading-relaxed">
                        {c.texto}
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
