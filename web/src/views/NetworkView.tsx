import { Network, Server } from 'lucide-react';
import type { Instance } from '../api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

export function NetworkView({ instances, isLoading }: { instances: Instance[], isLoading: boolean }) {
  const networkName = instances.find(i => i.networkName)?.networkName || 'mini-aws-network';
  const networkedInstances = instances.filter(i => i.privateIP);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-[20px] font-bold tracking-tight text-console-text">Virtual Private Cloud</h2>
        <p className="mt-1 text-[13px] text-console-secondary">View your isolated Docker bridge networks and connected instances.</p>
      </div>

      <Card className="border-console-brand/20 bg-console-card overflow-hidden">
        <CardHeader className="border-b border-console-brand/10 bg-console-elevated/50 p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded bg-console-brandSubtle text-console-brand">
              <Network className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-console-text text-[15px]">{networkName}</CardTitle>
              <p className="text-[12px] text-console-secondary mt-0.5">Docker Bridge Network</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-12 pb-16 overflow-x-auto bg-console-bg">
          <div className="min-w-[600px] flex flex-col items-center">
            {/* Router/Switch representation */}
            <div className="flex h-12 w-28 items-center justify-center rounded border border-console-brand/30 bg-console-elevated shadow-[0_0_15px_rgba(34,211,238,0.1)] z-10">
              <span className="font-mono text-[12px] font-medium text-console-brand">vSwitch</span>
            </div>
            
            {/* Trunk line */}
            <div className="h-10 w-px bg-console-brand/30 shadow-[0_0_8px_rgba(34,211,238,0.2)]"></div>
            <div className="h-px w-full max-w-3xl bg-console-brand/30 shadow-[0_0_8px_rgba(34,211,238,0.2)]"></div>
            
            {/* Instances connections */}
            {isLoading ? (
              <p className="mt-12 text-[13px] text-console-muted">Loading topology...</p>
            ) : networkedInstances.length === 0 ? (
              <p className="mt-12 text-[13px] text-console-muted">No instances connected to this network.</p>
            ) : (
              <div className="mt-0 flex w-full max-w-3xl justify-around px-8">
                {networkedInstances.map((instance) => (
                  <div key={instance._id} className="flex flex-col items-center">
                    <div className="h-10 w-px bg-console-brand/30 shadow-[0_0_8px_rgba(34,211,238,0.2)]"></div>
                    <div className="flex w-32 flex-col items-center rounded border border-console-border bg-console-card p-4 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:border-console-brand/50 cursor-default group">
                      <div className="mb-3 rounded bg-console-elevated p-2 border border-console-border group-hover:border-console-brand/30 transition-colors">
                        <Server className="h-5 w-5 text-console-secondary group-hover:text-console-text transition-colors" />
                      </div>
                      <p className="w-full truncate text-[12px] font-medium text-console-text" title={instance.name}>{instance.name}</p>
                      <code className="mt-1.5 rounded bg-console-bg px-2 py-0.5 font-mono text-[11px] text-console-technical border border-console-border">
                        {instance.privateIP}
                      </code>
                      <div className="mt-3">
                        <Badge variant={instance.state === 'running' ? 'success' : 'default'}>
                          {instance.state}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
