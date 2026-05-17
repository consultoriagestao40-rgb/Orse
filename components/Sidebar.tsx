'use client';
 
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Home, Settings, Users, BarChart2, Briefcase, PlusCircle, ShoppingCart, ShieldCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { usePathname } from 'next/navigation';
 
const Sidebar = () => {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const [user, setUser] = useState<{ nome: string; role: string; iniciais: string } | null>(null);
  
  // Carrega as informações do usuário e o estado recolhido do localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const cookie = document.cookie.split('; ').find(row => row.startsWith('sb_user='));
      if (cookie) {
        try {
          setUser(JSON.parse(decodeURIComponent(cookie.split('=')[1])));
        } catch (e) {
          setUser({ nome: 'Cristiano Silva', role: 'USER', iniciais: 'CS' });
        }
      } else {
        setUser({ nome: 'Cristiano Silva', role: 'USER', iniciais: 'CS' });
      }

      const saved = localStorage.getItem('sb_sidebar_collapsed');
      if (saved === 'true') {
        setIsCollapsed(true);
      }
    }
  }, []);

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sb_sidebar_collapsed', String(newState));
    }
  };

 
  const menuItems = [
    { icon: Home, label: 'Dashboard CRM', href: '/', roles: ['ADMIN', 'MANAGER', 'USER'] },
    { icon: PlusCircle, label: 'Nova Proposta', href: '/propostas/nova', roles: ['ADMIN', 'MANAGER', 'USER'] },
    { icon: Briefcase, label: 'Regras (CCT)', href: '/admin/ccts', roles: ['ADMIN', 'MANAGER'] },
    { icon: Users, label: 'Clientes', href: '/clientes', roles: ['ADMIN', 'MANAGER', 'USER'] },
    { icon: ShieldCheck, label: 'Usuários e Permissões', href: '/admin/usuarios', roles: ['ADMIN'] },
    { icon: ShoppingCart, label: 'Produtos e Insumos', href: '/produtos', roles: ['ADMIN', 'MANAGER'] },
    { icon: ShieldCheck, label: 'EPIs e Uniformes', href: '/epis', roles: ['ADMIN', 'MANAGER'] },
    { icon: BarChart2, label: 'Controladoria', href: '/admin/controladoria', roles: ['ADMIN'] },
    { icon: Settings, label: 'Configurações', href: '/admin/settings', roles: ['ADMIN'] },
  ];
 
  return (
    <aside className={`bg-white border-r border-slate-200 h-screen sticky top-0 flex flex-col shadow-sm transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
      {/* Header */}
      <div className="p-6 border-b border-slate-50 relative flex items-center justify-between min-h-[96px]">
        {!isCollapsed ? (
          <div>
            <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <div className="w-8 h-8 bg-[#1B4D3E] rounded-xl flex items-center justify-center text-white text-sm font-black shadow-lg shadow-emerald-200 shrink-0">S</div>
              SmartBid
            </h1>
            <p className="text-[9px] text-slate-400 mt-2 font-black uppercase tracking-[0.2em] whitespace-nowrap">Enterprise FM System</p>
          </div>
        ) : (
          <div className="w-full flex justify-center">
            <div className="w-10 h-10 bg-[#1B4D3E] rounded-xl flex items-center justify-center text-white text-base font-black shadow-lg shadow-emerald-200 transition-all shrink-0">S</div>
          </div>
        )}
        
        {/* Botão de Recolher Flutuante */}
        <button 
          onClick={toggleCollapse} 
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-[#1B4D3E] hover:border-[#1B4D3E]/40 hover:shadow-md transition-all z-50 cursor-pointer shadow-sm"
        >
          {isCollapsed ? <ChevronRight size={12} className="stroke-[3]" /> : <ChevronLeft size={12} className="stroke-[3]" />}
        </button>
      </div>
      
      {/* Menu de Navegação */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.filter(item => item.roles.includes(user?.role || 'USER')).map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              title={isCollapsed ? item.label : undefined}
              className={`flex items-center gap-3 rounded-2xl transition-all ${
                isCollapsed ? 'justify-center p-3.5' : 'px-5 py-4'
              } ${
                isActive 
                  ? 'bg-slate-900 text-white shadow-xl shadow-slate-200' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-bold'
              }`}
            >
              <item.icon size={20} className={isActive ? 'text-emerald-400 shrink-0' : 'text-slate-400 shrink-0'} />
              {!isCollapsed && <span className="text-sm truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>
      
      {/* Footer do Usuário */}
      <div className="p-4 border-t border-slate-50 space-y-4">
        <div className={`flex items-center gap-3 p-3 bg-slate-50 rounded-[1.5rem] border border-slate-100 group relative ${isCollapsed ? 'justify-center' : ''}`}>
          <div className="w-10 h-10 bg-[#1B4D3E] rounded-xl flex items-center justify-center text-white font-black text-xs shadow-md shrink-0">
            {user?.iniciais || 'US'}
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden">
              <p className="text-xs font-black text-slate-800 truncate">{user?.nome || 'Carregando...'}</p>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">
                {user?.role === 'ADMIN' ? 'Administrador' : user?.role === 'MANAGER' ? 'Gestor Comercial' : 'Vendedor'}
              </p>
            </div>
          )}
        </div>

        
        <button 
          onClick={async () => {
            try {
              await fetch('/api/auth/logout', { method: 'POST' });
            } catch (err) {
              console.error('Logout failed:', err);
            }
            window.location.href = '/login';
          }}
          title={isCollapsed ? "Sair do Sistema" : undefined}
          className={`w-full flex items-center justify-center gap-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all font-bold text-xs uppercase tracking-widest border border-transparent hover:border-red-100 ${isCollapsed ? 'p-3' : 'py-3'}`}
        >
          <BarChart2 size={14} className="rotate-90 shrink-0" />
          {!isCollapsed && <span className="truncate">Sair</span>}
        </button>
      </div>
    </aside>
  );
};
 
export default Sidebar;
