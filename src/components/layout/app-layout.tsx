'use client';
import { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';
import { MobileFooterNav } from '@/components/mobile/mobile-footer-nav';
import { useMobileViewport } from '@/hooks/useTouchDevice';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarWidth, setSidebarWidth] = useState('256px'); // Default expanded width
  const [isMobile, setIsMobile] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const isMobileViewport = useMobileViewport();

  // Stable callback to prevent unnecessary re-renders
  const handleCloseSidebar = useCallback(() => {
    setMobileSidebarOpen(false);
  }, []);

  // Check for mobile/tablet screens and update sidebar width
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);

      if (mobile) {
        setSidebarWidth('256px'); // Full width on mobile
      } else {
        // Check localStorage for compact state
        const savedCompact = localStorage.getItem('sidebar-compact');
        const isCompact = savedCompact ? JSON.parse(savedCompact) : false;
        setSidebarWidth(isCompact ? '84px' : '256px');
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    // Listen for storage changes (when sidebar state changes)
    const handleStorageChange = () => {
      if (!isMobile) {
        const savedCompact = localStorage.getItem('sidebar-compact');
        const isCompact = savedCompact ? JSON.parse(savedCompact) : false;
        setSidebarWidth(isCompact ? '84px' : '256px');
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [isMobile]);

  return (
    <div className="min-h-[100dvh]">
      <Sidebar
        isOpen={mobileSidebarOpen}
        onClose={handleCloseSidebar}
      />
      <div
        className="transition-all duration-300 px-4 py-4 md:pr-3 md:pl-0"
        style={{
          paddingLeft: isMobile
            ? undefined
            : sidebarWidth === '84px'
              ? '92px'
              : '264px',
          paddingBottom: isMobileViewport ? '80px' : undefined, // Add padding for mobile footer
        }}
      >
        <Topbar />
        <main className="mt-4 grid gap-4">{children}</main>
      </div>

      {/* Mobile Footer Navigation */}
      {isMobileViewport && (
        <MobileFooterNav
          onMenuClick={() => {
            console.log(
              '📱 Opening mobile sidebar, current state:',
              mobileSidebarOpen
            );
            setMobileSidebarOpen(true);
          }}
        />
      )}
    </div>
  );
}
