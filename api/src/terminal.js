import { WebSocketServer } from 'ws';
import { Client } from 'ssh2';
import fs from 'node:fs/promises';
import { Instance } from './models/Instance.js';
import { internalSshCredentials } from './services/networkingService.js';
import { config } from './config.js';
import { URL } from 'node:url';
import jwt from 'jsonwebtoken';

export function setupTerminal(server) {
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    try {
      const url = new URL(request.url, `http://${request.headers.host}`);
      const match = url.pathname.match(/^\/api\/instances\/([0-9a-fA-F]{24})\/terminal$/);
      if (!match) {
        // Not a terminal request, let other handlers process it (if any)
        return; // Don't destroy the socket, just return
      }

      const cookieHeader = request.headers.cookie || '';
      const cookies = Object.fromEntries(cookieHeader.split('; ').map(c => c.split('=')));
      const token = cookies.token;
      
      if (!token) {
        return socket.destroy();
      }
      
      let userId;
      try {
        const payload = jwt.verify(token, config.JWT_SECRET);
        userId = payload.userId;
      } catch (err) {
        return socket.destroy();
      }

      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request, match[1], userId);
      });
    } catch (e) {
      socket.destroy();
    }
  });

  wss.on('connection', async (ws, request, instanceId, userId) => {
    let sshConn = null;
    let stream = null;

    const cleanup = () => {
      if (stream) { stream.end(); stream = null; }
      if (sshConn) { sshConn.end(); sshConn = null; }
      if (ws.readyState === ws.OPEN) { ws.close(); }
    };

    ws.on('close', cleanup);
    ws.on('error', cleanup);

    try {
      const instance = await Instance.findOne({ _id: instanceId, ownerId: userId, state: 'running' });
      if (!instance || !instance.ssh || !instance.ssh.hostPort) {
        ws.send(JSON.stringify({ type: 'error', data: '\r\nInstance not found or not running.\r\n' }));
        return ws.close();
      }

      const internalSsh = await internalSshCredentials();
      const privateKey = await fs.readFile(internalSsh.privateKey);

      sshConn = new Client();
      sshConn.on('ready', () => {
        sshConn.shell({ term: 'xterm-256color' }, (err, shellStream) => {
          if (err) {
            ws.send(JSON.stringify({ type: 'error', data: `\r\nFailed to start shell: ${err.message}\r\n` }));
            return cleanup();
          }
          stream = shellStream;

          stream.on('data', (data) => {
            if (ws.readyState === ws.OPEN) {
              ws.send(JSON.stringify({ type: 'data', data: data.toString('utf8') }));
            }
          });

          stream.on('close', () => {
            if (ws.readyState === ws.OPEN) {
              ws.send(JSON.stringify({ type: 'data', data: '\r\nConnection closed.\r\n' }));
            }
            cleanup();
          });
        });
      }).on('error', (err) => {
        console.error('SSH connection error:', err);
        if (ws.readyState === ws.OPEN) {
          ws.send(JSON.stringify({ type: 'error', data: `\r\nSSH Error: ${err.message || String(err)}\r\n` }));
        }
        cleanup();
      }).on('end', () => {
        cleanup();
      }).connect({
        host: config.SSH_PUBLIC_HOST, // Use the public host address, e.g. localhost
        port: instance.ssh.hostPort,
        username: instance.ssh.username,
        privateKey: privateKey,
        keepaliveInterval: 10000
      });

      ws.on('message', (message) => {
        try {
          const msg = JSON.parse(message.toString('utf8'));
          if (msg.type === 'data' && stream) {
            stream.write(msg.data);
          } else if (msg.type === 'resize' && stream) {
            stream.setWindow(msg.rows, msg.cols, msg.height || 0, msg.width || 0);
          }
        } catch (e) {
          console.error('Invalid WS message:', e);
        }
      });
    } catch (e) {
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({ type: 'error', data: `\r\nInternal error: ${e.message}\r\n` }));
        ws.close();
      }
    }
  });
}
