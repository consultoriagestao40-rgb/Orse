import React from 'react';
import FinancialLoadingTransition from '@/components/FinancialLoadingTransition';

export default function LeadsLoading() {
  return (
    <FinancialLoadingTransition
      title="Sincronizando Funil Comercial & Leads"
      subtitle="Carregando oportunidades, estágios do pipeline e histórico de mensagens..."
      variant="fullscreen"
    />
  );
}
