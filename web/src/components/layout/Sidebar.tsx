import { LayoutDashboard, Server, Network, Bot, Settings, BookOpen, Cloud } from 'lucide-react';
import { cn } from '../../lib/utils';

export type ViewType = 'overview' | 'instances' | 'network' | 'ai';

interface SidebarProps {
  currentView: ViewType;
  onChangeView: (view: ViewType) => void;
}

export function Sidebar({ currentView, onChangeView }: SidebarProps) {
  const navItems: { id: ViewType; label: string; icon: any }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'instances', label: 'Instances', icon: Server },
    { id: 'network', label: 'Network', icon: Network },
    { id: 'ai', label: 'AI Operations', icon: Bot },
  ];

  return (
    <aside className="fixed inset-y-0 left-0 z-20 flex w-64 flex-col border-r border-slate-800 bg-slate-950">
      <div className="flex h-16 items-center gap-3 px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400">
          <Cloud className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-tight text-slate-100">Mini-AWS</h1>
          <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Cloud Console</p>
        </div>
      </div>
      
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onChangeView(item.id)}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              currentView === item.id 
                ? "bg-slate-800 text-cyan-400" 
                : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="border-t border-slate-800 p-3">
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-900 hover:text-slate-200">
          <BookOpen className="h-4 w-4" />
          Documentation
        </button>
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-900 hover:text-slate-200">
          <Settings className="h-4 w-4" />
          Settings
        </button>
      </div>
      <div className="border-t border-slate-800 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-xs font-medium text-slate-300">
            US
          </div>
          <div className="flex flex-col text-xs text-left">
            <span className="font-medium text-slate-200">Local Environment</span>
            <span className="flex items-center gap-1.5 text-slate-500">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
              </span>
              Connected
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
