export interface Match {
  id: number;
  homeTeam: string;
  awayTeam: string;
  sport: string;
  startTime: string;
  status: 'scheduled' | 'live' | 'finished';
  homeScore: number;
  awayScore: number;
  createdAt: string;
  commentary?: CommentaryItem[];
}

export interface CommentaryItem {
  id: number;
  matchId: number;
  actor: string | null;
  message: string;
  minute: number | null;
  sequenceNo: number;
  details?: Record<string, any>;
  createdAt: string;
  isNew?: boolean;
}

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected';
