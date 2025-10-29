// Orchestrates push->pull with graceful fallbacks
import { getDB } from './db.client';
import { enqueueOp } from './ops-helpers';
import type { Task } from '@/types/task';

export type SyncStatus = 'idle' | 'syncing' | 'error';

// Keep conflicts in memory and avoid re-opening the modal repeatedly
const conflictMemory = new Set<string>(); // `${entityType}:${id}:${remoteVersion}`
let lastConflictOpenAt = 0;
const CONFLICT_MODAL_COOLDOWN_MS = 20_000; // 20s

type Entity = Record<string, any> & {
  id: string;
  version?: number;
  updatedAt?: string;
};

let listeners: Array<(s: SyncStatus) => void> = [];
let _status: SyncStatus = 'idle';

export function onSyncStatus(cb: (s: SyncStatus) => void) {
  listeners.push(cb);
  return () => (listeners = listeners.filter((x) => x !== cb));
}
function setStatus(s: SyncStatus) {
  _status = s;
  listeners.forEach((l) => l(s));
}
export function getStatus() {
  return _status;
}

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
        await Promise.all(applied.map((id) => db.opsQueue.delete(id)));
      });
      setStatus('idle');
      return { conflicts: data.conflicts || [] };
    } else {
      setStatus('error');
      return { conflicts: data.conflicts || [] };
    }
  } catch {
    setStatus('error');
    return { conflicts: [] };
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
      await db.transaction(
        'rw',
        db.tasks,
        db.projects,
        db.syncVector,
        async () => {
          if (changes?.tasks?.length) {
            for (const t of changes.tasks) await db.tasks.put(t);
          }
          if (changes?.projects?.length) {
            for (const p of changes.projects) await db.projects.put(p);
          }
          await db.syncVector.put({
            id: 'global',
            lastPullVersion: serverVersion,
            lastPushAt: Date.now(),
          });
        }
      );
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
  navigator.serviceWorker?.addEventListener(
    'message',
    async (e: MessageEvent) => {
      if (e.data?.type === 'DO_PUSH_PULL') {
        await pushAndPull();
      }
    }
  );
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

// --- Smart Conflict Handling ---

function isNoop(localPatch: Record<string, any>, remote: Entity) {
  // If every key in the patch equals remote's value, it's a no-op
  return Object.keys(localPatch).every(
    (k) => JSON.stringify(remote[k]) === JSON.stringify(localPatch[k])
  );
}

function changedKeys(objA: Entity, objB: Entity) {
  const keys = new Set([...Object.keys(objA), ...Object.keys(objB)]);
  const out: string[] = [];
  for (const k of keys) {
    if (JSON.stringify(objA[k]) !== JSON.stringify(objB[k])) out.push(k);
  }
  return out;
}

function canAutoMerge(
  localPatch: Record<string, any>,
  localBase: Entity,
  remote: Entity
) {
  // If local is only touching keys that remote didn't change since base, auto-merge.
  // Compute what changed on the server (remote vs base).
  const serverChanged = new Set(changedKeys(remote, localBase));
  for (const k of Object.keys(localPatch)) {
    if (serverChanged.has(k)) return false; // overlapping change -> real conflict
  }
  return true;
}

async function updateLocalVersion(id: string, nextVersion: number) {
  const db = await getDB();
  await db.tasks.update(id, { version: nextVersion });
}

function shouldOpenConflictModal(conflictKey: string) {
  const now = Date.now();
  if (conflictMemory.has(conflictKey)) return false; // seen already this session
  if (now - lastConflictOpenAt < CONFLICT_MODAL_COOLDOWN_MS) return false;
  conflictMemory.add(conflictKey);
  lastConflictOpenAt = now;
  return true;
}

// Called when server rejects because of stale_version or we detect divergence
export async function handleStaleVersion({
  entityType,
  id,
  localPatch,
  localBase, // the entity as of baseVersion (if stored) or best-effort previous
  remote, // latest from server
}: {
  entityType: 'task' | 'project';
  id: string;
  localPatch: Record<string, any>;
  localBase: Entity;
  remote: Entity;
}) {
  // 1) No-op: nothing to change -> just align version locally and return
  if (isNoop(localPatch, remote)) {
    if (entityType === 'task')
      await updateLocalVersion(id, remote.version ?? 0);
    return { resolved: true, mode: 'noop' as const };
  }

  // 2) Non-overlapping: auto-merge — rebase patch onto remote and re-enqueue with new baseVersion
  if (canAutoMerge(localPatch, localBase, remote)) {
    const rebased = {
      ...remote,
      ...localPatch,
      version: (remote.version ?? 0) + 1,
      updatedAt: new Date().toISOString(),
    };
    const db = await getDB();
    if (entityType === 'task') await db.tasks.put(rebased as Task);
    await enqueueOp({
      entityType,
      entityId: id,
      action: 'update',
      payload: localPatch, // only the delta
      baseVersion: remote.version ?? 0,
      projectId: (rebased as any).projectId,
    });
    return { resolved: true, mode: 'autoMerge' as const };
  }

  // 3) Real conflict: signal UI (but debounce and don't spam)
  const conflictKey = `${entityType}:${id}:${remote.version ?? 0}`;
  const open = shouldOpenConflictModal(conflictKey);
  return {
    resolved: false,
    mode: 'conflict' as const,
    openModal: open,
    remote,
    localPatch,
    localBase,
  };
}

// Helper to obtain a fresh baseVersion before enqueueing any UPDATE op
export async function getFreshBaseVersionForTask(id: string) {
  const db = await getDB();
  const t = await db.tasks.get(id);
  // baseVersion should be the updatedAt timestamp (in ms) from server, not a version counter
  return t?.updatedAt ? new Date(t.updatedAt).getTime() : 0;
}
