import { useState } from 'react';
import type { FormEvent } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { instancesApi, sshKeysApi, type OperatingSystem } from '../api';
import { Button } from './ui/Button';
import { Cloud, Server, Key, Plus, ExternalLink } from 'lucide-react';

const distributions = {
  ubuntu: { name: 'Ubuntu', versions: ['24.04'] },
  debian: { name: 'Debian', versions: ['13'] },
  alpine: { name: 'Alpine Linux', versions: ['3.21'] },
  fedora: { name: 'Fedora', versions: ['41'] },
  rocky: { name: 'Rocky Linux', versions: ['9'] }
};

export function LaunchInstanceDialog({ onCreated, onNavigateToSettings }: { onCreated: () => void, onNavigateToSettings?: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [sshKeyId, setSshKeyId] = useState('');
  
  const keysQuery = useQuery({
    queryKey: ['ssh-keys'],
    queryFn: sshKeysApi.list,
    enabled: open
  });
  
  const [distribution, setDistribution] = useState<keyof typeof distributions>('ubuntu');
  const [version, setVersion] = useState<string>(distributions.ubuntu.versions[0]);
  
  const mutation = useMutation({
    mutationFn: instancesApi.create,
    onSuccess: () => { 
      setName(''); 
      setSshKeyId(''); 
      setDistribution('ubuntu');
      setVersion(distributions.ubuntu.versions[0]);
      setOpen(false); 
      onCreated(); 
    }
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!sshKeyId) return;
    mutation.mutate({ name, sshKeyId, os: { type: 'linux', distribution, version } });
  }

  function handleDistroSelect(key: keyof typeof distributions) {
    setDistribution(key);
    setVersion(distributions[key].versions[0]);
  }

  return <>
    <Button variant="primary" onClick={() => setOpen(true)} className="gap-2">
      <Plus className="h-4 w-4" />
      Launch Instance
    </Button>
    
    {open && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-console-bg/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="launch-title">
        <div className="w-full max-w-4xl overflow-hidden rounded-[10px] border border-console-border bg-console-card shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
          <div className="flex border-b border-console-border bg-console-elevated/50 p-6 flex-shrink-0">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-console-brandSubtle text-console-brand border border-console-brand/20">
              <Cloud className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <h2 id="launch-title" className="text-[18px] font-bold text-console-text">Launch Instance</h2>
              <p className="text-[13px] text-console-secondary mt-0.5">Configure a new isolated SSH-enabled compute instance.</p>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
            <form onSubmit={submit} className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-console-border scrollbar-track-transparent">
              <div className="space-y-8">
                
                {/* Distribution Selection */}
                <div>
                  <h3 className="text-[14px] font-semibold text-console-text mb-3">1. Operating System</h3>
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                    {(Object.entries(distributions) as [keyof typeof distributions, any][]).map(([key, distro]) => (
                      <div 
                        key={key}
                        className={`cursor-pointer rounded border p-3 text-center transition-all ${distribution === key ? 'border-console-brand bg-console-brandSubtle' : 'border-console-border bg-console-bg hover:border-console-muted'}`}
                        onClick={() => handleDistroSelect(key)}
                      >
                        <p className="text-[13px] font-medium text-console-text">{distro.name}</p>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4">
                    <label className="text-[13px] font-medium text-console-text">Version</label>
                    <select 
                      value={version}
                      onChange={(e) => setVersion(e.target.value)}
                      className="mt-1.5 w-full rounded border border-console-border bg-console-bg py-2 px-3 text-[13px] text-console-text focus:border-console-brand focus:outline-none focus:ring-1 focus:ring-console-brand"
                    >
                      {distributions[distribution].versions.map(v => (
                        <option key={v} value={v}>{distributions[distribution].name} {v}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Configuration */}
                <div>
                  <h3 className="text-[14px] font-semibold text-console-text mb-3">2. Configuration</h3>
                  <div className="space-y-5">
                    <div>
                      <label className="text-[13px] font-medium text-console-text">Instance Name</label>
                      <div className="mt-1.5 relative group">
                        <Server className="absolute left-3 top-2.5 h-4 w-4 text-console-muted group-focus-within:text-console-brand transition-colors" />
                        <input 
                          required 
                          maxLength={64} 
                          value={name} 
                          onChange={e => setName(e.target.value)} 
                          placeholder="development-box"
                          className="w-full rounded border border-console-border bg-console-bg py-2 pl-9 pr-3 text-[13px] text-console-text placeholder:text-console-muted focus:border-console-brand focus:outline-none focus:ring-1 focus:ring-console-brand transition-all"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between">
                        <label className="text-[13px] font-medium text-console-text">SSH Key</label>
                        {onNavigateToSettings && (
                          <button 
                            type="button" 
                            onClick={() => { setOpen(false); onNavigateToSettings(); }}
                            className="text-[11px] text-console-brand hover:underline flex items-center gap-1"
                          >
                            Manage Keys <ExternalLink className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                      <div className="mt-1.5 relative group">
                        <Key className="absolute left-3 top-2.5 h-4 w-4 text-console-muted group-focus-within:text-console-brand transition-colors" />
                        {keysQuery.isLoading ? (
                          <div className="w-full rounded border border-console-border bg-console-bg py-2 pl-9 pr-3 text-[13px] text-console-muted">
                            Loading SSH keys...
                          </div>
                        ) : keysQuery.data?.length === 0 ? (
                          <div className="w-full rounded border border-console-error/30 bg-console-error/10 py-2 pl-9 pr-3 text-[13px] text-console-error">
                            No SSH keys found. Please add one in Settings.
                          </div>
                        ) : (
                          <select 
                            required 
                            value={sshKeyId} 
                            onChange={e => setSshKeyId(e.target.value)} 
                            className="w-full rounded border border-console-border bg-console-bg py-2 pl-9 pr-3 text-[13px] text-console-text focus:border-console-brand focus:outline-none focus:ring-1 focus:ring-console-brand transition-all"
                          >
                            <option value="" disabled>Select an SSH Key...</option>
                            {keysQuery.data?.map(key => (
                              <option key={key.id} value={key.id}>{key.name} {key.isDefault ? '(Default)' : ''}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {mutation.error && (
                  <div className="rounded border border-console-error/20 bg-console-error/10 p-3 text-[13px] text-console-error" role="alert">
                    {mutation.error.message}
                  </div>
                )}
              </div>
              
              <div className="mt-8 pt-6 border-t border-console-border flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" variant="primary" disabled={mutation.isPending || !sshKeyId}>
                  {mutation.isPending ? 'Launching...' : 'Launch Instance'}
                </Button>
              </div>
            </form>
            
            <div className="w-full border-t border-console-border bg-console-elevated/20 p-6 md:w-64 md:border-l md:border-t-0 flex-shrink-0">
              <h3 className="text-[11px] font-semibold tracking-wider text-console-muted uppercase">Summary</h3>
              <div className="mt-4 space-y-4">
                <div>
                  <p className="text-[11px] text-console-secondary">Instance Name</p>
                  <p className="font-mono text-[12px] text-console-technical mt-0.5">{name || '—'}</p>
                </div>
                <div>
                  <p className="text-[11px] text-console-secondary">Operating System</p>
                  <p className="text-[13px] text-console-text mt-0.5">
                    {distributions[distribution].name} {version}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-console-secondary">Provider</p>
                  <p className="font-mono text-[12px] text-console-technical mt-0.5">Docker</p>
                </div>
                <div>
                  <p className="text-[11px] text-console-secondary">Network</p>
                  <p className="font-mono text-[12px] text-console-technical mt-0.5">mini-aws-network</p>
                </div>
                <div>
                  <p className="text-[11px] text-console-secondary">SSH</p>
                  <p className="text-[13px] text-console-text mt-0.5">{sshKeyId ? 'Enabled' : '—'}</p>
                </div>
              </div>

              {mutation.isPending && (
                <div className="mt-8 border-t border-console-border pt-6">
                  <h3 className="text-[11px] font-semibold tracking-wider text-console-muted uppercase">Status</h3>
                  <div className="mt-3 space-y-2 text-[12px] text-console-secondary">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-console-success shadow-[0_0_8px_rgba(34,197,94,0.4)]"></div>
                      <span>Validating OS</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-console-success shadow-[0_0_8px_rgba(34,197,94,0.4)]"></div>
                      <span>Creating network config</span>
                    </div>
                    <div className="flex items-center gap-2 animate-pulse">
                      <div className="h-1.5 w-1.5 rounded-full bg-console-brand shadow-[0_0_8px_rgba(34,211,238,0.4)]"></div>
                      <span className="text-console-text font-medium">Starting container</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )}
  </>;
}
