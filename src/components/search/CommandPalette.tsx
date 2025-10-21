"use client";
import { useState, useEffect } from "react";
import { CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { DialogTitle } from "@/components/ui/dialog";
import { mockProjects, mockTasks } from "@/lib/mock-data";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  // Mock search results for UI-only version
  const searchResults = query.length >= 2 ? [
    ...mockProjects.map(project => ({ 
      kind: 'project' as const, 
      item: project, 
      snippet: project.description 
    })),
    ...mockTasks.map(task => ({ 
      kind: 'task' as const, 
      item: task, 
      snippet: task.description 
    }))
  ].filter((item: any) => {
    const searchTerm = query.toLowerCase();
    if (item.kind === 'project') {
      return item.item.name?.toLowerCase().includes(searchTerm) ||
             item.snippet?.toLowerCase().includes(searchTerm);
    } else {
      return item.item.title?.toLowerCase().includes(searchTerm) ||
             item.snippet?.toLowerCase().includes(searchTerm);
    }
  }) : [];

  const isLoading = false;

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && e.ctrlKey) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <DialogTitle className="sr-only">Search Command Palette</DialogTitle>
      <CommandInput
        placeholder="Search projects, tasks, and more..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {isLoading && <div className="p-6 text-center text-sm">Searching...</div>}
        {!isLoading && query.length >= 2 && (!searchResults || searchResults.length === 0) && (
          <CommandEmpty>No results found.</CommandEmpty>
        )}
        {searchResults && searchResults.length > 0 && (
          <CommandGroup heading="Results">
            {searchResults.map((result: any, index: number) => (
              <CommandItem
                key={`${result.kind}-${result.item.id}-${index}`}
                onSelect={() => {
                  setOpen(false);
                  // Navigate to the item
                  if (result.kind === 'task') {
                    // Navigate to task or project containing the task
                    window.location.href = `/projects/${result.item.projectId}`;
                  } else if (result.kind === 'project') {
                    window.location.href = `/projects/${result.item.id}`;
                  }
                }}
              >
                <div className="flex flex-col">
                  <span className="font-medium">{result.item.title}</span>
                  <span className="text-xs text-muted-foreground">{result.snippet}</span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
