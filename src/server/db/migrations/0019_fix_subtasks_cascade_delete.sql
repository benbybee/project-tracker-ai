-- Fix subtasks foreign key constraint to cascade on delete
-- This allows tasks to be deleted without orphaning subtasks

-- Drop the existing foreign key constraint
ALTER TABLE "subtasks" DROP CONSTRAINT IF EXISTS "subtasks_task_id_tasks_id_fk";

-- Recreate the foreign key constraint with ON DELETE CASCADE
ALTER TABLE "subtasks" 
  ADD CONSTRAINT "subtasks_task_id_tasks_id_fk" 
  FOREIGN KEY ("task_id") 
  REFERENCES "tasks"("id") 
  ON DELETE CASCADE 
  ON UPDATE NO ACTION;

