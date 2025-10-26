'use client';

import { useEffect, useState } from 'react';
import type { Ticket } from '@/types/ticket';
import { trpc } from '@/lib/trpc';
import { Eye, Trash2, CheckCircle, Ticket as TicketIcon } from 'lucide-react';
import { useRealtime } from '@/app/providers';
import { PageHeader } from '@/components/layout/page-header';

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
  const [showCompleted, setShowCompleted] = useState<boolean>(false);

  const { data: projects } = trpc.projects.list.useQuery({});
  const realtime = useRealtime();

  useEffect(() => {
    refresh();
  }, []);

  // Refresh when showCompleted toggle changes
  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCompleted]);

  // Listen for real-time updates
  useEffect(() => {
    const unsubscribeActivity = realtime.onActivity((activity) => {
      // Refresh tickets when tasks are created or updated
      if (activity.type === 'task_created' || activity.type === 'task_updated') {
        refresh();
      }
    });

    return () => {
      unsubscribeActivity();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refresh() {
    setLoading(true);
    try {
      const url = `/api/support/list${showCompleted ? '?includeCompleted=true' : ''}`;
      const res = await fetch(url);
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

  async function markTicketAsViewed(ticketId: string) {
    try {
      await fetch('/api/support/tickets/mark-viewed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId })
      });
    } catch (error) {
      console.error('Failed to mark ticket as viewed:', error);
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
      
      // Trigger real-time update
      realtime.broadcastActivity({
        type: 'task_created',
        entityType: 'task',
        entityId: active.id,
        data: { ticketId: active.id, count: selected.length }
      });
      
      // Trigger sync to update local database
      try {
        const { pullChanges } = await import('@/lib/sync-manager');
        await pullChanges();
      } catch (syncError) {
        console.error('Failed to trigger sync:', syncError);
      }
      
      // Refresh tickets list
      await refresh();
      setSummary('');
      setProposed([]);
      setActive(null);
    } catch (error) {
      console.error('Failed to accept tasks:', error);
    }
  }

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Get unique projects for filtering
  const uniqueProjects = Array.from(new Set(tickets.map(t => t.projectName))).filter(Boolean);

  const filteredTickets = tickets.filter(ticket => {
    if (statusFilter !== 'all' && ticket.status !== statusFilter) return false;
    if (projectFilter !== 'all' && ticket.projectName !== projectFilter) return false;
    if (dateFilter !== 'all') {
      const ticketDate = new Date(ticket.createdAt);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - ticketDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (dateFilter === 'today' && daysDiff > 0) return false;
      if (dateFilter === 'week' && daysDiff > 7) return false;
      if (dateFilter === 'month' && daysDiff > 30) return false;
    }
    return true;
  }).sort((a, b) => {
    const aVal = a[sortBy as keyof typeof a];
    const bVal = b[sortBy as keyof typeof b];
    
    // Handle null/undefined values
    if (aVal == null && bVal == null) return 0;
    if (aVal == null) return sortOrder === 'asc' ? 1 : -1;
    if (bVal == null) return sortOrder === 'asc' ? -1 : 1;
    
    if (sortOrder === 'asc') {
      return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    } else {
      return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
    }
  });

  return (
    <div className="px-2 py-6">
      <div className="max-w-7xl mx-auto">
        <PageHeader
          icon={TicketIcon}
          title="Tickets"
          subtitle="Manage support requests and client feedback"
          badge={tickets.length}
          actions={
            <div className="flex gap-2">
              <button 
                onClick={() => setShowCompleted(!showCompleted)}
                className={`text-sm rounded-lg border px-3 py-2 transition-colors ${
                  showCompleted 
                    ? 'bg-indigo-100 border-indigo-500 text-indigo-700' 
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                {showCompleted ? '✓ Showing Completed' : 'Show Completed'}
              </button>
              <button 
                onClick={refresh} 
                disabled={loading}
                className="text-sm rounded-lg border border-gray-300 px-3 py-2 hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Loading...' : 'Refresh'}
              </button>
            </div>
          }
        />

        {/* Filters */}
        <div className="rounded-xl border bg-white/80 backdrop-blur p-4 mb-4">

          <div className="flex gap-4 items-center flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Status:</label>
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value="all">All</option>
              <option value="new">New</option>
              <option value="viewed">Viewed</option>
              <option value="pending_tasks">Pending Tasks</option>
              <option value="complete">Complete</option>
              <option value="in_review">In Review</option>
              <option value="responded">Responded</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Submitted:</label>
            <select 
              value={dateFilter} 
              onChange={(e) => setDateFilter(e.target.value)}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Project:</label>
            <select 
              value={projectFilter} 
              onChange={(e) => setProjectFilter(e.target.value)}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value="all">All Projects</option>
              {uniqueProjects.map(project => (
                <option key={project} value={project}>{project}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Sort:</label>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value="createdAt">Date</option>
              <option value="priority">Priority</option>
              <option value="status">Status</option>
              <option value="projectName">Project</option>
            </select>
            <button 
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="text-sm border rounded px-2 py-1 hover:bg-gray-50"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
        </div>

        {/* Tickets Table */}
        <div className="rounded-xl border bg-white/80 backdrop-blur overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Domain</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tasks</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tasks Due</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredTickets.map(ticket => (
                <TicketRow 
                  key={ticket.id} 
                  ticket={ticket}
                  onOpen={() => {
                    setActive(ticket);
                    setSummary('');
                    setProposed([]);
                    if (ticket.status === 'new') {
                      markTicketAsViewed(ticket.id);
                    }
                  }}
                  onDelete={async () => {
                    if (confirm('Are you sure you want to delete this ticket? This will also delete all associated tasks.')) {
                      try {
                        const res = await fetch('/api/support/tickets/delete', {
                          method: 'DELETE',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ ticketId: ticket.id })
                        });
                        if (res.ok) {
                          // Refresh the tickets list
                          window.location.reload();
                        } else {
                          alert('Failed to delete ticket');
                        }
                      } catch (error) {
                        console.error('Failed to delete ticket:', error);
                        alert('Failed to delete ticket');
                      }
                    }
                  }}
                />
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredTickets.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-2">No tickets found</p>
            <p className="text-sm text-gray-500">
              {tickets.length === 0 ? (
                <>Share the <a href="/support" className="text-blue-600 underline">/support</a> link with clients</>
              ) : (
                'Try adjusting your filters'
              )}
            </p>
          </div>
        )}
        </div>

        {/* Ticket Details Modal */}
        {active && (
        <TicketDetailsModal 
          ticket={active}
          onClose={() => setActive(null)}
          summary={summary}
          proposed={proposed}
          suggestedProject={suggestedProject}
          availableProjects={availableProjects}
          onSummaryChange={setSummary}
          onProposedChange={setProposed}
          onSuggestedProjectChange={setSuggestedProject}
          onAvailableProjectsChange={setAvailableProjects}
          onAiPropose={aiPropose}
          onAcceptSelected={acceptSelected}
        />
        )}
      </div>
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

function TicketRow({ 
  ticket, 
  onOpen, 
  onDelete 
}: {
  ticket: Ticket;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const [taskCount, setTaskCount] = useState<number>(0);
  const [tasksDue, setTasksDue] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [assignedProject, setAssignedProject] = useState<string>(ticket.suggestedProjectId || '');
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  
  // Use tRPC to fetch projects
  const { data: projectsData } = trpc.projects.list.useQuery({});
  const availableProjects = projectsData || [];

  useEffect(() => {
    async function fetchTaskData() {
      try {
        const res = await fetch(`/api/tickets/${ticket.id}/tasks`);
        if (res.ok) {
          const data = await res.json();
          const tasks = data.tasks || [];
          setTaskCount(tasks.length);
          
          // Count tasks that are not completed
          const dueTasks = tasks.filter((task: any) => 
            task.status !== 'completed' && task.status !== 'cancelled'
          );
          setTasksDue(dueTasks.length);
        }
      } catch (error) {
        console.error('Failed to fetch task data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchTaskData();
  }, [ticket.id]);

  const completionDate = ticket.aiEta ? new Date(ticket.aiEta).toLocaleDateString() : '—';

  async function assignProject(projectId: string) {
    try {
      const res = await fetch('/api/support/tickets/assign-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId: ticket.id, projectId })
      });
      if (res.ok) {
        setAssignedProject(projectId);
        setShowProjectDropdown(false);
      }
    } catch (error) {
      console.error('Failed to assign project:', error);
    }
  }

  async function closeTicket() {
    try {
      const res = await fetch('/api/support/tickets/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId: ticket.id })
      });
      if (res.ok) {
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to close ticket:', error);
    }
  }

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3 text-sm text-gray-900">
        {ticket.projectName}
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">
        {ticket.domain || '—'}
      </td>
      <td className="px-4 py-3 text-sm text-gray-600 relative">
        <div className="relative">
          <button
            onClick={() => setShowProjectDropdown(!showProjectDropdown)}
            className="text-blue-600 hover:text-blue-800 text-xs font-medium"
          >
            {assignedProject ? 
              (availableProjects.find(p => p.id === assignedProject)?.name || 'Unknown Project') : 
              'Assign'
            }
          </button>
          {showProjectDropdown && (
            <div className="absolute top-6 left-0 bg-white border rounded shadow-lg z-10 min-w-48">
              <div className="p-2">
                <div className="text-xs text-gray-500 mb-2">Select Project:</div>
                <div className="space-y-1">
                  <button
                    onClick={() => assignProject('')}
                    className="block w-full text-left px-2 py-1 text-xs hover:bg-gray-100 rounded"
                  >
                    — Unassigned
                  </button>
                  {availableProjects.map(project => (
                    <button
                      key={project.id}
                      onClick={() => assignProject(project.id)}
                      className="block w-full text-left px-2 py-1 text-xs hover:bg-gray-100 rounded"
                    >
                      {project.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          ticket.priority === 'urgent' ? 'bg-red-100 text-red-800' :
          ticket.priority === 'high' ? 'bg-orange-100 text-orange-800' :
          ticket.priority === 'normal' ? 'bg-blue-100 text-blue-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {ticket.priority}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">
        {loading ? '...' : taskCount}
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">
        {loading ? '...' : tasksDue}
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">
        {completionDate}
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          ticket.status === 'new' ? 'bg-green-100 text-green-800' :
          ticket.status === 'viewed' ? 'bg-blue-100 text-blue-800' :
          ticket.status === 'pending_tasks' ? 'bg-orange-100 text-orange-800' :
          ticket.status === 'complete' ? 'bg-emerald-100 text-emerald-800' :
          ticket.status === 'in_review' ? 'bg-yellow-100 text-yellow-800' :
          ticket.status === 'responded' ? 'bg-purple-100 text-purple-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {ticket.status.replace('_', ' ')}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={onOpen}
            className="text-blue-600 hover:text-blue-800 p-1"
            title="Open ticket details"
          >
            <Eye className="h-4 w-4" />
          </button>
          {ticket.status !== 'complete' && (
            <button
              onClick={closeTicket}
              className="text-green-600 hover:text-green-800 p-1"
              title="Close ticket"
            >
              <CheckCircle className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={onDelete}
            className="text-red-600 hover:text-red-800 p-1"
            title="Delete ticket"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

function TicketDetailsModal({ 
  ticket, 
  onClose, 
  summary, 
  proposed, 
  suggestedProject, 
  availableProjects,
  onSummaryChange,
  onProposedChange,
  onSuggestedProjectChange,
  onAvailableProjectsChange,
  onAiPropose,
  onAcceptSelected
}: {
  ticket: Ticket;
  onClose: () => void;
  summary: string;
  proposed: Array<{
    id: string;
    title: string;
    description?: string;
    projectId?: string;
    accepted?: boolean;
    estimatedHours?: number;
  }>;
  suggestedProject: { id: string; name: string; reason: string } | null;
  availableProjects: Array<{ id: string; name: string }>;
  onSummaryChange: (summary: string) => void;
  onProposedChange: (proposed: any[]) => void;
  onSuggestedProjectChange: (project: any) => void;
  onAvailableProjectsChange: (projects: any[]) => void;
  onAiPropose: () => void;
  onAcceptSelected: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-4xl max-h-[90vh] rounded-2xl bg-white shadow-xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">{ticket.projectName}</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>
        
        <div className="p-4 max-h-[calc(90vh-80px)] overflow-y-auto">
          <div className="space-y-4">
            <header className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm text-gray-700">
                  <div>👤 {ticket.customerName} ({ticket.customerEmail})</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {(ticket.domain || '—')} · Priority: <span className="font-medium">{ticket.priority}</span>
                    {ticket.dueDateSuggested && ` · Requested: ${ticket.dueDateSuggested}`}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={onAiPropose} 
                  className="rounded-lg bg-black px-3 py-2 text-white text-sm hover:bg-gray-800 transition-colors"
                >
                  ✨ AI Tasks
                </button>
              </div>
            </header>

            <section className="rounded-lg border p-3 bg-gray-50">
              <div className="text-xs text-gray-600 mb-1 font-medium">Request Details</div>
              <div className="text-sm whitespace-pre-wrap">{ticket.details}</div>
            </section>

            {ticket.attachments && ticket.attachments.length > 0 && (
              <section className="rounded-lg border p-3 bg-blue-50">
                <div className="text-xs text-blue-700 mb-2 font-medium">📎 Attachments ({ticket.attachments.length})</div>
                <div className="space-y-2">
                  {ticket.attachments.map((attachment, idx) => (
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
            <AssociatedTasksSection ticketId={ticket.id} />

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
                      onProposedChange(updated);
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
                        onProposedChange(updated);
                      }}
                      className="rounded-lg border px-3 py-1.5 text-xs hover:bg-gray-50 transition-colors"
                    >
                      Select All
                    </button>
                    <button 
                      onClick={() => {
                        const updated = proposed.map(p => ({ ...p, accepted: false }));
                        onProposedChange(updated);
                      }}
                      className="rounded-lg border px-3 py-1.5 text-xs hover:bg-gray-50 transition-colors"
                    >
                      Clear All
                    </button>
                    <button 
                      onClick={onAcceptSelected} 
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
                          onProposedChange(newProposed);
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
                            onProposedChange(newProposed);
                          }}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => {
                            const newProposed = proposed.filter((_, i) => i !== idx);
                            onProposedChange(newProposed);
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
                            onProposedChange(newProposed);
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

            <TicketReplyBox ticketId={ticket.id} />
          </div>
        </div>
      </div>
    </div>
  );
}

function AssociatedTasksSection({ ticketId }: { ticketId: string}) {
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

  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId]);

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

