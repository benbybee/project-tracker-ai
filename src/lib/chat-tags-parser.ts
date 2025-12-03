import {
  format,
  addDays,
  addWeeks,
  startOfDay,
  nextMonday,
  nextTuesday,
  nextWednesday,
  nextThursday,
  nextFriday,
  nextSaturday,
  nextSunday,
} from 'date-fns';

export interface ParsedTags {
  projects: string[]; // Project IDs
  task?: string;
  projectName?: string;
  userRole?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string; // ISO date string
  status?: 'not_started' | 'in_progress' | 'completed' | 'blocked';
  notes?: string;
}

export interface ParsedMessage {
  originalMessage: string;
  cleanMessage: string; // Tags stripped, cleaned for AI
  tags: ParsedTags;
  unmatchedProjects: string[]; // Project names that couldn't be matched
  errors: string[]; // Validation errors
  hasErrors: boolean;
}

interface Project {
  id: string;
  name: string;
}

interface Role {
  id: string;
  name: string;
}

interface ParserContext {
  projects: Project[];
  roles: Role[];
}

const PRIORITY_MAP: Record<string, 'low' | 'medium' | 'high' | 'urgent'> = {
  low: 'low',
  l: 'low',
  '1': 'low',
  medium: 'medium',
  med: 'medium',
  m: 'medium',
  '2': 'medium',
  high: 'high',
  h: 'high',
  '3': 'high',
  urgent: 'urgent',
  u: 'urgent',
  critical: 'urgent',
  '4': 'urgent',
};

const STATUS_MAP: Record<
  string,
  'not_started' | 'in_progress' | 'completed' | 'blocked'
> = {
  not_started: 'not_started',
  'not started': 'not_started',
  todo: 'not_started',
  pending: 'not_started',
  in_progress: 'in_progress',
  'in progress': 'in_progress',
  inprogress: 'in_progress',
  active: 'in_progress',
  working: 'in_progress',
  completed: 'completed',
  done: 'completed',
  finished: 'completed',
  complete: 'completed',
  blocked: 'blocked',
  stuck: 'blocked',
  waiting: 'blocked',
};

/**
 * Parse natural language date to ISO string
 */
function parseNaturalDate(dateStr: string): string | null {
  const normalized = dateStr.toLowerCase().trim();
  const now = new Date();

  try {
    // Relative days
    if (normalized === 'today') {
      return format(startOfDay(now), 'yyyy-MM-dd');
    }
    if (normalized === 'tomorrow') {
      return format(addDays(startOfDay(now), 1), 'yyyy-MM-dd');
    }
    if (normalized === 'yesterday') {
      return format(addDays(startOfDay(now), -1), 'yyyy-MM-dd');
    }

    // "in X days/weeks"
    const inDaysMatch = normalized.match(/^in\s+(\d+)\s+days?$/);
    if (inDaysMatch) {
      return format(
        addDays(startOfDay(now), parseInt(inDaysMatch[1])),
        'yyyy-MM-dd'
      );
    }

    const inWeeksMatch = normalized.match(/^in\s+(\d+)\s+weeks?$/);
    if (inWeeksMatch) {
      return format(
        addWeeks(startOfDay(now), parseInt(inWeeksMatch[1])),
        'yyyy-MM-dd'
      );
    }

    // Next week
    if (normalized === 'next week') {
      return format(addWeeks(startOfDay(now), 1), 'yyyy-MM-dd');
    }

    // Specific weekdays
    const dayMap: Record<string, (date: Date) => Date> = {
      monday: nextMonday,
      tuesday: nextTuesday,
      wednesday: nextWednesday,
      thursday: nextThursday,
      friday: nextFriday,
      saturday: nextSaturday,
      sunday: nextSunday,
      mon: nextMonday,
      tue: nextTuesday,
      wed: nextWednesday,
      thu: nextThursday,
      fri: nextFriday,
      sat: nextSaturday,
      sun: nextSunday,
    };

    // "next monday", "this friday", etc.
    const dayMatch = normalized.match(/^(?:next|this)\s+(\w+)$/);
    if (dayMatch && dayMap[dayMatch[1]]) {
      return format(dayMap[dayMatch[1]](startOfDay(now)), 'yyyy-MM-dd');
    }

    // Just day name (assume next occurrence)
    if (dayMap[normalized]) {
      return format(dayMap[normalized](startOfDay(now)), 'yyyy-MM-dd');
    }

    // ISO date format (YYYY-MM-DD)
    if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
      const date = new Date(normalized);
      if (!isNaN(date.getTime())) {
        return normalized;
      }
    }

    // Common date formats (MM/DD/YYYY, DD/MM/YYYY)
    const slashDateMatch = normalized.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (slashDateMatch) {
      const [, part1, part2, year] = slashDateMatch;
      // Assume MM/DD/YYYY for US format
      const date = new Date(
        parseInt(year),
        parseInt(part1) - 1,
        parseInt(part2)
      );
      if (!isNaN(date.getTime())) {
        return format(date, 'yyyy-MM-dd');
      }
    }

    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Extract quoted value or value until next tag/end
 */
function extractValue(
  text: string,
  startPos: number
): { value: string; endPos: number } {
  let pos = startPos;

  // Skip whitespace
  while (pos < text.length && /\s/.test(text[pos])) {
    pos++;
  }

  // Handle quoted values
  if (text[pos] === '"') {
    pos++; // Skip opening quote
    const start = pos;
    while (pos < text.length && text[pos] !== '"') {
      pos++;
    }
    return { value: text.substring(start, pos).trim(), endPos: pos + 1 };
  }

  // Handle unquoted values (until next @ or / or end)
  const start = pos;
  while (pos < text.length && text[pos] !== '@' && text[pos] !== '/') {
    pos++;
  }

  return { value: text.substring(start, pos).trim(), endPos: pos };
}

/**
 * Find fuzzy match for project name
 */
function findProject(name: string, projects: Project[]): Project | null {
  const normalized = name.toLowerCase().trim();

  // Exact match
  const exact = projects.find((p) => p.name.toLowerCase() === normalized);
  if (exact) return exact;

  // Partial match
  const partial = projects.find((p) =>
    p.name.toLowerCase().includes(normalized)
  );
  if (partial) return partial;

  // Fuzzy match (contains words)
  const words = normalized.split(/\s+/);
  const fuzzy = projects.find((p) => {
    const projectLower = p.name.toLowerCase();
    return words.every((word) => projectLower.includes(word));
  });

  return fuzzy || null;
}

/**
 * Find fuzzy match for role name
 */
function findRole(name: string, roles: Role[]): Role | null {
  const normalized = name.toLowerCase().trim();

  // Exact match
  const exact = roles.find((r) => r.name.toLowerCase() === normalized);
  if (exact) return exact;

  // Partial match
  const partial = roles.find((r) => r.name.toLowerCase().includes(normalized));
  if (partial) return partial;

  return null;
}

/**
 * Parse chat message for tags and commands
 */
export function parseChatTags(
  message: string,
  context: ParserContext
): ParsedMessage {
  const tags: ParsedTags = {
    projects: [],
  };
  const unmatchedProjects: string[] = [];
  const errors: string[] = [];

  let cleanMessage = message;

  // Extract @project mentions
  const projectRegex = /@(\w+(?:\s+\w+)*)/g;
  let match;
  while ((match = projectRegex.exec(message)) !== null) {
    const projectName = match[1].trim();
    const project = findProject(projectName, context.projects);

    if (project) {
      if (!tags.projects.includes(project.id)) {
        tags.projects.push(project.id);
      }
      // Remove from clean message
      cleanMessage = cleanMessage.replace(`@${projectName}`, '');
    } else {
      unmatchedProjects.push(projectName);
      errors.push(`Project '@${projectName}' not found`);
    }
  }

  // Parse commands
  let pos = 0;
  while (pos < message.length) {
    if (message[pos] === '/') {
      pos++; // Skip /

      // Extract command name
      let cmdEnd = pos;
      while (cmdEnd < message.length && /[a-z]/.test(message[cmdEnd])) {
        cmdEnd++;
      }

      const command = message.substring(pos, cmdEnd).toLowerCase();

      // Extract value
      const { value, endPos } = extractValue(message, cmdEnd);

      switch (command) {
        case 'task':
          if (value) {
            tags.task = value;
            cleanMessage = cleanMessage.replace(`/task ${value}`, '');
            cleanMessage = cleanMessage.replace(`/task "${value}"`, '');
          } else {
            errors.push('/task requires a value');
          }
          break;

        case 'projectname':
          if (value) {
            tags.projectName = value;
            cleanMessage = cleanMessage.replace(`/projectname ${value}`, '');
            cleanMessage = cleanMessage.replace(`/projectname "${value}"`, '');
          } else {
            errors.push('/projectname requires a value');
          }
          break;

        case 'userole':
          if (value) {
            const role = findRole(value, context.roles);
            if (role) {
              tags.userRole = role.name;
              cleanMessage = cleanMessage.replace(`/userole ${value}`, '');
              cleanMessage = cleanMessage.replace(`/userole "${value}"`, '');
            } else {
              errors.push(`Role '${value}' not found`);
            }
          } else {
            errors.push('/userole requires a value');
          }
          break;

        case 'priority':
          if (value) {
            const priority = PRIORITY_MAP[value.toLowerCase()];
            if (priority) {
              tags.priority = priority;
              cleanMessage = cleanMessage.replace(`/priority ${value}`, '');
            } else {
              errors.push(
                `Invalid priority '${value}'. Use: low, medium, high, or urgent`
              );
            }
          } else {
            errors.push('/priority requires a value');
          }
          break;

        case 'duedate':
          if (value) {
            const date = parseNaturalDate(value);
            if (date) {
              tags.dueDate = date;
              cleanMessage = cleanMessage.replace(`/duedate ${value}`, '');
              cleanMessage = cleanMessage.replace(`/duedate "${value}"`, '');
            } else {
              errors.push(`Invalid date format '${value}'`);
            }
          } else {
            errors.push('/duedate requires a value');
          }
          break;

        case 'status':
          if (value) {
            const status = STATUS_MAP[value.toLowerCase()];
            if (status) {
              tags.status = status;
              cleanMessage = cleanMessage.replace(`/status ${value}`, '');
            } else {
              errors.push(
                `Invalid status '${value}'. Use: not_started, in_progress, completed, or blocked`
              );
            }
          } else {
            errors.push('/status requires a value');
          }
          break;

        case 'notes':
          if (value) {
            tags.notes = value;
            cleanMessage = cleanMessage.replace(`/notes ${value}`, '');
            cleanMessage = cleanMessage.replace(`/notes "${value}"`, '');
          } else {
            errors.push('/notes requires a value');
          }
          break;

        default:
          if (command) {
            errors.push(`Unknown command: /${command}`);
          }
      }

      pos = endPos;
    } else {
      pos++;
    }
  }

  // Clean up the message (remove extra whitespace)
  cleanMessage = cleanMessage.replace(/\s+/g, ' ').trim();

  return {
    originalMessage: message,
    cleanMessage,
    tags,
    unmatchedProjects,
    errors,
    hasErrors: errors.length > 0 || unmatchedProjects.length > 0,
  };
}

/**
 * Get available commands with descriptions
 */
export function getAvailableCommands() {
  return [
    {
      command: '/task',
      description: 'Task name or title',
      example: '/task "Fix login bug"',
    },
    {
      command: '/projectname',
      description: 'Name for a new project',
      example: '/projectname "Website Redesign"',
    },
    {
      command: '/userole',
      description: 'Assign to a role/category',
      example: '/userole Development',
    },
    {
      command: '/priority',
      description: 'Priority level (low, medium, high, urgent)',
      example: '/priority high',
    },
    {
      command: '/duedate',
      description: 'Due date (natural language)',
      example: '/duedate tomorrow',
    },
    {
      command: '/status',
      description: 'Task status',
      example: '/status in_progress',
    },
    {
      command: '/notes',
      description: 'Additional notes or description',
      example: '/notes "Need to test on mobile"',
    },
  ];
}
