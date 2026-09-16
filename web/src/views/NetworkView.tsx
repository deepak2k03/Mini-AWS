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
        <h2 className="text-2xl font-bold tracking-tight">Virtual Private Cloud</h2>
        <p className="mt-1 text-sm text-slate-400">View your isolated Docker bridge networks and connected instances.</p>
      </div>

      <Card className="border-cyan-900/30 bg-cyan-950/10 overflow-hidden">
        <CardHeader className="border-b border-cyan-900/30 bg-cyan-950/20">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-900/50 text-cyan-400">
              <Network className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-cyan-100">{networkName}</CardTitle>
              <p className="text-xs text-cyan-500/70">Docker Bridge Network</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-12 pb-16 overflow-x-auto">
          <div className="min-w-[600px] flex flex-col items-center">
            {/* Router/Switch representation */}
            <div className="flex h-16 w-32 items-center justify-center rounded-lg border-2 border-cyan-800 bg-slate-900 shadow-[0_0_20px_rgba(6,182,212,0.15)] z-10">
              <span className="font-mono text-sm font-semibold text-cyan-400">vSwitch</span>
            </div>
            
            {/* Trunk line */}
            <div className="h-12 w-0.5 bg-cyan-800/80 shadow-[0_0_5px_rgba(6,182,212,0.5)]"></div>
            <div className="h-0.5 w-full max-w-3xl bg-cyan-800/80 shadow-[0_0_5px_rgba(6,182,212,0.5)]"></div>
            
            {/* Instances connections */}
            {isLoading ? (
              <p className="mt-12 text-sm text-slate-500">Loading topology...</p>
            ) : networkedInstances.length === 0 ? (
              <p className="mt-12 text-sm text-slate-500">No instances connected to this network.</p>
            ) : (
              <div className="mt-0 flex w-full max-w-3xl justify-around px-8">
                {networkedInstances.map((instance) => (
                  <div key={instance._id} className="flex flex-col items-center">
                    <div className="h-12 w-0.5 bg-cyan-800/80 shadow-[0_0_5px_rgba(6,182,212,0.5)]"></div>
                    <div className="flex w-36 flex-col items-center rounded-xl border border-slate-700 bg-slate-800 p-4 text-center shadow-lg transition-transform hover:-translate-y-1 hover:border-cyan-700 hover:shadow-[0_0_15px_rgba(6,182,212,0.15)] cursor-default">
                      <div className="mb-3 rounded-full bg-slate-700/50 p-2">
                        <Server className="h-6 w-6 text-slate-300" />
                      </div>
                      <p className="w-full truncate text-sm font-medium text-slate-200" title={instance.name}>{instance.name}</p>
                      <code className="mt-1.5 rounded bg-slate-950 px-2 py-1 font-mono text-[10px] text-cyan-300 border border-slate-700/50">
                        {instance.privateIP}
                      </code>
                      <div className="mt-3">
                        <Badge variant={instance.state === 'running' ? 'success' : 'default'} className="scale-90">
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
