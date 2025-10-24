"use client";

import { motion } from "framer-motion";
import { ArrowRight, Globe } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/ui/glass-card";

interface ProjectTileProps {
  project: {
    id: string;
    name: string;
    type: 'general' | 'website';
    roleId: string | null;
    role?: {
      id: string;
      name: string;
      color: string;
    } | null;
    totalTasks: number;
    completedTasks: number;
    pinned?: boolean;
  };
  index?: number;
  onTogglePin?: (projectId: string, pinned: boolean) => void;
  onConvertToWebsite?: (projectId: string) => void;
}

export function ProjectTile({ project, index = 0, onTogglePin, onConvertToWebsite }: ProjectTileProps) {
  const progress = project.totalTasks > 0 ? (project.completedTasks / project.totalTasks) * 100 : 0;
  const progressRounded = Math.round(progress);
  const [converting, setConverting] = useState(false);

  const handlePinClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onTogglePin?.(project.id, !project.pinned);
  };

  const handleConvertToWebsite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (converting) return;
    
    setConverting(true);
    try {
      await onConvertToWebsite?.(project.id);
    } finally {
      setConverting(false);
    }
  };

  return (
    <Link href={`/projects/${project.id}`} prefetch>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
          delay: index * 0.1,
        }}
        whileHover={{ y: -2, scale: 1.01 }}
        className="cursor-pointer block"
      >
      <GlassCard className="relative overflow-hidden group">
        {/* Pin button */}
        <button
          onClick={handlePinClick}
          className="absolute top-3 left-3 z-10 text-xs px-2 py-1 rounded-full border border-white/40 bg-white/60 backdrop-blur hover:bg-white/80 transition-all"
          aria-label={project.pinned ? 'Unpin project' : 'Pin project'}
          title={project.pinned ? 'Unpin' : 'Pin'}
        >
          {project.pinned ? '📌 Pinned' : '📌 Pin'}
        </button>

        {/* Convert to Website button (only for general projects) */}
        {project.type === 'general' && onConvertToWebsite && (
          <button
            onClick={handleConvertToWebsite}
            disabled={converting}
            className="absolute top-3 right-3 z-10 flex items-center gap-1 text-xs px-2 py-1 rounded-full border border-blue-300 bg-blue-50 backdrop-blur hover:bg-blue-100 transition-all disabled:opacity-50"
            aria-label="Convert to website project"
            title="Convert to Website Project"
          >
            <Globe className="h-3 w-3" />
            {converting ? 'Converting...' : 'Website'}
          </button>
        )}

        {/* Role color accent */}
        {project.role && (
          <div
            className="absolute top-0 left-0 w-full h-1"
            style={{ backgroundColor: project.role.color }}
          />
        )}

        {/* Progress ring */}
        <div className="relative w-16 h-16 mx-auto mb-3">
          <svg
            className="w-16 h-16 transform -rotate-90"
            viewBox="0 0 36 36"
          >
            {/* Background circle */}
            <path
              d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-white/20"
            />
            {/* Progress circle */}
            <path
              d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray={`${progress}, 100`}
              className="text-blue-500 transition-all duration-300"
              style={{
                strokeLinecap: "round",
                filter: "drop-shadow(0 0 6px rgba(59, 130, 246, 0.3))",
              }}
            />
          </svg>
          {/* Percentage text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              {progressRounded}%
            </span>
          </div>
        </div>

        {/* Project info */}
        <div className="text-center">
          <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-1 truncate">
            {project.name}
          </h3>
          
          {/* Project type and role */}
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              {project.type}
            </span>
            {project.role && (
              <span
                className="inline-flex items-center px-2 py-1 rounded-full text-xs"
                style={{
                  backgroundColor: `${project.role.color}22`,
                  color: project.role.color,
                }}
              >
                {project.role.name}
              </span>
            )}
          </div>

          {/* Task count */}
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">
            {project.completedTasks} of {project.totalTasks} tasks
          </div>

          {/* Progress bar */}
          <div className="mt-2 h-1.5 w-full rounded-full bg-white/40 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-indigo-400 to-violet-500 transition-all duration-300" 
              style={{ width: `${progressRounded}%` }} 
            />
          </div>
        </div>

        {/* Hover arrow */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          whileHover={{ opacity: 1, x: 0 }}
          className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all"
        >
          <ArrowRight className="h-4 w-4 text-slate-400" />
        </motion.div>

        {/* Subtle glow effect on hover */}
        <div className="absolute inset-0 rounded-[var(--radius-lg)] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div
            className="absolute inset-0 rounded-[var(--radius-lg)] blur-xl"
            style={{
              background: `radial-gradient(circle at center, ${project.role?.color || '#3B82F6'}22 0%, transparent 70%)`,
            }}
          />
        </div>
      </GlassCard>
      </motion.div>
    </Link>
  );
}
