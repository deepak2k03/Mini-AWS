import { Server, CheckCircle2, XCircle, AlertCircle, Play, Globe, Activity, ArrowRight } from 'lucide-react';
import type { Instance } from '../api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { formatDistanceToNow } from 'date-fns';

interface OverviewProps {
  instances: Instance[];
  isLoading: boolean;
  onNavigate: (view: 'instances' | 'ai' | 'network') => void;
}

export function Overview({ instances, isLoading, onNavigate }: OverviewProps) {
  const total = instances.length;
  const running = instances.filter(i => i.state === 'running').length;
  const stopped = instances.filter(i => i.state === 'stopped').length;
  const errors = instances.filter(i => i.state === 'error').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between pb-2">
        <div>
          <h2 className="text-[24px] font-bold tracking-tight text-white">Cloud infrastructure, simplified.</h2>
          <p className="mt-1 text-[14px] text-console-secondary">Provision and manage isolated SSH-enabled compute instances from one place.</p>
        </div>
        <div className="flex items-center gap-6">
          <button 
            onClick={() => onNavigate('ai')} 
            className="text-[13px] font-semibold text-[#A78BFA] hover:text-[#C4B5FD] transition-colors"
          >
            Ask AI
          </button>
          <button 
            onClick={() => onNavigate('instances')} 
            className="rounded border border-console-border text-[13px] font-medium text-console-text px-4 py-1.5 hover:bg-white hover:text-black transition-colors"
          >
            View Instances
          </button>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Total Instances" value={total} subtitle="Provisioned" icon={Server} loading={isLoading} />
        <MetricCard title="Running" value={running} subtitle="Currently active" icon={Play} loading={isLoading} />
        <MetricCard title="Stopped" value={stopped} subtitle="Halted" icon={CheckCircle2} loading={isLoading} />
        <MetricCard title="Errors" value={errors} subtitle="Requires attention" icon={AlertCircle} loading={isLoading} />
      </div>

      <section className="grid gap-4 md:grid-cols-2">
        <Card className="flex flex-col border border-console-border bg-console-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-5 px-5">
            <CardTitle className="text-[15px] font-semibold text-white flex items-center gap-2">
              <Globe className="h-4 w-4" /> Infrastructure
            </CardTitle>
            <button 
              onClick={() => onNavigate('network')} 
              className="text-[12px] font-medium text-white flex items-center gap-1 hover:underline"
            >
              View Network <ArrowRight className="h-3 w-3" />
            </button>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-3 flex-1">
            <div className="rounded-lg border border-console-border bg-transparent p-4 h-full flex flex-col justify-between">
              <div>
                <div className="mb-6">
                  <h4 className="text-[14px] font-semibold text-white">mini-aws-network</h4>
                  <p className="text-[12px] text-console-secondary mt-0.5">Private bridge network</p>
                </div>
                
                {isLoading ? (
                  <div className="space-y-2">
                    {[1,2].map(i => <div key={i} className="h-8 w-full animate-pulse rounded bg-console-elevated"></div>)}
                  </div>
                ) : instances.length === 0 ? (
                  <p className="text-[12px] text-white">No instances connected.</p>
                ) : (
                  <div className="space-y-2 mt-2">
                    {instances.map(instance => (
                      <div key={instance._id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-[13px] font-medium text-white">{instance.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="mt-8 pt-3 border-t border-console-border text-[12px] text-console-secondary">
                <span>{total} instances · {running} running · {stopped} stopped</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="flex flex-col border border-console-border bg-console-card">
          <CardHeader className="pb-2 pt-5 px-5">
            <CardTitle className="text-[15px] font-semibold text-white flex items-center gap-2">
              <Activity className="h-4 w-4" /> Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-3 flex-1 flex flex-col justify-center items-center">
            {instances.length === 0 ? (
              <div className="text-center w-full">
                <p className="text-[13px] font-medium text-white">No recent activity</p>
                <p className="text-[12px] text-console-secondary mt-1">Instance lifecycle events will appear here.</p>
              </div>
            ) : (
              <div className="w-full space-y-4">
                {instances.slice(0, 5).map((instance) => (
                  <div key={instance._id} className="flex gap-4 relative py-1">
                    <div className="flex-1">
                      <p className="text-[13px] text-white">
                        <span className="font-medium">{instance.name}</span> is now <span>{instance.state}</span>
                      </p>
                      <span className="text-[11px] text-console-secondary">
                        {formatDistanceToNow(new Date(instance.createdAt), { addSuffix: true })}
                      </span>
                    </div>
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

function MetricCard({ title, value, subtitle, icon: Icon, loading }: any) {
  return (
    <Card className="border border-console-border bg-console-card p-5 flex flex-col justify-between">
      <div className="flex items-center gap-2 mb-6">
        <Icon className="h-4 w-4 text-white" />
        <p className="text-[13px] font-medium text-white">{title}</p>
      </div>
      {loading ? (
        <div className="h-8 w-16 animate-pulse rounded bg-console-elevated" />
      ) : (
        <div className="flex items-baseline gap-2">
          <p className="text-[24px] font-bold leading-none text-white">{value}</p>
          {subtitle && <p className="text-[11px] text-white font-medium">{subtitle}</p>}
        </div>
      )}
    </Card>
  );
}
