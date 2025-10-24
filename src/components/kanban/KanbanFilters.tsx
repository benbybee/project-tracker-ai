'use client';
export default function KanbanFilters({ role, setRole }:{ role?: string; setRole: (r?: string)=>void }) {
  const roles = ['All','Balance of Nature','Obsession Marketing','Test']; // TODO: query roles
  return (
    <div className="flex gap-2 items-center">
      <select className="border rounded px-2 py-1 text-sm" value={role ?? 'All'} onChange={e=>setRole(e.target.value === 'All' ? undefined : e.target.value)}>
        {roles.map(r => <option key={r} value={r}>{r}</option>)}
      </select>
    </div>
  );
}
