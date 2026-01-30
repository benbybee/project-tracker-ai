import { createHmac } from 'crypto';
import express from 'express';

const app = express();

const secret = process.env.PROJECT_TRACKER_WEBHOOK_SECRET;
if (!secret) {
  throw new Error('Missing PROJECT_TRACKER_WEBHOOK_SECRET');
}

// Capture raw body for signature verification
app.use(
  express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf.toString('utf8');
    },
  })
);

function verifySignature(rawBody: string, signature: string | undefined): boolean {
  if (!signature) return false;
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
  return expected === signature;
}

app.post('/api/webhooks/project-tracker', (req: any, res) => {
  const signature = req.headers['x-ideaforge-signature'] as string | undefined;
  if (!verifySignature(req.rawBody, signature)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const event = req.body;
  // Example handler: update IdeaForge execution state
  // TODO: map event.planTaskId -> idea plan task
  // TODO: update status/dueDate/notes in IdeaForge

  return res.json({ ok: true });
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Webhook server listening on ${port}`);
});
