import { eq, asc, max } from 'drizzle-orm';
import { db, matches, commentary, type Commentary } from '../db/index';
import { broadcastMatchEvent } from '../websocket';

export class CommentaryService {
  static async getCommentaryByMatchId(matchId: number): Promise<Commentary[]> {
    return await db
      .select()
      .from(commentary)
      .where(eq(commentary.matchId, matchId))
      .orderBy(asc(commentary.sequenceNo));
  }

  static async addCommentary(
    matchId: number,
    data: { actor?: string | null; message: string; minute?: number | null; sequenceNo?: number; details?: Record<string, any> }
  ): Promise<Commentary | null> {
    // Check if match exists
    const [match] = await db.select().from(matches).where(eq(matches.id, matchId));
    if (!match) return null;

    let calculatedSequenceNo = data.sequenceNo;
    if (calculatedSequenceNo === undefined) {
      const [lastEvent] = await db
        .select({ maxSeq: max(commentary.sequenceNo) })
        .from(commentary)
        .where(eq(commentary.matchId, matchId));
      calculatedSequenceNo = (lastEvent?.maxSeq || 0) + 1;
    }

    const [newEvent] = await db
      .insert(commentary)
      .values({
        matchId,
        actor: data.actor || null,
        message: data.message,
        minute: data.minute !== undefined ? Number(data.minute) : null,
        sequenceNo: Number(calculatedSequenceNo),
        details: data.details || {},
      })
      .returning();

    // Broadcast real-time event to all connected WebSocket clients
    broadcastMatchEvent(matchId, 'COMMENTARY_ADDED', newEvent);

    return newEvent;
  }
}
