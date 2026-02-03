import {
  pgTable,
  uuid,
  text,
  timestamp,
  index,
  integer,
  date,
  jsonb,
  decimal,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users, tasks, projects } from '../schema';
import { sprints, sprintWeeks, opportunities } from './pattern4';

export const integrationApiKeys = pgTable(
  'integration_api_keys',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    integration: text('integration', { enum: ['ideaforge'] }).notNull(),
    keyHash: text('key_hash').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    lastUsedAt: timestamp('last_used_at'),
    revokedAt: timestamp('revoked_at'),
  },
  (table) => ({
    userIdIdx: index('integration_api_keys_user_id_idx').on(table.userId),
    keyHashIdx: index('integration_api_keys_key_hash_idx').on(table.keyHash),
  })
);

export const ideaforgeSyncMap = pgTable(
  'ideaforge_sync_map',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    ideaId: text('idea_id').notNull(),
    planVersion: text('plan_version').notNull(),
    planTaskId: text('plan_task_id').notNull(),
    taskId: uuid('task_id')
      .notNull()
      .references(() => tasks.id, { onDelete: 'cascade' }),
    projectId: uuid('project_id').references(() => projects.id),
    sprintId: uuid('sprint_id').references(() => sprints.id),
    sprintWeekId: uuid('sprint_week_id').references(() => sprintWeeks.id),
    opportunityId: uuid('opportunity_id').references(() => opportunities.id),
    lastSyncAt: timestamp('last_sync_at').notNull().defaultNow(),
    lastChangeSource: text('last_change_source', {
      enum: ['idea_app', 'task_app'],
    })
      .notNull()
      .default('idea_app'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index('ideaforge_sync_map_user_id_idx').on(table.userId),
    ideaIdIdx: index('ideaforge_sync_map_idea_id_idx').on(table.ideaId),
    planTaskIdIdx: index('ideaforge_sync_map_plan_task_id_idx').on(
      table.planTaskId
    ),
    taskIdIdx: index('ideaforge_sync_map_task_id_idx').on(table.taskId),
  })
);

export const ideaforgeIdeas = pgTable(
  'ideaforge_ideas',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    oneLiner: text('one_liner'),
    notes: text('notes'),
    status: text('status', {
      enum: [
        'INBOX',
        'EXPLORING',
        'VALIDATING',
        'PLANNED',
        'EXECUTING',
        'ARCHIVED',
      ],
    })
      .notNull()
      .default('INBOX'),
    lastExploredAt: timestamp('last_explored_at'),
    lastCommittedAt: timestamp('last_committed_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index('ideaforge_ideas_user_id_idx').on(table.userId),
    statusIdx: index('ideaforge_ideas_status_idx').on(table.status),
  })
);

export const ideaforgeTranscripts = pgTable(
  'ideaforge_transcripts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    ideaId: uuid('idea_id')
      .notNull()
      .references(() => ideaforgeIdeas.id, { onDelete: 'cascade' }),
    role: text('role', { enum: ['user', 'assistant'] }).notNull(),
    mode: text('mode', { enum: ['text', 'voice'] }).notNull().default('text'),
    aiMode: text('ai_mode', {
      enum: ['freeform', 'guided', 'critical'],
    }).notNull(),
    content: text('content').notNull(),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index('ideaforge_transcripts_user_id_idx').on(table.userId),
    ideaIdIdx: index('ideaforge_transcripts_idea_id_idx').on(table.ideaId),
  })
);

export const ideaforgePlans = pgTable(
  'ideaforge_plans',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    ideaId: uuid('idea_id')
      .notNull()
      .references(() => ideaforgeIdeas.id, { onDelete: 'cascade' }),
    version: integer('version').notNull(),
    scheduleMode: text('schedule_mode', {
      enum: ['realistic', 'aggressive', 'deadline'],
    }).notNull(),
    snapshot: jsonb('snapshot'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index('ideaforge_plans_user_id_idx').on(table.userId),
    ideaIdIdx: index('ideaforge_plans_idea_id_idx').on(table.ideaId),
  })
);

export const ideaforgePlanTasks = pgTable(
  'ideaforge_plan_tasks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    planId: uuid('plan_id')
      .notNull()
      .references(() => ideaforgePlans.id, { onDelete: 'cascade' }),
    ideaId: uuid('idea_id')
      .notNull()
      .references(() => ideaforgeIdeas.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    priority: integer('priority'),
    budgetPlanned: decimal('budget_planned'),
    dueDate: date('due_date'),
    dependencies: text('dependencies'),
    projectId: uuid('project_id').references(() => projects.id),
    sprintId: uuid('sprint_id').references(() => sprints.id),
    sprintWeekId: uuid('sprint_week_id').references(() => sprintWeeks.id),
    opportunityId: uuid('opportunity_id').references(() => opportunities.id),
    taskId: uuid('task_id').references(() => tasks.id),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index('ideaforge_plan_tasks_user_id_idx').on(table.userId),
    planIdIdx: index('ideaforge_plan_tasks_plan_id_idx').on(table.planId),
    ideaIdIdx: index('ideaforge_plan_tasks_idea_id_idx').on(table.ideaId),
  })
);

export const ideaforgeTaskNotes = pgTable(
  'ideaforge_task_notes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    planTaskId: uuid('plan_task_id')
      .notNull()
      .references(() => ideaforgePlanTasks.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    source: text('source', { enum: ['ideaforge', 'tasktraker'] })
      .notNull()
      .default('ideaforge'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index('ideaforge_task_notes_user_id_idx').on(table.userId),
    planTaskIdIdx: index('ideaforge_task_notes_plan_task_id_idx').on(
      table.planTaskId
    ),
  })
);

export const ideaforgeUserMemory = pgTable(
  'ideaforge_user_memory',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    profile: jsonb('profile').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index('ideaforge_user_memory_user_id_idx').on(table.userId),
  })
);

export const ideaforgeNotifications = pgTable(
  'ideaforge_notifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    ideaId: uuid('idea_id').references(() => ideaforgeIdeas.id),
    planTaskId: uuid('plan_task_id').references(() => ideaforgePlanTasks.id),
    type: text('type', {
      enum: ['due_soon', 'overdue', 'stalled'],
    }).notNull(),
    windowKey: text('window_key'),
    readAt: timestamp('read_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index('ideaforge_notifications_user_id_idx').on(table.userId),
    typeIdx: index('ideaforge_notifications_type_idx').on(table.type),
  })
);

export const ideaforgeSyncCursors = pgTable(
  'ideaforge_sync_cursors',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    cursorType: text('cursor_type', { enum: ['tasks', 'notifications'] })
      .notNull()
      .default('tasks'),
    lastValue: timestamp('last_value'),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index('ideaforge_sync_cursors_user_id_idx').on(table.userId),
  })
);

export const integrationApiKeysRelations = relations(
  integrationApiKeys,
  ({ one }) => ({
    user: one(users, {
      fields: [integrationApiKeys.userId],
      references: [users.id],
    }),
  })
);

export const ideaforgeSyncMapRelations = relations(
  ideaforgeSyncMap,
  ({ one }) => ({
    user: one(users, {
      fields: [ideaforgeSyncMap.userId],
      references: [users.id],
    }),
    task: one(tasks, {
      fields: [ideaforgeSyncMap.taskId],
      references: [tasks.id],
    }),
    project: one(projects, {
      fields: [ideaforgeSyncMap.projectId],
      references: [projects.id],
    }),
    sprint: one(sprints, {
      fields: [ideaforgeSyncMap.sprintId],
      references: [sprints.id],
    }),
    sprintWeek: one(sprintWeeks, {
      fields: [ideaforgeSyncMap.sprintWeekId],
      references: [sprintWeeks.id],
    }),
    opportunity: one(opportunities, {
      fields: [ideaforgeSyncMap.opportunityId],
      references: [opportunities.id],
    }),
  })
);

export const ideaforgeIdeasRelations = relations(ideaforgeIdeas, ({ one, many }) => ({
  user: one(users, {
    fields: [ideaforgeIdeas.userId],
    references: [users.id],
  }),
  transcripts: many(ideaforgeTranscripts),
  plans: many(ideaforgePlans),
  planTasks: many(ideaforgePlanTasks),
}));

export const ideaforgeTranscriptsRelations = relations(
  ideaforgeTranscripts,
  ({ one }) => ({
    user: one(users, {
      fields: [ideaforgeTranscripts.userId],
      references: [users.id],
    }),
    idea: one(ideaforgeIdeas, {
      fields: [ideaforgeTranscripts.ideaId],
      references: [ideaforgeIdeas.id],
    }),
  })
);

export const ideaforgePlansRelations = relations(ideaforgePlans, ({ one, many }) => ({
  user: one(users, {
    fields: [ideaforgePlans.userId],
    references: [users.id],
  }),
  idea: one(ideaforgeIdeas, {
    fields: [ideaforgePlans.ideaId],
    references: [ideaforgeIdeas.id],
  }),
  tasks: many(ideaforgePlanTasks),
}));

export const ideaforgePlanTasksRelations = relations(
  ideaforgePlanTasks,
  ({ one, many }) => ({
    user: one(users, {
      fields: [ideaforgePlanTasks.userId],
      references: [users.id],
    }),
    idea: one(ideaforgeIdeas, {
      fields: [ideaforgePlanTasks.ideaId],
      references: [ideaforgeIdeas.id],
    }),
    plan: one(ideaforgePlans, {
      fields: [ideaforgePlanTasks.planId],
      references: [ideaforgePlans.id],
    }),
    task: one(tasks, {
      fields: [ideaforgePlanTasks.taskId],
      references: [tasks.id],
    }),
    project: one(projects, {
      fields: [ideaforgePlanTasks.projectId],
      references: [projects.id],
    }),
    sprint: one(sprints, {
      fields: [ideaforgePlanTasks.sprintId],
      references: [sprints.id],
    }),
    sprintWeek: one(sprintWeeks, {
      fields: [ideaforgePlanTasks.sprintWeekId],
      references: [sprintWeeks.id],
    }),
    opportunity: one(opportunities, {
      fields: [ideaforgePlanTasks.opportunityId],
      references: [opportunities.id],
    }),
    notes: many(ideaforgeTaskNotes),
  })
);

export const ideaforgeTaskNotesRelations = relations(ideaforgeTaskNotes, ({ one }) => ({
  user: one(users, {
    fields: [ideaforgeTaskNotes.userId],
    references: [users.id],
  }),
  planTask: one(ideaforgePlanTasks, {
    fields: [ideaforgeTaskNotes.planTaskId],
    references: [ideaforgePlanTasks.id],
  }),
}));

export const ideaforgeUserMemoryRelations = relations(ideaforgeUserMemory, ({ one }) => ({
  user: one(users, {
    fields: [ideaforgeUserMemory.userId],
    references: [users.id],
  }),
}));

export const ideaforgeNotificationsRelations = relations(
  ideaforgeNotifications,
  ({ one }) => ({
    user: one(users, {
      fields: [ideaforgeNotifications.userId],
      references: [users.id],
    }),
    idea: one(ideaforgeIdeas, {
      fields: [ideaforgeNotifications.ideaId],
      references: [ideaforgeIdeas.id],
    }),
    planTask: one(ideaforgePlanTasks, {
      fields: [ideaforgeNotifications.planTaskId],
      references: [ideaforgePlanTasks.id],
    }),
  })
);

export const ideaforgeSyncCursorsRelations = relations(
  ideaforgeSyncCursors,
  ({ one }) => ({
    user: one(users, {
      fields: [ideaforgeSyncCursors.userId],
      references: [users.id],
    }),
  })
);

export type IntegrationApiKey = typeof integrationApiKeys.$inferSelect;
export type NewIntegrationApiKey = typeof integrationApiKeys.$inferInsert;

export type IdeaforgeSyncMap = typeof ideaforgeSyncMap.$inferSelect;
export type NewIdeaforgeSyncMap = typeof ideaforgeSyncMap.$inferInsert;

export type IdeaforgeIdea = typeof ideaforgeIdeas.$inferSelect;
export type NewIdeaforgeIdea = typeof ideaforgeIdeas.$inferInsert;

export type IdeaforgeTranscript = typeof ideaforgeTranscripts.$inferSelect;
export type NewIdeaforgeTranscript = typeof ideaforgeTranscripts.$inferInsert;

export type IdeaforgePlan = typeof ideaforgePlans.$inferSelect;
export type NewIdeaforgePlan = typeof ideaforgePlans.$inferInsert;

export type IdeaforgePlanTask = typeof ideaforgePlanTasks.$inferSelect;
export type NewIdeaforgePlanTask = typeof ideaforgePlanTasks.$inferInsert;

export type IdeaforgeTaskNote = typeof ideaforgeTaskNotes.$inferSelect;
export type NewIdeaforgeTaskNote = typeof ideaforgeTaskNotes.$inferInsert;

export type IdeaforgeUserMemory = typeof ideaforgeUserMemory.$inferSelect;
export type NewIdeaforgeUserMemory = typeof ideaforgeUserMemory.$inferInsert;

export type IdeaforgeNotification = typeof ideaforgeNotifications.$inferSelect;
export type NewIdeaforgeNotification = typeof ideaforgeNotifications.$inferInsert;

export type IdeaforgeSyncCursor = typeof ideaforgeSyncCursors.$inferSelect;
export type NewIdeaforgeSyncCursor = typeof ideaforgeSyncCursors.$inferInsert;
