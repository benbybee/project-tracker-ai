# 📤 Bulk Opportunity Upload Feature

## Overview

The bulk opportunity upload feature allows you to create multiple opportunities at once by uploading a structured markdown (.md) file. This is particularly useful for:
- Migrating opportunities from other systems
- Planning quarterly or annual opportunity pipelines
- Quickly populating your opportunity backlog
- Sharing opportunity templates across teams

## Features

✅ **Drag & Drop Upload** - Simple drag-and-drop interface for .md files  
✅ **Batch Processing** - Create dozens of opportunities in seconds  
✅ **Validation** - Automatic validation of required fields  
✅ **Sprint Association** - Optionally associate opportunities with active sprint  
✅ **Status Preservation** - Maintains opportunity status from file  
✅ **Error Handling** - Clear error messages for troubleshooting

## How to Use

### Step 1: Prepare Your Markdown File

Create a `.md` file with your opportunities using the following format:

```markdown
# Opportunity Name

**Type:** MAJOR or MICRO
**Lane:** Marketing (optional)
**Complexity:** Low, Medium, or High (optional)
**Estimated Cost:** 5000 (optional)
**Priority:** 1-4 (optional)
**Status:** IDEA, PLANNING, ACTIVE, or ON_HOLD (optional)

## Summary
Brief description of the opportunity

## Details
Detailed description with requirements, scope, etc.

## Go-to-Market
Strategy for bringing this opportunity to market

## Notes
Additional notes and considerations

---

(Repeat for next opportunity)
```

### Step 2: Upload the File

1. Navigate to **Pattern 4 > Opportunities**
2. Click the **"Bulk Upload"** button in the top-right corner
3. Either:
   - Drag and drop your `.md` file into the upload area, OR
   - Click **"Select File"** to browse for your file
4. Review the file name and size
5. Click **"Upload & Create Opportunities"**

### Step 3: Verify Creation

- A success message will display showing how many opportunities were created
- The page will automatically refresh to show your new opportunities
- Filter by status to view specific opportunity types

## Field Requirements

### Required Fields
- **Name** (H1 heading)
- **Type** (MAJOR or MICRO)

### Optional Fields
- **Lane** - Category or team (e.g., Marketing, Sales, Product)
- **Complexity** - Low, Medium, or High
- **Estimated Cost** - Numeric value (will be stored as decimal)
- **Priority** - 1-4 (1 = highest, 4 = lowest, defaults to 3)
- **Status** - IDEA, PLANNING, ACTIVE, ON_HOLD, COMPLETED, or KILLED (defaults to IDEA)
- **Summary** - Brief description
- **Details** - Comprehensive details
- **Go-to-Market** - Marketing/launch strategy
- **Notes** - Additional information

## Example Template

See `opportunities-template.md` in the root directory for a complete example with 5 different opportunities demonstrating various configurations.

## Markdown Format Details

### Separating Opportunities

Use horizontal rules (`---`) to separate opportunities:

```markdown
# First Opportunity
...content...

---

# Second Opportunity
...content...
```

### Metadata Format

Metadata must use bold text with colons:

```markdown
**Type:** MICRO
**Priority:** 2
```

**Important:** Field names are case-insensitive, but values for Type and Status must match exactly.

### Section Headers

Use level 2 headers (`##`) for sections:

```markdown
## Summary
Your summary text here

## Details
Your details here
```

## Tips & Best Practices

1. **Start Simple** - Begin with just name and type, add details later
2. **Use Template** - Copy `opportunities-template.md` as a starting point
3. **Validate Locally** - Review your markdown file before uploading
4. **Test First** - Try uploading 1-2 opportunities before bulk uploading dozens
5. **Backup** - Keep a copy of your markdown file for reference
6. **Consistent Formatting** - Maintain consistent spacing and formatting
7. **Sprint Association** - Upload when you have an active sprint for automatic association

## Error Messages

### "No file provided"
- Make sure you've selected a file before clicking upload

### "Only .md files are supported"
- File must have `.md` extension (not `.txt`, `.doc`, etc.)

### "No valid opportunities found in the file"
- Check that your file has at least one opportunity with required fields (Name and Type)
- Verify format matches the template exactly

### "Unauthorized"
- You must be logged in to upload opportunities

## Technical Details

### API Endpoint
```
POST /api/opportunities/bulk-upload
Content-Type: multipart/form-data
```

### Request Format
```typescript
FormData {
  file: File,           // .md file
  sprintId?: string    // Optional sprint UUID
}
```

### Response Format
```typescript
{
  success: boolean,
  count: number,
  opportunities: Opportunity[]
}
```

### Parser Logic
- Located at `src/lib/parse-opportunities-md.ts`
- Uses regex-based parsing for metadata and sections
- Splits opportunities by horizontal rules (`---`)
- Validates required fields before creation

### Database Schema
Opportunities are stored in the `opportunities` table with the following structure:
- `id` - UUID (auto-generated)
- `userId` - UUID (from session)
- `name` - Text (required)
- `type` - Enum: MAJOR | MICRO (required)
- `lane` - Text (optional)
- `summary` - Text (optional)
- `complexity` - Text (optional)
- `estimatedCost` - Decimal (optional)
- `goToMarket` - Text (optional)
- `details` - Text (optional)
- `status` - Enum (defaults to IDEA)
- `priority` - Integer 1-4 (defaults to 3)
- `notes` - Text (optional)
- `sprintId` - UUID (optional)
- `createdAt` - Timestamp (auto)
- `updatedAt` - Timestamp (auto)

## Security Considerations

✅ **Authentication Required** - Only authenticated users can upload  
✅ **User Isolation** - Opportunities are associated with the uploading user  
✅ **File Type Validation** - Only .md files accepted  
✅ **Rate Limiting** - API route respects global rate limits  
✅ **Input Sanitization** - All fields sanitized before database insertion  
✅ **No Script Execution** - Markdown is parsed, not executed

## Troubleshooting

### Upload Button Disabled
- Ensure you've selected a valid .md file
- Check that you're not already uploading

### Opportunities Not Appearing
- Verify the status filter isn't hiding them
- Check that Type field matches exactly (case-sensitive)
- Ensure proper formatting with `---` separators

### Partial Upload
- If some opportunities failed, check the error message
- Review the formatting of failed opportunities
- Re-upload only the failed opportunities

### Need Help?
Review the `opportunities-template.md` file for a working example, or check the console logs for detailed error messages.

## Future Enhancements

Potential features for future releases:
- [ ] CSV upload support
- [ ] Excel file import
- [ ] Duplicate detection
- [ ] Preview before upload
- [ ] Edit uploaded opportunities before saving
- [ ] Import from external services (Notion, Airtable, etc.)
- [ ] Opportunity templates library
- [ ] Auto-generate opportunities from AI prompts

