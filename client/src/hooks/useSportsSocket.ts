import { useEffect, useRef, useState, useCallback } from 'react';
import type { ConnectionStatus, Match, CommentaryItem } from '../types';

interface WebSocketMessage {
  type: 'CONNECTED' | 'SUBSCRIBED' | 'UNSUBSCRIBED' | 'SCORE_UPDATED' | 'COMMENTARY_ADDED' | 'MATCH_CREATED';
  matchId?: number;
  payload?: any;
  timestamp?: string;
  message?: string;
}

interface UseSportsSocketOptions {
  onScoreUpdated?: (updatedMatch: Match) => void;
  onCommentaryAdded?: (commentary: CommentaryItem) => void;
  onMatchCreated?: (newMatch: Match) => void;
  selectedMatchId?: number | null;
}

export function useSportsSocket({
  onScoreUpdated,
  onCommentaryAdded,
  onMatchCreated,
  selectedMatchId,
}: UseSportsSocketOptions) {
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const backoffRef = useRef<number>(1000);

  // Keep callback refs fresh
  const onScoreUpdatedRef = useRef(onScoreUpdated);
  const onCommentaryAddedRef = useRef(onCommentaryAdded);
  const onMatchCreatedRef = useRef(onMatchCreated);
  useEffect(() => {
    onScoreUpdatedRef.current = onScoreUpdated;
    onCommentaryAddedRef.current = onCommentaryAdded;
    onMatchCreatedRef.current = onMatchCreated;
  });

  const connect = useCallback(() => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    setStatus('connecting');

    // Use direct port 5000 where the ws server is running
    const host = window.location.hostname || 'localhost';
    const wsUrl = `ws://${host}:5000`;

    try {
      const socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        setStatus('connected');
        backoffRef.current = 1000; // Reset backoff

        // If a match is currently selected, subscribe
        if (selectedMatchId) {
          socket.send(JSON.stringify({ type: 'SUBSCRIBE', matchId: selectedMatchId }));
        }
      };

      socket.onmessage = (event) => {
        try {
          const data: WebSocketMessage = JSON.parse(event.data);

          if (data.type === 'SCORE_UPDATED' && data.payload) {
            onScoreUpdatedRef.current?.(data.payload as Match);
          } else if (data.type === 'COMMENTARY_ADDED' && data.payload) {
            onCommentaryAddedRef.current?.(data.payload as CommentaryItem);
          } else if (data.type === 'MATCH_CREATED' && data.payload) {
            onMatchCreatedRef.current?.(data.payload as Match);
          }
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      socket.onclose = () => {
        setStatus('disconnected');
        wsRef.current = null;
        // Exponential backoff reconnect
        const nextDelay = Math.min(backoffRef.current * 1.5, 8000);
        backoffRef.current = nextDelay;
        reconnectTimeoutRef.current = window.setTimeout(connect, nextDelay);
      };

      socket.onerror = (err) => {
        console.warn('WebSocket connection error:', err);
        socket.close();
      };
    } catch (e) {
      console.error('Error instantiating WebSocket:', e);
      setStatus('disconnected');
      reconnectTimeoutRef.current = window.setTimeout(connect, 3000);
    }
  }, [selectedMatchId]);

  // Handle match subscription changes
  useEffect(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && selectedMatchId) {
      wsRef.current.send(JSON.stringify({ type: 'SUBSCRIBE', matchId: selectedMatchId }));
    }
  }, [selectedMatchId]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  return {
    status,
    reconnect: connect,
  };
}
