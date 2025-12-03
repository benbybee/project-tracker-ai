import OpenAI from 'openai';
import {
  buildDailyPlanPrompt,
  buildTaskEstimatePrompt,
  buildPrioritySuggestionPrompt,
  buildContextualSuggestionPrompt,
  DailyPlanContext,
} from './prompt-templates';
import { ProductivityPattern } from './pattern-analyzer';

// Lazy initialization to avoid build-time errors
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error(
        'OPENAI_API_KEY environment variable is required for AI features'
      );
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

export interface DailyPlan {
  plan: Array<{
    taskId: string;
    order: number;
    suggestedStartTime: string;
    estimatedDuration: number;
    reasoning: string;
  }>;
  breaks: Array<{
    afterTask: string;
    duration: number;
    type: 'short_break' | 'lunch_break';
  }>;
  deferredTasks: string[];
  totalEstimatedMinutes: number;
  risks: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high';
    message: string;
  }>;
  summary: string;
  confidence: number;
}

export interface TaskEstimate {
  estimatedMinutes: number;
  confidence: number;
  reasoning: string;
}

export interface PrioritySuggestion {
  suggestedPriority: string;
  reasoning: string;
  confidence: number;
}

export interface ContextualSuggestion {
  type: string;
  title: string;
  message: string;
  action?: {
    type: string;
    taskId?: string;
    [key: string]: any;
  };
  priority: 'low' | 'medium' | 'high';
}

/**
 * AI Planning Engine powered by OpenAI
 * Generates intelligent task plans, estimates, and suggestions
 */
export class PlanningEngine {
  private requestCount: Map<string, number> = new Map();
  private readonly MAX_REQUESTS_PER_HOUR = 10;

  /**
   * Check if user has exceeded rate limit
   */
  private checkRateLimit(userId: string): boolean {
    const key = `${userId}-${new Date().getHours()}`;
    const count = this.requestCount.get(key) || 0;

    if (count >= this.MAX_REQUESTS_PER_HOUR) {
      return false;
    }

    this.requestCount.set(key, count + 1);
    return true;
  }

  /**
   * Generate a daily plan using GPT-4
   */
  async generateDailyPlan(
    userId: string,
    context: DailyPlanContext
  ): Promise<DailyPlan> {
    if (!this.checkRateLimit(userId)) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    const prompt = buildDailyPlanPrompt(context);

    try {
      const completion = await getOpenAIClient().chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert productivity AI assistant that helps users optimize their daily work schedule. Always respond with valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      });

      const responseText = completion.choices[0]?.message?.content;
      if (!responseText) {
        throw new Error('No response from AI');
      }

      const plan: DailyPlan = JSON.parse(responseText);

      // Validate the response
      if (!plan.plan || !Array.isArray(plan.plan)) {
        throw new Error('Invalid plan format');
      }

      return plan;
    } catch (error: any) {
      console.error('[PlanningEngine] Error generating daily plan:', error);
      throw new Error(`Failed to generate plan: ${error.message}`);
    }
  }

  /**
   * Estimate task duration using GPT-3.5 (cheaper for simpler tasks)
   */
  async estimateTaskDuration(
    userId: string,
    taskTitle: string,
    taskDescription?: string,
    similarTasks?: Array<{ title: string; duration: number }>
  ): Promise<TaskEstimate> {
    if (!this.checkRateLimit(userId)) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    const prompt = buildTaskEstimatePrompt(
      taskTitle,
      taskDescription,
      similarTasks
    );

    try {
      const completion = await getOpenAIClient().chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content:
              'You are a task estimation expert. Provide realistic time estimates in JSON format.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.5,
        response_format: { type: 'json_object' },
      });

      const responseText = completion.choices[0]?.message?.content;
      if (!responseText) {
        throw new Error('No response from AI');
      }

      const estimate: TaskEstimate = JSON.parse(responseText);
      return estimate;
    } catch (error: any) {
      console.error('[PlanningEngine] Error estimating task:', error);
      // Return a default estimate if AI fails
      return {
        estimatedMinutes: 60,
        confidence: 0.5,
        reasoning: 'Default estimate (AI unavailable)',
      };
    }
  }

  /**
   * Suggest task priority using GPT-3.5
   */
  async suggestPriority(
    userId: string,
    task: { title: string; description?: string; dueDate?: string },
    otherTasks: Array<{ title: string; priority: string; dueDate?: string }>,
    currentDate: Date
  ): Promise<PrioritySuggestion> {
    if (!this.checkRateLimit(userId)) {
      // Return default if rate limited
      return {
        suggestedPriority: '2',
        reasoning: 'Rate limit reached - default priority assigned',
        confidence: 0.5,
      };
    }

    const prompt = buildPrioritySuggestionPrompt({
      task,
      otherTasks,
      currentDate,
    });

    try {
      const completion = await getOpenAIClient().chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content:
              'You are a priority management expert. Analyze tasks and suggest appropriate priorities in JSON format.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.6,
        response_format: { type: 'json_object' },
      });

      const responseText = completion.choices[0]?.message?.content;
      if (!responseText) {
        throw new Error('No response from AI');
      }

      const suggestion: PrioritySuggestion = JSON.parse(responseText);
      return suggestion;
    } catch (error: any) {
      console.error('[PlanningEngine] Error suggesting priority:', error);
      return {
        suggestedPriority: '2',
        reasoning: 'Default priority (AI unavailable)',
        confidence: 0.5,
      };
    }
  }

  /**
   * Generate contextual suggestions based on user's current state
   */
  async generateContextualSuggestions(
    userId: string,
    context: {
      currentView: 'dashboard' | 'project' | 'daily';
      userActivity: string;
      relevantTasks: Array<{
        id: string;
        title: string;
        status: string;
        priority: string;
      }>;
      patterns?: ProductivityPattern;
    }
  ): Promise<ContextualSuggestion[]> {
    if (!this.checkRateLimit(userId)) {
      return []; // Return empty if rate limited
    }

    const prompt = buildContextualSuggestionPrompt(context);

    try {
      const completion = await getOpenAIClient().chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content:
              'You are a proactive productivity assistant. Generate helpful, contextual suggestions in JSON format.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.8,
        response_format: { type: 'json_object' },
      });

      const responseText = completion.choices[0]?.message?.content;
      if (!responseText) {
        return [];
      }

      const response = JSON.parse(responseText);
      return response.suggestions || [];
    } catch (error: any) {
      console.error('[PlanningEngine] Error generating suggestions:', error);
      return [];
    }
  }

  /**
   * Simple health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const completion = await getOpenAIClient().chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Say "OK"' }],
        max_tokens: 10,
      });
      return completion.choices[0]?.message?.content?.includes('OK') || false;
    } catch {
      return false;
    }
  }
}

// Singleton instance
export const planningEngine = new PlanningEngine();
