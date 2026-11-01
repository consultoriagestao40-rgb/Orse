import React from 'react';
import FinancialLoadingTransition from '@/components/FinancialLoadingTransition';

export default function PipelineLoading() {
  return (
    <FinancialLoadingTransition
      title="Sincronizando Pipeline de FVP"
      subtitle="Calculando propostas, versões de engenharia e métricas financeiras..."
      variant="fullscreen"
    />
  );
}
