import { pgTable, serial, text, timestamp, boolean, integer, date, jsonb, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const taskStatusEnum = pgTable('task_status_enum', {
  value: text('value', { enum: ['not_started', 'in_progress', 'blocked', 'completed', 'content', 'design', 'dev', 'qa', 'launch'] }).primaryKey(),
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
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Roles table
export const roles = pgTable('roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  color: text('color').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Projects table
export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
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
  websiteStatus: text('website_status', { enum: ['discovery', 'development', 'client_review', 'completed', 'blocked'] }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Tasks table
export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').notNull().references(() => projects.id),
  roleId: uuid('role_id').references(() => roles.id),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status', { enum: ['not_started', 'in_progress', 'blocked', 'completed', 'content', 'design', 'dev', 'qa', 'launch'] }).notNull().default('not_started'),
  weekOf: date('week_of'),
  progress: integer('progress').default(0),
  dueDate: date('due_date'),
  isDaily: boolean('is_daily').default(false),
  priorityScore: text('priority_score', { enum: ['1', '2', '3', '4'] }).default('2'),
  blockedReason: text('blocked_reason'),
  blockedDetails: text('blocked_details'),
  blockedAt: timestamp('blocked_at'),
  archived: boolean('archived').default(false),
  archivedAt: timestamp('archived_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Subtasks table
export const subtasks = pgTable('subtasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  taskId: uuid('task_id').notNull().references(() => tasks.id),
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

// Import notification, activity, and chat schemas
export * from './schema/notifications';
export * from './schema/activity';
export * from './schema/chat';