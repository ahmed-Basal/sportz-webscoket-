import type { Match, CommentaryItem } from '../types';

const API_BASE = '/api';

export const api = {
  async getMatches(status?: string): Promise<Match[]> {
    const url = status && status !== 'all' ? `${API_BASE}/matches?status=${status}` : `${API_BASE}/matches`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch matches');
    return res.json();
  },

  async getMatchById(id: number): Promise<Match> {
    const res = await fetch(`${API_BASE}/matches/${id}`);
    if (!res.ok) throw new Error('Failed to fetch match');
    return res.json();
  },

  async getMatchCommentary(matchId: number): Promise<CommentaryItem[]> {
    const res = await fetch(`${API_BASE}/matches/${matchId}/commentary`);
    if (!res.ok) throw new Error('Failed to fetch commentary');
    return res.json();
  },

  async updateMatch(
    matchId: number,
    data: { homeScore?: number; awayScore?: number; status?: 'scheduled' | 'live' | 'finished' }
  ): Promise<Match> {
    const res = await fetch(`${API_BASE}/matches/${matchId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update match');
    return res.json();
  },

  async addCommentary(
    matchId: number,
    data: { actor?: string; message: string; minute?: number; details?: Record<string, any> }
  ): Promise<CommentaryItem> {
    const res = await fetch(`${API_BASE}/matches/${matchId}/commentary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to add commentary');
    return res.json();
  },

  async createMatch(data: {
    homeTeam: string;
    awayTeam: string;
    sport: string;
    startTime: string;
    status?: 'scheduled' | 'live' | 'finished';
    homeScore?: number;
    awayScore?: number;
  }): Promise<Match> {
    const res = await fetch(`${API_BASE}/matches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create match');
    return res.json();
  },

  async seedDemo(): Promise<{ message: string; matches: Match[]; eventsCount: number }> {
    const res = await fetch(`${API_BASE}/seed`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to seed demo data');
    return res.json();
  },
};
