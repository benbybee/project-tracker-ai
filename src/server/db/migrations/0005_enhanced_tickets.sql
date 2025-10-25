-- Enhanced tickets with customer details and project suggestions
-- Migration 0005: Add customer fields and project suggestions to tickets

-- Add customer name and email fields
ALTER TABLE "tickets" ADD COLUMN "customer_name" text NOT NULL DEFAULT '';
ALTER TABLE "tickets" ADD COLUMN "customer_email" text NOT NULL DEFAULT '';

-- Add suggested project reference
ALTER TABLE "tickets" ADD COLUMN "suggested_project_id" uuid REFERENCES "projects"("id");

-- Remove old requester_email field (data will be lost, but this is expected for the enhancement)
ALTER TABLE "tickets" DROP COLUMN "requester_email";

-- Update existing tickets to have placeholder customer data
UPDATE "tickets" SET 
  "customer_name" = 'Legacy Customer',
  "customer_email" = 'legacy@example.com'
WHERE "customer_name" = '' OR "customer_email" = '';

-- Make customer fields NOT NULL after populating
ALTER TABLE "tickets" ALTER COLUMN "customer_name" SET NOT NULL;
ALTER TABLE "tickets" ALTER COLUMN "customer_email" SET NOT NULL;
