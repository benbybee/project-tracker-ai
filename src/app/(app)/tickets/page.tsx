'use client';

import { useEffect, useState } from 'react';
import type { Ticket } from '@/types/ticket';
import { trpc } from '@/lib/trpc';

export const dynamic = 'force-dynamic';

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [active, setActive] = useState<Ticket|null>(null);
  const [summary, setSummary] = useState('');
  const [proposed, setProposed] = useState<Array<{
    id:string; 
    title:string; 
    description?:string; 
    projectId?:string; 
    accepted?:boolean;
    estimatedHours?: number;
  }>>([]);
  const [suggestedProject, setSuggestedProject] = useState<{id:string; name:string; reason:string} | null>(null);
  const [availableProjects, setAvailableProjects] = useState<Array<{id:string; name:string}>>([]);
  const [loading, setLoading] = useState(true);

  const { data: projects } = trpc.projects.list.useQuery({});

  useEffect(() => {
    refresh();
  }, []);

  async function refresh() {
    setLoading(true);
    try {
      const res = await fetch('/api/support/list');
      const data = await res.json().catch(()=>({tickets:[]}));
      setTickets(data.tickets || []);
    } finally {
      setLoading(false);
    }
  }

  async function aiPropose() {
    if (!active) return;
    try {
      const res = await fetch('/api/support/ai/summarize-and-propose', {
        method:'POST', 
        headers:{'Content-Type':'application/json'}, 
        body: JSON.stringify({ ticketId: active.id })
      });
      const data = await res.json();
      setSummary(data.summary || '');
      setProposed((data.tasks || []).map((t:any)=>({ ...t, accepted:false })));
      setSuggestedProject(data.suggestedProject || null);
      setAvailableProjects(data.availableProjects || []);
    } catch (error) {
      console.error('Failed to generate AI proposal:', error);
    }
  }

  async function acceptSelected() {
    const selected = proposed.filter(p => p.accepted);
    if (!active || selected.length===0) return;
    
    try {
      await fetch('/api/support/tasks/accept', {
        method:'POST', 
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ ticketId: active.id, tasks: selected })
      });
      
      // Refresh tickets list
      await refresh();
      setSummary('');
      setProposed([]);
      setActive(null);
    } catch (error) {
      console.error('Failed to accept tasks:', error);
    }
  }

  return (
    <div className="px-6 py-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Sidebar - Tickets List */}
      <aside className="rounded-xl border bg-white/80 backdrop-blur p-3">
        <header className="mb-2 flex items-center justify-between">
          <h1 className="text-lg font-semibold">🎫 Tickets</h1>
          <button 
            onClick={refresh} 
            disabled={loading}
            className="text-xs rounded border px-2 py-1 hover:bg-gray-50 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </header>
        <div className="space-y-2 max-h-[70vh] overflow-auto">
          {tickets.map(t=>(
            <button 
              key={t.id} 
              onClick={()=>{ setActive(t); setSummary(''); setProposed([]); }}
              className={`w-full text-left rounded-lg border px-3 py-2 hover:shadow-sm transition-all ${active?.id===t.id?'bg-blue-50 border-blue-300':''}`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="font-medium text-sm">{t.projectName}</div>
                <div className="flex gap-1">
                  <span className={`text-xs rounded-full px-2 py-0.5 ${
                    t.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                    t.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                    t.priority === 'normal' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {t.priority}
                  </span>
                  <span className={`text-xs rounded-full px-2 py-0.5 ${
                    t.status === 'new' ? 'bg-green-100 text-green-700' :
                    t.status === 'viewed' ? 'bg-blue-100 text-blue-700' :
                    t.status === 'pending_tasks' ? 'bg-orange-100 text-orange-700' :
                    t.status === 'complete' ? 'bg-emerald-100 text-emerald-700' :
                    t.status === 'in_review' ? 'bg-yellow-100 text-yellow-700' :
                    t.status === 'responded' ? 'bg-purple-100 text-purple-700' :
                    t.status === 'converted' ? 'bg-indigo-100 text-indigo-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {t.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
              <div className="text-xs text-gray-500 mb-1">
                👤 {t.customerName} · {(t.domain || '—')} {t.aiEta && `· ETA ${t.aiEta}`}
              </div>
              <div className="text-sm text-gray-700 line-clamp-2">{t.details}</div>
            </button>
          ))}
          {tickets.length===0 && !loading && (
            <div className="text-sm text-gray-600 text-center py-8">
              No tickets yet. Share the <a href="/support" className="text-blue-600 underline">/support</a> link with clients.
            </div>
          )}
        </div>
      </aside>

      {/* Main - Ticket Details */}
      <main className="rounded-xl border bg-white/80 backdrop-blur p-3 lg:col-span-2">
        {active ? (
          <div className="space-y-4">
            <header className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">{active.projectName}</h2>
                <div className="text-sm text-gray-700 mt-1">
                  <div>👤 {active.customerName} ({active.customerEmail})</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {(active.domain || '—')} · Priority: <span className="font-medium">{active.priority}</span>
                    {active.dueDateSuggested && ` · Requested: ${active.dueDateSuggested}`}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={aiPropose} 
                  className="rounded-lg bg-black px-3 py-2 text-white text-sm hover:bg-gray-800 transition-colors"
                >
                  ✨ AI: Summarize & Propose
                </button>
              </div>
            </header>

            <section className="rounded-lg border p-3 bg-gray-50">
              <div className="text-xs text-gray-600 mb-1 font-medium">Request Details</div>
              <div className="text-sm whitespace-pre-wrap">{active.details}</div>
            </section>

            {active.attachments && active.attachments.length > 0 && (
              <section className="rounded-lg border p-3 bg-blue-50">
                <div className="text-xs text-blue-700 mb-2 font-medium">📎 Attachments ({active.attachments.length})</div>
                <div className="space-y-2">
                  {active.attachments.map((attachment, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white rounded-lg p-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">📄</span>
                        <span className="text-sm font-medium">{attachment.name}</span>
                        {attachment.size && (
                          <span className="text-xs text-gray-500">
                            ({(attachment.size / 1024).toFixed(1)} KB)
                          </span>
                        )}
                      </div>
                      {attachment.url && (
                        <a 
                          href={attachment.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm underline"
                        >
                          View →
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {summary && (
              <section className="rounded-lg border p-3 bg-blue-50">
                <div className="text-xs text-blue-700 mb-1 font-medium">AI Summary</div>
                <div className="text-sm whitespace-pre-wrap">{summary}</div>
              </section>
            )}

            {/* Associated Tasks Section */}
            <AssociatedTasksSection ticketId={active.id} />

            {suggestedProject && (
              <section className="rounded-lg border p-3 bg-blue-50">
                <div className="text-sm font-semibold mb-2">🤖 AI Project Suggestion</div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{suggestedProject.name}</div>
                    <div className="text-xs text-gray-600">{suggestedProject.reason}</div>
                  </div>
                  <button 
                    onClick={() => {
                      // Apply suggested project to all tasks
                      const updated = proposed.map(p => ({ ...p, projectId: suggestedProject.id }));
                      setProposed(updated);
                    }}
                    className="rounded-lg bg-blue-600 text-white px-3 py-1 text-xs hover:bg-blue-700"
                  >
                    Apply to All Tasks
                  </button>
                </div>
              </section>
            )}

            {proposed.length>0 && (
              <section className="rounded-lg border p-3">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-semibold">Proposed Tasks ({proposed.length})</div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        const updated = proposed.map(p => ({ ...p, accepted: true }));
                        setProposed(updated);
                      }}
                      className="rounded-lg border px-3 py-1.5 text-xs hover:bg-gray-50 transition-colors"
                    >
                      Select All
                    </button>
                    <button 
                      onClick={() => {
                        const updated = proposed.map(p => ({ ...p, accepted: false }));
                        setProposed(updated);
                      }}
                      className="rounded-lg border px-3 py-1.5 text-xs hover:bg-gray-50 transition-colors"
                    >
                      Clear All
                    </button>
                    <button 
                      onClick={acceptSelected} 
                      disabled={!proposed.some(p => p.accepted)}
                      className="rounded-lg bg-green-600 text-white px-3 py-1.5 text-xs hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      Accept Selected ({proposed.filter(p => p.accepted).length})
                    </button>
                  </div>
                </div>
                <div className="space-y-3">
                  {proposed.map((p, idx)=>(
                    <div key={p.id} className="grid grid-cols-1 lg:grid-cols-[1fr_200px_100px_80px] gap-3 rounded-lg border p-3 hover:bg-gray-50">
                      <div>
                        <div className="font-medium text-sm">{p.title}</div>
                        {p.description && <div className="text-sm text-gray-600 mt-1">{p.description}</div>}
                        {p.estimatedHours && (
                          <div className="text-xs text-blue-600 mt-1">⏱️ ~{p.estimatedHours}h estimated</div>
                        )}
                      </div>
                      <select 
                        className="border rounded px-2 py-1 text-sm bg-white" 
                        value={p.projectId ?? ''} 
                        onChange={(e)=>{ 
                          const newProposed = [...proposed];
                          newProposed[idx].projectId = e.target.value || undefined;
                          setProposed(newProposed);
                        }}
                      >
                        <option value="">Select Project</option>
                        {availableProjects.map(proj => (
                          <option key={proj.id} value={proj.id}>{proj.name}</option>
                        ))}
                        <option value="__new__">➕ New Project</option>
                      </select>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            const newProposed = [...proposed];
                            newProposed[idx].title = prompt('Edit task title:', p.title) || p.title;
                            setProposed(newProposed);
                          }}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => {
                            const newProposed = proposed.filter((_, i) => i !== idx);
                            setProposed(newProposed);
                          }}
                          className="text-xs text-red-600 hover:text-red-800"
                        >
                          🗑️ Remove
                        </button>
                      </div>
                      <label className="flex items-center gap-2 text-sm justify-center">
                        <input 
                          type="checkbox" 
                          checked={!!p.accepted} 
                          onChange={(e)=>{ 
                            const newProposed = [...proposed];
                            newProposed[idx].accepted = e.target.checked;
                            setProposed(newProposed);
                          }} 
                          className="rounded border-gray-300"
                        />
                        Accept
                      </label>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <TicketReplyBox ticketId={active.id} />
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-2">Select a ticket to review</p>
            <p className="text-sm text-gray-500">Tickets will appear in the sidebar as they're submitted</p>
          </div>
        )}
      </main>
    </div>
  );
}

function TicketReplyBox({ ticketId }: { ticketId: string }) {
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  
  async function send() {
    setSaving(true);
    setSuccess(false);
    try {
      await fetch('/api/support/reply', {
        method:'POST', 
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ ticketId, message: value })
      });
      setValue('');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to send reply:', error);
    } finally {
      setSaving(false);
    }
  }
  
  return (
    <section className="rounded-lg border p-3 bg-white">
      <div className="text-sm font-semibold mb-2">Reply to Requester</div>
      <textarea 
        value={value} 
        onChange={(e)=>setValue(e.target.value)} 
        rows={4} 
        placeholder="Type your response here..."
        className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
      />
      <div className="mt-2 flex items-center gap-2">
        <button 
          disabled={!value.trim() || saving} 
          onClick={send} 
          className="rounded-lg bg-black text-white px-4 py-2 disabled:opacity-50 hover:bg-gray-800 transition-colors"
        >
          {saving ? 'Sending...' : 'Send Reply'}
        </button>
        {success && <span className="text-sm text-green-600">✓ Reply sent!</span>}
      </div>
    </section>
  );
}

function AssociatedTasksSection({ ticketId }: { ticketId: string }) {
  const [tasks, setTasks] = useState<Array<{
    id: string;
    title: string;
    description?: string;
    status: string;
    projectName?: string;
    projectId?: string;
    createdAt: string;
  }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, [ticketId]);

  async function fetchTasks() {
    setLoading(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}/tasks`);
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <section className="rounded-lg border p-3 bg-gray-50">
        <div className="text-sm font-semibold mb-2">📋 Associated Tasks</div>
        <div className="text-sm text-gray-500">Loading tasks...</div>
      </section>
    );
  }

  if (tasks.length === 0) {
    return (
      <section className="rounded-lg border p-3 bg-gray-50">
        <div className="text-sm font-semibold mb-2">📋 Associated Tasks</div>
        <div className="text-sm text-gray-500">No tasks created from this ticket yet.</div>
      </section>
    );
  }

  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const totalCount = tasks.length;

  return (
    <section className="rounded-lg border p-3 bg-green-50">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-semibold">📋 Associated Tasks ({totalCount})</div>
        <div className="text-xs text-gray-600">
          {completedCount}/{totalCount} completed
        </div>
      </div>
      
      <div className="space-y-2">
        {tasks.map(task => (
          <div key={task.id} className="flex items-center justify-between bg-white rounded-lg p-3 border">
            <div className="flex-1">
              <div className="font-medium text-sm">{task.title}</div>
              {task.description && (
                <div className="text-xs text-gray-600 mt-1">{task.description}</div>
              )}
              <div className="text-xs text-gray-500 mt-1">
                {task.projectName && `Project: ${task.projectName}`}
                <span className="mx-2">•</span>
                Created: {new Date(task.createdAt).toLocaleDateString()}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs rounded-full px-2 py-1 ${
                task.status === 'completed' ? 'bg-green-100 text-green-700' :
                task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                task.status === 'blocked' ? 'bg-red-100 text-red-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {task.status.replace('_', ' ')}
              </span>
              {task.projectId && (
                <a 
                  href={`/projects/${task.projectId}`}
                  className="text-blue-600 hover:text-blue-800 text-xs underline"
                >
                  View →
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

