import { useState } from 'react';
import { Search, Filter, Server, Terminal, Play, Square, RotateCcw, Trash2, Copy, Check } from 'lucide-react';
import type { Instance } from '../api';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { LaunchInstanceDialog } from '../components/LaunchInstanceDialog';
import { formatDistanceToNow } from 'date-fns';

interface InstancesViewProps {
  instances: Instance[];
  isLoading: boolean;
  error?: Error | null;
  busyId?: string;
  onAction: (id: string, action: 'start' | 'stop' | 'restart') => void;
  onDelete: (id: string) => void;
  onTerminal: (instance: Instance) => void;
  onCreated: () => void;
}

const statusConfig: Record<Instance['state'], { color: 'success' | 'default' | 'warning' | 'error' | 'outline', label: string }> = { 
  running: { color: 'success', label: 'Running' }, 
  stopped: { color: 'default', label: 'Stopped' }, 
  creating: { color: 'warning', label: 'Creating' }, 
  deleting: { color: 'warning', label: 'Deleting' }, 
  error: { color: 'error', label: 'Error' } 
};

export function InstancesView({ instances, isLoading, error, busyId, onAction, onDelete, onTerminal, onCreated }: InstancesViewProps) {
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string>();

  const filteredInstances = instances.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(undefined), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Instances</h2>
          <p className="mt-1 text-sm text-slate-400">Manage your SSH-enabled cloud instances and container workloads.</p>
        </div>
        <LaunchInstanceDialog onCreated={onCreated} />
      </div>

      <div className="flex items-center gap-4 pb-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search instances by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-slate-800 bg-slate-900 py-2 pl-9 pr-4 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" /> Filter
        </Button>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-900/50 bg-red-950/20 p-6 text-center text-red-400">
          <p className="font-medium">Failed to load instances</p>
          <p className="mt-1 text-sm">{error.message}</p>
        </div>
      ) : isLoading ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-12 text-center text-slate-500">
          Loading instances...
        </div>
      ) : filteredInstances.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-900/20 p-12 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-slate-400">
            <Server className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-medium text-slate-200">No instances found</h3>
          <p className="mt-1 text-sm text-slate-500">
            {search ? 'Try adjusting your search query.' : 'Launch your first isolated cloud instance to get started.'}
          </p>
          {!search && (
            <div className="mt-6">
              <LaunchInstanceDialog onCreated={onCreated} />
            </div>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/40 shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400">
                <th className="font-medium px-6 py-4">Instance</th>
                <th className="font-medium px-6 py-4">Status</th>
                <th className="font-medium px-6 py-4">Private IP</th>
                <th className="font-medium px-6 py-4">SSH Endpoint</th>
                <th className="font-medium px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {filteredInstances.map(instance => {
                const isBusy = busyId === instance._id;
                const sshCmd = instance.ssh.hostPort ? `ssh ${instance.ssh.username}@${instance.ssh.host} -p ${instance.ssh.hostPort}` : '';
                const conf = statusConfig[instance.state] || statusConfig.error;
                
                return (
                  <tr key={instance._id} className="transition-colors hover:bg-slate-800/20">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded bg-slate-800 text-slate-300">
                          <Server className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-200">{instance.name}</p>
                          <p className="text-xs text-slate-500">
                            Created {formatDistanceToNow(new Date(instance.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      {instance.lastError && (
                        <p className="mt-2 text-xs text-red-400 max-w-xs">{instance.lastError}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={conf.color}>{conf.label}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      {instance.privateIP ? (
                        <div className="font-mono text-xs text-slate-300">
                          {instance.privateIP}
                          <p className="text-[10px] font-sans text-slate-500 mt-0.5">{instance.networkName}</p>
                        </div>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {sshCmd ? (
                        <div className="flex items-center gap-2">
                          <code className="rounded bg-slate-950 px-2 py-1 text-xs font-medium text-cyan-300 border border-slate-800">
                            {sshCmd}
                          </code>
                          <button 
                            onClick={() => handleCopy(sshCmd, instance._id)}
                            className="text-slate-500 hover:text-slate-300 p-1 transition-colors"
                            title="Copy command"
                          >
                            {copiedId === instance._id ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {instance.state === 'running' && (
                          <>
                            <Button size="icon" variant="ghost" disabled={isBusy} onClick={() => onTerminal(instance)} title="Open Terminal">
                              <Terminal className="h-4 w-4 text-cyan-400" />
                            </Button>
                            <Button size="icon" variant="ghost" disabled={isBusy} onClick={() => onAction(instance._id, 'restart')} title="Restart">
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" disabled={isBusy} onClick={() => onAction(instance._id, 'stop')} title="Stop">
                              <Square className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {instance.state === 'stopped' && (
                          <Button size="icon" variant="ghost" disabled={isBusy} onClick={() => onAction(instance._id, 'start')} title="Start">
                            <Play className="h-4 w-4 text-emerald-400" />
                          </Button>
                        )}
                        <Button size="icon" variant="ghost" disabled={isBusy} onClick={() => onDelete(instance._id)} className="hover:text-red-400 hover:bg-red-950/30" title="Delete">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
