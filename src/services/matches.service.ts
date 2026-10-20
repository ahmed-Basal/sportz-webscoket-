import { eq, desc } from 'drizzle-orm';
import { db, matches, type Match, type NewMatch } from '../db/index';
import { broadcastMatchEvent } from '../websocket';

export class MatchesService {
  static async getAllMatches(status?: string): Promise<Match[]> {
    const query = db.select().from(matches).$dynamic();

    if (status && typeof status === 'string') {
      query.where(eq(matches.status, status.toLowerCase() as any));
    }

    return await query.orderBy(desc(matches.startTime));
  }

  static async getMatchById(matchId: number) {
    return await db.query.matches.findFirst({
      where: eq(matches.id, matchId),
      with: {
        commentary: {
          orderBy: (c, { asc }) => [asc(c.sequenceNo)],
        },
      },
    });
  }

  static async createMatch(data: NewMatch): Promise<Match> {
    const [newMatch] = await db
      .insert(matches)
      .values({
        homeTeam: data.homeTeam,
        awayTeam: data.awayTeam,
        sport: data.sport,
        startTime: new Date(data.startTime),
        status: (data.status ? String(data.status).toLowerCase() : 'scheduled') as any,
        homeScore: data.homeScore !== undefined ? Number(data.homeScore) : 0,
        awayScore: data.awayScore !== undefined ? Number(data.awayScore) : 0,
      })
      .returning();

    // Broadcast creation via WebSocket
    broadcastMatchEvent(newMatch.id, 'MATCH_CREATED', newMatch);

    return newMatch;
  }

  static async updateMatch(
    matchId: number,
    updates: { status?: string; homeScore?: number; awayScore?: number }
  ): Promise<Match | null> {
    const updateFields: Record<string, any> = {};
    if (updates.status !== undefined) updateFields.status = updates.status.toLowerCase();
    if (updates.homeScore !== undefined) updateFields.homeScore = Number(updates.homeScore);
    if (updates.awayScore !== undefined) updateFields.awayScore = Number(updates.awayScore);

    const [updatedMatch] = await db
      .update(matches)
      .set(updateFields)
      .where(eq(matches.id, matchId))
      .returning();

    if (!updatedMatch) return null;

    // Broadcast update via WebSocket
    broadcastMatchEvent(matchId, 'SCORE_UPDATED', updatedMatch);

    return updatedMatch;
  }
}
