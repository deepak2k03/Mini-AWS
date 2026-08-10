import { useState } from 'react';
import type { FormEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { instancesApi } from '../api';

export function LaunchInstanceDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [publicKey, setPublicKey] = useState('');
  const mutation = useMutation({
    mutationFn: instancesApi.create,
    onSuccess: () => { setName(''); setPublicKey(''); setOpen(false); onCreated(); }
  });
  function submit(event: FormEvent) {
    event.preventDefault();
    mutation.mutate({ name, publicKey });
  }
  return <>
    <button className="button button-primary" onClick={() => setOpen(true)}>Launch instance</button>
    {open && <div className="fixed inset-0 z-10 grid place-items-center bg-slate-950/80 p-4" role="dialog" aria-modal="true" aria-labelledby="launch-title">
      <form onSubmit={submit} className="w-full max-w-lg rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <h2 id="launch-title" className="text-xl font-semibold">Launch SSH instance</h2>
        <p className="mt-1 text-sm text-slate-400">Only a public key is stored. Your private key never leaves your device.</p>
        <label className="label">Instance name<input autoFocus required maxLength={64} value={name} onChange={e => setName(e.target.value)} placeholder="development-box" /></label>
        <label className="label">SSH public key<textarea required value={publicKey} onChange={e => setPublicKey(e.target.value)} placeholder="ssh-ed25519 AAAA..." rows={5} /></label>
        {mutation.error && <p className="mt-3 text-sm text-red-300" role="alert">{mutation.error.message}</p>}
        <div className="mt-5 flex justify-end gap-3"><button className="button" type="button" onClick={() => setOpen(false)}>Cancel</button><button className="button button-primary" disabled={mutation.isPending}>{mutation.isPending ? 'Launching…' : 'Launch'}</button></div>
      </form>
    </div>}
  </>;
}
