import React from 'react';
import Sidebar from '@/components/Sidebar';
import { getCCTs } from '@/app/ccts/actions';
import CCTManagerClient from '@/components/cct/CCTManagerClient';

export default async function AdminCCTPage() {
  const ccts = await getCCTs();

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar />
      <main className="flex-1 p-6 md:p-8 overflow-auto">
        <CCTManagerClient initialCcts={ccts} />
      </main>
    </div>
  );
}
