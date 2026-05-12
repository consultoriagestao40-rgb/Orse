import React from 'react';
import { ResultadoCalculo } from '@/types/calculator';
import { X, Download } from 'lucide-react';

interface DetailedCostStatementProps {
  resultado: ResultadoCalculo;
  onClose: () => void;
}

const DetailedCostStatement: React.FC<DetailedCostStatementProps> = ({ resultado, onClose }) => {
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const exportCSV = () => {
    const rows = [
      ['DISCRIMINAÇÃO', 'VALOR (R$)'],
      ['MONTANTE "A" - MÃO-DE-OBRA', resultado.remuneracaoBase + resultado.custoSocial.total],
      ['Salário Base / Piso', resultado.remuneracaoBase],
      ['Encargos Sociais', resultado.custoSocial.total],
      ['MONTANTE "B" - INSUMOS & OPERACIONAIS', resultado.dre.custos - (resultado.remuneracaoBase + resultado.custoSocial.total)],
      ['MONTANTE "C" - BENEFÍCIOS', 0], // Adicionar lógica de benefícios se houver
      ['TOTAL PARCIAL (A + B + C)', resultado.dre.custos],
      ['MONTANTE "D" - MARGEM / LUCRO', resultado.dre.margemBruta],
      ['IMPOSTOS INDIRETOS', resultado.dre.impostos],
      ['PREÇO TOTAL UNITÁRIO', resultado.dre.faturamento],
    ];

    const csvContent = "data:text/csv;charset=utf-8," 
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "extrato_custos_smartbid.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <header className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <Download size={20} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 italic">Extrato de Custos Detalhado</h3>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-0.5">PORTARIA / LIMPEZA</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 flex items-center gap-1 font-bold text-xs">
             <X size={18} /> FECHAR
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="text-xs uppercase bg-[#1a472a] text-white font-black">
              <tr>
                <th className="px-4 py-3">Discriminação</th>
                <th className="px-4 py-3 text-center">% REF.</th>
                <th className="px-4 py-3 text-right">Valor (R$)</th>
              </tr>
            </thead>
            <tbody className="font-medium text-gray-700">
              {/* MONTANTE A */}
              <tr className="bg-[#1a472a] text-white font-black">
                <td className="px-4 py-2 uppercase">Montante "A" - Mão-de-Obra</td>
                <td className="px-4 py-2 text-center">-</td>
                <td className="px-4 py-2 text-right">{formatCurrency(resultado.remuneracaoBase + resultado.custoSocial.total)}</td>
              </tr>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <td className="px-4 py-2 pl-8">1) Salário Base / Piso</td>
                <td className="px-4 py-2 text-center">-</td>
                <td className="px-4 py-2 text-right">{formatCurrency(resultado.remuneracaoBase)}</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="px-4 py-2 pl-8">2) Encargos Sociais (INSS, FGTS, RAT...)</td>
                <td className="px-4 py-2 text-center">-</td>
                <td className="px-4 py-2 text-right">{formatCurrency(resultado.custoSocial.total)}</td>
              </tr>

              {/* MONTANTE B */}
              <tr className="bg-[#1a472a] text-white font-black">
                <td className="px-4 py-2 uppercase">Montante "B" - Insumos & Operacionais</td>
                <td className="px-4 py-2 text-center">-</td>
                <td className="px-4 py-2 text-right">{formatCurrency(0)}</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="px-4 py-2 pl-8">1) Materiais e Equipamentos</td>
                <td className="px-4 py-2 text-center">-</td>
                <td className="px-4 py-2 text-right">R$ 0,00</td>
              </tr>

              {/* MONTANTE C */}
              <tr className="bg-[#1a472a] text-white font-black">
                <td className="px-4 py-2 uppercase">Montante "C" - Benefícios</td>
                <td className="px-4 py-2 text-center">-</td>
                <td className="px-4 py-2 text-right">R$ 0,00</td>
              </tr>

              {/* TOTAIS PARCIAIS */}
              <tr className="bg-gray-200 text-gray-900 font-black">
                <td className="px-4 py-3 text-right" colSpan={2}>TOTAL PARCIAL (A + B + C)</td>
                <td className="px-4 py-3 text-right">{formatCurrency(resultado.dre.custos)}</td>
              </tr>

              {/* MONTANTE D */}
              <tr className="bg-[#1a472a] text-white font-black">
                <td className="px-4 py-2 uppercase">Montante "D" - Margem / Lucro</td>
                <td className="px-4 py-2 text-center">-</td>
                <td className="px-4 py-2 text-right">{formatCurrency(resultado.dre.margemBruta)}</td>
              </tr>

              {/* IMPOSTOS */}
              <tr className="bg-[#1a472a] text-white font-black">
                <td className="px-4 py-2 uppercase">Impostos Indiretos (PIS/COFINS/ISS)</td>
                <td className="px-4 py-2 text-center">-</td>
                <td className="px-4 py-2 text-right">{formatCurrency(resultado.dre.impostos)}</td>
              </tr>

              {/* PREÇO FINAL */}
              <tr className="bg-black text-white font-black text-xl">
                <td className="px-4 py-4 uppercase text-right" colSpan={2}>Preço Total Unitário</td>
                <td className="px-4 py-4 text-right">{formatCurrency(resultado.dre.faturamento)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <footer className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button 
            onClick={exportCSV}
            className="flex items-center gap-2 px-6 py-2 bg-green-700 text-white rounded-lg font-bold hover:bg-green-800 transition-colors"
          >
            <Download size={18} />
            Exportar Planilha Aberta
          </button>
        </footer>
      </div>
    </div>
  );
};

export default DetailedCostStatement;
