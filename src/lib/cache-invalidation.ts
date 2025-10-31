/**
 * Cache Invalidation Helpers
 *
 * Centralized cache invalidation logic to ensure all related queries
 * are invalidated when data changes. This prevents stale data issues
 * across multiple views and components.
 */

type TRPCUtils = any; // Using any to avoid tight coupling to tRPC internals

/**
 * Invalidates all queries that depend on roles data
 *
 * Use this when:
 * - Creating a new role
 * - Updating a role (name, color)
 * - Deleting a role
 *
 * Affected queries:
 * - roles.list - Direct role listing
 * - dashboard.get - Uses roles for filtering
 * - tasks.list - Displays role information with tasks
 * - projects.list - Displays role assignments
 */
export async function invalidateRoleQueries(utils: TRPCUtils): Promise<void> {
  await Promise.all([
    utils.roles.list.invalidate(),
    utils.dashboard.get.invalidate(),
    utils.tasks.list.invalidate(),
    utils.projects.list.invalidate(),
  ]);
}

/**
 * Invalidates all queries that depend on project data
 *
 * Use this when:
 * - Creating a new project
 * - Updating a project (name, role, status)
 * - Deleting a project
 * - Pinning/unpinning a project
 */
export async function invalidateProjectQueries(
  utils: TRPCUtils
): Promise<void> {
  await Promise.all([
    utils.projects.list.invalidate(),
    utils.projects.get.invalidate(),
    utils.dashboard.get.invalidate(),
    utils.tasks.list.invalidate(),
  ]);
}

/**
 * Invalidates all queries that depend on task data
 *
 * Use this when:
 * - Creating a new task
 * - Updating a task (status, role, etc)
 * - Deleting a task
 * - Moving a task between statuses
 */
export async function invalidateTaskQueries(utils: TRPCUtils): Promise<void> {
  await Promise.all([
    utils.tasks.list.invalidate(),
    utils.tasks.get.invalidate(),
    utils.dashboard.get.invalidate(),
    utils.projects.get.invalidate(),
  ]);
}

/**
 * Cache invalidation event types
 */
export type CacheInvalidationTarget = 'roles' | 'projects' | 'tasks' | 'all';

export interface CacheInvalidationEvent {
  type: 'cache_invalidation';
  target: CacheInvalidationTarget;
  userId?: string;
  timestamp: number;
}
