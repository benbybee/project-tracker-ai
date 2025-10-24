"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useTransition, useMemo } from "react";
import Image from "next/image";
import { Home, FolderKanban, Columns3, CalendarDays, Settings, Command, ChevronLeft, ChevronRight, Archive } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { isActive, triggerCommandPalette } from "@/lib/sidebar-utils";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/projects",  label: "Projects",  icon: FolderKanban },
  { href: "/board",     label: "Board",     icon: Columns3 },
  { href: "/daily",     label: "Daily",     icon: CalendarDays },
  { href: "/completed", label: "Completed", icon: Archive },
  { href: "/settings",  label: "Settings",  icon: Settings },
];

// Optimized NavItem component with optimistic updates
function NavItem({ href, icon: Icon, label, isCompact, isMobile }: { 
  href: string; 
  icon: any; 
  label: string;
  isCompact: boolean;
  isMobile: boolean;
}) {
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  const isActive = useMemo(() => {
    if (pendingHref) {
      return pendingHref === href;
    }
    if (href === "/dashboard") {
      return pathname === "/dashboard" || pathname === "/";
    }
    return pathname.startsWith(href);
  }, [pendingHref, pathname, href]);

  // Clear pending state when pathname changes
  useEffect(() => {
    if (pendingHref && pathname.startsWith(href)) {
      setPendingHref(null);
    }
  }, [pathname, href, pendingHref]);

  const handleClick = (e: React.MouseEvent) => {
    setPendingHref(href);
    startTransition(() => {
      // This signals pending UI; the actual navigation happens via Link
    });
  };

  return (
    <Link
      prefetch
      href={href}
      onClick={handleClick}
      className="group relative"
      aria-current={isActive ? "page" : undefined}
    >
      <motion.div
        className={cn(
          "flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200",
          "text-slate-500 dark:text-slate-300 hover:text-slate-700 dark:hover:text-slate-100",
          "hover:bg-white/10 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/50",
          isActive && "bg-gradient-to-r from-indigo-500/60 to-violet-500/60 text-white shadow-lg"
        )}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        data-pending={isPending && pendingHref === href ? "true" : "false"}
      >
        {/* Left accent bar for active state */}
        {isActive && (
          <motion.div
            layoutId="sidebar-accent"
            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        )}
        
        <Icon className="h-5 w-5 flex-shrink-0" />
        
        <AnimatePresence>
          {!isCompact && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.15 }}
              className="font-medium overflow-hidden whitespace-nowrap"
            >
              {label}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const [isCompact, setIsCompact] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Check for mobile/tablet screens
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setIsCompact(true);
        setIsMobileOpen(false);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close mobile sidebar when route changes
  useEffect(() => {
    if (isMobile) {
      setIsMobileOpen(false);
    }
  }, [pathname, isMobile]);

  // Listen for mobile sidebar open event
  useEffect(() => {
    const handleOpenMobileSidebar = () => {
      if (isMobile) {
        setIsMobileOpen(true);
      }
    };

    window.addEventListener('openMobileSidebar', handleOpenMobileSidebar);
    return () => window.removeEventListener('openMobileSidebar', handleOpenMobileSidebar);
  }, [isMobile]);

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
          onClick={() => setIsMobileOpen(false)}
        />
      )}
      
    <aside
      className={cn(
          "group fixed left-0 top-0 h-dvh z-40 transition-all duration-300",
          "bg-white/55 dark:bg-white/10 backdrop-blur-2xl",
          "border-r border-white/20 shadow-[0_8px_30px_rgba(0,0,0,.08)]",
          isMobile && !isMobileOpen && "-translate-x-full",
          isMobile ? "w-[256px]" : (isCompact ? "w-[84px]" : "w-[256px]")
        )}
        aria-label="Main navigation"
        onMouseEnter={() => !isMobile && setIsHovered(true)}
        onMouseLeave={() => !isMobile && setIsHovered(false)}
      >
      {/* Header with logo and toggle */}
      <div className={cn(
        "flex items-center justify-between border-b border-white/10",
        (!isMobile && isCompact) ? "p-4" : "px-4"
      )}>
        {(!isMobile && isCompact) ? (
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
            aria-label={isCompact ? "Expand sidebar" : "Collapse sidebar"}
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
      <nav className="flex flex-col gap-1 p-3" aria-label="Main">
        {nav.map((item) => (
          <NavItem
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            isCompact={!isMobile && isCompact}
            isMobile={isMobile}
          />
        ))}
      </nav>

      {/* Command Palette Button */}
      <div className="mt-auto p-3 border-t border-white/10">
        <button
          onClick={triggerCommandPalette}
                className={cn(
            "group flex items-center gap-3 rounded-xl px-4 py-3 w-full transition-all duration-200",
            "text-slate-500 dark:text-slate-300 hover:text-slate-700 dark:hover:text-slate-100",
            "hover:bg-white/10 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          )}
          aria-label="Open command palette"
        >
          <Command className="h-5 w-5 flex-shrink-0" />
          <AnimatePresence>
            {(!isMobile && isCompact) ? null : (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
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
      </div>
    </aside>
    </>
  );
}
