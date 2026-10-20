import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';

export interface ExtWebSocket extends WebSocket {
  subscriptions: Set<number>;
}

let wss: WebSocketServer | undefined;

export function initWebSocket(httpServer: Server): WebSocketServer {
  wss = new WebSocketServer({ server: httpServer });

  wss.on('connection', (socket: WebSocket) => {
    const ws = socket as ExtWebSocket;
    ws.subscriptions = new Set<number>();

    ws.on('message', (message: string | Buffer) => {
      try {
        const payload = JSON.parse(message.toString());
        if (payload.type === 'SUBSCRIBE' && payload.matchId) {
          ws.subscriptions.add(Number(payload.matchId));
          ws.send(JSON.stringify({ type: 'SUBSCRIBED', matchId: Number(payload.matchId) }));
        } else if (payload.type === 'UNSUBSCRIBE' && payload.matchId) {
          ws.subscriptions.delete(Number(payload.matchId));
          ws.send(JSON.stringify({ type: 'UNSUBSCRIBED', matchId: Number(payload.matchId) }));
        }
      } catch (err) {
        console.error('Invalid WS message:', err);
      }
    });

    ws.send(JSON.stringify({ type: 'CONNECTED', message: 'Connected to Sports Real-Time Stream' }));
  });

  return wss;
}

export function broadcastMatchEvent(matchId: number | string, eventType: string, payload: unknown): void {
  if (!wss) return;

  const message = JSON.stringify({
    type: eventType,
    matchId: Number(matchId),
    payload,
    timestamp: new Date().toISOString(),
  });

  wss.clients.forEach((client: WebSocket) => {
    const extWs = client as ExtWebSocket;
    if (extWs.readyState === WebSocket.OPEN) {
      if (!extWs.subscriptions || extWs.subscriptions.size === 0 || extWs.subscriptions.has(Number(matchId))) {
        extWs.send(message);
      }
    }
  });
}
