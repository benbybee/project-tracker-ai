"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Role {
  id: string;
  name: string;
  color: string;
}

interface RoleFilterProps {
  roles: Role[];
  selectedRoleId: string | null;
  onRoleChange: (roleId: string | null) => void;
  isLoading?: boolean;
}

export function RoleFilter({ roles, selectedRoleId, onRoleChange, isLoading }: RoleFilterProps) {
  return (
    <div className="sticky top-[88px] z-10 bg-transparent/0 backdrop-blur-sm pb-2">
      <div role="tablist" aria-label="Filter by role" className="flex flex-wrap gap-2">
      {/* All roles chip */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onRoleChange(null)}
        disabled={isLoading}
        role="tab"
        aria-selected={selectedRoleId === null}
        aria-controls="panel-all-roles"
        className={cn(
          "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
          "border backdrop-blur-sm",
          selectedRoleId === null
            ? "bg-blue-500 text-white border-blue-500 shadow-lg shadow-blue-500/25"
            : "bg-white/60 dark:bg-white/10 text-slate-700 dark:text-slate-300 border-white/50 hover:bg-white/80 dark:hover:bg-white/20"
        )}
      >
        All Roles
      </motion.button>

      {/* Individual role chips */}
      {roles.map((role, index) => (
        <motion.button
          key={role.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 25,
            delay: index * 0.05,
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onRoleChange(role.id)}
          disabled={isLoading}
          role="tab"
          aria-selected={selectedRoleId === role.id}
          aria-controls={`panel-role-${role.id}`}
          className={cn(
            "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
            "border backdrop-blur-sm relative overflow-hidden",
            selectedRoleId === role.id
              ? "text-white shadow-lg"
              : "text-slate-700 dark:text-slate-300 border-white/50 hover:bg-white/80 dark:hover:bg-white/20"
          )}
          style={{
            backgroundColor: selectedRoleId === role.id ? role.color : undefined,
            borderColor: selectedRoleId === role.id ? role.color : undefined,
            boxShadow: selectedRoleId === role.id ? `0 4px 12px ${role.color}40` : undefined,
          }}
        >
          {/* Subtle glow effect for selected state */}
          {selectedRoleId === role.id && (
            <div
              className="absolute inset-0 rounded-full opacity-20"
              style={{
                background: `radial-gradient(circle at center, ${role.color} 0%, transparent 70%)`,
              }}
            />
          )}
          
          <span className="relative z-10">{role.name}</span>
          
          {/* Loading state */}
          {isLoading && selectedRoleId === role.id && (
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ backgroundColor: role.color }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.3 }}
            />
          )}
        </motion.button>
      ))}
      </div>
    </div>
  );
}
