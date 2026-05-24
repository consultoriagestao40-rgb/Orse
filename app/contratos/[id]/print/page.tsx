'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getContratoById } from '../../actions';

export default function ContratoPrint() {
  const { id } = useParams() as { id: string };
  const [loading, setLoading] = useState(true);
  const [contrato, setContrato] = useState<any>(null);

  const loadData = async () => {
    setLoading(true);
    const res = await getContratoById(id);
    if (res.success && res.data) {
      setContrato(res.data);
    }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [id]);

  useEffect(() => {
    if (!loading && contrato) {
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }, [loading, contrato]);

  if (loading) return <div className="p-10 text-center">Preparando documento...</div>;
  if (!contrato) return <div className="p-10 text-center">Contrato não encontrado.</div>;

  return (
    <div className="bg-white min-h-screen text-black">
      <div className="max-w-[800px] mx-auto p-12 text-justify">
        <div className="text-center mb-12">
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
    </div>
  );
}
