import React, { Suspense } from 'react';
import Sidebar from '@/components/Sidebar';
import LeadsKanban from './LeadsKanban';
import FinancialLoadingTransition from '@/components/FinancialLoadingTransition';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Pipeline de Leads | SmartBid',
};

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }> | { [key: string]: string | string[] | undefined };
}) {
  const headersList = await headers();
  const userAgent = headersList.get('user-agent') || '';
  const isMobile = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  if (isMobile) {
    const resolvedParams = searchParams instanceof Promise ? await searchParams : searchParams;
    const queryString = resolvedParams && Object.keys(resolvedParams).length > 0
      ? '?' + new URLSearchParams(resolvedParams as any).toString()
      : '';
    redirect(`/leads/mobile${queryString}`);
  }

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        <Suspense fallback={
          <FinancialLoadingTransition
            title="Sincronizando Funil Comercial & Leads"
            subtitle="Carregando oportunidades, estágios do pipeline e contatos..."
            variant="fullscreen"
          />
        }>
          <LeadsKanban />
        </Suspense>
      </main>
    </div>
  );
}
