-- Fix foreign key constraint on activity_log.task_id to allow task deletion
-- When a task is deleted, set the task_id in activity_log to NULL instead of blocking deletion
-- This preserves the activity history while allowing tasks to be deleted

-- Drop the existing constraint
ALTER TABLE activity_log 
DROP CONSTRAINT IF EXISTS activity_log_task_id_tasks_id_fk;

-- Add the constraint back with ON DELETE SET NULL
ALTER TABLE activity_log 
ADD CONSTRAINT activity_log_task_id_tasks_id_fk 
FOREIGN KEY (task_id) 
REFERENCES tasks(id) 
ON DELETE SET NULL;

