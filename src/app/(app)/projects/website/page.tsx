'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { trpc } from '@/lib/trpc';

// Use auto dynamic rendering
export const dynamic = 'force-dynamic';

type Project = {
  id: string;
  name: string;
  type?: string | null;
  pinned?: boolean | null;
  description?: string | null;
};

export default function WebsiteBoardsHub() {
  const { data: allProjects, isLoading } = trpc.projects.list.useQuery({});
  
  const websiteProjects = (allProjects || []).filter(
    (p: Project) => (p.type ?? '').toLowerCase() === 'website'
  );

  return (
    <div className="px-6 py-4 space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Website Boards</h1>
        <p className="text-sm text-gray-600 mt-1">
          Projects of type <b>Website</b>. Click a card to open its website-focused Kanban board.
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading website projects...</p>
        </div>
      ) : websiteProjects.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {websiteProjects.map((p: Project, index: number) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link
                href={`/projects/${p.id}/website`}
                className="block rounded-xl border border-gray-200 bg-white/80 p-4 hover:shadow-md transition-all"
              >
                <div className="font-medium text-gray-900">{p.name}</div>
                {p.description && (
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{p.description}</p>
                )}
                <div className="text-xs text-blue-600 mt-2 flex items-center gap-1">
                  Open board →
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">No website projects found.</p>
          <Link
            href="/projects/new"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 text-white px-4 py-2 hover:bg-blue-700 transition-colors"
          >
            Create Website Project
          </Link>
        </div>
      )}
    </div>
  );
}

