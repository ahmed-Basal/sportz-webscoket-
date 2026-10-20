import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { relations, type InferSelectModel, type InferInsertModel } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { users } from './users';

// ----------------------------------------------------------------------------
// MESSAGES TABLE
// ----------------------------------------------------------------------------
export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  userId: serial('user_id').references(() => users.id),
  content: text('content').notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

// Messages Relations
export const messagesRelations = relations(messages, ({ one }) => ({
  user: one(users, {
    fields: [messages.userId],
    references: [users.id],
  }),
}));

// TypeScript Model Types
export type Message = InferSelectModel<typeof messages>;
export type NewMessage = InferInsertModel<typeof messages>;

// Zod Validation Schemas
export const insertMessageSchema = createInsertSchema(messages, {
  content: (s) => s.min(1, 'Message content cannot be empty'),
});

export const selectMessageSchema = createSelectSchema(messages);
