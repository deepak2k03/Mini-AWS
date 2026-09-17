import { LayoutDashboard, Server, Network, Bot, Settings, BookOpen, Cloud, LogOut } from 'lucide-react';
import { cn } from '../../lib/utils';

export type ViewType = 'overview' | 'instances' | 'network' | 'ai' | 'settings';

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
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="fixed inset-y-0 left-0 z-20 flex w-64 flex-col border-r border-console-border bg-console-sidebar">
      <div className="flex h-16 items-center gap-3 px-6 border-b border-console-border">
        <div className="flex h-8 w-8 items-center justify-center text-console-text">
          <Cloud className="h-6 w-6" />
        </div>
        <div className="flex flex-col">
          <h1 className="text-[14px] font-bold tracking-tight text-console-text">Mini-AWS</h1>
          <p className="text-[10px] font-semibold tracking-wider text-console-muted uppercase">Cloud Console</p>
        </div>
      </div>
      
      <nav className="flex-1 space-y-1.5 px-4 py-6">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onChangeView(item.id)}
            className={cn(
              "flex w-full items-center gap-3 rounded px-3 py-2 text-[14px] font-medium transition-colors",
              currentView === item.id 
                ? "text-console-text" 
                : "text-console-secondary hover:text-console-text"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="border-t border-console-border p-4 space-y-1.5">
        <button className="flex w-full items-center gap-3 rounded px-3 py-2 text-[14px] font-medium text-console-secondary transition-colors hover:text-console-text">
          <BookOpen className="h-4 w-4" />
          Documentation
        </button>
      </div>
      
      <div className="border-t border-console-border p-5">
        <div className="flex items-center gap-3 px-1">
          <div className="flex h-8 w-8 items-center justify-center text-[12px] font-medium text-console-text">
            US
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[13px] font-medium text-console-text">Local Environment</span>
            <span className="text-[11px] text-console-text mt-0.5">Connected</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
