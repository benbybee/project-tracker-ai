type EnvConfig = {
  baseUrl: string;
  apiKey: string;
};

function getConfig(): EnvConfig {
  const baseUrl = process.env.PROJECT_TRACKER_BASE_URL;
  const apiKey = process.env.PROJECT_TRACKER_INTEGRATION_KEY;
  if (!baseUrl || !apiKey) {
    throw new Error('Missing PROJECT_TRACKER_BASE_URL or PROJECT_TRACKER_INTEGRATION_KEY');
  }
  return { baseUrl: baseUrl.replace(/\/$/, ''), apiKey };
}

async function request(method: string, path: string, body?: unknown) {
  const { baseUrl, apiKey } = getConfig();
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${method} ${path} failed (${response.status}): ${text}`);
  }

  return response.json();
}

async function run() {
  const sprint = await request('POST', '/api/ideaforge/pattern4/sprints', {
    name: `IdeaForge Sprint ${Date.now()}`,
    startDate: '2026-01-01',
    endDate: '2026-03-31',
  });

  const sprintId = sprint.sprint?.id;
  if (!sprintId) throw new Error('Sprint creation failed');

  await request('POST', '/api/ideaforge/pattern4/weeks/generate', { sprintId });

  const opportunity = await request(
    'POST',
    '/api/ideaforge/pattern4/opportunities',
    {
      name: 'Smoke Test Opportunity',
      type: 'MICRO',
      sprintId,
      priority: 2,
    }
  );

  const opportunityId = opportunity.opportunity?.id;

  const sync = await request('POST', '/api/ideaforge/tasks/sync', {
    ideaId: 'smoke_idea',
    planVersion: 'v1',
    tasks: [
      {
        planTaskId: 'smoke_task_1',
        title: 'Smoke Test Task',
        priority: 2,
        sprintId,
        opportunityId,
        projectName: 'IdeaForge',
      },
    ],
  });

  const taskId = sync.mappedTasks?.[0]?.taskId;
  if (!taskId) throw new Error('Task sync failed');

  await request('POST', `/api/ideaforge/tasks/${taskId}/notes`, {
    content: 'Smoke test note',
  });

  const changes = await request('GET', `/api/ideaforge/tasks/changes?since=1970-01-01T00:00:00.000Z`);

  console.log('Smoke test complete', { sprintId, opportunityId, taskId, changesCount: changes?.tasks?.length });
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
