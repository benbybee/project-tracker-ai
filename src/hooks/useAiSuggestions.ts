import { useState, useCallback } from 'react';
import type { Suggestion } from '@/components/ai/SuggestionCard';

export function useAiSuggestions() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSuggestions = useCallback(
    async (context: {
      currentView: 'dashboard' | 'project' | 'daily';
      taskIds?: string[];
    }) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/ai/suggest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(context),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch suggestions');
        }

        const data = await response.json();

        // Transform API response to Suggestion format
        const transformedSuggestions: Suggestion[] = (
          data.suggestions || []
        ).map((s: any) => ({
          id: s.id || Math.random().toString(36),
          type: s.type,
          title: s.title,
          message: s.message,
          priority: s.priority || 'medium',
          action: s.action,
          confidence: s.confidence,
        }));

        setSuggestions(transformedSuggestions);
      } catch (err: any) {
        console.error('Error fetching AI suggestions:', err);
        setError(err.message || 'Failed to load suggestions');
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const acceptSuggestion = useCallback(async (suggestion: Suggestion) => {
    try {
      // Record acceptance
      await fetch('/api/ai/suggest', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          suggestionId: suggestion.id,
          accepted: true,
          action: suggestion.action,
        }),
      });

      // Remove from local state
      setSuggestions((prev) => prev.filter((s) => s.id !== suggestion.id));
    } catch (err) {
      console.error('Error accepting suggestion:', err);
      throw err;
    }
  }, []);

  const rejectSuggestion = useCallback(async (suggestion: Suggestion) => {
    try {
      // Record rejection
      await fetch('/api/ai/suggest', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          suggestionId: suggestion.id,
          accepted: false,
        }),
      });

      // Remove from local state
      setSuggestions((prev) => prev.filter((s) => s.id !== suggestion.id));
    } catch (err) {
      console.error('Error rejecting suggestion:', err);
      throw err;
    }
  }, []);

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
  }, []);

  return {
    suggestions,
    isLoading,
    error,
    fetchSuggestions,
    acceptSuggestion,
    rejectSuggestion,
    clearSuggestions,
  };
}
