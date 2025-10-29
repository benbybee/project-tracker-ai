import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PlanningEngine } from '../planning-engine';
import type { DailyPlanContext } from '../prompt-templates';

// Mock OpenAI
vi.mock('openai', () => ({
  default: vi.fn(() => ({
    chat: {
      completions: {
        create: vi.fn(),
      },
    },
  })),
}));

describe('PlanningEngine', () => {
  let engine: PlanningEngine;

  beforeEach(() => {
    engine = new PlanningEngine();
    vi.clearAllMocks();
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limit of 10 requests per hour', async () => {
      const userId = 'test-user-123';
      const mockContext: DailyPlanContext = {
        currentTime: new Date(),
        tasks: [],
        workingHoursStart: 9,
        workingHoursEnd: 17,
      };

      // Mock successful responses
      const mockCreate = vi.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                plan: [],
                breaks: [],
                deferredTasks: [],
                totalEstimatedMinutes: 0,
                risks: [],
                summary: 'Test plan',
                confidence: 0.8,
              }),
            },
          },
        ],
      });

      // Inject mock
      (engine as any).openai = {
        chat: { completions: { create: mockCreate } },
      };

      // Make 10 requests (should succeed)
      for (let i = 0; i < 10; i++) {
        await engine.generateDailyPlan(userId, mockContext);
      }

      // 11th request should fail
      await expect(
        engine.generateDailyPlan(userId, mockContext)
      ).rejects.toThrow('Rate limit exceeded');
    });
  });

  describe('Daily Plan Generation', () => {
    it('should generate a valid daily plan structure', async () => {
      const userId = 'test-user-456';
      const mockContext: DailyPlanContext = {
        currentTime: new Date(),
        tasks: [
          {
            id: 'task-1',
            title: 'Write tests',
            priority: '1',
            status: 'not_started',
          },
          {
            id: 'task-2',
            title: 'Review PR',
            priority: '2',
            status: 'not_started',
          },
        ],
        workingHoursStart: 9,
        workingHoursEnd: 17,
      };

      const mockPlan = {
        plan: [
          {
            taskId: 'task-1',
            order: 1,
            suggestedStartTime: '09:00',
            estimatedDuration: 60,
            reasoning: 'High priority task',
          },
        ],
        breaks: [
          { afterTask: 'task-1', duration: 15, type: 'short_break' as const },
        ],
        deferredTasks: [],
        totalEstimatedMinutes: 60,
        risks: [],
        summary: 'Focused morning session',
        confidence: 0.85,
      };

      const mockCreate = vi.fn().mockResolvedValue({
        choices: [
          {
            message: { content: JSON.stringify(mockPlan) },
          },
        ],
      });

      (engine as any).openai = {
        chat: { completions: { create: mockCreate } },
      };

      const result = await engine.generateDailyPlan(userId, mockContext);

      expect(result).toEqual(mockPlan);
      expect(result.plan).toHaveLength(1);
      expect(result.plan[0].taskId).toBe('task-1');
      expect(result.totalEstimatedMinutes).toBe(60);
    });

    it('should handle API errors gracefully', async () => {
      const userId = 'test-user-789';
      const mockContext: DailyPlanContext = {
        currentTime: new Date(),
        tasks: [],
        workingHoursStart: 9,
        workingHoursEnd: 17,
      };

      const mockCreate = vi
        .fn()
        .mockRejectedValue(new Error('OpenAI API error'));
      (engine as any).openai = {
        chat: { completions: { create: mockCreate } },
      };

      await expect(
        engine.generateDailyPlan(userId, mockContext)
      ).rejects.toThrow('Failed to generate plan');
    });
  });

  describe('Task Duration Estimation', () => {
    it('should estimate task duration', async () => {
      const userId = 'test-user-duration';
      const mockEstimate = {
        estimatedMinutes: 90,
        confidence: 0.75,
        reasoning: 'Based on similar tasks',
      };

      const mockCreate = vi.fn().mockResolvedValue({
        choices: [
          {
            message: { content: JSON.stringify(mockEstimate) },
          },
        ],
      });

      (engine as any).openai = {
        chat: { completions: { create: mockCreate } },
      };

      const result = await engine.estimateTaskDuration(
        userId,
        'Implement feature X',
        'Add new authentication method'
      );

      expect(result.estimatedMinutes).toBe(90);
      expect(result.confidence).toBe(0.75);
    });

    it('should return default estimate on failure', async () => {
      const userId = 'test-user-failure';
      const mockCreate = vi.fn().mockRejectedValue(new Error('Network error'));
      (engine as any).openai = {
        chat: { completions: { create: mockCreate } },
      };

      const result = await engine.estimateTaskDuration(userId, 'Test task');

      expect(result.estimatedMinutes).toBe(60); // Default
      expect(result.confidence).toBe(0.5);
      expect(result.reasoning).toContain('Default estimate');
    });
  });

  describe('Priority Suggestions', () => {
    it('should suggest appropriate priority', async () => {
      const userId = 'test-user-priority';
      const mockSuggestion = {
        suggestedPriority: '1',
        reasoning: 'Critical bug fix',
        confidence: 0.9,
      };

      const mockCreate = vi.fn().mockResolvedValue({
        choices: [
          {
            message: { content: JSON.stringify(mockSuggestion) },
          },
        ],
      });

      (engine as any).openai = {
        chat: { completions: { create: mockCreate } },
      };

      const result = await engine.suggestPriority(
        userId,
        { title: 'Fix production bug', description: 'Critical issue' },
        [],
        new Date()
      );

      expect(result.suggestedPriority).toBe('1');
      expect(result.confidence).toBe(0.9);
    });
  });

  describe('Contextual Suggestions', () => {
    it('should generate contextual suggestions', async () => {
      const userId = 'test-user-context';
      const mockSuggestions = {
        suggestions: [
          {
            type: 'focus',
            title: 'Focus Session',
            message: 'You have 3 hours available',
            priority: 'medium',
          },
        ],
      };

      const mockCreate = vi.fn().mockResolvedValue({
        choices: [
          {
            message: { content: JSON.stringify(mockSuggestions) },
          },
        ],
      });

      (engine as any).openai = {
        chat: { completions: { create: mockCreate } },
      };

      const result = await engine.generateContextualSuggestions(userId, {
        currentView: 'daily',
        userActivity: 'viewing daily planner',
        relevantTasks: [],
      });

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('focus');
    });

    it('should return empty array on rate limit', async () => {
      const userId = 'test-rate-limit';
      const mockContext: DailyPlanContext = {
        currentTime: new Date(),
        tasks: [],
        workingHoursStart: 9,
        workingHoursEnd: 17,
      };

      // Exhaust rate limit first
      const mockCreate = vi.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                plan: [],
                breaks: [],
                deferredTasks: [],
                totalEstimatedMinutes: 0,
                risks: [],
                summary: '',
                confidence: 0.5,
              }),
            },
          },
        ],
      });
      (engine as any).openai = {
        chat: { completions: { create: mockCreate } },
      };

      for (let i = 0; i < 10; i++) {
        await engine.generateDailyPlan(userId, mockContext);
      }

      // Should return empty array instead of throwing
      const result = await engine.generateContextualSuggestions(userId, {
        currentView: 'dashboard',
        userActivity: 'test',
        relevantTasks: [],
      });

      expect(result).toEqual([]);
    });
  });
});
