import { useState } from 'react';
import { Search, Filter, Server, Terminal, Play, Square, RotateCcw, Trash2, Copy, Check, ChevronLeft, Shield, Cpu, Network as NetworkIcon, Clock } from 'lucide-react';
import type { Instance } from '../api';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { LaunchInstanceDialog } from '../components/LaunchInstanceDialog';
import { formatDistanceToNow, format } from 'date-fns';

interface InstancesViewProps {
  instances: Instance[];
  isLoading: boolean;
  error?: Error | null;
  busyId?: string;
  onAction: (id: string, action: 'start' | 'stop' | 'restart') => void;
  onDelete: (id: string) => void;
  onTerminal: (instance: Instance) => void;
  onCreated: () => void;
  onNavigateToSettings?: () => void;
}

const statusConfig: Record<Instance['state'], { color: 'success' | 'default' | 'warning' | 'error' | 'outline', label: string }> = { 
  running: { color: 'success', label: 'Running' }, 
  stopped: { color: 'default', label: 'Stopped' }, 
  creating: { color: 'warning', label: 'Creating' }, 
  deleting: { color: 'warning', label: 'Deleting' }, 
  error: { color: 'error', label: 'Error' } 
};

export function InstancesView({ instances, isLoading, error, busyId, onAction, onDelete, onTerminal, onCreated, onNavigateToSettings }: InstancesViewProps) {
  const [search, setSearch] = useState('');
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string>();

  const filteredInstances = instances.filter(i => (i.name || '').toLowerCase().includes(search.toLowerCase()));
  const selectedInstance = instances.find(i => i._id === selectedInstanceId);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(undefined), 2000);
  };

  if (selectedInstance) {
    return <InstanceDetails 
      instance={selectedInstance} 
      onBack={() => setSelectedInstanceId(null)} 
      onAction={onAction}
      onDelete={onDelete}
      onTerminal={onTerminal}
      isBusy={busyId === selectedInstance._id}
      handleCopy={handleCopy}
      copiedId={copiedId}
    />;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[20px] font-bold tracking-tight text-console-text">Instances</h2>
          <p className="mt-1 text-[13px] text-console-secondary">Manage your SSH-enabled cloud instances.</p>
        </div>
        <div>
          <LaunchInstanceDialog onCreated={onCreated} onNavigateToSettings={onNavigateToSettings} />
        </div>
      </div>

      <div className="flex items-center gap-3 pb-2">
        <div className="relative max-w-sm flex-1 group">
          <Search className="absolute left-3 top-2 h-4 w-4 text-console-muted group-focus-within:text-console-brand transition-colors" />
          <input
            type="text"
            placeholder="Search instances..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded border border-console-border bg-console-bg py-1.5 pl-9 pr-4 text-[13px] text-console-text placeholder:text-console-muted focus:border-console-brand focus:outline-none focus:ring-1 focus:ring-console-brand"
          />
        </div>
        <Button variant="outline" className="gap-2 text-[12px] h-8">
          <Filter className="h-3 w-3" /> Status filter
        </Button>
      </div>

      {error ? (
        <div className="rounded border border-console-error/20 bg-console-error/10 p-6 text-center text-console-error">
          <p className="text-[14px] font-medium">Failed to load instances</p>
          <p className="mt-1 text-[12px] opacity-80">{error.message}</p>
        </div>
      ) : isLoading ? (
        <div className="rounded border border-console-border bg-console-card p-12 text-center text-console-muted text-[13px]">
          Loading instance data...
        </div>
      ) : filteredInstances.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded border border-dashed border-console-border bg-console-card/50 p-12 text-center">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-console-elevated text-console-muted">
            <Server className="h-5 w-5" />
          </div>
          <h3 className="text-[14px] font-medium text-console-text">No instances found</h3>
          <p className="mt-1 text-[13px] text-console-secondary">
            {search ? 'Try adjusting your search query.' : 'Launch your first isolated cloud instance to get started.'}
          </p>
          {!search && (
            <div className="mt-6">
              <LaunchInstanceDialog onCreated={onCreated} onNavigateToSettings={onNavigateToSettings} />
            </div>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded border border-console-border bg-console-card shadow-sm">
          <table className="min-w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-console-border bg-console-elevated/50 text-console-muted">
                <th className="font-medium px-4 py-3 w-[25%]">Instance</th>
                <th className="font-medium px-4 py-3 w-[15%]">Status</th>
                <th className="font-medium px-4 py-3 w-[15%]">Private IP</th>
                <th className="font-medium px-4 py-3 w-[25%]">SSH Endpoint</th>
                <th className="font-medium px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-console-border">
              {filteredInstances.map(instance => {
                const isBusy = busyId === instance._id;
                const sshCmd = instance.ssh?.hostPort ? `ssh ${instance.ssh.username}@${instance.ssh.host} -p ${instance.ssh.hostPort}` : '';
                const conf = statusConfig[instance.state] || statusConfig.error;
                
                return (
                  <tr key={instance._id} className="transition-colors hover:bg-console-hover group">
                    <td className="px-4 py-3">
                      <div className="flex flex-col cursor-pointer" onClick={() => setSelectedInstanceId(instance._id)}>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-console-brand group-hover:text-console-brandHover transition-colors">{instance.name}</p>
                          {instance.os && (
                            <span className="rounded bg-console-elevated px-1.5 py-0.5 text-[10px] font-medium uppercase text-console-secondary capitalize">
                              {instance.os.distribution} {instance.os.version}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-console-secondary truncate max-w-[200px]">
                          Created {instance.createdAt ? formatDistanceToNow(new Date(instance.createdAt), { addSuffix: true }) : 'Unknown'}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={conf.color}>{conf.label}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      {instance.privateIP ? (
                        <div className="font-mono text-[11px] text-console-technical">
                          {instance.privateIP}
                        </div>
                      ) : (
                        <span className="text-console-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {sshCmd ? (
                        <div className="flex items-center gap-2">
                          <code className="rounded bg-console-bg px-2 py-1 text-[11px] font-mono text-console-technical border border-console-border truncate max-w-[200px]">
                            {sshCmd}
                          </code>
                          <button 
                            onClick={() => handleCopy(sshCmd, instance._id)}
                            className="text-console-muted hover:text-console-text p-1 transition-colors"
                            title="Copy command"
                          >
                            {copiedId === instance._id ? <Check className="h-3.5 w-3.5 text-console-success" /> : <Copy className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      ) : (
                        <span className="text-console-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {instance.state === 'running' && (
                          <>
                            <Button size="icon" variant="ghost" disabled={isBusy} onClick={() => onTerminal(instance)} title="Connect">
                              <Terminal className="h-3.5 w-3.5 text-console-brand" />
                            </Button>
                            <Button size="icon" variant="ghost" disabled={isBusy} onClick={() => onAction(instance._id, 'restart')} title="Restart">
                              <RotateCcw className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" disabled={isBusy} onClick={() => onAction(instance._id, 'stop')} title="Stop">
                              <Square className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                        {instance.state === 'stopped' && (
                          <Button size="icon" variant="ghost" disabled={isBusy} onClick={() => onAction(instance._id, 'start')} title="Start">
                            <Play className="h-3.5 w-3.5 text-console-success" />
                          </Button>
                        )}
                        <Button size="icon" variant="ghost" disabled={isBusy} onClick={() => { if (window.confirm('Delete this instance permanently?')) onDelete(instance._id); }} className="hover:text-console-error hover:bg-console-error/10" title="Delete">
                          <Trash2 className="h-3.5 w-3.5" />
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

function InstanceDetails({ instance, onBack, onAction, onDelete, onTerminal, isBusy, handleCopy, copiedId }: any) {
  const conf = statusConfig[instance.state as Instance['state']] || statusConfig.error;
  const sshCmd = instance.ssh?.hostPort ? `ssh ${instance.ssh.username}@${instance.ssh.host} -p ${instance.ssh.hostPort}` : '';

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
      <div className="flex items-center gap-4 border-b border-console-border pb-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="text-console-secondary -ml-3">
          <ChevronLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <div className="h-4 w-px bg-console-border"></div>
        <div className="flex items-center gap-3">
          <h2 className="text-[20px] font-bold text-console-text">{instance.name}</h2>
          <Badge variant={conf.color}>{conf.label}</Badge>
        </div>
        <div className="ml-auto flex gap-2">
          {instance.state === 'running' && (
            <>
              <Button size="sm" variant="outline" disabled={isBusy} onClick={() => onAction(instance._id, 'stop')}><Square className="h-3.5 w-3.5 mr-2" /> Stop</Button>
              <Button size="sm" variant="outline" disabled={isBusy} onClick={() => onAction(instance._id, 'restart')}><RotateCcw className="h-3.5 w-3.5 mr-2" /> Restart</Button>
              <Button size="sm" variant="primary" disabled={isBusy} onClick={() => onTerminal(instance)}><Terminal className="h-3.5 w-3.5 mr-2" /> Connect</Button>
            </>
          )}
          {instance.state === 'stopped' && (
            <Button size="sm" variant="outline" disabled={isBusy} onClick={() => onAction(instance._id, 'start')}><Play className="h-3.5 w-3.5 mr-2 text-console-success" /> Start</Button>
          )}
          <Button size="sm" variant="danger" disabled={isBusy} onClick={() => { if (window.confirm('Delete this instance permanently?')) onDelete(instance._id); }}><Trash2 className="h-3.5 w-3.5 mr-2" /> Delete</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="rounded border border-console-border bg-console-card overflow-hidden">
            <div className="px-4 py-3 bg-console-elevated/50 border-b border-console-border font-medium text-[14px] flex items-center gap-2">
              <Server className="h-4 w-4 text-console-muted" /> Overview
            </div>
            <div className="p-4 space-y-4">
              <div>
                <p className="text-[11px] text-console-secondary mb-1">Instance ID</p>
                <code className="text-[12px] font-mono text-console-technical">{instance._id}</code>
              </div>
              <div>
                <p className="text-[11px] text-console-secondary mb-1">Operating System</p>
                {instance.os ? (
                  <p className="text-[13px] text-console-text capitalize">{instance.os.distribution} {instance.os.version}</p>
                ) : (
                  <code className="text-[12px] font-mono text-console-technical">mini-aws/ssh-instance:latest</code>
                )}
              </div>
              <div>
                <p className="text-[11px] text-console-secondary mb-1">Created</p>
                <p className="text-[13px] text-console-text">{instance.createdAt ? format(new Date(instance.createdAt), 'MMM d, yyyy HH:mm:ss') : 'Unknown'}</p>
              </div>
            </div>
          </div>

          <div className="rounded border border-console-border bg-console-card overflow-hidden">
            <div className="px-4 py-3 bg-console-elevated/50 border-b border-console-border font-medium text-[14px] flex items-center gap-2">
              <Shield className="h-4 w-4 text-console-muted" /> Security & Connection
            </div>
            <div className="p-4 space-y-4">
              <div>
                <p className="text-[11px] text-console-secondary mb-1">SSH Command</p>
                <div className="flex items-center gap-2">
                  <code className="bg-console-bg border border-console-border rounded px-2 py-1 text-[12px] font-mono text-console-technical flex-1 truncate">
                    {sshCmd || '—'}
                  </code>
                  {sshCmd && (
                    <Button variant="outline" size="icon" onClick={() => handleCopy(sshCmd, 'ssh')}>
                      {copiedId === 'ssh' ? <Check className="h-3.5 w-3.5 text-console-success" /> : <Copy className="h-3.5 w-3.5" />}
                    </Button>
                  )}
                </div>
              </div>
              <div>
                <p className="text-[11px] text-console-secondary mb-1">Authentication</p>
                <p className="text-[13px] text-console-text">Ed25519 Public Key</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded border border-console-border bg-console-card overflow-hidden">
            <div className="px-4 py-3 bg-console-elevated/50 border-b border-console-border font-medium text-[14px] flex items-center gap-2">
              <NetworkIcon className="h-4 w-4 text-console-muted" /> Network
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[11px] text-console-secondary mb-1">Private IP</p>
                  <code className="text-[12px] font-mono text-console-technical">{instance.privateIP || '—'}</code>
                </div>
                <div>
                  <p className="text-[11px] text-console-secondary mb-1">VPC Network</p>
                  <code className="text-[12px] font-mono text-console-technical">{instance.networkName || '—'}</code>
                </div>
              </div>
              <div>
                <p className="text-[11px] text-console-secondary mb-1">Port Mapping</p>
                <p className="text-[13px] text-console-text">22/tcp → {instance.ssh?.hostPort || '—'}</p>
              </div>
            </div>
          </div>

          <div className="rounded border border-console-border bg-console-card overflow-hidden">
            <div className="px-4 py-3 bg-console-elevated/50 border-b border-console-border font-medium text-[14px] flex items-center gap-2">
              <Cpu className="h-4 w-4 text-console-muted" /> Resources
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[11px] text-console-secondary mb-1">CPU Allocation</p>
                  <code className="text-[12px] font-mono text-console-technical">0.5 vCPU</code>
                </div>
                <div>
                  <p className="text-[11px] text-console-secondary mb-1">Memory Allocation</p>
                  <code className="text-[12px] font-mono text-console-technical">512 MB</code>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
