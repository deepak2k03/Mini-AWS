import { useState } from 'react';
import type { FormEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { instancesApi } from '../api';
import { Button } from './ui/Button';
import { Cloud, Server, Key, Plus } from 'lucide-react';

export function LaunchInstanceDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [publicKey, setPublicKey] = useState('');
  
  const mutation = useMutation({
    mutationFn: instancesApi.create,
    onSuccess: () => { 
      setName(''); 
      setPublicKey(''); 
      setOpen(false); 
      onCreated(); 
    }
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    mutation.mutate({ name, publicKey });
  }

  return <>
    <Button variant="primary" onClick={() => setOpen(true)} className="gap-2">
      <Plus className="h-4 w-4" />
      Launch Instance
    </Button>
    
    {open && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-console-bg/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="launch-title">
        <div className="w-full max-w-3xl overflow-hidden rounded-[10px] border border-console-border bg-console-card shadow-2xl animate-in zoom-in-95 duration-200">
          <div className="flex border-b border-console-border bg-console-elevated/50 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-console-brandSubtle text-console-brand border border-console-brand/20">
              <Cloud className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <h2 id="launch-title" className="text-[18px] font-bold text-console-text">Launch Instance</h2>
              <p className="text-[13px] text-console-secondary mt-0.5">Configure a new isolated SSH-enabled compute instance.</p>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row">
            <form onSubmit={submit} className="flex-1 p-6">
              <div className="space-y-6">
                <div>
                  <label className="text-[13px] font-medium text-console-text">Instance Name</label>
                  <div className="mt-1.5 relative group">
                    <Server className="absolute left-3 top-2.5 h-4 w-4 text-console-muted group-focus-within:text-console-brand transition-colors" />
                    <input 
                      autoFocus 
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
                    <label className="text-[13px] font-medium text-console-text">SSH Public Key</label>
                    <span className="text-[11px] text-console-muted">Only public keys are stored</span>
                  </div>
                  <div className="mt-1.5 relative group">
                    <Key className="absolute left-3 top-2.5 h-4 w-4 text-console-muted group-focus-within:text-console-brand transition-colors" />
                    <textarea 
                      required 
                      value={publicKey} 
                      onChange={e => setPublicKey(e.target.value)} 
                      placeholder="ssh-ed25519 AAAA..." 
                      rows={5}
                      className="w-full rounded border border-console-border bg-console-bg py-2 pl-9 pr-3 font-mono text-[12px] text-console-technical placeholder:text-console-muted focus:border-console-brand focus:outline-none focus:ring-1 focus:ring-console-brand transition-all"
                    />
                  </div>
                  <p className="mt-2 text-[11px] text-console-muted">
                    Paste the contents of your <code className="rounded bg-console-elevated px-1 py-0.5 border border-console-border text-console-secondary">.pub</code> file.
                  </p>
                </div>
                
                {mutation.error && (
                  <div className="rounded border border-console-error/20 bg-console-error/10 p-3 text-[13px] text-console-error" role="alert">
                    {mutation.error.message}
                  </div>
                )}
              </div>
              
              <div className="mt-8 flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" variant="primary" disabled={mutation.isPending}>
                  {mutation.isPending ? 'Launching...' : 'Launch Instance'}
                </Button>
              </div>
            </form>
            
            <div className="w-full border-t border-console-border bg-console-elevated/20 p-6 md:w-64 md:border-l md:border-t-0">
              <h3 className="text-[11px] font-semibold tracking-wider text-console-muted uppercase">Configuration Summary</h3>
              <div className="mt-4 space-y-4">
                <div>
                  <p className="text-[11px] text-console-secondary">Image</p>
                  <p className="font-mono text-[12px] text-console-technical mt-0.5">mini-aws/ssh-instance</p>
                </div>
                <div>
                  <p className="text-[11px] text-console-secondary">Network</p>
                  <p className="font-mono text-[12px] text-console-technical mt-0.5">mini-aws-network</p>
                </div>
                <div>
                  <p className="text-[11px] text-console-secondary">Authentication</p>
                  <p className="text-[13px] text-console-text mt-0.5">Public Key</p>
                </div>
                <div>
                  <p className="text-[11px] text-console-secondary">Resources</p>
                  <p className="text-[13px] text-console-text mt-0.5">0.5 CPU / 512 MiB</p>
                </div>
              </div>

              {mutation.isPending && (
                <div className="mt-8 border-t border-console-border pt-6">
                  <h3 className="text-[11px] font-semibold tracking-wider text-console-muted uppercase">Status</h3>
                  <div className="mt-3 space-y-2 text-[12px] text-console-secondary">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-console-success shadow-[0_0_8px_rgba(34,197,94,0.4)]"></div>
                      <span>Validating key</span>
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
