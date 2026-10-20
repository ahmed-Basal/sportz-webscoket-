import { pgTable, serial, text, integer, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { relations, type InferSelectModel, type InferInsertModel } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { matches } from './matches';

// ----------------------------------------------------------------------------
// COMMENTARY TABLE (Dynamic Story / Fast Events)
// ----------------------------------------------------------------------------
export const commentary = pgTable(
  'commentary',
  {
    id: serial('id').primaryKey(),
    matchId: integer('match_id')
      .notNull()
      .references(() => matches.id, { onDelete: 'cascade' }),
    actor: text('actor'), // Who (player, referee, coach)
    message: text('message').notNull(), // What (event narration)
    minute: integer('minute'), // When (game minute)
    sequenceNo: integer('sequence_no').notNull(), // Order
    details: jsonb('details').$type<Record<string, any>>().default({}), // JSON "Anything" Bucket
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => [
    index('commentary_match_id_idx').on(table.matchId),
    index('commentary_match_seq_idx').on(table.matchId, table.sequenceNo),
  ]
);

// Commentary Relations
export const commentaryRelations = relations(commentary, ({ one }) => ({
  match: one(matches, {
    fields: [commentary.matchId],
    references: [matches.id],
  }),
}));

// TypeScript Model Types
export type Commentary = InferSelectModel<typeof commentary>;
export type NewCommentary = InferInsertModel<typeof commentary>;

// ----------------------------------------------------------------------------
// ZOD VALIDATION SCHEMAS
// ----------------------------------------------------------------------------
export const insertCommentarySchema = createInsertSchema(commentary, {
  message: (s) => s.min(1, 'Commentary message is required'),
  actor: (s) => s.optional(),
  minute: z.coerce.number().int().min(0).max(180).optional(),
  sequenceNo: z.coerce.number().int().positive().optional(),
  details: z.record(z.string(), z.any()).default({}),
});

export const selectCommentarySchema = createSelectSchema(commentary);
