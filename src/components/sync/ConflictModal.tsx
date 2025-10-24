'use client';
import { useState } from 'react';

type Conflict = { entityType: string; entityId: string; local: any; remote: any; reason: string };

// Simple in-memory store for conflicts (in production, use Zustand or similar)
let globalConflicts: Conflict[] = [];
export function addConflict(c: Conflict) {
  globalConflicts.push(c);
}
export function getConflicts() {
  return [...globalConflicts];
}
export function clearConflict(idx: number) {
  globalConflicts = globalConflicts.filter((_, i) => i !== idx);
}

// Conflict Review Button for topbar
export function ConflictReviewButton() {
  const [open, setOpen] = useState(false);
  const count = globalConflicts.length;
  
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`relative rounded-lg border px-2 py-1 text-sm transition-colors ${
          count ? 'border-red-300 bg-red-50 text-red-700 hover:bg-red-100' : 'text-gray-600 hover:bg-gray-50'
        }`}
        title={count ? `${count} conflicts to review` : 'No conflicts'}
      >
        Conflicts
        {count > 0 && (
          <span className="ml-1 inline-block rounded-full bg-red-500 text-white text-xs px-2 font-medium">
            {count}
          </span>
        )}
      </button>
      {open && <ConflictModal onClose={() => setOpen(false)} />}
    </>
  );
}

// Conflict Modal Component
export default function ConflictModal({ onClose }: { onClose?: () => void }) {
  const [conflicts, setConflicts] = useState(getConflicts());

  if (conflicts.length === 0) {
    if (onClose) onClose();
    return null;
  }
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
          <button className="px-3 py-1 rounded border" onClick={onClose}>Close</button>
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
    
    clearConflict(idx);
    setConflicts(getConflicts());
    
    if (conflicts.length <= 1 && onClose) {
      onClose();
    }
  }
}
