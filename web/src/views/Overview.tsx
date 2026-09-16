import { Server, CheckCircle2, XCircle, AlertCircle, Play } from 'lucide-react';
import type { Instance } from '../api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

interface OverviewProps {
  instances: Instance[];
  isLoading: boolean;
  onNavigate: (view: 'instances' | 'ai') => void;
}

export function Overview({ instances, isLoading, onNavigate }: OverviewProps) {
  const total = instances.length;
  const running = instances.filter(i => i.state === 'running').length;
  const stopped = instances.filter(i => i.state === 'stopped').length;
  const errors = instances.filter(i => i.state === 'error').length;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Cloud infrastructure, simplified.</h2>
          <p className="mt-2 text-slate-400">Provision and manage isolated SSH-enabled compute instances from one place.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => onNavigate('ai')}>Ask AI</Button>
          <Button variant="primary" onClick={() => onNavigate('instances')}>View Instances</Button>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Total Instances" value={total} icon={Server} loading={isLoading} />
        <MetricCard title="Running" value={running} icon={Play} valueColor="text-emerald-400" loading={isLoading} />
        <MetricCard title="Stopped" value={stopped} icon={CheckCircle2} valueColor="text-slate-400" loading={isLoading} />
        <MetricCard title="Errors" value={errors} icon={AlertCircle} valueColor="text-red-400" loading={isLoading} />
      </div>

      <section className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Architecture</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center space-y-4 py-8">
              <div className="rounded-lg border border-slate-700 bg-slate-800 px-6 py-3 font-medium text-slate-200 shadow-sm">Mini-AWS Console</div>
              <div className="h-6 w-px bg-slate-600"></div>
              <div className="rounded-lg border border-cyan-800 bg-cyan-950/30 px-6 py-3 font-medium text-cyan-400 shadow-sm">API Gateway</div>
              <div className="h-6 w-px bg-slate-600"></div>
              <div className="rounded-lg border border-indigo-800 bg-indigo-950/30 px-6 py-3 font-medium text-indigo-400 shadow-sm">Docker Engine</div>
              <div className="flex w-full max-w-[200px] justify-between border-t border-slate-600 pt-4 mt-2">
                <div className="rounded border border-slate-700 bg-slate-800 px-3 py-1 text-xs text-slate-300">Container</div>
                <div className="rounded border border-slate-700 bg-slate-800 px-3 py-1 text-xs text-slate-300">Container</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {instances.length === 0 ? (
              <div className="flex h-40 flex-col items-center justify-center text-slate-500">
                <p>No recent activity</p>
              </div>
            ) : (
              <div className="space-y-4">
                {instances.slice(0, 5).map(instance => (
                  <div key={instance._id} className="flex items-center gap-4 border-b border-slate-800/50 pb-4 last:border-0 last:pb-0">
                    <div className={`h-2 w-2 rounded-full ${instance.state === 'running' ? 'bg-emerald-500' : instance.state === 'error' ? 'bg-red-500' : 'bg-slate-500'}`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-200">{instance.name}</p>
                      <p className="text-xs text-slate-500">State changed to {instance.state}</p>
                    </div>
                    <span className="text-xs text-slate-500">
                      {new Date(instance.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function MetricCard({ title, value, icon: Icon, valueColor = "text-slate-100", loading }: any) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-slate-400">{title}</p>
          <Icon className="h-4 w-4 text-slate-500" />
        </div>
        {loading ? (
          <div className="mt-2 h-8 w-16 animate-pulse rounded bg-slate-800" />
        ) : (
          <p className={`mt-2 text-3xl font-bold ${valueColor}`}>{value}</p>
        )}
      </CardContent>
    </Card>
  );
}
