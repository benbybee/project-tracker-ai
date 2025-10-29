/**
 * Utility functions for sidebar navigation
 */

/**
 * Check if a route is currently active
 * @param pathname - Current pathname from usePathname()
 * @param href - Route href to check against
 * @returns boolean indicating if the route is active
 */
export function isActive(pathname: string, href: string): boolean {
  if (href === '/dashboard') {
    return pathname === '/dashboard' || pathname === '/';
  }
  return pathname.startsWith(href);
}

/**
 * Trigger the command palette via keyboard event
 */
export function triggerCommandPalette(): void {
  document.dispatchEvent(
    new KeyboardEvent('keydown', {
      key: 'k',
      ctrlKey: true,
      bubbles: true,
    })
  );
}

/**
 * Get sidebar width based on compact state and mobile detection
 * @param isCompact - Whether sidebar is in compact mode
 * @param isMobile - Whether on mobile/tablet screen
 * @returns CSS width value
 */
export function getSidebarWidth(isCompact: boolean, isMobile: boolean): string {
  if (isMobile) {
    return '256px'; // Full width on mobile
  }
  return isCompact ? '64px' : '256px';
}
