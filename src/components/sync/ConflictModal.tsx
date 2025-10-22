'use client';
import { useEffect, useState } from 'react';
import { pushAndPull } from '@/lib/sync-manager';

type Conflict = { entityType: string; entityId: string; local: any; remote: any; reason: string };

export default function ConflictModal() {
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [open, setOpen] = useState(false);

  async function checkConflicts() {
    const c = await pushAndPull();
    if (c?.length) {
      setConflicts(c);
      setOpen(true);
    }
  }

  useEffect(() => {
    // Poll for conflicts after push/pull cycles
    const id = setInterval(checkConflicts, 15_000);
    return () => clearInterval(id);
  }, []);

  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-4 w-[680px] max-w-[95vw]">
        <h3 className="text-lg font-semibold mb-3">Resolve Conflicts</h3>
        <div className="space-y-3 max-h-[50vh] overflow-auto">
          {conflicts.map((c, i) => (
            <div key={i} className="border rounded-md p-3">
              <div className="text-sm mb-2">
                <b>{c.entityType}:</b> {c.entityId} <span className="text-gray-500">({c.reason})</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="font-medium mb-1">Local</div>
                  <pre className="bg-gray-50 p-2 rounded overflow-auto">{JSON.stringify(c.local, null, 2)}</pre>
                </div>
                <div>
                  <div className="font-medium mb-1">Remote</div>
                  <pre className="bg-gray-50 p-2 rounded overflow-auto">{JSON.stringify(c.remote, null, 2)}</pre>
                </div>
              </div>
              <div className="mt-3 flex gap-2 justify-end">
                <button className="px-3 py-1 rounded border" onClick={() => decide(i, 'remote')}>Keep Remote</button>
                <button className="px-3 py-1 rounded bg-black text-white" onClick={() => decide(i, 'local')}>Keep Local</button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 text-right">
          <button className="px-3 py-1 rounded border" onClick={()=>setOpen(false)}>Close</button>
        </div>
      </div>
    </div>
  );

  async function decide(idx: number, winner: 'local'|'remote') {
    const c = conflicts[idx];
    // Call a resolve endpoint or push a "force" op – depends on server design.
    await fetch('/api/sync/resolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entityType: c.entityType, entityId: c.entityId, winner, local: c.local, remote: c.remote }),
    }).catch(()=>{});
    setConflicts(prev => prev.filter((_, i) => i !== idx));
    if (conflicts.length <= 1) setOpen(false);
  }
}
