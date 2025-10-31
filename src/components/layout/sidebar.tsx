'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { signOut } from 'next-auth/react';
import {
  Home,
  FolderKanban,
  Columns3,
  CalendarDays,
  Calendar,
  Settings,
  Command,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Archive,
  BarChart3,
  Globe,
  Bot,
  MessagesSquare,
  FileText,
  LogOut,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { triggerCommandPalette } from '@/lib/sidebar-utils';

interface NavItem {
  href: string;
  label: string;
  icon: any;
}

interface NavGroup {
  id: string;
  label: string;
  collapsible?: boolean;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    id: 'home',
    label: 'Home',
    items: [{ href: '/dashboard', label: 'Dashboard', icon: Home }],
  },
  {
    id: 'plan',
    label: 'Plan',
    collapsible: true,
    items: [
      { href: '/projects', label: 'Projects', icon: FolderKanban },
      { href: '/calendar', label: 'Calendar', icon: Calendar },
      { href: '/daily', label: 'Daily', icon: CalendarDays },
    ],
  },
  {
    id: 'execute',
    label: 'Execute',
    collapsible: true,
    items: [
      { href: '/board', label: 'Board', icon: Columns3 },
      { href: '/tickets', label: 'Tickets', icon: MessagesSquare },
      { href: '/projects/website', label: 'Website Boards', icon: Globe },
    ],
  },
  {
    id: 'capture',
    label: 'Capture',
    collapsible: true,
    items: [
      { href: '/notes', label: 'Notes', icon: FileText },
      { href: '/plaud', label: 'Plaud AI', icon: Bot },
    ],
  },
  {
    id: 'review',
    label: 'Review',
    collapsible: true,
    items: [
      { href: '/analytics', label: 'Analytics', icon: BarChart3 },
      { href: '/summary', label: 'Summary', icon: BarChart3 },
      { href: '/completed', label: 'Completed', icon: Archive },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    items: [{ href: '/settings', label: 'Settings', icon: Settings }],
  },
];

// Extract all nav hrefs for checking more specific routes
const navHrefs = navGroups.flatMap((group) =>
  group.items.map((item) => item.href)
);

// NavItem component with proper active state detection
function NavItem({
  href,
  icon: Icon,
  label,
  isCompact,
}: {
  href: string;
  icon: any;
  label: string;
  isCompact: boolean;
  isMobile: boolean;
}) {
  const pathname = usePathname();

  const isActive = useMemo(() => {
    // Special case for dashboard
    if (href === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/';
    }

    // Exact match for the route
    if (pathname === href) {
      return true;
    }

    // For sub-routes, check if pathname starts with this href
    // BUT only if there's no more specific route in nav that matches
    if (pathname.startsWith(href + '/')) {
      // Check if any other nav item has a more specific (longer) match
      const hasMoreSpecificMatch = navHrefs.some(
        (navHref) =>
          navHref !== href &&
          navHref.startsWith(href) &&
          pathname.startsWith(navHref)
      );

      // Only mark as active if there's no more specific match
      return !hasMoreSpecificMatch;
    }

    return false;
  }, [pathname, href]);

  return (
    <Link
      href={href}
      prefetch={true}
      className={cn(
        'group relative flex items-center gap-3 rounded-xl px-4 py-3 transition-colors duration-200',
        'text-slate-500 dark:text-slate-300 hover:text-slate-700 dark:hover:text-slate-100',
        'hover:bg-white/10 active:bg-white/20 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/50',
        isActive &&
          'bg-gradient-to-r from-indigo-500/60 to-violet-500/60 text-white shadow-lg'
      )}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon className="h-5 w-5 flex-shrink-0" />

      <AnimatePresence>
        {!isCompact && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.15 }}
            className="font-medium overflow-hidden whitespace-nowrap"
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </Link>
  );
}

// NavGroup component with collapsible functionality
function NavGroup({
  group,
  isCompact,
  isMobile,
}: {
  group: NavGroup;
  isCompact: boolean;
  isMobile: boolean;
}) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Check if any item in this group is active
  const hasActiveItem = useMemo(() => {
    return group.items.some((item) => {
      if (item.href === '/dashboard') {
        return pathname === '/dashboard' || pathname === '/';
      }
      if (pathname === item.href) {
        return true;
      }
      if (pathname.startsWith(item.href + '/')) {
        const hasMoreSpecificMatch = navHrefs.some(
          (navHref) =>
            navHref !== item.href &&
            navHref.startsWith(item.href) &&
            pathname.startsWith(navHref)
        );
        return !hasMoreSpecificMatch;
      }
      return false;
    });
  }, [pathname, group.items]);

  // Load collapsed state from localStorage
  useEffect(() => {
    if (group.collapsible && !isCompact) {
      const savedState = localStorage.getItem(
        `sidebar-group-collapsed-${group.id}`
      );
      if (savedState !== null) {
        setIsCollapsed(JSON.parse(savedState));
      }
    }
  }, [group.id, group.collapsible, isCompact]);

  // Auto-expand if group contains active item
  useEffect(() => {
    if (hasActiveItem && isCollapsed && group.collapsible) {
      setIsCollapsed(false);
    }
  }, [hasActiveItem, isCollapsed, group.collapsible]);

  // Save collapsed state to localStorage
  const toggleCollapsed = () => {
    if (group.collapsible) {
      const newState = !isCollapsed;
      setIsCollapsed(newState);
      localStorage.setItem(
        `sidebar-group-collapsed-${group.id}`,
        JSON.stringify(newState)
      );
    }
  };

  // In compact mode, don't show group headers, just show items with dividers
  if (isCompact && !isMobile) {
    return (
      <>
        {group.id !== 'home' && <div className="h-px bg-white/10 my-2 mx-3" />}
        {group.items.map((item) => (
          <NavItem
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            isCompact={true}
            isMobile={isMobile}
          />
        ))}
      </>
    );
  }

  // Normal mode with group headers
  return (
    <div className="space-y-1">
      {group.collapsible ? (
        <>
          <button
            onClick={toggleCollapsed}
            className={cn(
              'flex items-center justify-between w-full px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors',
              'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300',
              'focus:outline-none focus:ring-2 focus:ring-indigo-500/50 rounded-lg'
            )}
            aria-expanded={!isCollapsed}
          >
            <span>{group.label}</span>
            {isCollapsed ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronUp className="h-3 w-3" />
            )}
          </button>
          <AnimatePresence initial={false}>
            {!isCollapsed && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                {group.items.map((item) => (
                  <NavItem
                    key={item.href}
                    href={item.href}
                    icon={item.icon}
                    label={item.label}
                    isCompact={false}
                    isMobile={isMobile}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      ) : (
        <>
          {group.id !== 'home' && (
            <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {group.label}
            </div>
          )}
          {group.items.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              isCompact={false}
              isMobile={isMobile}
            />
          ))}
        </>
      )}
    </div>
  );
}

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [isCompact, setIsCompact] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const isMobileOpen = isOpen; // Use prop instead of local state

  // Check for mobile/tablet screens
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setIsCompact(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close mobile sidebar when route changes
  useEffect(() => {
    if (isMobile && onClose) {
      onClose();
    }
  }, [pathname, isMobile, onClose]);

  // Load compact state from localStorage
  useEffect(() => {
    const savedCompact = localStorage.getItem('sidebar-compact');
    if (savedCompact !== null && !isMobile) {
      setIsCompact(JSON.parse(savedCompact));
    }
  }, [isMobile]);

  // Save compact state to localStorage
  useEffect(() => {
    if (!isMobile) {
      localStorage.setItem('sidebar-compact', JSON.stringify(isCompact));
    }
  }, [isCompact, isMobile]);

  const toggleCompact = () => {
    if (!isMobile) {
      setIsCompact(!isCompact);
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'group fixed left-0 top-0 h-dvh z-40 transition-all duration-300',
          'bg-white/55 dark:bg-white/10 backdrop-blur-2xl',
          'border-r border-white/20 shadow-[0_8px_30px_rgba(0,0,0,.08)]',
          isMobile && !isMobileOpen && '-translate-x-full',
          isMobile ? 'w-[256px]' : isCompact ? 'w-[84px]' : 'w-[256px]'
        )}
        aria-label="Main navigation"
      >
        {/* Header with logo and toggle */}
        <div
          className={cn(
            'flex items-center justify-between border-b border-white/10',
            !isMobile && isCompact ? 'p-4' : 'px-4'
          )}
        >
          {!isMobile && isCompact ? (
            <div className="flex items-center justify-center w-full py-2">
              <Image
                src="/app-icon.png"
                alt="App icon"
                width={32}
                height={32}
                priority
                className="rounded-lg"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center w-full -my-4">
              <Image
                src="/tasktracker-logo.png"
                alt="TaskTracker"
                width={192}
                height={192}
                priority
                className="rounded-none"
              />
            </div>
          )}

          {!isMobile && (
            <button
              onClick={toggleCompact}
              className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
              aria-label={isCompact ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCompact ? (
                <ChevronRight className="h-4 w-4 text-slate-600 dark:text-slate-300" />
              ) : (
                <ChevronLeft className="h-4 w-4 text-slate-600 dark:text-slate-300" />
              )}
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav
          className="flex flex-col gap-2 p-3 overflow-y-auto flex-1"
          aria-label="Main"
        >
          {navGroups.map((group) => (
            <NavGroup
              key={group.id}
              group={group}
              isCompact={!isMobile && isCompact}
              isMobile={isMobile}
            />
          ))}
        </nav>

        {/* Command Palette & Logout Buttons */}
        <div className="mt-auto p-3 border-t border-white/10 space-y-1">
          <button
            onClick={triggerCommandPalette}
            className={cn(
              'group flex items-center gap-3 rounded-xl px-4 py-3 w-full transition-all duration-200',
              'text-slate-500 dark:text-slate-300 hover:text-slate-700 dark:hover:text-slate-100',
              'hover:bg-white/10 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/50'
            )}
            aria-label="Open command palette"
          >
            <Command className="h-5 w-5 flex-shrink-0" />
            <AnimatePresence>
              {!isMobile && isCompact ? null : (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-2 overflow-hidden"
                >
                  <kbd className="rounded px-1.5 py-0.5 text-xs bg-white/60 border border-white/40 backdrop-blur-sm">
                    Ctrl+K
                  </kbd>
                </motion.div>
              )}
            </AnimatePresence>
          </button>

          <button
            onClick={() => signOut({ callbackUrl: '/sign-in' })}
            className={cn(
              'group flex items-center gap-3 rounded-xl px-4 py-3 w-full transition-all duration-200',
              'text-slate-500 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400',
              'hover:bg-red-50/50 dark:hover:bg-red-500/10 focus:bg-red-50/50 focus:outline-none focus:ring-2 focus:ring-red-500/50'
            )}
            aria-label="Logout"
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            <AnimatePresence>
              {!isMobile && isCompact ? null : (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.15 }}
                  className="font-medium overflow-hidden whitespace-nowrap"
                >
                  Logout
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </aside>
    </>
  );
}
