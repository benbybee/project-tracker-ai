"use client";
import { useMemo, useState } from "react";
import { DndContext, DragEndEvent, useDroppable } from "@dnd-kit/core";
import { trpc } from "@/lib/trpc";
import { TaskCard, Task } from "@/components/tasks/task-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import { TaskEditModal } from "@/components/tasks/TaskEditModal";

// Use auto dynamic rendering to avoid chunk loading issues
export const dynamic = 'force-dynamic';


export default function DailyPage() {
  const utils = trpc.useUtils();
  const { data: all = [] } = trpc.tasks.list.useQuery({});
  const moveToToday = trpc.tasks.moveToToday.useMutation({ onSuccess: () => utils.tasks.invalidate() });
  const moveToNoDue = trpc.tasks.moveToNoDue.useMutation({ onSuccess: () => utils.tasks.invalidate() });
  const moveToNext = trpc.tasks.moveToNextDays.useMutation({ onSuccess: () => utils.tasks.invalidate() });
  const complete = trpc.tasks.complete.useMutation({ onSuccess: () => utils.tasks.invalidate() });
  const snooze = trpc.tasks.snoozeDays.useMutation({ onSuccess: () => utils.tasks.invalidate() });
  const remove = trpc.tasks.remove.useMutation({ onSuccess: () => utils.tasks.invalidate() });

  const [nextPick, setNextPick] = useState<1|2|3>(1);
  const [selected, setSelected] = useState<Task | null>(null);
  const [suggestions, setSuggestions] = useState<any[] | null>(null);

  const today = new Date(); today.setHours(0,0,0,0);
  const isSameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

  const { todayList, next3, noDue } = useMemo(() => {
    const T: any[] = [], N: any[] = [], Z: any[] = [];
    for (const t of all as any[]) {
      if (t.isDaily && t.dueDate === null) { Z.push(t); continue; }
      if (t.dueDate) {
        const d = new Date(t.dueDate); d.setHours(0,0,0,0);
        const diff = Math.round((+d - +today)/86400000);
        if (isSameDay(d, today) || (t.isDaily && isSameDay(d, today))) T.push(t);
        else if (diff >= 1 && diff <= 3) N.push(t);
      }
    }
    return { todayList: T, next3: N, noDue: Z };
  }, [all]);

  const onDragEnd = (e: DragEndEvent) => {
    const id = e.active?.id as string;
    const dest = e.over?.id as "today"|"next3"|"nodue"|undefined;
    if (!id || !dest) return;
    if (dest === "today") moveToToday.mutate({ id });
    if (dest === "next3") moveToNext.mutate({ id, daysFromToday: nextPick });
    if (dest === "nodue") moveToNoDue.mutate({ id });
  };

  async function generatePlan() {
    const res = await fetch('/api/ai/daily-plan', { method: 'POST' });
    const data = await res.json();
    setSuggestions(data.suggestions);
  }

  async function acceptPlan() {
    await fetch('/api/ai/daily-plan/accept', { method: 'POST', body: JSON.stringify({ suggestions }) });
    setSuggestions(null);
  }

  return (
    <div className="px-6 py-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Daily Planner</h1>
        <button onClick={generatePlan} className="px-3 py-2 rounded bg-black text-white">Generate Plan</button>
      </div>

      {suggestions && (
        <div className="mb-4 p-3 rounded-lg border bg-white/70">
          <h3 className="font-medium mb-2">AI Suggested Plan</h3>
          <ul className="list-disc ml-5 text-sm">
            {suggestions.map((s, i) => <li key={i}>{s.title} — {s.reason}</li>)}
          </ul>
          <div className="mt-3 flex gap-2">
            <button onClick={acceptPlan} className="px-3 py-1 rounded bg-black text-white">Accept</button>
            <button onClick={()=>setSuggestions(null)} className="px-3 py-1 rounded border">Dismiss</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">Next-3 target:</span>
            {[1,2,3].map(d => (
              <Button key={d} variant={d===nextPick?"default":"outline"} onClick={()=>setNextPick(d as 1|2|3)}>{d}d</Button>
            ))}
          </div>
        </div>

      <DndContext onDragEnd={onDragEnd}>
        <Bucket id="today" title={`Today (${todayList.length})`}>
          {todayList.map(t => (
            <div key={t.id} id={String(t.id)} data-task>
              <TaskCard
                task={t}
                onOpen={(task)=>setSelected(task)}
                onComplete={(id)=>complete.mutate({ id })}
                onSnooze={(id)=>snooze.mutate({ id, days: 1 })}
                onDelete={(id)=>remove.mutate({ id })}
              />
            </div>
          ))}
        </Bucket>

        <Bucket id="next3" title={`Next 3 Days (${next3.length})`} subtitle={`Drop sets due date to +${nextPick}d`}>
          {next3.map(t => (
            <div key={t.id} id={String(t.id)} data-task>
              <TaskCard
                task={t}
                onOpen={(task)=>setSelected(task)}
                onComplete={(id)=>complete.mutate({ id })}
                onSnooze={(id)=>snooze.mutate({ id, days: 1 })}
                onDelete={(id)=>remove.mutate({ id })}
              />
            </div>
          ))}
        </Bucket>

        <Bucket id="nodue" title={`No Due Date (${noDue.length})`} subtitle="Add to Daily (no due date)">
          {noDue.map(t => (
            <div key={t.id} id={String(t.id)} data-task>
              <TaskCard
                task={t}
                onOpen={(task)=>setSelected(task)}
                onComplete={(id)=>complete.mutate({ id })}
                onSnooze={(id)=>snooze.mutate({ id, days: 1 })}
                onDelete={(id)=>remove.mutate({ id })}
              />
            </div>
          ))}
        </Bucket>
      </DndContext>
      </div>

      <TaskEditModal task={selected!} open={!!selected} onClose={()=>setSelected(null)} />
    </div>
  );
}

function Bucket({ id, title, subtitle, children }:{
  id:"today"|"next3"|"nodue"; title:string; subtitle?:string; children:React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      id={id}
      data-bucket
      className={cn(
        "rounded-[var(--radius-lg)] border p-3 min-h-[240px] transition",
        "bg-white/50 dark:bg-white/10 border-white/50 backdrop-blur",
        isOver && "ring-2 ring-violet-400/50"
      )}
    >
      <div className="mb-2">
        <div className="font-medium">{title}</div>
        {subtitle && <div className="text-xs text-slate-500">{subtitle}</div>}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
