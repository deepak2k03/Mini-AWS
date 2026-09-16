import { useState } from 'react';
import { Sidebar, type ViewType } from './Sidebar';
import { Topbar } from './Topbar';
import { Overview } from '../../views/Overview';
import { InstancesView } from '../../views/InstancesView';
import { NetworkView } from '../../views/NetworkView';
import { AiOperationsAssistant } from '../AiOperationsAssistant';
import { TerminalDialog } from '../TerminalDialog';
import type { Instance } from '../../api';

interface AppShellProps {
  onLogout: () => void;
  userEmail?: string;
  refreshInstances: () => void;
  instances: Instance[];
  isLoading: boolean;
  error?: Error | null;
  removeMutation: any;
  actionMutation: any;
  busyId?: string;
  setBusyId: (id?: string) => void;
}

export function AppShell({ 
  onLogout, userEmail, refreshInstances, instances, 
  isLoading, error, removeMutation, actionMutation, busyId, setBusyId 
}: AppShellProps) {
  const [currentView, setCurrentView] = useState<ViewType>('overview');
  const [terminalInstance, setTerminalInstance] = useState<Instance | null>(null);

  const viewTitles: Record<ViewType, string> = {
    overview: 'Overview',
    instances: 'Compute / Instances',
    network: 'Virtual Private Cloud',
    ai: 'AI Operations'
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <Sidebar currentView={currentView} onChangeView={setCurrentView} />
      
      <div className="pl-64">
        <Topbar 
          title={viewTitles[currentView]} 
          onLogout={onLogout} 
          userEmail={userEmail} 
        />
        
        <main className="p-8">
          <div className="mx-auto max-w-6xl">
            {currentView === 'overview' && (
              <Overview 
                instances={instances} 
                onNavigate={setCurrentView}
                isLoading={isLoading}
              />
            )}
            
            {currentView === 'instances' && (
              <InstancesView 
                instances={instances}
                isLoading={isLoading}
                error={error}
                busyId={busyId}
                onAction={(id, verb) => { setBusyId(id); actionMutation.mutate({ id, action: verb }); }}
                onDelete={(id) => { if (window.confirm('Delete this instance permanently?\nThis will remove the Docker container.')) { setBusyId(id); removeMutation.mutate(id); } }}
                onTerminal={setTerminalInstance}
                onCreated={refreshInstances}
              />
            )}

            {currentView === 'network' && (
              <NetworkView instances={instances} isLoading={isLoading} />
            )}

            {currentView === 'ai' && (
              <div className="max-w-3xl">
                <AiOperationsAssistant onCompleted={refreshInstances} />
              </div>
            )}
          </div>
        </main>
      </div>

      <TerminalDialog instance={terminalInstance} onClose={() => setTerminalInstance(null)} />
    </div>
  );
}
