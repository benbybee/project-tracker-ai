'use client';

export async function togglePin(projectId: string, pinned: boolean) {
  const res = await fetch(`/api/projects/${projectId}/pin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pinned })
  });
  
  if (!res.ok) {
    throw new Error('Failed to toggle pin');
  }
  
  return res.json();
}

