"use client";
import { GlassCard } from "@/components/ui/glass-card";

export function ProjectStats({
  counts,
}: {
  counts: { total:number; inProgress:number; completed:number };
}) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      <StatCard label="Total Tasks" value={counts.total} barClass="bg-gradient-to-r from-indigo-400 to-violet-500" />
      <StatCard label="In Progress" value={counts.inProgress} barClass="bg-gradient-to-r from-sky-400 to-cyan-500" />
      <StatCard label="Completed" value={counts.completed} barClass="bg-gradient-to-r from-emerald-400 to-teal-500" />
    </div>
  );
}

function StatCard({ label, value, barClass }:{ label:string; value:number; barClass:string }) {
  return (
    <GlassCard className="p-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
      <div className="mt-2 h-2 w-full rounded-full bg-white/50 overflow-hidden">
        <div className={`h-full ${barClass}`} style={{ width: "100%" }} />
      </div>
    </GlassCard>
  );
}
