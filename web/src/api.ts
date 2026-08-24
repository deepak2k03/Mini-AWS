export type InstanceState = 'creating' | 'running' | 'stopped' | 'deleting' | 'error';
export type Instance = {
  _id: string;
  name: string;
  hostname?: string;
  privateIP?: string;
  networkName?: string;
  state: InstanceState;
  ssh: { host: string; hostPort?: number; username: string };
  lastError?: string;
  createdAt: string;
};

export type AiProposal = {
  operation: 'create' | 'start' | 'stop' | 'delete' | 'none';
  instanceName: string;
  publicKey: string;
  message: string;
  instance: { id: string; name: string; state: InstanceState } | null;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/instances${path}`, {
    ...init,
    headers: { ...(init?.body ? { 'content-type': 'application/json' } : {}), ...init?.headers },
    credentials: 'include'
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message ?? 'The request failed');
  }
  return response.status === 204 ? undefined as T : response.json() as Promise<T>;
}

export const instancesApi = {
  list: () => request<Instance[]>(''),
  create: (values: { name: string; publicKey: string }) => request<Instance>('', { method: 'POST', body: JSON.stringify(values) }),
  action: (id: string, action: 'start' | 'stop' | 'restart') => request<Instance>(`/${id}/actions`, { method: 'POST', body: JSON.stringify({ action }) }),
  remove: (id: string) => request<void>(`/${id}`, { method: 'DELETE' })
};

async function aiRequest<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`/api/ai/operations${path}`, { method: 'POST', headers: { 'content-type': 'application/json' }, credentials: 'include', body: JSON.stringify(body) });
  if (!response.ok) { const error = await response.json().catch(() => ({})); throw new Error(error.message ?? 'The AI request failed'); }
  return response.status === 204 ? undefined as T : response.json() as Promise<T>;
}

export const aiOperationsApi = {
  interpret: (message: string) => aiRequest<AiProposal>('/interpret', { message }),
  execute: (command: { operation: 'create'; name: string; publicKey: string } | { operation: 'start' | 'stop' | 'delete'; instanceId: string }) => aiRequest<Instance | void>('/execute', command)
};
