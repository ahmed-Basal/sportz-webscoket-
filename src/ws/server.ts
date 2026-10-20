import { WebSocket, WebSocketServer } from 'ws';
import type { Server } from 'http';

/**
 * Sends a JSON payload to a single WebSocket client if the connection is open.
 */
export function sendJson(socket: WebSocket, payload: unknown): void {
  if (socket.readyState !== WebSocket.OPEN) return;

  socket.send(JSON.stringify(payload));
}

/**
 * Broadcasts a JSON payload to all connected clients on the WebSocket server.
 */
export function broadcast(wss: WebSocketServer, payload: unknown): void {
  for (const client of wss.clients) {
    if (client.readyState !== WebSocket.OPEN) continue;

    client.send(JSON.stringify(payload));
  }
}

/**
 * Attaches the WebSocket server to the given HTTP server instance.
 */
export function attachWebSocketServer(server: Server) {
  const wss = new WebSocketServer({ server, path: '/ws', maxPayload: 1024 * 1024 });

  wss.on('connection', (socket: WebSocket) => {
    sendJson(socket, { type: 'welcome' });

    socket.on('error', console.error);
  });

  function broadcastMatchCreated(match: unknown) {
    broadcast(wss, { type: 'match_created', data: match });
  }

  return { broadcastMatchCreated, wss };
}
 