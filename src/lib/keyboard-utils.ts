/**
 * Keyboard utilities for cross-platform keyboard shortcuts
 * Handles OS detection and key formatting
 */

/**
 * Detect if user is on Mac/iOS
 */
export function isMacOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Mac|iPhone|iPad|iPod/.test(navigator.platform);
}

/**
 * Get the modifier key symbol based on OS
 */
export function getModKey(): '⌘' | 'Ctrl' {
  return isMacOS() ? '⌘' : 'Ctrl';
}

/**
 * Get the alt modifier key symbol based on OS
 */
export function getAltModKey(): '⌥' | 'Alt' {
  return isMacOS() ? '⌥' : 'Alt';
}

/**
 * Format a keyboard shortcut for display
 * @example formatShortcut(['Ctrl', 'K']) => 'Ctrl+K' or '⌘K'
 */
export function formatShortcut(keys: string[]): string {
  const isMac = isMacOS();
  
  return keys.map(key => {
    // Replace Ctrl with ⌘ on Mac
    if (key === 'Ctrl' && isMac) return '⌘';
    if (key === 'Alt' && isMac) return '⌥';
    if (key === 'Shift') return isMac ? '⇧' : 'Shift';
    
    // Uppercase single letters
    if (key.length === 1) return key.toUpperCase();
    
    return key;
  }).join(isMac ? '' : '+');
}

/**
 * Check if a keyboard event matches a shortcut definition
 */
export function matchesShortcut(
  event: KeyboardEvent,
  shortcut: {
    key: string;
    ctrl?: boolean;
    alt?: boolean;
    shift?: boolean;
    meta?: boolean;
  }
): boolean {
  const isMac = isMacOS();
  
  // On Mac, Cmd key is "meta", on Windows/Linux it's "ctrl"
  const modifierKey = isMac ? event.metaKey : event.ctrlKey;
  const expectedModifier = shortcut.ctrl || shortcut.meta;
  
  // Check modifiers
  if (expectedModifier && !modifierKey) return false;
  if (!expectedModifier && (event.ctrlKey || event.metaKey)) return false;
  
  if (shortcut.alt && !event.altKey) return false;
  if (!shortcut.alt && event.altKey) return false;
  
  if (shortcut.shift && !event.shiftKey) return false;
  if (!shortcut.shift && event.shiftKey) return false;
  
  // Check key (case-insensitive)
  return event.key.toLowerCase() === shortcut.key.toLowerCase();
}

/**
 * Keyboard shortcut definition
 */
export interface KeyboardShortcut {
  keys: string[];
  description: string;
  action: () => void;
  category?: 'global' | 'navigation' | 'tasks' | 'projects';
  enabled?: boolean;
}

/**
 * Check if an element is an input field
 */
export function isInputElement(element: Element | null): boolean {
  if (!element) return false;
  
  const tagName = element.tagName.toLowerCase();
  const isInput = tagName === 'input' || tagName === 'textarea' || tagName === 'select';
  const isContentEditable = element.getAttribute('contenteditable') === 'true';
  
  return isInput || isContentEditable;
}

