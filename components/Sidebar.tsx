import React from 'react';
import { Home, FileText, Settings, Users, BarChart2 } from 'lucide-react';

const Sidebar = () => {
  const menuItems = [
    { icon: Home, label: 'Dashboard', active: true },
    { icon: FileText, label: 'Propostas', active: false },
    { icon: Users, label: 'CCTs & Cargos', active: false },
    { icon: BarChart2, label: 'Relatórios', active: false },
    { icon: Settings, label: 'Configurações', active: false },
  ];

  return (
    <aside className="w-64 bg-[var(--card)] border-r border-[var(--border)] h-screen sticky top-0 flex flex-col">
      <div className="p-6 border-b border-[var(--border)]">
        <h1 className="text-2xl font-bold text-[var(--primary)] flex items-center gap-2">
          <div className="w-8 h-8 bg-[var(--primary)] rounded-lg flex items-center justify-center text-white text-sm">O</div>
          ORSE
        </h1>
        <p className="text-xs text-[var(--secondary)] mt-1 font-medium">Engenharia de Custos FM</p>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.label}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              item.active 
                ? 'bg-[var(--primary)] text-white shadow-md' 
                : 'text-[var(--secondary)] hover:bg-[var(--background)] hover:text-[var(--foreground)]'
            }`}
          >
            <item.icon size={20} />
            <span className="font-medium text-sm">{item.label}</span>
          </button>
        ))}
      </nav>
      
      <div className="p-4 border-t border-[var(--border)]">
        <div className="flex items-center gap-3 p-3 bg-[var(--background)] rounded-xl">
          <div className="w-10 h-10 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-lg" />
          <div className="overflow-hidden">
            <p className="text-sm font-bold truncate">Gestão 4.0</p>
            <p className="text-[10px] text-[var(--secondary)]">Plano Enterprise</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
