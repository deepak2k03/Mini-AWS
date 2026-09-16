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
      Launch instance
    </Button>
    
    {open && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="launch-title">
        <div className="w-full max-w-3xl overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-2xl animate-in zoom-in-95 duration-200">
          <div className="flex border-b border-slate-800 bg-slate-900/50 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
              <Cloud className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <h2 id="launch-title" className="text-xl font-bold text-slate-100">Launch instance</h2>
              <p className="text-sm text-slate-400">Configure a new isolated SSH-enabled compute instance.</p>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row">
            <form onSubmit={submit} className="flex-1 p-6">
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-medium text-slate-200">Instance name</label>
                  <div className="mt-1.5 relative">
                    <Server className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <input 
                      autoFocus 
                      required 
                      maxLength={64} 
                      value={name} 
                      onChange={e => setName(e.target.value)} 
                      placeholder="development-box"
                      className="w-full rounded-md border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-sm text-slate-100 placeholder:text-slate-600 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-200">SSH public key</label>
                    <span className="text-xs text-slate-500">Only public keys are stored</span>
                  </div>
                  <div className="mt-1.5 relative">
                    <Key className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                    <textarea 
                      required 
                      value={publicKey} 
                      onChange={e => setPublicKey(e.target.value)} 
                      placeholder="ssh-ed25519 AAAA..." 
                      rows={5}
                      className="w-full rounded-md border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 font-mono text-sm text-slate-100 placeholder:text-slate-600 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    Paste the contents of your <code className="rounded bg-slate-800 px-1 py-0.5">.pub</code> file.
                  </p>
                </div>
                
                {mutation.error && (
                  <div className="rounded-md border border-red-900/50 bg-red-950/30 p-3 text-sm text-red-400" role="alert">
                    {mutation.error.message}
                  </div>
                )}
              </div>
              
              <div className="mt-8 flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" variant="primary" disabled={mutation.isPending}>
                  {mutation.isPending ? 'Launching...' : 'Launch instance'}
                </Button>
              </div>
            </form>
            
            <div className="w-full border-t border-slate-800 bg-slate-900/30 p-6 md:w-64 md:border-l md:border-t-0">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Configuration</h3>
              <div className="mt-4 space-y-4">
                <div>
                  <p className="text-xs text-slate-500">Image</p>
                  <p className="font-mono text-sm text-slate-300">mini-aws/ssh-instance</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Network</p>
                  <p className="font-mono text-sm text-slate-300">mini-aws-network</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Authentication</p>
                  <p className="text-sm text-slate-300">Public Key</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Resources</p>
                  <p className="text-sm text-slate-300">0.5 CPU / 512 MiB</p>
                </div>
              </div>

              {mutation.isPending && (
                <div className="mt-8 border-t border-slate-800 pt-6">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Status</h3>
                  <div className="mt-3 space-y-2 text-sm text-slate-300">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div>
                      <span>Validating key</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div>
                      <span>Creating network config</span>
                    </div>
                    <div className="flex items-center gap-2 opacity-50 animate-pulse">
                      <div className="h-1.5 w-1.5 rounded-full bg-cyan-500"></div>
                      <span>Starting container</span>
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
