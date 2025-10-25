'use client';

import { useState, useRef } from 'react';

export default function SupportRequestPage() {
  const [submitting, setSubmitting] = useState(false);
  const [ok, setOk] = useState<null|{ id: string; eta?: string }>(null);
  const [err, setErr] = useState<string|null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true); setErr(null); setOk(null);
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch('/api/support/submit', { method: 'POST', body: form });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Submission failed');
      }
      const data = await res.json();
      setOk({ id: data.id, eta: data.aiEta });
      if (formRef.current) {
        formRef.current.reset();
      }
    } catch (e:any) {
      setErr(e?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="text-3xl font-semibold mb-2">Support Request</h1>
        <p className="text-sm text-gray-600 mb-6">
          Submit your project request. You can attach files. <b>Suggested due date is not guaranteed.</b>
        </p>

        {ok && (
          <div className="mb-4 rounded-xl border bg-green-50 p-3 text-green-800">
            Thanks! Ticket ID: <b>{ok.id}</b>{ok.eta ? <> · Estimated completion: <b>{ok.eta}</b></> : null}
          </div>
        )}
        {err && <div className="mb-4 rounded-xl border bg-red-50 p-3 text-red-700">{err}</div>}

        <form ref={formRef} onSubmit={onSubmit} className="space-y-4 rounded-2xl border bg-white/80 p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">
                Your Name <span className="text-red-500">*</span>
              </label>
              <input required name="customerName" className="mt-1 w-full rounded-lg border px-3 py-2" />
            </div>
            <div>
              <label className="text-sm font-medium">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input required type="email" name="customerEmail" className="mt-1 w-full rounded-lg border px-3 py-2" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">
              Project Name <span className="text-red-500">*</span>
            </label>
            <input required name="projectName" className="mt-1 w-full rounded-lg border px-3 py-2" />
          </div>
          <div>
            <label className="text-sm font-medium">Domain</label>
            <input name="domain" placeholder="example.com" className="mt-1 w-full rounded-lg border px-3 py-2" />
          </div>
          <div>
            <label className="text-sm font-medium">
              Request Details <span className="text-red-500">*</span>
            </label>
            <textarea required name="details" rows={6} className="mt-1 w-full rounded-lg border px-3 py-2" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Suggested Due Date (not guaranteed)</label>
              <input type="date" name="dueDateSuggested" className="mt-1 w-full rounded-lg border px-3 py-2" />
            </div>
            <div>
              <label className="text-sm font-medium">Priority</label>
              <select name="priority" defaultValue="normal" className="mt-1 w-full rounded-lg border px-3 py-2">
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Attachments</label>
            <input name="files" type="file" multiple className="mt-1 w-full rounded-lg border px-3 py-2" />
            <p className="text-xs text-gray-500 mt-1">Screenshots, docs, etc. (storage stubbed; wire Blob/S3 later)</p>
          </div>
          <div className="pt-2">
            <button disabled={submitting} className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50">
              {submitting ? 'Submitting…' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

