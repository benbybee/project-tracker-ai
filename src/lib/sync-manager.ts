// Orchestrates push->pull with graceful fallbacks
import { getDB } from './db.client';

export type SyncStatus = 'idle'|'syncing'|'error';

let listeners: Array<(s: SyncStatus) => void> = [];
let _status: SyncStatus = 'idle';

export function onSyncStatus(cb: (s: SyncStatus)=>void) {
  listeners.push(cb);
  return () => (listeners = listeners.filter(x => x !== cb));
}
function setStatus(s: SyncStatus) {
  _status = s;
  listeners.forEach(l => l(s));
}
export function getStatus() { return _status; }

export async function pushOps(): Promise<{ conflicts: any[] }> {
  const db = await getDB();
  const ops = await db.opsQueue.orderBy('ts').toArray();
  if (!ops.length) return { conflicts: [] };
  setStatus('syncing');
  try {
    const res = await fetch('/api/sync/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ops }),
    });
    const data = await res.json();
    if (res.ok) {
      // remove applied ops
      const applied: string[] = data.applied || [];
      await db.transaction('rw', db.opsQueue, async () => {
        await Promise.all(applied.map(id => db.opsQueue.delete(id)));
      });
      setStatus('idle');
      return { conflicts: data.conflicts || [] };
    } else {
      setStatus('error');
      return { conflicts: data.conflicts || [] };
    }
  } catch {
    setStatus('error'); return { conflicts: [] };
  }
}

export async function pullChanges(): Promise<void> {
  const db = await getDB();
  const vec = await db.syncVector.get('global');
  const since = vec?.lastPullVersion ?? 0;
  setStatus('syncing');
  try {
    const res = await fetch(`/api/sync/pull?since=${since}`);
    const data = await res.json();
    if (res.ok) {
      const { changes, serverVersion } = data;
      await db.transaction('rw', db.tasks, db.projects, db.syncVector, async () => {
        if (changes?.tasks?.length) {
          for (const t of changes.tasks) await db.tasks.put(t);
        }
        if (changes?.projects?.length) {
          for (const p of changes.projects) await db.projects.put(p);
        }
        await db.syncVector.put({ id: 'global', lastPullVersion: serverVersion, lastPushAt: Date.now() });
      });
      setStatus('idle');
    } else {
      setStatus('error');
    }
  } catch {
    setStatus('error');
  }
}

export async function pushAndPull(): Promise<any[]> {
  const { conflicts } = await pushOps();
  await pullChanges();
  return conflicts;
}

/** Kickoff from app: SW will postMessage({type:'DO_PUSH_PULL'}) */
export function wireServiceWorkerMessages() {
  if (typeof window === 'undefined') return;
  navigator.serviceWorker?.addEventListener('message', async (e: MessageEvent) => {
    if (e.data?.type === 'DO_PUSH_PULL') {
      await pushAndPull();
    }
  });
}

/** Fallback timer when SyncManager unsupported */
let fallbackTimer: number | undefined;
export function startFallbackInterval(ms = 30_000) {
  stopFallbackInterval();
  fallbackTimer = window.setInterval(() => {
    if (navigator.onLine) pushAndPull();
  }, ms);
}
export function stopFallbackInterval() {
  if (fallbackTimer) window.clearInterval(fallbackTimer);
  fallbackTimer = undefined;
}
