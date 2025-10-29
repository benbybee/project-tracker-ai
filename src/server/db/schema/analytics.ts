import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  real,
  jsonb,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users, tasks } from '../schema';

// Task completion analytics - tracks actual time spent on tasks
export const taskAnalytics = pgTable('task_analytics', {
  id: uuid('id').primaryKey().defaultRandom(),
  taskId: uuid('task_id')
    .notNull()
    .references(() => tasks.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  actualDurationMinutes: integer('actual_duration_minutes'),
  estimatedDurationMinutes: integer('estimated_duration_minutes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// User productivity patterns - learned patterns for personalization
export const userPatterns = pgTable('user_patterns', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  patternType: text('pattern_type', {
    enum: [
      'completion_time',
      'productive_hours',
      'task_category_duration',
      'postponement_pattern',
      'velocity',
    ],
  }).notNull(),
  patternData: jsonb('pattern_data').notNull(), // Flexible JSON structure for different pattern types
  confidenceScore: real('confidence_score'), // 0.0 to 1.0
  lastUpdated: timestamp('last_updated').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// AI suggestions log - tracks what the AI suggests and user acceptance
export const aiSuggestions = pgTable('ai_suggestions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  suggestionType: text('suggestion_type', {
    enum: [
      'daily_plan',
      'task_priority',
      'time_estimate',
      'schedule',
      'focus_block',
      'break_reminder',
    ],
  }).notNull(),
  taskId: uuid('task_id').references(() => tasks.id, { onDelete: 'set null' }),
  suggestionData: jsonb('suggestion_data').notNull(), // The actual suggestion content
  accepted: jsonb('accepted'), // null = not responded, true/false = user response, or partial acceptance object
  feedback: text('feedback'), // Optional user feedback
  createdAt: timestamp('created_at').notNull().defaultNow(),
  respondedAt: timestamp('responded_at'),
});

// Relations
export const taskAnalyticsRelations = relations(taskAnalytics, ({ one }) => ({
  task: one(tasks, {
    fields: [taskAnalytics.taskId],
    references: [tasks.id],
  }),
  user: one(users, {
    fields: [taskAnalytics.userId],
    references: [users.id],
  }),
}));

export const userPatternsRelations = relations(userPatterns, ({ one }) => ({
  user: one(users, {
    fields: [userPatterns.userId],
    references: [users.id],
  }),
}));

export const aiSuggestionsRelations = relations(aiSuggestions, ({ one }) => ({
  user: one(users, {
    fields: [aiSuggestions.userId],
    references: [users.id],
  }),
  task: one(tasks, {
    fields: [aiSuggestions.taskId],
    references: [tasks.id],
  }),
}));

// Export types
export type TaskAnalytics = typeof taskAnalytics.$inferSelect;
export type NewTaskAnalytics = typeof taskAnalytics.$inferInsert;

export type UserPattern = typeof userPatterns.$inferSelect;
export type NewUserPattern = typeof userPatterns.$inferInsert;

export type AiSuggestion = typeof aiSuggestions.$inferSelect;
export type NewAiSuggestion = typeof aiSuggestions.$inferInsert;
