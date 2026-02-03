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
import { analyticsRouter } from './routers/analytics';
import { userRouter } from './routers/user';
import { templatesRouter } from './routers/templates';
import { recurringRouter } from './routers/recurring';
import { attachmentsRouter } from './routers/attachments';
import { commentsRouter } from './routers/comments';
import { viewsRouter } from './routers/views';
import { slackRouter } from './routers/slack';
import { agentRouter } from './routers/agent';
import { goalsRouter } from './routers/goals';
import { habitsRouter } from './routers/habits';
import { pattern4Router } from './routers/pattern4';
import { analyticsPattern4Router } from './routers/analytics-pattern4';
import { ideaforgeRouter } from './routers/ideaforge';

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
  analytics: analyticsRouter,
  user: userRouter,
  templates: templatesRouter,
  recurring: recurringRouter,
  attachments: attachmentsRouter,
  comments: commentsRouter,
  views: viewsRouter,
  slack: slackRouter,
  agent: agentRouter,
  goals: goalsRouter,
  habits: habitsRouter,
  pattern4: pattern4Router,
  analyticsPattern4: analyticsPattern4Router,
  ideaforge: ideaforgeRouter,
});

export type AppRouter = typeof appRouter;
