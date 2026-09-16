import { Bell, Search, UserCircle, LogOut } from 'lucide-react';

interface TopbarProps {
  title: string;
  onLogout: () => void;
  userEmail?: string;
}

export function Topbar({ title, onLogout, userEmail }: TopbarProps) {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-800 bg-slate-950/80 px-6 backdrop-blur-sm">
      <div className="flex items-center gap-2 text-sm">
        <span className="font-medium text-slate-400">Mini-AWS</span>
        <span className="text-slate-600">/</span>
        <span className="font-medium text-slate-200">{title}</span>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative hidden md:block">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search resources..."
            className="h-9 w-64 rounded-md border border-slate-800 bg-slate-900 pl-9 pr-4 text-sm text-slate-200 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
        </div>
        
        <button className="relative rounded-full p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200">
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-cyan-500"></span>
        </button>
        
        <div className="flex items-center gap-3 border-l border-slate-800 pl-4">
          <UserCircle className="h-6 w-6 text-slate-400" />
          <div className="hidden flex-col text-left md:flex">
            <span className="text-xs font-medium text-slate-200">{userEmail || 'Developer'}</span>
            <span className="text-[10px] text-slate-500">Administrator</span>
          </div>
          <button 
            onClick={onLogout}
            title="Log out"
            className="ml-2 rounded-md p-1.5 text-slate-500 hover:bg-slate-800 hover:text-red-400"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
