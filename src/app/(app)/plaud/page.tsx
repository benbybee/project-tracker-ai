'use client';
export default function PlaudIngestPage() {
  // Fetch parsed tasks from Plaud webhook store
  // Render table with checkboxes; actions: Accept, Edit, Decline; bulk operations
  // On Accept -> choose project (or create new) then create tasks
  return (
    <div className="px-6 py-4">
      <h1 className="text-2xl font-semibold mb-3">Plaud AI Ingestion</h1>
      {/* Filters, bulk actions, table of proposed tasks */}
    </div>
  );
}
