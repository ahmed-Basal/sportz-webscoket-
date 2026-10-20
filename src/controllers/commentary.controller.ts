import { CommentaryService } from '../services/index';
import { asyncHandler } from '../utils/async-handler';

// GET /api/matches/:id/commentary
export const getMatchCommentary = asyncHandler(async (req, res) => {
  const matchId = Number(req.params.id);
  const feed = await CommentaryService.getCommentaryByMatchId(matchId);
  res.json(feed);
});

// POST /api/matches/:id/commentary
export const addCommentary = asyncHandler(async (req, res) => {
  const matchId = Number(req.params.id);
  const newEvent = await CommentaryService.addCommentary(matchId, req.body);

  if (!newEvent) {
    res.status(404).json({ error: 'Match not found' });
    return;
  }

  res.status(201).json(newEvent);
});
