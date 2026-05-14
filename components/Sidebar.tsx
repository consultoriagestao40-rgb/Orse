'use client';

import Link from 'next/link';
import { Home, FileText, Settings, Users, BarChart2, Briefcase, PlusCircle, CalendarDays, ShoppingCart } from 'lucide-react';
import { usePathname } from 'next/navigation';

const Sidebar = () => {
  const pathname = usePathname();
  
  const menuItems = [
    { icon: Home, label: 'Dashboard CRM', href: '/' },
    { icon: PlusCircle, label: 'Nova Proposta', href: '/propostas/nova' },
    { icon: Briefcase, label: 'Regras (CCT)', href: '/admin/ccts' },
    { icon: Users, label: 'Clientes', href: '/clientes' },
    { icon: ShoppingCart, label: 'Produtos e Insumos', href: '/produtos' },
    { icon: BarChart2, label: 'Controladoria', href: '#' },
    { icon: Settings, label: 'Configurações', href: '/admin/settings' },
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
        {menuItems.map((item) => {
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
      
      <div className="p-6 border-t border-slate-50">
        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-[1.5rem] border border-slate-100">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white font-black text-xs">RS</div>
          <div className="overflow-hidden">
            <p className="text-xs font-black text-slate-800 truncate">Cristiano</p>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Administrador</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
