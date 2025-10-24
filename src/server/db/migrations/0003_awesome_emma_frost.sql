CREATE TABLE IF NOT EXISTS "plaud_pending" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"confidence" integer,
	"source_id" text,
	"suggested_project_name" text
);
