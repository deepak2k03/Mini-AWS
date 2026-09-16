import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { aiOperationsApi, type AiProposal } from '../api';
import { Bot, AlertTriangle, Play, Square, Trash2, Plus } from 'lucide-react';
import { Button } from './ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';

const labels = { create: 'Create instance', start: 'Start instance', stop: 'Stop instance', delete: 'Delete instance', none: 'No supported operation' };

export function AiOperationsAssistant({ onCompleted }: { onCompleted: () => void }) {
  const [message, setMessage] = useState('');
  const [proposal, setProposal] = useState<AiProposal>();
  const [name, setName] = useState('');
  const [publicKey, setPublicKey] = useState('');
  
  const interpret = useMutation({ 
    mutationFn: aiOperationsApi.interpret, 
    onSuccess: value => { 
      setProposal(value); 
      setName(value.instanceName || ''); 
      setPublicKey(value.publicKey || ''); 
    } 
  });
  
  const execute = useMutation({
    mutationFn: () => {
      if (!proposal) throw new Error('Ask the assistant first');
      return proposal.operation === 'create'
        ? aiOperationsApi.execute({ operation: 'create', name, publicKey })
        : proposal.instance 
          ? aiOperationsApi.execute({ operation: proposal.operation as 'start' | 'stop' | 'delete', instanceId: proposal.instance.id }) 
          : Promise.reject(new Error('Choose a valid instance'));
    },
    onSuccess: () => { setMessage(''); setProposal(undefined); setName(''); setPublicKey(''); onCompleted(); }
  });

  const handleSuggestedPrompt = (prompt: string) => {
    setMessage(prompt);
  };

  return (
    <Card className="overflow-hidden border-violet-900/30 bg-slate-900/60 shadow-[0_0_30px_rgba(139,92,246,0.05)]">
      <div className="h-1 w-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-500"></div>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-violet-400">Gemini-powered</p>
            <CardTitle>AI Operations</CardTitle>
          </div>
        </div>
        <p className="mt-2 text-sm text-slate-400">Manage your infrastructure using natural language. The AI will propose actions, but will never execute them without your explicit confirmation.</p>
      </CardHeader>
      
      <CardContent>
        <form className="relative flex items-center" onSubmit={event => { event.preventDefault(); setProposal(undefined); interpret.mutate(message); }}>
          <input 
            className="w-full rounded-lg border border-slate-700 bg-slate-950/50 py-3 pl-4 pr-24 text-sm text-slate-100 placeholder:text-slate-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500" 
            value={message} 
            onChange={event => setMessage(event.target.value)} 
            maxLength={2000} 
            required 
            placeholder="Ask Mini-AWS to perform an operation..." 
            aria-label="AI operation request" 
          />
          <div className="absolute right-2">
            <Button type="submit" size="sm" className="bg-violet-600 text-white hover:bg-violet-500" disabled={interpret.isPending}>
              {interpret.isPending ? 'Interpreting...' : 'Interpret'}
            </Button>
          </div>
        </form>

        {!proposal && (
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={() => handleSuggestedPrompt("Start development-box")} className="inline-flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-900 px-3 py-1 text-xs text-slate-400 hover:bg-slate-800 hover:text-slate-200">
              <Play className="h-3 w-3" /> Start development-box
            </button>
            <button type="button" onClick={() => handleSuggestedPrompt("Stop all running instances")} className="inline-flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-900 px-3 py-1 text-xs text-slate-400 hover:bg-slate-800 hover:text-slate-200">
              <Square className="h-3 w-3" /> Stop all running instances
            </button>
            <button type="button" onClick={() => handleSuggestedPrompt("Delete the old staging server")} className="inline-flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-900 px-3 py-1 text-xs text-slate-400 hover:bg-slate-800 hover:text-slate-200">
              <Trash2 className="h-3 w-3" /> Delete staging server
            </button>
          </div>
        )}

        {interpret.error && (
          <div className="mt-4 rounded-md border border-red-900/50 bg-red-950/20 p-4 text-sm text-red-400">
            {interpret.error.message}
          </div>
        )}

        {proposal && (
          <div className="mt-6 animate-in slide-in-from-bottom-2 duration-300">
            <div className="rounded-lg border border-slate-700 bg-slate-950/80 overflow-hidden">
              <div className="bg-slate-900/80 px-4 py-2 border-b border-slate-700 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Operation Preview</span>
                {proposal.operation === 'delete' && <span className="flex items-center gap-1 text-xs font-medium text-red-400"><AlertTriangle className="h-3 w-3" /> Destructive action</span>}
              </div>
              <div className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Operation</p>
                    <p className={`mt-1 flex items-center gap-2 text-lg font-medium ${proposal.operation === 'delete' ? 'text-red-400' : 'text-violet-400'}`}>
                      {proposal.operation === 'create' && <Plus className="h-4 w-4" />}
                      {proposal.operation === 'start' && <Play className="h-4 w-4" />}
                      {proposal.operation === 'stop' && <Square className="h-4 w-4" />}
                      {proposal.operation === 'delete' && <Trash2 className="h-4 w-4" />}
                      {proposal.operation.toUpperCase()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Target</p>
                    {proposal.operation === 'create' ? (
                       <p className="mt-1 font-mono text-sm text-slate-200">{name || 'New Instance'}</p>
                    ) : proposal.instance ? (
                      <div>
                        <p className="mt-1 font-mono text-sm text-slate-200">{proposal.instance.name}</p>
                        <p className="mt-0.5 text-xs text-slate-500">Currently: {proposal.instance.state}</p>
                      </div>
                    ) : (
                      <p className="mt-1 text-slate-500">None</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Impact</p>
                    <p className="mt-1 text-sm text-slate-300">{proposal.message}</p>
                  </div>
                </div>

                {proposal.operation === 'create' && (
                  <div className="mt-6 grid gap-4 border-t border-slate-800 pt-6">
                    <div>
                      <label className="text-sm font-medium text-slate-300">Instance name</label>
                      <input className="mt-1.5 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-violet-500 focus:outline-none" value={name} onChange={event => setName(event.target.value)} maxLength={64} required />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-300">SSH public key</label>
                      <textarea className="mt-1.5 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-xs text-slate-100 focus:border-violet-500 focus:outline-none" value={publicKey} onChange={event => setPublicKey(event.target.value)} rows={3} required placeholder="ssh-ed25519 AAAA..." />
                    </div>
                  </div>
                )}
              </div>
              
              {proposal.operation !== 'none' && (
                <div className="flex items-center justify-end gap-3 border-t border-slate-700 bg-slate-900/50 px-5 py-4">
                  <Button variant="ghost" onClick={() => setProposal(undefined)}>Cancel</Button>
                  <Button 
                    variant={proposal.operation === 'delete' ? 'danger' : 'primary'} 
                    onClick={() => execute.mutate()} 
                    disabled={execute.isPending || (proposal.operation === 'create' && (!name.trim() || !publicKey.trim()))}
                    className={proposal.operation === 'delete' ? '' : 'border-violet-600 bg-violet-600 hover:bg-violet-500'}
                  >
                    {execute.isPending ? 'Executing...' : `Confirm ${labels[proposal.operation]}`}
                  </Button>
                </div>
              )}
            </div>
            {execute.error && <p className="mt-3 text-sm text-red-400">{execute.error.message}</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
