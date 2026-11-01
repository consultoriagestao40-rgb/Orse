import React from 'react';
import FinancialLoadingTransition from '@/components/FinancialLoadingTransition';

export default function RootLoading() {
  return (
    <FinancialLoadingTransition
      title="Sincronizando Sistema SmartBidHub"
      subtitle="Conectando mercado financeiro, módulos corporativos e base de dados..."
      variant="fullscreen"
    />
  );
}
