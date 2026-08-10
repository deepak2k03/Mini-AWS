import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { instancesApi } from './api';
import { InstanceTable } from './components/InstanceTable';
import { LaunchInstanceDialog } from './components/LaunchInstanceDialog';

export default function App() {
  const client = useQueryClient();
  const [busyId, setBusyId] = useState<string>();
  const refresh = () => void client.invalidateQueries({ queryKey: ['instances'] });
  const query = useQuery({ queryKey: ['instances'], queryFn: instancesApi.list, refetchInterval: 10000 });
  const action = useMutation({ mutationFn: ({ id, action }: { id: string; action: 'start' | 'stop' | 'restart' }) => instancesApi.action(id, action), onSuccess: refresh, onSettled: () => setBusyId(undefined) });
  const remove = useMutation({ mutationFn: instancesApi.remove, onSuccess: refresh, onSettled: () => setBusyId(undefined) });
  return <main className="min-h-screen bg-slate-950 px-5 py-8 text-slate-100 md:px-10"><div className="mx-auto max-w-6xl"><header className="mb-9 flex items-center justify-between"><div><p className="text-sm font-medium text-cyan-300">Mini-AWS</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Cloud instances</h1><p className="mt-2 text-slate-400">Launch and access isolated SSH containers.</p></div><LaunchInstanceDialog onCreated={refresh} /></header>{query.isLoading ? <p className="text-slate-400">Loading instances…</p> : query.error ? <p className="text-red-300">{query.error.message}</p> : <InstanceTable instances={query.data ?? []} busyId={busyId} onAction={(id, verb) => { setBusyId(id); action.mutate({ id, action: verb }); }} onDelete={(id) => { if (window.confirm('Delete this instance permanently?')) { setBusyId(id); remove.mutate(id); } }} />}</div></main>;
}
