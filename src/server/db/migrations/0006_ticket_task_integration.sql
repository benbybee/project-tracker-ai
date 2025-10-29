-- Add ticketId to tasks table to link tasks to tickets
ALTER TABLE "tasks" ADD COLUMN "ticket_id" uuid REFERENCES "tickets"("id");

-- Update ticket status enum to include new statuses
-- Note: This requires dropping and recreating the constraint
ALTER TABLE "tickets" DROP CONSTRAINT IF EXISTS "tickets_status_check";
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_status_check" 
  CHECK (status IN ('new', 'viewed', 'pending_tasks', 'complete', 'in_review', 'responded', 'converted', 'closed'));

-- Add index for ticket_id on tasks for better performance
CREATE INDEX IF NOT EXISTS "idx_tasks_ticket_id" ON "tasks"("ticket_id");
