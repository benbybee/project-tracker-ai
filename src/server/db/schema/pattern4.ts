import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  date,
  decimal,
  boolean,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from '../schema';

// Sprints Table
export const sprints = pgTable('sprints', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(), // Should be 90 days from start
  goalSummary: text('goal_summary'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Sprint Weeks Table
export const sprintWeeks = pgTable(
  'sprint_weeks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sprintId: uuid('sprint_id')
      .notNull()
      .references(() => sprints.id, { onDelete: 'cascade' }),
    weekIndex: integer('week_index').notNull(), // 1-13
    startDate: date('start_date').notNull(),
    endDate: date('end_date').notNull(),
    theme: text('theme'),
    notes: text('notes'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    sprintIdIdx: index('sprint_weeks_sprint_id_idx').on(table.sprintId),
  })
);

// Opportunities Table
export const opportunities = pgTable(
  'opportunities',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    sprintId: uuid('sprint_id').references(() => sprints.id),
    name: text('name').notNull(),
    type: text('type', { enum: ['MAJOR', 'MICRO'] }).notNull(),
    lane: text('lane'), // e.g., "Marketing", "Product"
    summary: text('summary'),
    complexity: text('complexity'), // e.g., "High", "Medium", "Low"
    estimatedCost: decimal('estimated_cost'),
    goToMarket: text('go_to_market'),
    details: text('details'),
    status: text('status', {
      enum: ['IDEA', 'PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'KILLED'],
    })
      .notNull()
      .default('IDEA'),
    priority: integer('priority').default(3), // 1-4
    notes: text('notes'),
    // Performance fields (for completed)
    actualCost: decimal('actual_cost'),
    revenue: decimal('revenue'),
    profit: decimal('profit'),
    decision: text('decision', {
      enum: ['KEEP', 'ADJUST', 'CANCEL', 'UNDECIDED'],
    }).default('UNDECIDED'),
    outcomeNotes: text('outcome_notes'),
    completedAt: timestamp('completed_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index('opportunities_user_id_idx').on(table.userId),
    sprintIdIdx: index('opportunities_sprint_id_idx').on(table.sprintId),
    statusIdx: index('opportunities_status_idx').on(table.status),
  })
);

// Relations
export const sprintsRelations = relations(sprints, ({ one, many }) => ({
  user: one(users, {
    fields: [sprints.userId],
    references: [users.id],
  }),
  weeks: many(sprintWeeks),
  opportunities: many(opportunities),
}));

export const sprintWeeksRelations = relations(sprintWeeks, ({ one }) => ({
  sprint: one(sprints, {
    fields: [sprintWeeks.sprintId],
    references: [sprints.id],
  }),
}));

export const opportunitiesRelations = relations(opportunities, ({ one }) => ({
  user: one(users, {
    fields: [opportunities.userId],
    references: [users.id],
  }),
  sprint: one(sprints, {
    fields: [opportunities.sprintId],
    references: [sprints.id],
  }),
}));

// Types
export type Sprint = typeof sprints.$inferSelect;
export type NewSprint = typeof sprints.$inferInsert;

export type SprintWeek = typeof sprintWeeks.$inferSelect;
export type NewSprintWeek = typeof sprintWeeks.$inferInsert;

export type Opportunity = typeof opportunities.$inferSelect;
export type NewOpportunity = typeof opportunities.$inferInsert;
