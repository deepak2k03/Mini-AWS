import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { aiOperationsApi, type AiProposal } from '../api';
import { Bot, AlertTriangle, Play, Square, Trash2, Plus, Terminal } from 'lucide-react';
import { Button } from './ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';

const labels = { create: 'Create instance', start: 'Start instance', stop: 'Stop instance', delete: 'Delete instance', none: 'No supported operation' };

export function AiOperationsAssistant({ onCompleted, navigateToSettings }: { onCompleted: () => void, navigateToSettings?: () => void }) {
  const [message, setMessage] = useState('');
  const [proposal, setProposal] = useState<AiProposal>();
  const [name, setName] = useState('');
  const [model, setModel] = useState('gemini-3.6-flash');

  
  const execute = useMutation({
    mutationFn: (override?: { p: AiProposal; n: string }) => {
      const currentProposal = override ? override.p : proposal;
      const currentName = override ? override.n : name;
      
      if (!currentProposal) throw new Error('Ask the assistant first');
      return currentProposal.operation === 'create'
        ? aiOperationsApi.execute({ operation: 'create', name: currentName, sshKeyName: currentProposal.sshKeyName, os: currentProposal.os })
        : currentProposal.instance 
          ? aiOperationsApi.execute({ operation: currentProposal.operation as 'start' | 'stop' | 'delete', instanceId: currentProposal.instance.id }) 
          : Promise.reject(new Error('Choose a valid instance'));
    },
    onSuccess: () => { setMessage(''); setProposal(undefined); setName(''); onCompleted(); }
  });

  const interpret = useMutation({ 
    mutationFn: aiOperationsApi.interpret, 
    onSuccess: value => { 
      setProposal(value); 
      setName(value.instanceName || ''); 
      
      // Auto-execute all operations
      if (value.operation === 'create' && value.instanceName) {
        execute.mutate({ p: value, n: value.instanceName });
      } else if ((value.operation === 'start' || value.operation === 'stop' || value.operation === 'delete') && value.instance) {
        execute.mutate({ p: value, n: '' });
      }
    } 
  });

  const handleSuggestedPrompt = (prompt: string) => {
    setMessage(prompt);
  };

  return (
    <Card className="overflow-hidden border-console-ai/20 bg-console-card shadow-[0_0_30px_rgba(167,139,250,0.05)]">
      <div className="h-1 w-full bg-gradient-to-r from-console-ai via-console-brand to-console-success"></div>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded bg-console-ai/10 text-console-ai">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-console-ai">Gemini-powered</p>
            <CardTitle className="text-[18px]">AI Operations</CardTitle>
          </div>
        </div>
        <p className="mt-2 text-[13px] text-console-secondary">Manage your infrastructure using natural language. The AI will propose actions, but will never execute them without your explicit confirmation.</p>
        
        <div className="mt-4 flex items-center gap-2">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-console-secondary">Model</label>
          <select 
            value={model} 
            onChange={e => setModel(e.target.value)}
            className="rounded border border-console-border bg-console-bg py-1 pl-2 pr-6 text-[12px] text-console-text focus:border-console-ai focus:outline-none"
          >
            <option value="gemini-3.6-flash">Gemini 3.6 Flash (Fast, Free)</option>
            <option value="gemini-3.6-pro">Gemini 3.6 Pro (Powerful)</option>
          </select>
        </div>
      </CardHeader>
      
      <CardContent>
        <form className="relative flex items-center" onSubmit={event => { event.preventDefault(); setProposal(undefined); interpret.mutate({ message, model }); }}>
          <Terminal className="absolute left-3 top-2.5 h-4 w-4 text-console-muted" />
          <input 
            className="w-full rounded border border-console-border bg-console-bg py-2 pl-9 pr-24 text-[13px] text-console-text placeholder:text-console-muted focus:border-console-ai focus:outline-none focus:ring-1 focus:ring-console-ai transition-colors" 
            value={message} 
            onChange={event => setMessage(event.target.value)} 
            maxLength={2000} 
            required 
            placeholder="e.g. 'Create an Ubuntu server named dev-box'" 
            aria-label="AI operation request" 
          />
          <div className="absolute right-1">
            <Button type="submit" size="sm" className="h-7 border-console-ai bg-console-ai text-console-bg hover:bg-console-ai/90" disabled={interpret.isPending || execute.isPending}>
              {interpret.isPending || execute.isPending ? 'Processing...' : 'Interpret'}
            </Button>
          </div>
        </form>

        {!proposal && (
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={() => handleSuggestedPrompt("Create an Ubuntu server named dev-box")} className="inline-flex items-center gap-1.5 rounded-full border border-console-border bg-console-elevated px-3 py-1 text-[11px] font-medium text-console-secondary hover:bg-console-hover hover:text-console-text transition-colors">
              <Plus className="h-3 w-3" /> Create Ubuntu server
            </button>
            <button type="button" onClick={() => handleSuggestedPrompt("Start development-box")} className="inline-flex items-center gap-1.5 rounded-full border border-console-border bg-console-elevated px-3 py-1 text-[11px] font-medium text-console-secondary hover:bg-console-hover hover:text-console-text transition-colors">
              <Play className="h-3 w-3" /> Start development-box
            </button>
            <button type="button" onClick={() => handleSuggestedPrompt("Stop all running instances")} className="inline-flex items-center gap-1.5 rounded-full border border-console-border bg-console-elevated px-3 py-1 text-[11px] font-medium text-console-secondary hover:bg-console-hover hover:text-console-text transition-colors">
              <Square className="h-3 w-3" /> Stop all running instances
            </button>
          </div>
        )}

        {interpret.error && (
          <div className="mt-4 rounded border border-console-error/20 bg-console-error/10 p-3 text-[13px] text-console-error">
            {interpret.error.message}
          </div>
        )}

        {proposal && (
          <div className="mt-6 animate-in slide-in-from-bottom-2 duration-300">
            <div className="rounded border border-console-border bg-console-bg overflow-hidden shadow-sm">
              <div className="bg-console-elevated/50 px-4 py-2 border-b border-console-border flex items-center justify-between">
                <span className="text-[11px] font-semibold tracking-wider text-console-muted uppercase">Proposed Operation</span>
                {proposal.operation === 'delete' && <span className="flex items-center gap-1 text-[11px] font-medium text-console-error"><AlertTriangle className="h-3 w-3" /> Destructive action</span>}
              </div>
              <div className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-console-secondary">Operation</p>
                    <p className={`mt-1 flex items-center gap-2 text-[15px] font-medium ${proposal.operation === 'delete' ? 'text-console-error' : 'text-console-ai'}`}>
                      {proposal.operation === 'create' && <Plus className="h-4 w-4" />}
                      {proposal.operation === 'start' && <Play className="h-4 w-4" />}
                      {proposal.operation === 'stop' && <Square className="h-4 w-4" />}
                      {proposal.operation === 'delete' && <Trash2 className="h-4 w-4" />}
                      {proposal.operation.toUpperCase()}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-console-secondary">Target</p>
                    {proposal.operation === 'create' ? (
                       <div>
                         <p className="mt-1 font-mono text-[13px] text-console-text">{name || 'New Instance'}</p>
                         {proposal.os && (
                           <p className="mt-0.5 text-[11px] text-console-secondary capitalize">
                             {proposal.os.distribution} {proposal.os.version}
                           </p>
                         )}
                       </div>
                    ) : proposal.instance ? (
                      <div>
                        <p className="mt-1 font-mono text-[13px] text-console-text">{proposal.instance.name}</p>
                        <p className="mt-0.5 text-[11px] text-console-secondary">Currently: {proposal.instance.state}</p>
                      </div>
                    ) : (
                      <p className="mt-1 text-[13px] text-console-muted">None</p>
                    )}
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-console-secondary">Impact</p>
                    <p className="mt-1 text-[13px] text-console-text leading-relaxed">{proposal.message}</p>
                  </div>
                </div>

                {proposal.operation === 'create' && (
                  <div className="mt-6 grid gap-4 border-t border-console-border pt-5">
                    <div>
                      <label className="text-[12px] font-medium text-console-text">Instance Name</label>
                      <input className="mt-1.5 w-full rounded border border-console-border bg-console-elevated px-3 py-2 text-[13px] text-console-text focus:border-console-ai focus:outline-none focus:ring-1 focus:ring-console-ai transition-colors" value={name} onChange={event => setName(event.target.value)} maxLength={64} required />
                    </div>
                  </div>
                )}
              </div>
              
              {proposal.operation !== 'none' && (
                <div className="flex items-center justify-end gap-3 border-t border-console-border bg-console-elevated px-5 py-3">
                  <Button variant="ghost" onClick={() => setProposal(undefined)} className="h-8 text-[12px]">Cancel</Button>
                  <Button 
                    variant={proposal.operation === 'delete' ? 'danger' : 'primary'} 
                    onClick={() => execute.mutate()} 
                    disabled={execute.isPending || (proposal.operation === 'create' && (!name.trim()))}
                    className={`h-8 text-[12px] ${proposal.operation === 'delete' ? '' : 'border-console-ai bg-console-ai text-console-bg hover:bg-console-ai/90 hover:border-transparent'}`}
                  >
                    {execute.isPending ? 'Executing...' : `Confirm Operation`}
                  </Button>
                </div>
              )}
            </div>
            {execute.error && (
              execute.error.message.includes('SSH_KEY_REQUIRED') || (execute.error as any).code === 'SSH_KEY_REQUIRED' ? (
                <div className="mt-4 p-5 rounded border border-console-ai/20 bg-console-elevated">
                  <h3 className="text-[14px] font-medium text-console-text mb-2">SSH Key Setup Required</h3>
                  <p className="text-[13px] text-console-secondary mb-4">
                    Mini-AWS needs an SSH public key to securely access this instance. You only need to configure this once.
                  </p>
                  <Button variant="primary" onClick={navigateToSettings}>Add SSH Key</Button>
                </div>
              ) : (
                <p className="mt-3 text-[13px] text-console-error">{execute.error.message}</p>
              )
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
