'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Home, FileText, Settings, Users, BarChart2, Briefcase, PlusCircle, CalendarDays, ShoppingCart, ShieldCheck } from 'lucide-react';
import { usePathname } from 'next/navigation';

const Sidebar = () => {
  const pathname = usePathname();
  
  const [user, setUser] = useState(() => {
    if (typeof window !== 'undefined') {
      const cookie = document.cookie.split('; ').find(row => row.startsWith('sb_user='));
      if (cookie) {
        try {
          return JSON.parse(decodeURIComponent(cookie.split('=')[1]));
        } catch (e) {
          return { nome: 'Cristiano Silva', role: 'ADMIN', iniciais: 'CS' };
        }
      }
    }
    return { nome: 'Cristiano Silva', role: 'ADMIN', iniciais: 'CS' };
  });

  const menuItems = [
    { icon: Home, label: 'Dashboard CRM', href: '/', roles: ['ADMIN', 'MANAGER', 'USER'] },
    { icon: PlusCircle, label: 'Nova Proposta', href: '/propostas/nova', roles: ['ADMIN', 'MANAGER', 'USER'] },
    { icon: Briefcase, label: 'Regras (CCT)', href: '/admin/ccts', roles: ['ADMIN', 'MANAGER'] },
    { icon: Users, label: 'Clientes', href: '/clientes', roles: ['ADMIN', 'MANAGER', 'USER'] },
    { icon: ShieldCheck, label: 'Usuários e Permissões', href: '/admin/usuarios', roles: ['ADMIN'] },
    { icon: ShoppingCart, label: 'Produtos e Insumos', href: '/produtos', roles: ['ADMIN', 'MANAGER'] },
    { icon: ShieldCheck, label: 'EPIs e Uniformes', href: '/epis', roles: ['ADMIN', 'MANAGER'] },
    { icon: BarChart2, label: 'Controladoria', href: '#', roles: ['ADMIN'] },
    { icon: Settings, label: 'Configurações', href: '/admin/settings', roles: ['ADMIN'] },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 h-screen sticky top-0 flex flex-col shadow-sm">
      <div className="p-8 border-b border-slate-50">
        <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
          <div className="w-8 h-8 bg-[#1B4D3E] rounded-xl flex items-center justify-center text-white text-sm font-black shadow-lg shadow-emerald-200">S</div>
          SmartBid
        </h1>
        <p className="text-[9px] text-slate-400 mt-2 font-black uppercase tracking-[0.2em]">Enterprise FM System</p>
      </div>
      
      <nav className="flex-1 p-6 space-y-2">
        {menuItems.filter(item => item.roles.includes(user.role)).map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-5 py-4 rounded-2xl transition-all ${
                isActive 
                  ? 'bg-slate-900 text-white shadow-xl shadow-slate-200' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-bold'
              }`}
            >
              <item.icon size={20} className={isActive ? 'text-emerald-400' : 'text-slate-400'} />
              <span className="text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      
      <div className="p-6 border-t border-slate-50 space-y-4">
        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-[1.5rem] border border-slate-100 group relative">
          <div className="w-10 h-10 bg-[#1B4D3E] rounded-xl flex items-center justify-center text-white font-black text-xs shadow-md">
            {user.iniciais}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-black text-slate-800 truncate">{user.nome}</p>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">
              {user.role === 'ADMIN' ? 'Administrador' : user.role === 'MANAGER' ? 'Gestor Comercial' : 'Vendedor'}
            </p>
          </div>
        </div>
        
        <button 
          onClick={() => {
            document.cookie = "sb_session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
            window.location.href = '/login';
          }}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all font-bold text-xs uppercase tracking-widest border border-transparent hover:border-red-100"
        >
          <BarChart2 size={14} className="rotate-90" />
          Sair do Sistema
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
