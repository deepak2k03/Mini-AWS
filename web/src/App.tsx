import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, instancesApi } from './api';
import { AuthScreen } from './components/AuthScreen';
import { AppShell } from './components/layout/AppShell';
import { useState } from 'react';

export default function App() {
  const queryClient = useQueryClient();
  const [busyId, setBusyId] = useState<string>();

  // Auth Query
  const meQuery = useQuery({ 
    queryKey: ['me'], 
    queryFn: api.me,
    retry: false
  });

  // Instances Query
  const instancesQuery = useQuery({ 
    queryKey: ['instances'], 
    queryFn: instancesApi.list, 
    refetchInterval: 10000,
    enabled: !!meQuery.data
  });

  const refreshInstances = () => void queryClient.invalidateQueries({ queryKey: ['instances'] });

  const actionMutation = useMutation({ 
    mutationFn: ({ id, action }: { id: string; action: 'start' | 'stop' | 'restart' }) => instancesApi.action(id, action), 
    onSuccess: refreshInstances, 
    onSettled: () => setBusyId(undefined) 
  });
  
  const removeMutation = useMutation({ 
    mutationFn: instancesApi.remove, 
    onSuccess: refreshInstances, 
    onSettled: () => setBusyId(undefined) 
  });

  const logoutMutation = useMutation({
    mutationFn: api.logout,
    onSuccess: () => {
      queryClient.setQueryData(['me'], null);
      queryClient.clear();
    }
  });

  if (meQuery.isLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-950"><div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-800 border-t-cyan-500"></div></div>;
  }

  if (!meQuery.data) {
    return <AuthScreen onAuthenticated={() => meQuery.refetch()} />;
  }

  return (
    <AppShell 
      userEmail={meQuery.data.email}
      onLogout={() => logoutMutation.mutate()}
      instances={instancesQuery.data ?? []}
      isLoading={instancesQuery.isLoading}
      error={instancesQuery.error}
      refreshInstances={refreshInstances}
      removeMutation={removeMutation}
      actionMutation={actionMutation}
      busyId={busyId}
      setBusyId={setBusyId}
    />
  );
}
