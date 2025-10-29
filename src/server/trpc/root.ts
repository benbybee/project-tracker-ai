import { createTRPCRouter } from './trpc';
import { authRouter } from './routers/auth';
import { rolesRouter } from './routers/roles';
import { projectsRouter } from './routers/projects';
import { tasksRouter } from './routers/tasks';
import { searchRouter } from './routers/search';
import { dashboardRouter } from './routers/dashboard';
import { realtimeRouter } from './routers/realtime';
import { notificationsRouter } from './routers/notifications';
import { activityRouter } from './routers/activity';
import { chatRouter } from './routers/chat';
import { analyticsRouter } from './routers/analytics';

export const appRouter = createTRPCRouter({
  auth: authRouter,
  roles: rolesRouter,
  projects: projectsRouter,
  tasks: tasksRouter,
  search: searchRouter,
  dashboard: dashboardRouter,
  realtime: realtimeRouter,
  notifications: notificationsRouter,
  activity: activityRouter,
  chat: chatRouter,
  analytics: analyticsRouter,
});

export type AppRouter = typeof appRouter;
