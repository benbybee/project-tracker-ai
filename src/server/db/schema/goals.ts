import { pgTable, text, timestamp, uuid, integer, date } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users, projects } from '../schema';

export const goals = pgTable('goals', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  category: text('category', {
    enum: ['career', 'health', 'finance', 'personal', 'learning', 'other'],
  })
    .notNull()
    .default('personal'),
  targetDate: date('target_date'),
  status: text('status', {
    enum: ['not_started', 'in_progress', 'completed', 'on_hold'],
  })
    .notNull()
    .default('not_started'),
  progress: integer('progress').default(0), // 0-100
  projectId: uuid('project_id').references(() => projects.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const goalsRelations = relations(goals, ({ one }) => ({
  user: one(users, {
    fields: [goals.userId],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [goals.projectId],
    references: [projects.id],
  }),
}));

export type Goal = typeof goals.$inferSelect;
export type NewGoal = typeof goals.$inferInsert;

