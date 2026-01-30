/**
 * Centralized environment variable validation and type safety
 * This ensures all required environment variables are present at startup
 */

interface EnvironmentVariables {
  // Core required variables
  DATABASE_URL: string;
  NEXTAUTH_SECRET: string;
  NEXTAUTH_URL: string;

  // Optional feature variables
  OPENAI_API_KEY?: string;
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  CRON_SECRET?: string;
  IDEAFORGE_WEBHOOK_URL?: string;
  IDEAFORGE_WEBHOOK_SECRET?: string;

  // Node environment
  NODE_ENV: 'development' | 'production' | 'test';
}

/**
 * Validates that all required environment variables are present
 * @throws Error if any required variable is missing
 */
export function validateEnv(): EnvironmentVariables {
  const errors: string[] = [];

  // Check required variables
  const required = ['DATABASE_URL', 'NEXTAUTH_SECRET', 'NEXTAUTH_URL'] as const;

  for (const key of required) {
    if (!process.env[key]) {
      errors.push(`Missing required environment variable: ${key}`);
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `Environment validation failed:\n${errors.map((e) => `  - ${e}`).join('\n')}`
    );
  }

  return {
    DATABASE_URL: process.env.DATABASE_URL!,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET!,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL!,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    CRON_SECRET: process.env.CRON_SECRET,
    IDEAFORGE_WEBHOOK_URL: process.env.IDEAFORGE_WEBHOOK_URL,
    IDEAFORGE_WEBHOOK_SECRET: process.env.IDEAFORGE_WEBHOOK_SECRET,
    NODE_ENV: (process.env.NODE_ENV || 'development') as
      | 'development'
      | 'production'
      | 'test',
  };
}

/**
 * Cached environment variables (validated once at startup)
 */
let cachedEnv: EnvironmentVariables | null = null;

/**
 * Get validated environment variables
 * Validates on first call, then returns cached result
 */
export function getEnv(): EnvironmentVariables {
  if (!cachedEnv) {
    cachedEnv = validateEnv();
  }
  return cachedEnv;
}

/**
 * Check if a feature is enabled based on environment variables
 */
export const features = {
  hasOpenAI: () => !!process.env.OPENAI_API_KEY,
  hasSupabase: () =>
    !!process.env.SUPABASE_URL && !!process.env.SUPABASE_ANON_KEY,
  hasCronSecret: () => !!process.env.CRON_SECRET,
  hasIdeaForgeWebhook: () =>
    !!process.env.IDEAFORGE_WEBHOOK_URL &&
    !!process.env.IDEAFORGE_WEBHOOK_SECRET,
};
