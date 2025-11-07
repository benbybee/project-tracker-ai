'use client';

import {
  Calendar,
  Columns3,
  BarChart3,
  Sparkles,
  FolderKanban,
} from 'lucide-react';

const features = [
  {
    icon: Calendar,
    title: 'Daily Planner',
    description:
      'Track overdue, blocked, and upcoming tasks with priority-based planning and AI suggestions.',
  },
  {
    icon: Columns3,
    title: 'Kanban Board',
    description:
      'Visualize and manage your tasks across different stages with drag-and-drop functionality.',
  },
  {
    icon: Calendar,
    title: 'Calendar View',
    description:
      'Schedule and organize your tasks with a comprehensive calendar interface.',
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    description:
      'Comprehensive insights into your productivity and performance metrics.',
  },
  {
    icon: Sparkles,
    title: 'AI-Powered',
    description:
      'Get intelligent task suggestions, automated planning, and AI-assisted productivity insights.',
  },
  {
    icon: FolderKanban,
    title: 'Project Organization',
    description:
      'Organize tasks by projects, track progress, and collaborate with your team seamlessly.',
  },
];

export function Features() {
  return (
    <section id="features" className="py-20 md:py-32 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl mb-4">
            Everything you need to get work done
          </h2>
          <p className="text-lg text-slate-600">
            100+ features to take your productivity to the next level
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-brand-200"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-brand-100 text-brand-600">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-slate-900">
                  {feature.title}
                </h3>
                <p className="text-slate-600">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
