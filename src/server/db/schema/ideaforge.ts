import {
  pgTable,
  uuid,
  text,
  timestamp,
  index,
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

export type IntegrationApiKey = typeof integrationApiKeys.$inferSelect;
export type NewIntegrationApiKey = typeof integrationApiKeys.$inferInsert;

export type IdeaforgeSyncMap = typeof ideaforgeSyncMap.$inferSelect;
export type NewIdeaforgeSyncMap = typeof ideaforgeSyncMap.$inferInsert;
