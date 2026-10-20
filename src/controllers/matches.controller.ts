import { MatchesService } from '../services/index';
import { asyncHandler } from '../utils/async-handler';
import { db, matches, commentary } from '../db/index';
import { broadcastMatchEvent } from '../websocket';

// GET /api/matches
export const listMatches = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const result = await MatchesService.getAllMatches(status as string);
  res.json(result);
});

// GET /api/matches/:id
export const getMatchById = asyncHandler(async (req, res) => {
  const matchId = Number(req.params.id);
  const match = await MatchesService.getMatchById(matchId);

  if (!match) {
    res.status(404).json({ error: 'Match not found' });
    return;
  }

  res.json(match);
});

// POST /api/matches
export const createMatch = asyncHandler(async (req, res) => {
  const newMatch = await MatchesService.createMatch(req.body);
  res.status(201).json(newMatch);
});

// PATCH /api/matches/:id
export const updateMatch = asyncHandler(async (req, res) => {
  const matchId = Number(req.params.id);
  const updatedMatch = await MatchesService.updateMatch(matchId, req.body);

  if (!updatedMatch) {
    res.status(404).json({ error: 'Match not found' });
    return;
  }

  res.json(updatedMatch);
});

// POST /api/seed
export const seedDemoMatch = asyncHandler(async (_req, res) => {
  const matchesToInsert = [
    {
      homeTeam: 'Desert Falcons',
      awayTeam: 'Highland Kings',
      sport: 'Cricket',
      startTime: new Date(),
      status: 'live' as const,
      homeScore: 0,
      awayScore: 0,
    },
    {
      homeTeam: 'Aurora XI',
      awayTeam: 'Coastal Strikers',
      sport: 'Cricket',
      startTime: new Date(),
      status: 'live' as const,
      homeScore: 1,
      awayScore: 0,
    },
    {
      homeTeam: 'Rivergate Rovers',
      awayTeam: 'Summit Borough',
      sport: 'Football',
      startTime: new Date(),
      status: 'live' as const,
      homeScore: 1,
      awayScore: 1,
    },
    {
      homeTeam: 'Harbor City FC',
      awayTeam: 'Metro United',
      sport: 'Football',
      startTime: new Date(),
      status: 'live' as const,
      homeScore: 1,
      awayScore: 1,
    },
  ];

  const insertedMatches = await db.insert(matches).values(matchesToInsert).returning();

  for (const m of insertedMatches) {
    broadcastMatchEvent(m.id, 'MATCH_CREATED', m);
  }

  // Seed sample commentary for the first match
  const firstMatch = insertedMatches[0];
  const sampleEvents = [
    {
      matchId: firstMatch.id,
      actor: 'Umpire',
      message: 'Match underway at the Grand Arena! Falcons won the toss and elected to bat.',
      minute: 1,
      sequenceNo: 1,
      details: { eventType: 'toss', decision: 'bat' },
    },
    {
      matchId: firstMatch.id,
      actor: 'Rashid Khan',
      message: 'Huge appeal for LBW! Turned down by the umpire.',
      minute: 4,
      sequenceNo: 2,
      details: { eventType: 'appeal', bowler: 'Rashid Khan' },
    },
    {
      matchId: firstMatch.id,
      actor: 'Zain Malik',
      message: 'FOUR! Beautiful cover drive off the front foot.',
      minute: 7,
      sequenceNo: 3,
      details: { eventType: 'boundary', runs: 4 },
    },
  ];

  const insertedEvents = await db.insert(commentary).values(sampleEvents).returning();
  for (const event of insertedEvents) {
    broadcastMatchEvent(firstMatch.id, 'COMMENTARY_ADDED', event);
  }

  res.json({
    message: 'Demo matches and commentary seeded successfully!',
    matches: insertedMatches,
    eventsCount: insertedEvents.length,
  });
});
