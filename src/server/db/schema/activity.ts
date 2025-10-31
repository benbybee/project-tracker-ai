import { pgTable, uuid, text, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users, projects, tasks } from '../schema';

export const activityLog = pgTable('activity_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  actorId: uuid('actor_id')
    .notNull()
    .references(() => users.id),
  targetType: text('target_type', {
    enum: ['task', 'project', 'comment', 'sync', 'system'],
  }).notNull(),
  targetId: uuid('target_id'),
  action: text('action', {
    enum: [
      'created',
      'updated',
      'deleted',
      'assigned',
      'completed',
      'commented',
      'mentioned',
      'synced',
      'conflict_resolved',
    ],
  }).notNull(),
  payload: jsonb('payload'),
  projectId: uuid('project_id').references(() => projects.id),
  taskId: uuid('task_id').references(() => tasks.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const activityLogRelations = relations(activityLog, ({ one }) => ({
  actor: one(users, {
    fields: [activityLog.actorId],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [activityLog.projectId],
    references: [projects.id],
  }),
  task: one(tasks, {
    fields: [activityLog.taskId],
    references: [tasks.id],
  }),
}));

export type ActivityLog = typeof activityLog.$inferSelect;
export type NewActivityLog = typeof activityLog.$inferInsert;
