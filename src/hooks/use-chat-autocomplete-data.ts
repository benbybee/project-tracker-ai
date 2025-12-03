import { useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { getAvailableCommands } from '@/lib/chat-tags-parser';
import type { AutocompleteItem } from '@/components/ai/ai-chat-autocomplete-dropdown';

export interface ChatAutocompleteData {
  projects: { id: string; name: string }[];
  roles: { id: string; name: string }[];
  commands: { command: string; description: string; example: string }[];
  isLoading: boolean;
}

/**
 * Hook to fetch and cache data for chat autocomplete
 */
export function useChatAutocompleteData(): ChatAutocompleteData {
  // Fetch projects
  const { data: projectsData, isLoading: projectsLoading } =
    trpc.projects.list.useQuery({});

  // Fetch roles
  const { data: rolesData, isLoading: rolesLoading } =
    trpc.roles.list.useQuery();

  const projects = useMemo(() => {
    return (
      projectsData?.map((p) => ({
        id: p.id,
        name: p.name,
      })) || []
    );
  }, [projectsData]);

  const roles = useMemo(() => {
    return (
      rolesData?.map((r) => ({
        id: r.id,
        name: r.name,
      })) || []
    );
  }, [rolesData]);

  const commands = useMemo(() => getAvailableCommands(), []);

  return {
    projects,
    roles,
    commands,
    isLoading: projectsLoading || rolesLoading,
  };
}

/**
 * Filter autocomplete items based on search query
 */
export function filterAutocompleteItems(
  query: string,
  type: 'project' | 'role' | 'command',
  data: ChatAutocompleteData
): AutocompleteItem[] {
  const lowerQuery = query.toLowerCase();

  if (type === 'project') {
    return data.projects
      .filter((p) => p.name.toLowerCase().includes(lowerQuery))
      .map((p) => ({
        id: p.id,
        type: 'project' as const,
        label: p.name,
      }))
      .slice(0, 10); // Limit to 10 items
  }

  if (type === 'role') {
    return data.roles
      .filter((r) => r.name.toLowerCase().includes(lowerQuery))
      .map((r) => ({
        id: r.id,
        type: 'role' as const,
        label: r.name,
      }))
      .slice(0, 10);
  }

  if (type === 'command') {
    return data.commands
      .filter((c) => c.command.toLowerCase().includes(lowerQuery))
      .map((c) => ({
        id: c.command,
        type: 'command' as const,
        label: c.command,
        description: c.description,
      }))
      .slice(0, 10);
  }

  return [];
}
