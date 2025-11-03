-- Add note_attachments table
CREATE TABLE IF NOT EXISTS "note_attachments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "note_id" uuid NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "file_name" text NOT NULL,
  "file_size" bigint,
  "url" text
);

-- Add foreign key constraint
DO $$ BEGIN
  ALTER TABLE "note_attachments" 
  ADD CONSTRAINT "note_attachments_note_id_notes_id_fk" 
  FOREIGN KEY ("note_id") 
  REFERENCES "notes"("id") 
  ON DELETE cascade 
  ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS "note_attachments_note_id_idx" ON "note_attachments"("note_id");

