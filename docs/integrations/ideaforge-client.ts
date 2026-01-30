import crypto from 'crypto';

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

export type IdeaForgeClientConfig = {
  baseUrl: string;
  apiKey: string;
};

export class IdeaForgeClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(config: IdeaForgeClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.apiKey = config.apiKey;
  }

  private async request<T>(
    method: HttpMethod,
    path: string,
    body?: unknown
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Request failed (${response.status}): ${text}`);
    }

    return (await response.json()) as T;
  }

  // Pattern4
  listSprints() {
    return this.request('GET', '/api/ideaforge/pattern4/sprints');
  }

  createSprint(payload: {
    name: string;
    startDate: string;
    endDate: string;
    goalSummary?: string;
  }) {
    return this.request('POST', '/api/ideaforge/pattern4/sprints', payload);
  }

  completeSprint(id: string) {
    return this.request('POST', `/api/ideaforge/pattern4/sprints/${id}/complete`);
  }

  generateWeeks(sprintId: string) {
    return this.request('POST', '/api/ideaforge/pattern4/weeks/generate', {
      sprintId,
    });
  }

  createOpportunity(payload: {
    name: string;
    type: 'MAJOR' | 'MICRO';
    sprintId?: string;
    lane?: string;
    summary?: string;
    estimatedCost?: string;
    priority?: number;
  }) {
    return this.request(
      'POST',
      '/api/ideaforge/pattern4/opportunities',
      payload
    );
  }

  completeOpportunity(
    id: string,
    payload: {
      actualCost?: string;
      revenue?: string;
      profit?: string;
      decision: 'KEEP' | 'ADJUST' | 'CANCEL' | 'UNDECIDED';
      outcomeNotes?: string;
    }
  ) {
    return this.request(
      'POST',
      `/api/ideaforge/pattern4/opportunities/${id}/complete`,
      payload
    );
  }

  killOpportunity(id: string, payload: { outcomeNotes?: string }) {
    return this.request(
      'POST',
      `/api/ideaforge/pattern4/opportunities/${id}/kill`,
      payload
    );
  }

  // Task sync
  syncTasks(payload: {
    ideaId: string;
    planVersion: string;
    tasks: Array<{
      planTaskId: string;
      title: string;
      description?: string | null;
      priority?: number;
      budgetPlanned?: string | null;
      sprintId?: string | null;
      sprintWeekId?: string | null;
      opportunityId?: string | null;
      dueDate?: string | null;
      projectId?: string | null;
      projectName?: string;
    }>;
  }) {
    return this.request('POST', '/api/ideaforge/tasks/sync', payload);
  }

  fetchChanges(since?: string) {
    const suffix = since ? `?since=${encodeURIComponent(since)}` : '';
    return this.request('GET', `/api/ideaforge/tasks/changes${suffix}`);
  }

  addTaskNote(id: string, payload: { content: string; contentHtml?: string }) {
    return this.request('POST', `/api/ideaforge/tasks/${id}/notes`, payload);
  }
}

// Webhook verification helper (IdeaForge side)
export function verifyWebhookSignature(params: {
  rawBody: string;
  secret: string;
  signature: string | undefined;
}): boolean {
  if (!params.signature) return false;
  const expected = crypto
    .createHmac('sha256', params.secret)
    .update(params.rawBody)
    .digest('hex');
  return expected === params.signature;
}
