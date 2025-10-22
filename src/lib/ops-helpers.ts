import { getDB, LocalOp } from './db.client';

export async function enqueueOp(op: Omit<LocalOp,'id'|'ts'>) {
  const db = await getDB();
  const id = `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  await db.opsQueue.add({ 
    id, 
    ts: Date.now(), 
    ...op 
  });
  
  // Optionally, nudge SW to sync
  navigator.serviceWorker?.controller?.postMessage({ type: 'REQUEST_SYNC' });
  
  return id;
}

// Helper functions for common operations
export async function enqueueTaskCreate(task: any, projectId: string) {
  return enqueueOp({
    entityType: 'task',
    entityId: task.id,
    action: 'create',
    payload: task,
    projectId,
    baseVersion: 0
  });
}

export async function enqueueTaskUpdate(taskId: string, updates: any, projectId: string, baseVersion: number) {
  return enqueueOp({
    entityType: 'task',
    entityId: taskId,
    action: 'update',
    payload: updates,
    projectId,
    baseVersion
  });
}

export async function enqueueTaskDelete(taskId: string, projectId: string) {
  return enqueueOp({
    entityType: 'task',
    entityId: taskId,
    action: 'delete',
    payload: {},
    projectId
  });
}

export async function enqueueProjectCreate(project: any) {
  return enqueueOp({
    entityType: 'project',
    entityId: project.id,
    action: 'create',
    payload: project,
    baseVersion: 0
  });
}

export async function enqueueProjectUpdate(projectId: string, updates: any, baseVersion: number) {
  return enqueueOp({
    entityType: 'project',
    entityId: projectId,
    action: 'update',
    payload: updates,
    baseVersion
  });
}

export async function enqueueProjectDelete(projectId: string) {
  return enqueueOp({
    entityType: 'project',
    entityId: projectId,
    action: 'delete',
    payload: {}
  });
}
