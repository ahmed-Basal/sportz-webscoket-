import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { relations, type InferSelectModel, type InferInsertModel } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { messages } from './messages';

// ----------------------------------------------------------------------------
// USERS TABLE
// ----------------------------------------------------------------------------
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

// Users Relations
export const usersRelations = relations(users, ({ many }) => ({
  messages: many(messages),
}));

// TypeScript Model Types
export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;

// Zod Validation Schemas
export const insertUserSchema = createInsertSchema(users, {
  name: (s) => s.min(2, 'Name must be at least 2 characters'),
  email: (s) => s.email('Invalid email address'),
});

export const selectUserSchema = createSelectSchema(users);
