/**
 * Parse opportunities from a markdown file
 * 
 * Expected format:
 * 
 * # Opportunity Name
 * 
 * **Type:** MAJOR | MICRO
 * **Lane:** Marketing (optional)
 * **Complexity:** Low | Medium | High (optional)
 * **Estimated Cost:** 5000 (optional)
 * **Priority:** 1-4 (optional)
 * **Status:** IDEA | PLANNING | ACTIVE | ON_HOLD (optional, defaults to IDEA)
 * 
 * ## Summary
 * Brief description here
 * 
 * ## Details
 * Detailed description here
 * 
 * ## Go-to-Market
 * Go-to-market strategy here
 * 
 * ## Notes
 * Additional notes here
 * 
 * ---
 * 
 * (Repeat for each opportunity)
 */

interface ParsedOpportunity {
  name: string;
  type: 'MAJOR' | 'MICRO';
  lane?: string;
  summary?: string;
  complexity?: string;
  estimatedCost?: string;
  goToMarket?: string;
  details?: string;
  status?: 'IDEA' | 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'KILLED';
  priority?: number;
  notes?: string;
}

export function parseOpportunitiesFromMarkdown(
  markdown: string
): ParsedOpportunity[] {
  const opportunities: ParsedOpportunity[] = [];

  // Split by horizontal rules (---) or double h1 headers
  const blocks = markdown.split(/(?:^|\n)---+(?:\n|$)/gm);

  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;

    try {
      const opportunity = parseOpportunityBlock(trimmed);
      if (opportunity) {
        opportunities.push(opportunity);
      }
    } catch (error) {
      console.error('Error parsing opportunity block:', error);
      // Continue processing other blocks
    }
  }

  return opportunities;
}

function parseOpportunityBlock(block: string): ParsedOpportunity | null {
  const lines = block.split('\n');
  
  // Extract title (first h1)
  const titleMatch = block.match(/^#\s+(.+)$/m);
  if (!titleMatch) return null;
  
  const name = titleMatch[1].trim();
  if (!name) return null;

  // Extract metadata fields
  const typeMatch = block.match(/\*\*Type:\*\*\s*(MAJOR|MICRO)/i);
  if (!typeMatch) return null; // Type is required
  
  const type = typeMatch[1].toUpperCase() as 'MAJOR' | 'MICRO';

  const laneMatch = block.match(/\*\*Lane:\*\*\s*(.+?)(?:\n|$)/i);
  const lane = laneMatch ? laneMatch[1].trim() : undefined;

  const complexityMatch = block.match(/\*\*Complexity:\*\*\s*(Low|Medium|High)/i);
  const complexity = complexityMatch ? complexityMatch[1] : undefined;

  const costMatch = block.match(/\*\*Estimated Cost:\*\*\s*\$?(\d+(?:\.\d{2})?)/i);
  const estimatedCost = costMatch ? costMatch[1] : undefined;

  const priorityMatch = block.match(/\*\*Priority:\*\*\s*([1-4])/i);
  const priority = priorityMatch ? parseInt(priorityMatch[1], 10) : undefined;

  const statusMatch = block.match(/\*\*Status:\*\*\s*(IDEA|PLANNING|ACTIVE|ON_HOLD|COMPLETED|KILLED)/i);
  const status = statusMatch
    ? (statusMatch[1].toUpperCase() as ParsedOpportunity['status'])
    : undefined;

  // Extract section content
  const summary = extractSection(block, 'Summary');
  const details = extractSection(block, 'Details');
  const goToMarket = extractSection(block, 'Go-to-Market');
  const notes = extractSection(block, 'Notes');

  return {
    name,
    type,
    lane,
    summary,
    complexity,
    estimatedCost,
    goToMarket,
    details,
    status,
    priority,
    notes,
  };
}

function extractSection(block: string, sectionName: string): string | undefined {
  // Match ## Section Name followed by content until next ## or end
  const regex = new RegExp(
    `##\\s+${sectionName}\\s*\\n([\\s\\S]*?)(?=\\n##|$)`,
    'i'
  );
  const match = block.match(regex);
  
  if (!match) return undefined;
  
  const content = match[1].trim();
  return content || undefined;
}

