import React from 'react';
import Sidebar from '@/components/Sidebar';
import LeadsKanban from './LeadsKanban';

export const metadata = {
  title: 'Pipeline de Leads | SmartBid',
};

export default function LeadsPage() {
  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        <LeadsKanban />
      </main>
    </div>
  );
}
