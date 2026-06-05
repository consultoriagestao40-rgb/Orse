import React, { Suspense } from 'react';
import Sidebar from '@/components/Sidebar';
import LeadsKanban from './LeadsKanban';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Pipeline de Leads | SmartBid',
};

export default async function LeadsPage() {
  const headersList = await headers();
  const userAgent = headersList.get('user-agent') || '';
  const isMobile = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  if (isMobile) {
    redirect('/leads/mobile');
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
