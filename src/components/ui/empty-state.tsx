export function EmptyState({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-dashed p-6 text-center bg-white/30 dark:bg-white/5 backdrop-blur">
      <div className="text-sm font-medium">{title}</div>
      {subtitle && (
        <div className="text-xs text-slate-500 mt-1">{subtitle}</div>
      )}
    </div>
  );
}
