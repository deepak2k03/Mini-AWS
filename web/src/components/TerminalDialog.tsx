import { useEffect, useRef } from 'react';
import { X, Terminal as TerminalIcon } from 'lucide-react';
import { Terminal } from 'xterm';
import { FitAddon } from '@xterm/addon-fit';
import 'xterm/css/xterm.css';
import type { Instance } from '../api';

export function TerminalDialog({ instance, onClose }: { instance: Instance | null; onClose: () => void }) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!instance || !container.current) return;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(`${protocol}//${window.location.host}/api/instances/${instance._id}/terminal`);
    const term = new Terminal({
      cursorBlink: true,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      fontSize: 14,
      theme: {
        background: '#020617', // slate-950
        foreground: '#f1f5f9', // slate-100
        cursor: '#06b6d4', // cyan-500
        selectionBackground: '#334155', // slate-700
      }
    });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(container.current);
    fit.fit();
    
    // Slight delay to ensure parent dimensions are computed before refitting
    const handleResize = () => setTimeout(() => fit.fit(), 50);
    window.addEventListener('resize', handleResize);
    
    term.onData(data => socket.send(data));
    socket.onmessage = event => {
      if (typeof event.data === 'string') {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'error') {
            term.write(`\r\n\x1b[31;1mError: ${msg.message}\x1b[0m\r\n`);
          }
        } catch {
          term.write(event.data);
        }
      } else {
        term.write(event.data);
      }
    };
    
    socket.onclose = () => term.write('\r\n\x1b[33mConnection closed.\x1b[0m\r\n');
    socket.onerror = () => term.write('\r\n\x1b[31;1mConnection error.\x1b[0m\r\n');
    
    return () => {
      window.removeEventListener('resize', handleResize);
      socket.close();
      term.dispose();
    };
  }, [instance]);

  if (!instance) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="terminal-title">
      <div className="flex h-[80vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-slate-700 bg-[#020617] shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-200">
        
        {/* Terminal Header */}
        <div className="flex flex-shrink-0 items-center justify-between border-b border-slate-800 bg-slate-900/80 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <TerminalIcon className="h-4 w-4 text-cyan-500" />
            <span id="terminal-title" className="font-medium text-slate-300">{instance.name}</span>
            <span className="text-slate-600">—</span>
            <span className="font-mono text-xs">{instance.ssh.username}@{instance.ssh.host}:{instance.ssh.hostPort}</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </span>
              <span className="text-xs font-medium text-emerald-500">Connected</span>
            </div>
            <button onClick={onClose} className="rounded p-1 text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-200">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        {/* Terminal Body */}
        <div className="relative flex-1 overflow-hidden p-4">
          <div ref={container} className="h-full w-full" />
        </div>
      </div>
    </div>
  );
}
