import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  date,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from '../schema';

export const habits = pgTable('habits', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  frequency: text('frequency', { enum: ['daily', 'weekly'] })
    .notNull()
    .default('daily'),
  timeOfDay: text('time_of_day', {
    enum: ['morning', 'afternoon', 'evening', 'anytime'],
  })
    .notNull()
    .default('anytime'),
  archived: boolean('archived').default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const habitLogs = pgTable('habit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  habitId: uuid('habit_id')
    .notNull()
    .references(() => habits.id, { onDelete: 'cascade' }),
  completedDate: date('completed_date').notNull(), // YYYY-MM-DD
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const habitsRelations = relations(habits, ({ one, many }) => ({
  user: one(users, {
    fields: [habits.userId],
    references: [users.id],
  }),
  logs: many(habitLogs),
}));

export const habitLogsRelations = relations(habitLogs, ({ one }) => ({
  habit: one(habits, {
    fields: [habitLogs.habitId],
    references: [habits.id],
  }),
}));

export type Habit = typeof habits.$inferSelect;
export type NewHabit = typeof habits.$inferInsert;
export type HabitLog = typeof habitLogs.$inferSelect;
export type NewHabitLog = typeof habitLogs.$inferInsert;
