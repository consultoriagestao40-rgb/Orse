'use client';
 
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Home, Settings, Users, BarChart2, Briefcase, PlusCircle, ShoppingCart, ShieldCheck, ChevronLeft, ChevronRight, FileText, Presentation, Target, Search, Calendar, Mail, Bell, Clock, Wrench } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '@/app/notifications/actions';
 
const Sidebar = () => {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const [user, setUser] = useState<{ nome: string; role: string; email?: string; tenantId?: string | null; iniciais: string } | null>(null);
  
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

  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  const loadNotifications = async () => {
    try {
      const res = await getNotifications();
      if (res.success && res.notifications) {
        setNotifications(res.notifications);
        setUnreadCount(res.unreadCount);
      }
    } catch (err) {
      console.error('Erro ao carregar notificações:', err);
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (id: string, link?: string | null) => {
    try {
      await markNotificationAsRead(id);
      loadNotifications();
      if (link) {
        window.location.href = link;
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      loadNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sb_sidebar_collapsed', String(newState));
    }
  };

 
  const menuItems = [
    { icon: Search, label: 'Prospecção Inteligente', href: '/prospeccao', roles: ['ADMIN', 'MANAGER', 'USER'] },
    { icon: Calendar, label: 'Calendário Global', href: '/calendar', roles: ['ADMIN', 'MANAGER', 'USER'] },
    { icon: Target, label: 'Pipeline de Leads', href: '/leads', roles: ['ADMIN', 'MANAGER', 'USER'] },
    { icon: Mail, label: 'Gestão de E-mails', href: '/emails', roles: ['ADMIN', 'MANAGER', 'USER'] },
    { icon: Home, label: 'Dashboard CRM', href: '/', roles: ['ADMIN', 'MANAGER', 'USER'] },
    { icon: PlusCircle, label: 'Nova FPV', href: '/propostas/nova', roles: ['ADMIN', 'MANAGER', 'USER'] },
    { icon: Presentation, label: 'Proposta Comercial', href: '/propostas-comerciais', roles: ['ADMIN', 'MANAGER', 'USER'] },
    { icon: FileText, label: 'Contratos', href: '/contratos', roles: ['ADMIN', 'MANAGER'] },
    { icon: Briefcase, label: 'Regras (CCT)', href: '/admin/ccts', roles: ['ADMIN', 'MANAGER', 'USER'] },
    { icon: Wrench, label: 'Equipes Técnicas (SPOT)', href: '/admin/equipes-tecnicas', roles: ['ADMIN', 'MANAGER', 'USER'] },
    { icon: Users, label: 'Clientes', href: '/clientes', roles: ['ADMIN', 'MANAGER', 'USER'] },
    { icon: ShieldCheck, label: 'Usuários e Permissões', href: '/admin/usuarios', roles: ['ADMIN'] },
    { icon: ShoppingCart, label: 'Produtos e Insumos', href: '/produtos', roles: ['ADMIN', 'MANAGER', 'USER'] },
    { icon: ShieldCheck, label: 'EPIs e Uniformes', href: '/epis', roles: ['ADMIN', 'MANAGER', 'USER'] },
    { icon: BarChart2, label: 'Controladoria', href: '/admin/controladoria', roles: ['ADMIN'] },
    { icon: Settings, label: 'Configurações', href: '/admin/settings', roles: ['ADMIN', 'MANAGER', 'USER'] },
    { icon: ShieldCheck, label: 'Gestão SaaS (Tenants)', href: '/admin/empresas', roles: ['SUPER_ADMIN'] },
  ];
 
  return (
    <aside className={`bg-white border-r border-slate-200 h-screen sticky top-0 flex flex-col shadow-sm transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
      {/* Header */}
      <div className="p-6 border-b border-slate-50 relative flex items-center justify-between min-h-[96px] gap-2">
        {!isCollapsed ? (
          <div className="flex-1 flex items-center justify-between min-w-0">
            <div>
              <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <div className="w-8 h-8 bg-[#1B4D3E] rounded-xl flex items-center justify-center text-white text-sm font-black shadow-lg shadow-emerald-200 shrink-0">S</div>
                SmartBidHub
              </h1>
              <p className="text-[9px] text-slate-400 mt-2 font-black uppercase tracking-[0.2em] whitespace-nowrap">Enterprise FM System</p>
            </div>
            
            {/* Central de Notificações Popover */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-slate-400 hover:text-[#1B4D3E] hover:bg-slate-50 rounded-xl transition-all border border-slate-100 hover:border-slate-200 shadow-2xs shrink-0 cursor-pointer"
                title="Notificações"
              >
                <Bell size={18} className="stroke-[2.5]" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 top-10 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-[999] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  {/* Header Popover */}
                  <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                    <span className="text-xs font-black text-slate-800 uppercase tracking-wide">Central de Notificações</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        className="text-[10px] font-black text-[#1B4D3E] hover:text-[#13382D] hover:underline cursor-pointer uppercase tracking-wider"
                      >
                        Lidas todas
                      </button>
                    )}
                  </div>

                  {/* List */}
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length > 0 ? (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => handleMarkAsRead(n.id, n.link)}
                          className={`p-3.5 hover:bg-slate-50 cursor-pointer transition-all flex gap-3 items-start ${
                            !n.read ? 'bg-blue-50/20 font-semibold' : ''
                          }`}
                        >
                          <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!n.read ? 'bg-blue-500' : 'bg-transparent'}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-slate-700 leading-normal break-words">{n.texto}</p>
                            <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase tracking-tight flex items-center gap-1">
                              <Clock size={9} /> {new Date(n.createdAt).toLocaleDateString('pt-BR')} às {new Date(n.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center bg-white flex flex-col items-center justify-center">
                        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 mb-2 border border-slate-100">
                          <Bell size={18} />
                        </div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Nenhuma notificação por aqui.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="w-full flex flex-col items-center gap-3">
            <div className="w-10 h-10 bg-[#1B4D3E] rounded-xl flex items-center justify-center text-white text-base font-black shadow-lg shadow-emerald-200 transition-all shrink-0">S</div>
            
            {/* Central de Notificações Popover compacta */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2.5 text-slate-400 hover:text-[#1B4D3E] hover:bg-slate-50 rounded-xl transition-all border border-slate-100 hover:border-slate-200 shadow-2xs shrink-0 cursor-pointer"
                title="Notificações"
              >
                <Bell size={18} className="stroke-[2.5]" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute left-14 top-0 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-[999] overflow-hidden animate-in fade-in slide-in-from-left-2 duration-200">
                  {/* Header Popover */}
                  <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                    <span className="text-xs font-black text-slate-800 uppercase tracking-wide">Central de Notificações</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        className="text-[10px] font-black text-[#1B4D3E] hover:text-[#13382D] hover:underline cursor-pointer uppercase tracking-wider"
                      >
                        Lidas todas
                      </button>
                    )}
                  </div>

                  {/* List */}
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length > 0 ? (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => handleMarkAsRead(n.id, n.link)}
                          className={`p-3.5 hover:bg-slate-50 cursor-pointer transition-all flex gap-3 items-start ${
                            !n.read ? 'bg-blue-50/20 font-semibold' : ''
                          }`}
                        >
                          <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!n.read ? 'bg-blue-500' : 'bg-transparent'}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-slate-700 leading-normal break-words">{n.texto}</p>
                            <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase tracking-tight flex items-center gap-1">
                              <Clock size={9} /> {new Date(n.createdAt).toLocaleDateString('pt-BR')} às {new Date(n.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center bg-white flex flex-col items-center justify-center">
                        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 mb-2 border border-slate-100">
                          <Bell size={18} />
                        </div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Nenhuma notificação por aqui.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
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
        {menuItems.filter(item => {
          const isPlatformAccount = user?.email === 'admin@smartbidhub.com.br';
          
          if (isPlatformAccount) {
            // Conta de Operador do SaaS: vê apenas gestão de empresas
            return item.href === '/admin/empresas';
          } else {
            // Contas de Clientes (Grupo JVS, etc): não veem o painel de gestão de SaaS
            if (item.roles.includes('SUPER_ADMIN') || item.href === '/admin/empresas') {
              return false;
            }
            return item.roles.includes(user?.role || 'USER');
          }
        }).map((item) => {
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
