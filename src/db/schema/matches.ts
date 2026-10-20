import { pgTable, serial, text, integer, timestamp, index, pgEnum } from 'drizzle-orm/pg-core';
import { relations, type InferSelectModel, type InferInsertModel } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod';
import { z } from 'zod';
import { commentary } from './commentary';
import { MATCH_STATUS } from '../../utils/match-status';

// Native PostgreSQL Enum for Match Lifecycle Status
export const matchStatusEnum = pgEnum('match_status', ['scheduled', 'live', 'finished']);

export { MATCH_STATUS };

// ----------------------------------------------------------------------------
// MATCH TABLE (Static Anchor)
// ----------------------------------------------------------------------------
export const matches = pgTable(
  'matches',
  {
    id: serial('id').primaryKey(),
    homeTeam: text('home_team').notNull(),
    awayTeam: text('away_team').notNull(),
    sport: text('sport').notNull(),
    startTime: timestamp('start_time', { mode: 'date' }).notNull(),
    status: matchStatusEnum('status').default('scheduled').notNull(),
    homeScore: integer('home_score').default(0).notNull(),
    awayScore: integer('away_score').default(0).notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => [
    index('matches_status_idx').on(table.status),
    index('matches_sport_idx').on(table.sport),
    index('matches_start_time_idx').on(table.startTime),
  ]
);

// Match Relations
export const matchesRelations = relations(matches, ({ many }) => ({
  commentary: many(commentary),
}));

// TypeScript Model Types
export type Match = InferSelectModel<typeof matches>;
export type NewMatch = InferInsertModel<typeof matches>;

// ----------------------------------------------------------------------------
// ZOD VALIDATION SCHEMAS
// ----------------------------------------------------------------------------
export const insertMatchSchema = createInsertSchema(matches, {
  homeTeam: (s) => s.min(1, 'Home team name is required'),
  awayTeam: (s) => s.min(1, 'Away team name is required'),
  sport: (s) => s.min(1, 'Sport is required'),
  startTime: z.coerce.date(),
  homeScore: z.coerce.number().int().min(0).default(0),
  awayScore: z.coerce.number().int().min(0).default(0),
});

export const updateMatchSchema = createUpdateSchema(matches, {
  startTime: z.coerce.date().optional(),
  homeScore: z.coerce.number().int().min(0).optional(),
  awayScore: z.coerce.number().int().min(0).optional(),
}).partial();

export const selectMatchSchema = createSelectSchema(matches);
