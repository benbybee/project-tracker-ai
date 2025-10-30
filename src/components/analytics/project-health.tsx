'use client';

import React from 'react';
import {
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  TrendingDown,
} from 'lucide-react';
import { calculateProjectHealth, getHealthColor } from '@/lib/analytics-utils';

interface ProjectHealthData {
  projectId: string;
  projectName: string;
  overdueCount: number;
  blockedCount: number;
  completionRate: number;
  velocityTrend: 'increasing' | 'stable' | 'decreasing';
  totalTasks: number;
  completedTasks: number;
}

interface ProjectHealthProps {
  projects: ProjectHealthData[];
  title?: string;
}

export function ProjectHealth({
  projects,
  title = 'Project Health',
}: ProjectHealthProps) {
  // Calculate health for each project
  const projectsWithHealth = React.useMemo(() => {
    return projects
      .map((project) => {
        const health = calculateProjectHealth({
          overdueCount: project.overdueCount,
          blockedCount: project.blockedCount,
          completionRate: project.completionRate,
          velocityTrend: project.velocityTrend,
        });

        return {
          ...project,
          health,
        };
      })
      .sort((a, b) => a.health.score - b.health.score); // Sort by health (worst first)
  }, [projects]);

  // Categorize projects
  const criticalProjects = projectsWithHealth.filter(
    (p) => p.health.status === 'critical'
  );
  const warningProjects = projectsWithHealth.filter(
    (p) => p.health.status === 'warning'
  );
  const healthyProjects = projectsWithHealth.filter(
    (p) => p.health.status === 'healthy'
  );

  if (projects.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
          {title}
        </h3>
        <div className="flex flex-col items-center justify-center h-64 text-slate-500 dark:text-slate-400">
          <CheckCircle className="h-12 w-12 mb-3 opacity-30" />
          <p className="text-sm">No projects to analyze</p>
          <p className="text-xs mt-1">
            Create projects with tasks to see health metrics
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
          {title}
        </h3>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <span className="text-slate-600 dark:text-slate-400">
              {criticalProjects.length} Critical
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
            <span className="text-slate-600 dark:text-slate-400">
              {warningProjects.length} Warning
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-slate-600 dark:text-slate-400">
              {healthyProjects.length} Healthy
            </span>
          </div>
        </div>
      </div>

      {/* Project List */}
      <div className="space-y-3">
        {projectsWithHealth.map((project) => {
          const StatusIcon =
            project.health.status === 'critical'
              ? AlertTriangle
              : project.health.status === 'warning'
                ? AlertCircle
                : CheckCircle;

          return (
            <div
              key={project.projectId}
              className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              {/* Project Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
                    {project.projectName}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                    <span>
                      {project.completedTasks}/{project.totalTasks} tasks
                    </span>
                    <span>•</span>
                    <span>{project.completionRate}% complete</span>
                  </div>
                </div>

                {/* Health Score Badge */}
                <div
                  className={`
                  flex items-center gap-2 px-3 py-1.5 rounded-lg border
                  ${getHealthColor(project.health.status)}
                `}
                >
                  <StatusIcon className="h-4 w-4" />
                  <span className="font-bold text-lg">
                    {project.health.score}
                  </span>
                </div>
              </div>

              {/* Health Score Bar */}
              <div className="mb-3">
                <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      project.health.status === 'healthy'
                        ? 'bg-green-500'
                        : project.health.status === 'warning'
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                    }`}
                    style={{ width: `${project.health.score}%` }}
                  />
                </div>
              </div>

              {/* Issues */}
              {project.health.issues.length > 0 && (
                <div className="space-y-1">
                  {project.health.issues.map((issue, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400"
                    >
                      <div className="w-1 h-1 rounded-full bg-slate-400 flex-shrink-0"></div>
                      <span>{issue}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Velocity Trend */}
              {project.velocityTrend === 'decreasing' && (
                <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 rounded-lg text-xs text-red-700 dark:text-red-400">
                  <TrendingDown className="h-4 w-4" />
                  <span>
                    Velocity is declining - consider reviewing workload
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* At-Risk Summary */}
      {(criticalProjects.length > 0 || warningProjects.length > 0) && (
        <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-yellow-900 dark:text-yellow-200 mb-1">
                {criticalProjects.length + warningProjects.length} project(s)
                need attention
              </p>
              <p className="text-yellow-700 dark:text-yellow-300">
                Review overdue and blocked tasks to improve project health
                scores.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
