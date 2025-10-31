-- Add WordPress one-click login fields to projects table
ALTER TABLE projects ADD COLUMN wp_one_click_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE projects ADD COLUMN wp_admin_email TEXT;
ALTER TABLE projects ADD COLUMN wp_api_key TEXT;

-- Add comments for documentation
COMMENT ON COLUMN projects.wp_one_click_enabled IS 'Enables one-click WordPress login for this project';
COMMENT ON COLUMN projects.wp_admin_email IS 'WordPress admin email for Magic Login authentication';
COMMENT ON COLUMN projects.wp_api_key IS 'Magic Login Pro API key (stored encrypted)';

