import { z } from 'zod';
import { protectedProcedure, createTRPCRouter } from '../trpc';
import { taskTemplates, projectTemplates } from '@/server/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { db } from '@/server/db';

/**
 * Templates Router - CRUD for Task and Project Templates
 * Enables users to save and reuse task/project structures
 */

export const templatesRouter = createTRPCRouter({
  // ============================================
  // TASK TEMPLATES
  // ============================================

  /**
   * List all task templates for the current user
   */
  listTaskTemplates: protectedProcedure
    .input(
      z
        .object({
          category: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const conditions = [eq(taskTemplates.userId, ctx.session.user.id)];

      if (input?.category) {
        conditions.push(eq(taskTemplates.category, input.category));
      }

      const templates = await db.query.taskTemplates.findMany({
        where: and(...conditions),
        orderBy: [desc(taskTemplates.createdAt)],
      });

      return templates;
    }),

  /**
   * Get a specific task template by ID
   */
  getTaskTemplate: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const template = await db.query.taskTemplates.findFirst({
        where: and(
          eq(taskTemplates.id, input.id),
          eq(taskTemplates.userId, ctx.session.user.id)
        ),
      });

      if (!template) {
        throw new Error('Task template not found');
      }

      return template;
    }),

  /**
   * Create a new task template
   */
  createTaskTemplate: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2, 'Name must be at least 2 characters'),
        description: z.string().optional(),
        category: z.string().optional(),
        taskData: z.object({
          title: z.string(),
          description: z.string().optional(),
          priorityScore: z.enum(['1', '2', '3', '4']).optional(),
          status: z.string().optional(),
        }),
        subtasks: z
          .array(
            z.object({
              title: z.string(),
              completed: z.boolean().optional(),
              position: z.number(),
            })
          )
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [template] = await db
        .insert(taskTemplates)
        .values({
          userId: ctx.session.user.id,
          name: input.name,
          description: input.description,
          category: input.category,
          taskData: input.taskData,
          subtasks: input.subtasks || [],
        })
        .returning();

      return template;
    }),

  /**
   * Update an existing task template
   */
  updateTaskTemplate: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(2).optional(),
        description: z.string().optional(),
        category: z.string().optional(),
        taskData: z.any().optional(),
        subtasks: z.any().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;

      const [updated] = await db
        .update(taskTemplates)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(taskTemplates.id, id),
            eq(taskTemplates.userId, ctx.session.user.id)
          )
        )
        .returning();

      if (!updated) {
        throw new Error('Task template not found');
      }

      return updated;
    }),

  /**
   * Delete a task template
   */
  deleteTaskTemplate: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [deleted] = await db
        .delete(taskTemplates)
        .where(
          and(
            eq(taskTemplates.id, input.id),
            eq(taskTemplates.userId, ctx.session.user.id)
          )
        )
        .returning();

      if (!deleted) {
        throw new Error('Task template not found');
      }

      return { success: true };
    }),

  /**
   * Create a task from a template with variable substitution
   */
  createFromTaskTemplate: protectedProcedure
    .input(
      z.object({
        templateId: z.string().uuid(),
        projectId: z.string().uuid(),
        variables: z.record(z.string()).optional(), // e.g., { project_name: "Website", client_name: "Acme Corp" }
        dueDate: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get the template
      const template = await db.query.taskTemplates.findFirst({
        where: and(
          eq(taskTemplates.id, input.templateId),
          eq(taskTemplates.userId, ctx.session.user.id)
        ),
      });

      if (!template) {
        throw new Error('Task template not found');
      }

      // Substitute variables in task data
      const taskData = template.taskData as any;
      const variables = input.variables || {};

      const substituteVariables = (text: string): string => {
        let result = text;
        Object.entries(variables).forEach(([key, value]) => {
          const regex = new RegExp(`{{${key}}}`, 'g');
          result = result.replace(regex, value);
        });
        return result;
      };

      // Apply variable substitution
      const title = substituteVariables(taskData.title);
      const description = taskData.description
        ? substituteVariables(taskData.description)
        : undefined;

      // Create the task using the tasks router (we'll import this)
      // For now, return the processed data for the caller to create the task
      return {
        title,
        description,
        projectId: input.projectId,
        priorityScore: taskData.priorityScore || '2',
        status: taskData.status || 'not_started',
        dueDate: input.dueDate,
        subtasks:
          (template.subtasks as any[])?.map((st: any) => ({
            ...st,
            title: substituteVariables(st.title),
          })) || [],
      };
    }),

  // ============================================
  // PROJECT TEMPLATES
  // ============================================

  /**
   * List all project templates for the current user
   */
  listProjectTemplates: protectedProcedure
    .input(
      z
        .object({
          category: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const conditions = [eq(projectTemplates.userId, ctx.session.user.id)];

      if (input?.category) {
        conditions.push(eq(projectTemplates.category, input.category));
      }

      const templates = await db.query.projectTemplates.findMany({
        where: and(...conditions),
        orderBy: [desc(projectTemplates.createdAt)],
      });

      return templates;
    }),

  /**
   * Get a specific project template by ID
   */
  getProjectTemplate: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const template = await db.query.projectTemplates.findFirst({
        where: and(
          eq(projectTemplates.id, input.id),
          eq(projectTemplates.userId, ctx.session.user.id)
        ),
      });

      if (!template) {
        throw new Error('Project template not found');
      }

      return template;
    }),

  /**
   * Create a new project template
   */
  createProjectTemplate: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2, 'Name must be at least 2 characters'),
        description: z.string().optional(),
        category: z.string().optional(),
        projectData: z.object({
          name: z.string(),
          description: z.string().optional(),
          type: z.enum(['general', 'website']),
          tasks: z.array(z.any()).optional(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [template] = await db
        .insert(projectTemplates)
        .values({
          userId: ctx.session.user.id,
          name: input.name,
          description: input.description,
          category: input.category,
          projectData: input.projectData,
        })
        .returning();

      return template;
    }),

  /**
   * Update an existing project template
   */
  updateProjectTemplate: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(2).optional(),
        description: z.string().optional(),
        category: z.string().optional(),
        projectData: z.any().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;

      const [updated] = await db
        .update(projectTemplates)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(projectTemplates.id, id),
            eq(projectTemplates.userId, ctx.session.user.id)
          )
        )
        .returning();

      if (!updated) {
        throw new Error('Project template not found');
      }

      return updated;
    }),

  /**
   * Delete a project template
   */
  deleteProjectTemplate: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [deleted] = await db
        .delete(projectTemplates)
        .where(
          and(
            eq(projectTemplates.id, input.id),
            eq(projectTemplates.userId, ctx.session.user.id)
          )
        )
        .returning();

      if (!deleted) {
        throw new Error('Project template not found');
      }

      return { success: true };
    }),

  /**
   * Create a project from a template with variable substitution and date adjustment
   */
  createFromProjectTemplate: protectedProcedure
    .input(
      z.object({
        templateId: z.string().uuid(),
        variables: z.record(z.string()).optional(),
        startDate: z.string().optional(), // Adjust all task dates relative to this
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get the template
      const template = await db.query.projectTemplates.findFirst({
        where: and(
          eq(projectTemplates.id, input.templateId),
          eq(projectTemplates.userId, ctx.session.user.id)
        ),
      });

      if (!template) {
        throw new Error('Project template not found');
      }

      // Substitute variables in project data
      const projectData = template.projectData as any;
      const variables = input.variables || {};

      const substituteVariables = (text: string): string => {
        let result = text;
        Object.entries(variables).forEach(([key, value]) => {
          const regex = new RegExp(`{{${key}}}`, 'g');
          result = result.replace(regex, value);
        });
        return result;
      };

      // Apply variable substitution to project
      const name = substituteVariables(projectData.name);
      const description = projectData.description
        ? substituteVariables(projectData.description)
        : undefined;

      // Process tasks with variable substitution and date adjustment
      const tasks = (projectData.tasks || []).map((task: any) => ({
        ...task,
        title: substituteVariables(task.title),
        description: task.description
          ? substituteVariables(task.description)
          : undefined,
        // Date adjustment would go here if startDate is provided
      }));

      return {
        name,
        description,
        type: projectData.type,
        tasks,
      };
    }),
});
