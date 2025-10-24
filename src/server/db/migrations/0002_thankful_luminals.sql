ALTER TABLE "projects" ADD COLUMN "website_status" text;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "archived" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "archived_at" timestamp;