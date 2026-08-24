import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { aiOperationsApi } from '../api';
import type { AiProposal } from '../api';

const labels = { create: 'Create instance', start: 'Start instance', stop: 'Stop instance', delete: 'Delete instance', none: 'No supported operation' };

export function AiOperationsAssistant({ onCompleted }: { onCompleted: () => void }) {
  const [message, setMessage] = useState('');
  const [proposal, setProposal] = useState<AiProposal>();
  const [name, setName] = useState('');
  const [publicKey, setPublicKey] = useState('');
  const interpret = useMutation({ mutationFn: aiOperationsApi.interpret, onSuccess: value => { setProposal(value); setName(value.instanceName || ''); setPublicKey(value.publicKey || ''); } });
  const execute = useMutation({
    mutationFn: () => {
      if (!proposal) throw new Error('Ask the assistant first');
      return proposal.operation === 'create'
        ? aiOperationsApi.execute({ operation: 'create', name, publicKey })
        : proposal.instance ? aiOperationsApi.execute({ operation: proposal.operation as 'start' | 'stop' | 'delete', instanceId: proposal.instance.id }) : Promise.reject(new Error('Choose a valid instance'));
    },
    onSuccess: () => { setMessage(''); setProposal(undefined); setName(''); setPublicKey(''); onCompleted(); }
  });

  return <section className="mb-8 rounded-xl border border-violet-500/30 bg-slate-900/70 p-5 shadow-lg shadow-violet-950/20" aria-labelledby="ai-operations-title">
    <p className="text-sm font-medium text-violet-300">Gemini-powered</p><h2 id="ai-operations-title" className="mt-1 text-lg font-semibold">AI Operations Assistant</h2><p className="mt-1 text-sm text-slate-400">Ask to create, start, stop, or delete an instance. Every operation needs your confirmation.</p>
    <form className="mt-4 flex gap-3" onSubmit={event => { event.preventDefault(); setProposal(undefined); interpret.mutate(message); }}>
      <input className="min-w-0 flex-1 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-violet-400" value={message} onChange={event => setMessage(event.target.value)} maxLength={2000} required placeholder="e.g. Start development-box" aria-label="AI operation request" />
      <button className="button border-violet-500 bg-violet-500 text-white hover:bg-violet-400" disabled={interpret.isPending}>{interpret.isPending ? 'Thinking...' : 'Ask AI'}</button>
    </form>
    {interpret.error && <p className="mt-3 text-sm text-red-300" role="alert">{interpret.error.message}</p>}
    {proposal && <div className="mt-4 rounded-lg border border-slate-700 bg-slate-950/70 p-4">
      <p className="text-sm font-medium text-slate-200">Proposed action: <span className="text-violet-300">{labels[proposal.operation]}</span></p><p className="mt-1 text-sm text-slate-400">{proposal.message}</p>
      {proposal.operation === 'create' && <><label className="label">Instance name<input value={name} onChange={event => setName(event.target.value)} maxLength={64} required /></label><label className="label">SSH public key<textarea value={publicKey} onChange={event => setPublicKey(event.target.value)} rows={3} required placeholder="ssh-ed25519 AAAA..." /></label></>}
      {proposal.instance && <p className="mt-3 text-sm text-slate-300">Instance: <span className="font-medium">{proposal.instance.name}</span> <span className="text-slate-500">({proposal.instance.state})</span></p>}
      {proposal.operation !== 'none' && <div className="mt-4 flex items-center gap-3"><button className={proposal.operation === 'delete' ? 'button button-danger' : 'button button-primary'} onClick={() => execute.mutate()} disabled={execute.isPending || (proposal.operation === 'create' && (!name.trim() || !publicKey.trim()))}>{execute.isPending ? 'Running...' : `Confirm ${labels[proposal.operation]}`}</button>{execute.error && <p className="text-sm text-red-300" role="alert">{execute.error.message}</p>}</div>}
    </div>}
  </section>;
}
