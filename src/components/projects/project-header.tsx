"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { BadgeCheck, Globe, GitBranch, Link2, Server, CalendarDays, Shield, Edit, Trash2, AlertTriangle } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientButton } from "@/components/ui/gradient-button";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { WebsiteConversionModal } from "./website-conversion-modal";
import { EditProjectModal } from "./edit-project-modal";
import { useSync } from "@/hooks/useSync.client";
import { RefreshCw } from "lucide-react";

type Role = { id:string; name:string; color:string };
type Project = {
  id:string; name:string; type:"general"|"website"; description?:string|null;
  roleId?: string|null; role?: Role | null;
  domain?:string|null; hostingProvider?:string|null; dnsStatus?:string|null;
  repoUrl?:string|null; stagingUrl?:string|null; goLiveDate?:string|null;
};

export function ProjectHeader({
  project,
  role,
  onNewTask,
}: {
  project: Project;
  role?: Role | null;
  onNewTask: () => void;
}) {
  const [isWebsiteModalOpen, setIsWebsiteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const utils = trpc.useUtils();
  const { startSync, isSyncing, isOnline } = useSync();
  const convertToGeneralMutation = trpc.projects.convertToGeneral.useMutation({
    onSuccess: () => {
      utils.projects.get.invalidate({ id: project.id });
      utils.tasks.byProjectId.invalidate({ projectId: project.id });
    }
  });
  
  const deleteProjectMutation = trpc.projects.remove.useMutation({
    onSuccess: () => {
      // Redirect to projects list
      window.location.href = '/projects';
    }
  });

  const isWebsite = project.type === "website";

  const handleConvertToWebsite = () => {
    setIsWebsiteModalOpen(true);
  };

  const handleConvertToGeneral = () => {
    if (confirm('Are you sure you want to convert this website project back to a general project? This will clear all website-specific information.')) {
      convertToGeneralMutation.mutate({ id: project.id });
    }
  };

  const handleDeleteProject = () => {
    if (confirm(`Are you sure you want to delete the project "${project.name}"? This action cannot be undone and will delete all associated tasks.`)) {
      deleteProjectMutation.mutate({ id: project.id });
    }
    setIsDeleteModalOpen(false);
  };

  const handleSyncNow = async () => {
    try {
      await startSync();
    } catch (error) {
      console.error('Failed to sync:', error);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-[var(--radius-xl)] shadow-soft">
      {/* Gradient hero background */}
      <div
        className="h-40 sm:h-48 w-full"
        style={{ backgroundImage: isWebsite ? "var(--hero-grad-website)" : "var(--hero-grad-general)" }}
      />
      {/* Animated soft shapes */}
      <motion.div
        className="absolute -top-10 -right-10 h-40 w-40 rounded-full blur-3xl opacity-40"
        style={{ backgroundImage: "var(--grad-primary)" }}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.5 }}
        transition={{ duration: 0.8 }}
      />
      <motion.div
        className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full blur-3xl opacity-40"
        style={{ backgroundImage: "var(--grad-accent)" }}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.5 }}
        transition={{ duration: 0.8, delay: 0.1 }}
      />

      {/* Foreground content */}
      <div className="relative -mt-20 sm:-mt-24 px-4 md:px-6 pb-4">
        <GlassCard className="p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-semibold">{project.name}</h1>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
                    isWebsite ? "bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300" :
                                 "bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300"
                  )}
                >
                  <BadgeCheck className="h-3.5 w-3.5" />
                  {project.type === "website" ? "Website" : "General"}
                </span>
                {project.role && (
                  <span
                    className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full"
                    style={{ backgroundColor: `${project.role.color}22`, color: project.role.color }}
                    title="Role"
                  >
                    <Shield className="h-3.5 w-3.5" />
                    {project.role.name}
                  </span>
                )}
              </div>
              {project.description && (
                <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">{project.description}</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <GradientButton onClick={onNewTask}>New Task</GradientButton>
              
              {/* Sync Button */}
              {isOnline && (
                <Button
                  variant="outline"
                  onClick={handleSyncNow}
                  disabled={isSyncing}
                  className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 hover:from-green-500/30 hover:to-emerald-500/30"
                >
                  <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? 'Syncing...' : 'Sync Now'}
                </Button>
              )}
              
              {/* Project Type Conversion Buttons */}
              {!isWebsite ? (
                <Button
                  variant="outline"
                  onClick={handleConvertToWebsite}
                  className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30"
                >
                  Convert to Website Project
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  onClick={handleConvertToGeneral}
                  className="bg-gradient-to-r from-violet-500/20 to-purple-500/20 hover:from-violet-500/30 hover:to-purple-500/30"
                >
                  Convert to General Project
                </Button>
              )}
              
              {/* Project Management Buttons */}
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsEditModalOpen(true)}
                className="bg-gradient-to-r from-gray-500/20 to-slate-500/20 hover:from-gray-500/30 hover:to-slate-500/30"
              >
                <Edit className="h-4 w-4" />
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsDeleteModalOpen(true)}
                className="bg-gradient-to-r from-red-500/20 to-pink-500/20 hover:from-red-500/30 hover:to-pink-500/30"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Website meta cards */}
          {isWebsite && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <MetaCard icon={Globe} label="Domain" value={project.domain} href={safeUrl(project.domain)} />
              <MetaCard icon={Server} label="Hosting" value={project.hostingProvider} />
              <MetaCard icon={Link2} label="Staging" value={project.stagingUrl} href={safeUrl(project.stagingUrl)} />
              <MetaCard icon={GitBranch} label="Repo" value={project.repoUrl} href={project.repoUrl ?? undefined} />
              <MetaCard icon={CalendarDays} label="Go-Live" value={formatDate(project.goLiveDate)} />
              <MetaCard icon={Globe} label="DNS Status" value={project.dnsStatus} />
            </div>
          )}
        </GlassCard>
      </div>

      {/* Website Conversion Modal */}
      <WebsiteConversionModal
        isOpen={isWebsiteModalOpen}
        onClose={() => setIsWebsiteModalOpen(false)}
        projectId={project.id}
        onSuccess={() => {
          // Modal handles invalidation
        }}
      />

      {/* Edit Project Modal */}
      <EditProjectModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        project={{
          id: project.id,
          name: project.name,
          description: project.description,
          type: project.type,
          roleId: project.roleId,
        }}
        onSuccess={() => {
          // Modal handles invalidation
        }}
      />

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <GlassCard className="p-6 max-w-md mx-4">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-500" />
              <h3 className="text-lg font-semibold">Delete Project</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{project.name}"? This action cannot be undone and will delete all associated tasks.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteProject}
                disabled={deleteProjectMutation.isPending}
              >
                {deleteProjectMutation.isPending ? 'Deleting...' : 'Delete Project'}
              </Button>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}

function MetaCard({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: React.ElementType;
  label: string;
  value?: string | null;
  href?: string;
}) {
  return (
    <GlassCard className="py-3 px-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl border border-white/40 bg-white/50 backdrop-blur flex items-center justify-center">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <div className="text-xs text-slate-500">{label}</div>
          {href && value ? (
            <a href={href} target="_blank" className="text-sm font-medium underline underline-offset-2">
              {value}
            </a>
          ) : (
            <div className="text-sm font-medium">{value ?? "—"}</div>
          )}
        </div>
      </div>
    </GlassCard>
  );
}

function formatDate(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString();
}
function safeUrl(s?: string | null) {
  if (!s) return undefined;
  if (s.startsWith("http")) return s;
  return `https://${s}`;
}
