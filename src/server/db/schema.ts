import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  date,
  jsonb,
  uuid,
  bigint,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const taskStatusEnum = pgTable('task_status_enum', {
  value: text('value', {
    enum: [
      'not_started',
      'in_progress',
      'blocked',
      'completed',
      'content',
      'design',
      'dev',
      'qa',
      'launch',
    ],
  }).primaryKey(),
});

export const projectTypeEnum = pgTable('project_type_enum', {
  value: text('value', { enum: ['general', 'website'] }).primaryKey(),
});

export const priorityScoreEnum = pgTable('priority_score_enum', {
  value: text('value', { enum: ['1', '2', '3', '4'] }).primaryKey(),
});

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  name: text('name'),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Roles table
export const roles = pgTable('roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  color: text('color').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Projects table
export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  type: text('type', { enum: ['general', 'website'] }).notNull(),
  description: text('description'),
  roleId: uuid('role_id').references(() => roles.id),
  notes: text('notes'),
  pinned: boolean('pinned').default(false),
  // Website-specific fields
  domain: text('domain'),
  hostingProvider: text('hosting_provider'),
  dnsStatus: text('dns_status'),
  goLiveDate: date('go_live_date'),
  repoUrl: text('repo_url'),
  stagingUrl: text('staging_url'),
  checklistJson: jsonb('checklist_json'),
  websiteStatus: text('website_status', {
    enum: ['discovery', 'development', 'client_review', 'completed', 'blocked'],
  }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Tasks table
export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id),
  roleId: uuid('role_id').references(() => roles.id),
  ticketId: uuid('ticket_id').references(() => tickets.id),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status', {
    enum: [
      'not_started',
      'in_progress',
      'blocked',
      'completed',
      'content',
      'design',
      'dev',
      'qa',
      'launch',
    ],
  })
    .notNull()
    .default('not_started'),
  weekOf: date('week_of'),
  progress: integer('progress').default(0),
  dueDate: date('due_date'),
  isDaily: boolean('is_daily').default(false),
  priorityScore: text('priority_score', { enum: ['1', '2', '3', '4'] }).default(
    '2'
  ),
  blockedReason: text('blocked_reason'),
  blockedDetails: text('blocked_details'),
  blockedAt: timestamp('blocked_at'),
  archived: boolean('archived').default(false),
  archivedAt: timestamp('archived_at'),
  // Recurring task fields
  isRecurring: boolean('is_recurring').default(false),
  recurrenceRule: jsonb('recurrence_rule'), // RRULE format (RFC 5545)
  recurrenceParentId: uuid('recurrence_parent_id'),
  nextOccurrence: date('next_occurrence'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Subtasks table
export const subtasks = pgTable('subtasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  taskId: uuid('task_id')
    .notNull()
    .references(() => tasks.id),
  title: text('title').notNull(),
  completed: boolean('completed').default(false),
  position: integer('position').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Embeddings table for semantic search
export const embeddings = pgTable('embeddings', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityType: text('entity_type', { enum: ['task', 'project'] }).notNull(),
  entityId: uuid('entity_id').notNull(),
  chunkIndex: integer('chunk_index').notNull(),
  chunkText: text('chunk_text').notNull(),
  embedding: text('embedding'), // Temporarily using text instead of vector
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  projects: many(projects),
  tasks: many(tasks),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  role: one(roles, {
    fields: [projects.roleId],
    references: [roles.id],
  }),
  tasks: many(tasks),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  project: one(projects, {
    fields: [tasks.projectId],
    references: [projects.id],
  }),
  role: one(roles, {
    fields: [tasks.roleId],
    references: [roles.id],
  }),
  subtasks: many(subtasks),
  attachments: many(taskAttachments),
}));

export const subtasksRelations = relations(subtasks, ({ one }) => ({
  task: one(tasks, {
    fields: [subtasks.taskId],
    references: [tasks.id],
  }),
}));

// Export types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Role = typeof roles.$inferSelect;
export type NewRole = typeof roles.$inferInsert;

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;

export type Subtask = typeof subtasks.$inferSelect;
export type NewSubtask = typeof subtasks.$inferInsert;

export type Embedding = typeof embeddings.$inferSelect;
export type NewEmbedding = typeof embeddings.$inferInsert;

// Plaud AI pending items table
export const plaudPending = pgTable('plaud_pending', {
  id: uuid('id').primaryKey().defaultRandom(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  title: text('title').notNull(),
  description: text('description'),
  confidence: integer('confidence'), // 0-100
  sourceId: text('source_id'), // Drive file id, transcript id, etc.
  suggestedProjectName: text('suggested_project_name'),
});

export type PlaudPendingItem = typeof plaudPending.$inferSelect;
export type NewPlaudPendingItem = typeof plaudPending.$inferInsert;

// Support Tickets tables
export const tickets = pgTable('tickets', {
  id: uuid('id').primaryKey().defaultRandom(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  customerName: text('customer_name').notNull(),
  customerEmail: text('customer_email').notNull(),
  projectName: text('project_name').notNull(),
  domain: text('domain'),
  details: text('details').notNull(),
  dueDateSuggested: date('due_date_suggested'),
  priority: text('priority', { enum: ['low', 'normal', 'high', 'urgent'] })
    .notNull()
    .default('normal'),
  status: text('status', {
    enum: [
      'new',
      'viewed',
      'pending_tasks',
      'complete',
      'in_review',
      'responded',
      'converted',
      'closed',
    ],
  })
    .notNull()
    .default('new'),
  aiEta: date('ai_eta'),
  aiSummary: text('ai_summary'),
  suggestedProjectId: uuid('suggested_project_id').references(
    () => projects.id
  ),
  completedAt: timestamp('completed_at'),
});

export const ticketReplies = pgTable('ticket_replies', {
  id: uuid('id').primaryKey().defaultRandom(),
  ticketId: uuid('ticket_id')
    .notNull()
    .references(() => tickets.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  author: text('author', { enum: ['admin', 'requester'] }).notNull(),
  message: text('message').notNull(),
});

export const ticketAttachments = pgTable('ticket_attachments', {
  id: uuid('id').primaryKey().defaultRandom(),
  ticketId: uuid('ticket_id')
    .notNull()
    .references(() => tickets.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  fileName: text('file_name').notNull(),
  fileSize: bigint('file_size', { mode: 'number' }),
  url: text('url'),
});

export type Ticket = typeof tickets.$inferSelect;
export type NewTicket = typeof tickets.$inferInsert;
export type TicketReply = typeof ticketReplies.$inferSelect;
export type NewTicketReply = typeof ticketReplies.$inferInsert;
export type TicketAttachment = typeof ticketAttachments.$inferSelect;
export type NewTicketAttachment = typeof ticketAttachments.$inferInsert;

// Notes table
export const notes = pgTable('notes', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  content: text('content').notNull(),
  noteType: text('note_type', { enum: ['text', 'audio'] })
    .notNull()
    .default('text'),
  audioUrl: text('audio_url'),
  audioDuration: integer('audio_duration'), // seconds
  tasksGenerated: boolean('tasks_generated').default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const notesRelations = relations(notes, ({ one }) => ({
  user: one(users, {
    fields: [notes.userId],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [notes.projectId],
    references: [projects.id],
  }),
}));

export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;

// Task Templates table
export const taskTemplates = pgTable('task_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  taskData: jsonb('task_data').notNull(), // Full task structure
  category: text('category'),
  subtasks: jsonb('subtasks'), // Array of subtask templates
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const taskTemplatesRelations = relations(taskTemplates, ({ one }) => ({
  user: one(users, {
    fields: [taskTemplates.userId],
    references: [users.id],
  }),
}));

export type TaskTemplate = typeof taskTemplates.$inferSelect;
export type NewTaskTemplate = typeof taskTemplates.$inferInsert;

// Project Templates table
export const projectTemplates = pgTable('project_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  projectData: jsonb('project_data').notNull(), // Full project + tasks structure
  category: text('category'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const projectTemplatesRelations = relations(
  projectTemplates,
  ({ one }) => ({
    user: one(users, {
      fields: [projectTemplates.userId],
      references: [users.id],
    }),
  })
);

export type ProjectTemplate = typeof projectTemplates.$inferSelect;
export type NewProjectTemplate = typeof projectTemplates.$inferInsert;

// Task Attachments table
export const taskAttachments = pgTable('task_attachments', {
  id: uuid('id').primaryKey().defaultRandom(),
  taskId: uuid('task_id')
    .notNull()
    .references(() => tasks.id, { onDelete: 'cascade' }),
  fileName: text('file_name').notNull(),
  fileSize: bigint('file_size', { mode: 'number' }).notNull(),
  mimeType: text('mime_type').notNull(),
  url: text('url').notNull(), // Vercel Blob URL
  thumbnailUrl: text('thumbnail_url'), // For images
  uploadedBy: uuid('uploaded_by')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const taskAttachmentsRelations = relations(taskAttachments, ({ one }) => ({
  task: one(tasks, {
    fields: [taskAttachments.taskId],
    references: [tasks.id],
  }),
  uploader: one(users, {
    fields: [taskAttachments.uploadedBy],
    references: [users.id],
  }),
}));

export type TaskAttachment = typeof taskAttachments.$inferSelect;
export type NewTaskAttachment = typeof taskAttachments.$inferInsert;

// Import notification, activity, chat, and analytics schemas
export * from './schema/notifications';
export * from './schema/activity';
export * from './schema/chat';
export * from './schema/analytics';
