# WordPress One-Click Login Integration

## Overview

The WordPress One-Click Login feature enables seamless authentication between your Task Tracker app and WordPress sites using the **Magic Login Pro** plugin by HandyPlugins. Users can access their WordPress admin panel with a single click, without entering passwords.

---

## Architecture

### Flow Diagram

```
User clicks "Open WordPress Site" button
  ↓
Task Tracker frontend calls /api/wordpress/login?projectId={id}
  ↓
Backend validates:
  - User is authenticated (session exists)
  - User owns the project
  - WordPress login is enabled for project
  ↓
Backend fetches project configuration:
  - domain (WordPress site URL)
  - wpApiKey (Magic Login Pro API key)
  - wpAdminEmail (WordPress admin email)
  ↓
Backend makes secure API call to WordPress:
  POST {domain}/wp-json/magic-login/v1/create
  Headers: Authorization: Bearer {wpApiKey}
  Body: { email: wpAdminEmail }
  ↓
WordPress Magic Login Pro returns:
  { link: "https://site.com/wp-login.php?key=abc123..." }
  ↓
Backend redirects browser to magic link
  ↓
User is automatically logged into WordPress admin
```

---

## Prerequisites

### WordPress Site Requirements

1. **WordPress Plugin**: Install and activate **Magic Login Pro** by HandyPlugins
   - Plugin URL: https://handyplugins.co/magic-login-pro/
   - Provides passwordless authentication via REST API

2. **WordPress Configuration**:
   - WordPress must be accessible via HTTPS (required for security)
   - REST API must be enabled (default in WordPress)
   - Permalink structure must not be "Plain" (for REST API to work)

3. **Magic Login Pro Setup**:
   - Navigate to: WordPress Admin → Settings → Magic Login Pro
   - Enable REST API authentication
   - Generate an API key (Bearer token)
   - Configure security settings:
     - Domain whitelist: Add your Task Tracker domain
     - IP restrictions: Optional, but recommended for production
     - Magic link TTL: 5 minutes (default, one-time use)

---

## Task Tracker Configuration

### Database Schema

Three new fields are added to the `projects` table:

| Field               | Type            | Description                                        |
| ------------------- | --------------- | -------------------------------------------------- |
| `wpOneClickEnabled` | boolean         | Enables WordPress one-click login for this project |
| `wpAdminEmail`      | text (nullable) | WordPress admin email for authentication           |
| `wpApiKey`          | text (nullable) | Magic Login Pro API key (stored encrypted)         |

### Environment Variables (Optional)

You can set a global fallback API key in `.env` (not required):

```env
# WordPress Magic Login (Optional Global Default)
WP_GLOBAL_API_KEY=your-default-api-key
```

**Note**: Per-project API keys (stored in database) take precedence over global defaults.

---

## Setup Instructions

### For New Projects

1. Navigate to **Projects → New Project**
2. Select project type: **Website**
3. Fill in required fields (Name, Domain)
4. **Enable WordPress One-Click Login**:
   - Check the "Enable One-Click WordPress Login" checkbox
   - Enter **WordPress Admin Email** (the email of the WordPress user to log in as)
   - Enter **WordPress API Key** (from Magic Login Pro settings)
5. Click **Create Project**

### For Existing Projects

1. Navigate to the project page
2. Click **Edit** button in the project header
3. **Enable WordPress One-Click Login**:
   - Check the "Enable One-Click WordPress Login" checkbox
   - Enter **WordPress Admin Email**
   - Enter **WordPress API Key**
4. Click **Save Changes**

---

## Usage

### Accessing WordPress Admin

Once WordPress one-click login is enabled for a project, you'll see login buttons in two places:

#### 1. Project Header (Quick Access)

- Look for the **"Open WordPress Site"** button next to Sync/Edit/Delete
- Click to open WordPress admin in a new context

#### 2. Project Metadata Cards (Website Projects)

- Scroll to the website details section
- Find the **"WordPress Admin"** card
- Click "One-Click Login Available" to access

**Behavior**: Clicking either button will redirect you directly to the WordPress admin dashboard, fully authenticated.

---

## Security

### Authentication & Authorization

- **Session Validation**: User must be logged into Task Tracker
- **Row-Level Security**: User must own the project
- **Server-Side Only**: API keys never exposed to client-side JavaScript
- **HTTPS Required**: All WordPress sites must use HTTPS

### Rate Limiting

To prevent abuse, the WordPress login endpoint is rate-limited:

- **5 requests per user per minute**
- **429 Too Many Requests** response if exceeded
- Rate limits reset every 60 seconds

### API Key Storage

- API keys are stored encrypted in the database
- Keys are decrypted only during API calls (server-side)
- Never logged or transmitted to client

### WordPress Security Best Practices

1. **Domain Whitelisting**: Configure Magic Login Pro to only accept requests from your Task Tracker domain
2. **IP Restrictions**: Optionally restrict API calls to specific IP ranges
3. **Short TTL**: Magic links expire in 5 minutes and are single-use
4. **User Permissions**: WordPress users should have appropriate role permissions (avoid using Super Admin for routine logins)

---

## Troubleshooting

### Common Issues

#### "WordPress API Error: Invalid API Key"

**Solution**:

- Verify the API key in Magic Login Pro settings
- Ensure the key is copied correctly (no extra spaces)
- Regenerate the API key if necessary

#### "WordPress API Error: Email not found"

**Solution**:

- Verify the WordPress admin email exists in WordPress
- Check that the user account is active
- Ensure the email matches exactly (case-sensitive)

#### "Rate Limit Exceeded"

**Solution**:

- Wait 60 seconds before trying again
- Avoid clicking the login button multiple times rapidly

#### "CORS Error" or "Network Error"

**Solution**:

- Verify WordPress site is accessible via HTTPS
- Check WordPress REST API is enabled: Visit `{domain}/wp-json/`
- Ensure Magic Login Pro plugin is active
- Verify domain whitelist in Magic Login Pro settings

#### Magic Link Redirects to 404

**Solution**:

- Check WordPress permalink settings (must not be "Plain")
- Re-save permalink settings: Settings → Permalinks → Save Changes
- Verify Magic Login Pro is up to date

---

## API Reference

### Task Tracker API Endpoint

#### `GET /api/wordpress/login`

Generates a magic link and redirects the user to WordPress admin.

**Query Parameters**:

- `projectId` (required): UUID of the project

**Authentication**:

- Requires valid session (user must be logged in)

**Rate Limiting**:

- 5 requests per user per minute

**Response**:

- **302 Redirect**: Redirects to WordPress magic link on success
- **401 Unauthorized**: User not authenticated
- **403 Forbidden**: User does not own project or WordPress login disabled
- **404 Not Found**: Project not found
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: WordPress API error (check logs)

**Example**:

```
GET /api/wordpress/login?projectId=550e8400-e29b-41d4-a716-446655440000
```

---

### WordPress Magic Login Pro API

#### `POST /wp-json/magic-login/v1/create`

Creates a one-time magic link for passwordless login.

**Headers**:

```
Authorization: Bearer {api_key}
Content-Type: application/json
```

**Body**:

```json
{
  "email": "admin@example.com"
}
```

**Response**:

```json
{
  "success": true,
  "link": "https://example.com/wp-login.php?key=abc123&user_id=1"
}
```

**Error Response**:

```json
{
  "success": false,
  "message": "User not found"
}
```

---

## Development & Testing

### Testing Locally

1. Set up a local WordPress installation with HTTPS (use Local by Flywheel or similar)
2. Install Magic Login Pro
3. Configure API key and domain whitelist
4. Create a test project in Task Tracker with WordPress login enabled
5. Test the login flow

### Testing Checklist

- [ ] Create new website project with WordPress login enabled
- [ ] Edit existing project to enable WordPress login
- [ ] Verify conditional fields show/hide based on checkbox
- [ ] Click login button from project header
- [ ] Click login button from metadata card
- [ ] Verify successful redirect to WordPress admin
- [ ] Test with invalid API key (should show error)
- [ ] Test with non-existent email (should show error)
- [ ] Test rate limiting (6th request in 1 minute should fail)
- [ ] Verify API keys are never visible in browser DevTools
- [ ] Test on mobile devices

---

## Deployment Notes

### Production Checklist

- [ ] WordPress site uses HTTPS (SSL certificate installed)
- [ ] Magic Login Pro plugin is installed and licensed
- [ ] API key is generated and stored securely
- [ ] Domain whitelist is configured in Magic Login Pro
- [ ] Rate limiting is enabled on Task Tracker API
- [ ] Error logging is configured for API failures
- [ ] Monitor WordPress and Task Tracker logs for issues

### Monitoring

Monitor these metrics:

- **Success rate**: Percentage of successful login attempts
- **Error rate**: Track specific error types (invalid key, user not found, etc.)
- **Rate limit hits**: How often users hit rate limits
- **Response time**: WordPress API response times

---

## FAQ

### Q: Can I use this with multiple WordPress sites?

**A**: Yes! Each project can have its own WordPress configuration. Simply enable WordPress login per project with unique API keys and admin emails.

### Q: Do I need Magic Login Pro or will the free version work?

**A**: You need **Magic Login Pro** (premium version). The free version does not include the REST API functionality required for this integration.

### Q: Can I log in as different WordPress users?

**A**: Yes, change the `wpAdminEmail` field in the project settings to the desired WordPress user's email address.

### Q: What happens if the magic link expires?

**A**: Magic links expire after 5 minutes (configurable in Magic Login Pro). Simply click the login button again to generate a new link.

### Q: Is this secure?

**A**: Yes, when properly configured:

- API keys are encrypted in the database
- Magic links are one-time use with short TTL
- Domain whitelisting prevents unauthorized access
- Rate limiting prevents abuse
- All communication is over HTTPS

### Q: Can I use this for non-WordPress sites?

**A**: No, this integration is specifically designed for WordPress sites using the Magic Login Pro plugin. For other platforms, you would need a different integration approach.

---

## Support

For issues related to:

- **Task Tracker app**: Check application logs and verify project configuration
- **Magic Login Pro**: Consult plugin documentation at https://handyplugins.co/magic-login-pro/docs/
- **WordPress API**: Ensure REST API is enabled and accessible

---

## License & Attribution

- **Task Tracker**: Custom implementation
- **Magic Login Pro**: By HandyPlugins (premium license required)
- **WordPress REST API**: GPL v2 or later

---

## Changelog

### v1.0.0 (Initial Release)

- One-click WordPress login integration
- Per-project API key configuration
- Rate limiting (5 req/min per user)
- Security hardening (encryption, session validation)
- Documentation and testing checklist
