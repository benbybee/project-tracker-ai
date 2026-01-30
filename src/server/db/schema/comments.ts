import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  jsonb,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users, tasks } from '../schema';

export const taskComments = pgTable('task_comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  taskId: uuid('task_id')
    .notNull()
    .references(() => tasks.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  // For rich text/markdown
  contentHtml: text('content_html'),
  // File attachments (array of {url, fileName, fileSize})
  attachments: jsonb('attachments'),
  // For emoji reactions (array of {emoji, userId})
  reactions: jsonb('reactions'),
  source: text('source', { enum: ['app', 'ideaforge'] })
    .notNull()
    .default('app'),
  isEdited: boolean('is_edited').default(false),
  isPinned: boolean('is_pinned').default(false),
  editedAt: timestamp('edited_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const taskCommentsRelations = relations(taskComments, ({ one }) => ({
  task: one(tasks, {
    fields: [taskComments.taskId],
    references: [tasks.id],
  }),
  user: one(users, {
    fields: [taskComments.userId],
    references: [users.id],
  }),
}));

export type TaskComment = typeof taskComments.$inferSelect;
export type NewTaskComment = typeof taskComments.$inferInsert;
