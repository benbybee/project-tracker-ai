'use client';
export default function DailySummaryPage() {
  // Fetch stats: projects added, tasks added, completed, due completed, due not completed, tomorrow estimates
  // Render plus "Generate Summary" button -> POST /api/ai/daily-summary
  return (
    <div className="px-6 py-4">
      <h1 className="text-2xl font-semibold mb-3">Daily Summary</h1>
      {/* KPI tiles */}
      <button className="px-3 py-2 rounded bg-black text-white" onClick={async ()=>{
        const res = await fetch('/api/ai/daily-summary', { method: 'POST' });
        const data = await res.json();
        // show summary text block
      }}>Generate AI Summary</button>
    </div>
  );
}
