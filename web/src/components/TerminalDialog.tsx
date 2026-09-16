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
      <div className="flex h-[80vh] w-full max-w-5xl flex-col overflow-hidden rounded-[8px] border border-console-border bg-console-bg shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Terminal Header */}
        <div className="flex flex-shrink-0 items-center justify-between border-b border-console-border bg-console-elevated/80 px-4 py-3">
          <div className="flex items-center gap-2 text-[13px] text-console-secondary">
            <TerminalIcon className="h-4 w-4" />
            <span id="terminal-title" className="font-medium text-console-text">{instance.name}</span>
            <span className="text-console-muted">—</span>
            <span className="font-mono text-[11px] text-console-technical">{instance.privateIP}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded bg-console-bg px-2 py-1">
              <span className={`h-2 w-2 rounded-full ${isConnected ? 'bg-console-success shadow-[0_0_8px_rgba(34,197,94,0.4)]' : error ? 'bg-console-error' : 'bg-console-warning'}`}></span>
              <span className="text-[11px] font-medium text-console-secondary">
                {isConnected ? 'Connected' : error ? 'Disconnected' : 'Connecting...'}
              </span>
            </div>
            <button onClick={onClose} className="rounded p-1 text-console-muted transition-colors hover:bg-console-hover hover:text-console-text">
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
