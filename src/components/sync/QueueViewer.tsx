'use client';
import { useEffect, useState } from 'react';
import { getDB } from '@/lib/db.client';

export default function QueueViewer() {
  const [ops, setOps] = useState<any[]>([]);
  useEffect(() => {
    let active = true;
    (async () => {
      const db = await getDB();
      const list = await db.opsQueue.orderBy('ts').toArray();
      if (active) setOps(list);
    })();
    const id = setInterval(async () => {
      const db = await getDB();
      const list = await db.opsQueue.orderBy('ts').toArray();
      setOps(list);
    }, 2000);
    return () => { active = false; clearInterval(id); };
  }, []);

  return (
    <div className="p-3 text-xs max-h-64 overflow-auto">
      {ops.length ? ops.map(op => (
        <div key={op.id} className="flex items-center justify-between border-b py-1">
          <div>{op.action} {op.entityType} <span className="text-gray-500">{op.entityId}</span></div>
          <div className="text-gray-500">{new Date(op.ts).toLocaleTimeString()}</div>
        </div>
      )) : <div className="text-gray-500">Queue empty</div>}
    </div>
  );
}
