import React, { Suspense } from 'react';
import Sidebar from '@/components/Sidebar';
import LeadsKanban from './LeadsKanban';
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
      <main className="flex-1 overflow-hidden">
        <Suspense fallback={
          <div className="flex h-full w-full items-center justify-center bg-slate-950 text-slate-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1B4D3E]"></div>
          </div>
        }>
          <LeadsKanban />
        </Suspense>
      </main>
    </div>
  );
}
