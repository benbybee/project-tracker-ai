'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'kanban.roleFilter';

interface KanbanFiltersProps {
  value?: string;
  onChange: (v?: string) => void;
  roles: string[];
}

export default function KanbanFilters({
  value,
  onChange,
  roles,
}: KanbanFiltersProps) {
  const [role, setRole] = useState<string>(value ?? 'All');

  useEffect(() => {
    const saved =
      typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (saved) {
      setRole(saved);
      onChange(saved === 'All' ? undefined : saved);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function update(next: string) {
    setRole(next);
    if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, next);
    onChange(next === 'All' ? undefined : next);
  }

  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor="role-filter"
        className="text-sm font-medium text-gray-700"
      >
        Role
      </label>
      <select
        id="role-filter"
        className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        value={role}
        onChange={(e) => update(e.target.value)}
      >
        {roles.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
    </div>
  );
}
