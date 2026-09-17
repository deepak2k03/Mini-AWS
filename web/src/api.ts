export type InstanceState = 'creating' | 'running' | 'stopped' | 'deleting' | 'error';

export interface OperatingSystem {
  type: 'linux';
  distribution: string;
  version: string;
}

export type Instance = {
  _id: string;
  name: string;
  hostname?: string;
  privateIP?: string;
  networkName?: string;
  state: InstanceState;
  ssh: { host: string; hostPort?: number; username: string };
  os?: OperatingSystem;
  provider?: string;
  sshKeyId?: string;
  lastError?: string;
  createdAt: string;
};

export type SSHKey = {
  id: string;
  name: string;
  keyType: string;
  fingerprint: string;
  isDefault: boolean;
  createdAt: string;
};

export type AiProposal = {
  operation: 'create' | 'start' | 'stop' | 'delete' | 'none';
  instanceName: string;
  sshKeyName?: string;
  os?: OperatingSystem;
  message: string;
  instance: { id: string; name: string; state: InstanceState } | null;
};

export interface User {
  id: string;
  email: string;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, {
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

export const api = {
  // Auth
  login: (data: any) => request<User>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  register: (data: any) => request<User>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  logout: () => request<void>('/auth/logout', { method: 'POST' }),
  me: () => request<User>('/auth/me', { method: 'GET' })
};

export const instancesApi = {
  list: () => request<Instance[]>('/instances'),
  create: (values: { name: string; sshKeyId: string; os: OperatingSystem }) => request<Instance>('/instances', { method: 'POST', body: JSON.stringify(values) }),
  action: (id: string, action: 'start' | 'stop' | 'restart') => request<Instance>(`/instances/${id}/actions`, { method: 'POST', body: JSON.stringify({ action }) }),
  remove: (id: string) => request<void>(`/instances/${id}`, { method: 'DELETE' })
};

export const aiOperationsApi = {
  interpret: (message: string) => request<AiProposal>('/ai/operations/interpret', { method: 'POST', body: JSON.stringify({ message }) }),
  execute: (command: { operation: 'create'; name: string; sshKeyName?: string; os?: OperatingSystem } | { operation: 'start' | 'stop' | 'delete'; instanceId: string }) => request<Instance | void>('/ai/operations/execute', { method: 'POST', body: JSON.stringify(command) })
};

export const sshKeysApi = {
  list: () => request<SSHKey[]>('/ssh-keys'),
  create: (values: { name: string; publicKey: string }) => request<SSHKey>('/ssh-keys', { method: 'POST', body: JSON.stringify(values) }),
  remove: (id: string) => request<void>(`/ssh-keys/${id}`, { method: 'DELETE' }),
  setDefault: (id: string) => request<void>(`/ssh-keys/${id}/default`, { method: 'PATCH' })
};
