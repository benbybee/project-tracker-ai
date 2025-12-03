import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  jsonb,
  integer,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from '../schema';

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  type: text('type', {
    enum: [
      'task_assigned',
      'task_updated',
      'task_completed',
      'project_updated',
      'comment_added',
      'mention',
      'sync_conflict',
      'collaboration',
      'task_reminder',
      'due_date_approaching',
      'ai_suggestion',
    ],
  }).notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  link: text('link'),
  read: boolean('read').default(false),
  metadata: jsonb('metadata'),
  // For action buttons
  actions: jsonb('actions'), // Array of {type, label, taskId, etc.}
  actionTaken: text('action_taken'), // Track which action was taken
  groupKey: text('group_key'), // For grouping similar notifications
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;

// Notification Settings table
export const notificationSettings = pgTable('notification_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  // Per-type preferences (JSONB for flexibility)
  typePreferences: jsonb('type_preferences').notNull().default({
    task_reminder: true,
    due_date_approaching: true,
    task_assigned: true,
    task_updated: true,
    task_completed: true,
    project_updated: true,
    comment_added: true,
    mention: true,
    sync_conflict: true,
    collaboration: true,
    ai_suggestion: true,
  }),
  // Email notification settings
  emailEnabled: boolean('email_enabled').default(false),
  emailFrequency: text('email_frequency', {
    enum: ['realtime', 'daily', 'weekly', 'never'],
  })
    .notNull()
    .default('never'),
  emailDigestTime: integer('email_digest_time').default(8), // Hour of day (0-23)
  // Push notification settings
  pushEnabled: boolean('push_enabled').default(true),
  // Quiet hours
  quietHoursEnabled: boolean('quiet_hours_enabled').default(false),
  quietHoursStart: integer('quiet_hours_start').default(22), // 10 PM
  quietHoursEnd: integer('quiet_hours_end').default(8), // 8 AM
  // Sound preferences
  soundEnabled: boolean('sound_enabled').default(true),
  soundType: text('sound_type').default('default'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const notificationSettingsRelations = relations(
  notificationSettings,
  ({ one }) => ({
    user: one(users, {
      fields: [notificationSettings.userId],
      references: [users.id],
    }),
  })
);

export type NotificationSettings = typeof notificationSettings.$inferSelect;
export type NewNotificationSettings = typeof notificationSettings.$inferInsert;
