import { Bell, Search, UserCircle, LogOut } from 'lucide-react';

interface TopbarProps {
  title: string;
  onLogout: () => void;
  userEmail?: string;
}

export function Topbar({ title, onLogout, userEmail }: TopbarProps) {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-console-border bg-console-bg px-6">
      <div className="flex items-center gap-2 text-[14px]">
        <span className="font-medium text-console-text">Mini-AWS</span>
        <span className="text-console-secondary">/</span>
        <span className="font-medium text-console-text">{title}</span>
      </div>

      <div className="flex items-center gap-5">
        <div className="relative hidden md:block">
          <input
            type="text"
            placeholder="Search resources..."
            className="h-8 w-64 rounded bg-white pl-3 pr-4 text-[13px] text-black placeholder:text-gray-500 focus:outline-none"
          />
        </div>
        
        <button className="text-console-text hover:text-white transition-colors">
          <Bell className="h-4 w-4" />
        </button>
        
        <div className="flex items-center gap-3 border-l border-console-border pl-5">
          <UserCircle className="h-6 w-6 text-console-text" />
          <div className="hidden flex-col text-left md:flex">
            <span className="text-[12px] font-medium text-console-text leading-tight">{userEmail || 'Developer'}</span>
            <span className="text-[11px] text-console-secondary mt-0.5">Cloud Developer</span>
          </div>
          <button 
            onClick={onLogout}
            title="Log out"
            className="ml-3 text-console-text hover:text-white transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
