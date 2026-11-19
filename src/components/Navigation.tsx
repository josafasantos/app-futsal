import React from 'react';
import { useApp } from '../context/AppContext';
import { Trophy, Users, UserCheck, BarChart3, BookOpen } from 'lucide-react';

export const Navigation: React.FC = () => {
  const { activeTab, setActiveTab, state } = useApp();

  const tabs = [
    {
      id: 'court' as const,
      label: 'Quadra',
      icon: Trophy
    },
    {
      id: 'queue' as const,
      label: 'Fila',
      icon: Users,
      badge: state.queue.length > 0 ? state.queue.length.toString() : undefined,
      badgeColor: 'bg-slate-600'
    },
    {
      id: 'presence' as const,
      label: 'Presença',
      icon: UserCheck,
      badge: state.presentPlayers.length > 0 ? state.presentPlayers.length.toString() : undefined,
      badgeColor: 'bg-teal-600'
    },
    {
      id: 'reports' as const,
      label: 'Relatórios',
      icon: BarChart3
    },
    {
      id: 'rules' as const,
      label: 'Regras',
      icon: BookOpen
    }
  ];

  return (
    <nav
      role="tablist"
      aria-label="Navegação da pelada"
      className="fixed bottom-0 left-0 right-0 z-30 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 md:relative md:border-t-0 md:bg-transparent md:mb-4"
    >
      <div className="max-w-4xl mx-auto flex justify-around md:justify-center md:gap-3 p-1.5 md:p-0">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col md:flex-row items-center gap-1 md:gap-2 px-3 py-1.5 md:py-2 md:px-4 rounded-xl text-xs md:text-sm font-medium transition-all relative ${
                isActive
                  ? 'text-emerald-400 bg-emerald-950/70 border border-emerald-800/60 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
              }`}
            >
              <div className="relative">
                <Icon size={18} />
                {tab.badge && (
                  <span className={`absolute -top-1.5 -right-2 px-1 text-[10px] font-bold text-white rounded-full ${tab.badgeColor} leading-tight`}>
                    {tab.badge}
                  </span>
                )}
              </div>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
