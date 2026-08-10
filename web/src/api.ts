export type InstanceState = 'creating' | 'running' | 'stopped' | 'deleting' | 'error';
export type Instance = {
  _id: string;
  name: string;
  state: InstanceState;
  ssh: { host: string; hostPort?: number; username: string };
  lastError?: string;
  createdAt: string;
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
