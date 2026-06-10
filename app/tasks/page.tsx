import React, { Suspense } from 'react';
import Sidebar from '@/components/Sidebar';
import TasksKanban from './TasksKanban';
import { getLoggedUser } from '@/app/propostas/actions';
import { getUsersForFilter } from '@/app/leads/actions';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Gestão de Tarefas | SmartBid',
};

export default async function TasksPage() {
  const user = await getLoggedUser();
  if (!user) {
    redirect('/login');
  }

  // Get active system users for filters and delegation
  const usersRes = await getUsersForFilter();
  const initialUsers = usersRes.success && usersRes.users ? usersRes.users : [];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        <Suspense fallback={
          <div className="flex h-full w-full items-center justify-center bg-slate-950 text-slate-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1B4D3E]"></div>
          </div>
        }>
          <TasksKanban initialUsers={initialUsers} />
        </Suspense>
      </main>
    </div>
  );
}
