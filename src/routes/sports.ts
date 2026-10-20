import express from 'express';
import {
  listMatches,
  getMatchById,
  createMatch,
  updateMatch,
  seedDemoMatch,
  getMatchCommentary,
  addCommentary,
} from '../controllers/index';
import { insertMatchSchema, updateMatchSchema, insertCommentarySchema } from '../db/index';
import { validateBody } from '../middleware/validate';

const router = express.Router();

// -------------------------------------------------------------
// MATCHES ENDPOINTS (Static Anchor)
// -------------------------------------------------------------
router.get('/matches', listMatches);
router.get('/matches/:id', getMatchById);
router.post('/matches', validateBody(insertMatchSchema), createMatch);
router.patch('/matches/:id', validateBody(updateMatchSchema), updateMatch);

// -------------------------------------------------------------
// COMMENTARY ENDPOINTS (Dynamic / Fast Events)
// -------------------------------------------------------------
router.get('/matches/:id/commentary', getMatchCommentary);
router.post(
  '/matches/:id/commentary',
  validateBody(insertCommentarySchema.omit({ matchId: true })),
  addCommentary
);

// -------------------------------------------------------------
// SEED ENDPOINT
// -------------------------------------------------------------
router.post('/seed', seedDemoMatch);

export default router;
