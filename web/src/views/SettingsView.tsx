import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sshKeysApi } from '../api';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Key, Trash2, Plus, CheckCircle2, Shield } from 'lucide-react';
import { format } from 'date-fns';

export function SettingsView() {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [publicKey, setPublicKey] = useState('');

  const keysQuery = useQuery({
    queryKey: ['ssh-keys'],
    queryFn: sshKeysApi.list
  });

  const addMutation = useMutation({
    mutationFn: sshKeysApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ssh-keys'] });
      setIsAdding(false);
      setName('');
      setPublicKey('');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: sshKeysApi.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ssh-keys'] })
  });

  const setDefaultMutation = useMutation({
    mutationFn: sshKeysApi.setDefault,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ssh-keys'] })
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    addMutation.mutate({ name, publicKey });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl">
      <div>
        <h2 className="text-[20px] font-bold tracking-tight text-console-text">Settings</h2>
        <p className="mt-1 text-[13px] text-console-secondary">Manage your account preferences and security keys.</p>
      </div>

      <Card className="border border-console-border bg-console-card">
        <CardHeader className="flex flex-row items-center justify-between pb-4 pt-5 px-6 border-b border-console-border">
          <div>
            <CardTitle className="text-[16px] font-semibold text-white flex items-center gap-2">
              <Key className="h-4 w-4 text-console-brand" /> SSH Keys
            </CardTitle>
            <p className="mt-1 text-[12px] text-console-secondary">
              SSH keys allow you to securely connect to your instances. The default key is used automatically by AI Operations.
            </p>
          </div>
          {!isAdding && (
            <Button variant="primary" size="sm" onClick={() => setIsAdding(true)} className="gap-2">
              <Plus className="h-4 w-4" /> Add Key
            </Button>
          )}
        </CardHeader>
        
        <CardContent className="p-0">
          {isAdding && (
            <div className="p-6 border-b border-console-border bg-console-elevated/20">
              <form onSubmit={handleAdd} className="space-y-4 max-w-2xl">
                <h3 className="text-[14px] font-medium text-white mb-2">Add New SSH Key</h3>
                
                <div>
                  <label className="text-[12px] font-medium text-console-text">Key Name</label>
                  <input 
                    required 
                    maxLength={64} 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    placeholder="e.g. My Laptop"
                    className="mt-1.5 w-full rounded border border-console-border bg-console-bg py-2 px-3 text-[13px] text-console-text placeholder:text-console-muted focus:border-console-brand focus:outline-none focus:ring-1 focus:ring-console-brand transition-all"
                  />
                </div>
                
                <div>
                  <label className="text-[12px] font-medium text-console-text">Public Key</label>
                  <textarea 
                    required 
                    value={publicKey} 
                    onChange={e => setPublicKey(e.target.value)} 
                    placeholder="ssh-ed25519 AAAA..." 
                    rows={4}
                    className="mt-1.5 w-full rounded border border-console-border bg-console-bg py-2 px-3 font-mono text-[12px] text-console-technical placeholder:text-console-muted focus:border-console-brand focus:outline-none focus:ring-1 focus:ring-console-brand transition-all"
                  />
                </div>

                {addMutation.error && (
                  <div className="rounded border border-console-error/20 bg-console-error/10 p-3 text-[13px] text-console-error">
                    {addMutation.error.message}
                  </div>
                )}
                
                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setIsAdding(false)}>Cancel</Button>
                  <Button type="submit" variant="primary" size="sm" disabled={addMutation.isPending}>
                    {addMutation.isPending ? 'Adding...' : 'Add Key'}
                  </Button>
                </div>
              </form>
            </div>
          )}

          <div className="divide-y divide-console-border">
            {keysQuery.isLoading ? (
              <div className="p-8 text-center text-[13px] text-console-muted">Loading SSH keys...</div>
            ) : keysQuery.data?.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-console-elevated text-console-muted">
                  <Shield className="h-6 w-6" />
                </div>
                <h3 className="text-[14px] font-medium text-console-text">No SSH keys configured</h3>
                <p className="mt-1 text-[13px] text-console-secondary max-w-sm">
                  Add an SSH public key to enable secure access to your instances.
                </p>
                {!isAdding && (
                  <Button variant="outline" className="mt-4" onClick={() => setIsAdding(true)}>
                    Add SSH Key
                  </Button>
                )}
              </div>
            ) : (
              keysQuery.data?.map(key => (
                <div key={key.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors hover:bg-console-hover">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-[14px] font-medium text-white">{key.name}</h4>
                      {key.isDefault && (
                        <span className="inline-flex items-center gap-1 rounded bg-console-success/10 px-1.5 py-0.5 text-[10px] font-medium uppercase text-console-success border border-console-success/20">
                          <CheckCircle2 className="h-3 w-3" /> Default
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-[12px] text-console-secondary">
                      <span className="font-mono text-console-technical">{key.keyType}</span>
                      <span>•</span>
                      <span className="font-mono text-console-technical">{key.fingerprint}</span>
                      <span>•</span>
                      <span>Added {format(new Date(key.createdAt), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {!key.isDefault && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setDefaultMutation.mutate(key.id)}
                        disabled={setDefaultMutation.isPending}
                        className="text-[12px]"
                      >
                        Set Default
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => { if (window.confirm('Delete this SSH key? It will not affect existing instances.')) deleteMutation.mutate(key.id); }}
                      disabled={deleteMutation.isPending}
                      className="text-console-muted hover:text-console-error hover:bg-console-error/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
