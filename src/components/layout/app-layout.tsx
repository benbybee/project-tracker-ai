'use client';
import { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';
import { MobileHeader } from '@/components/mobile/mobile-header';
import { MobileFooterNav } from '@/components/mobile/mobile-footer-nav';
import { AiChatFloatingButton } from '@/components/ai/ai-chat-floating-button';
import { AiChatOverlay } from '@/components/ai/ai-chat-overlay';
import { AiChatWidget } from '@/components/ai/ai-chat-widget';
import { useMobileViewport } from '@/hooks/useTouchDevice';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarWidth, setSidebarWidth] = useState('256px'); // Default expanded width
  const [isMobile, setIsMobile] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const isMobileViewport = useMobileViewport();

  // Stable callback to prevent unnecessary re-renders
  const handleCloseSidebar = useCallback(() => {
    setMobileSidebarOpen(false);
  }, []);

  const handleOpenSidebar = useCallback(() => {
    setMobileSidebarOpen(true);
  }, []);

  const handleOpenChat = useCallback(() => {
    setChatOpen(true);
  }, []);

  const handleCloseChat = useCallback(() => {
    setChatOpen(false);
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
      <Sidebar isOpen={mobileSidebarOpen} onClose={handleCloseSidebar} />

      {/* Mobile Header - Only visible on mobile */}
      {isMobileViewport && <MobileHeader onMenuClick={handleOpenSidebar} />}

      <div
        className="transition-all duration-300 px-4 py-4 md:pr-3 md:pl-0"
        style={{
          paddingLeft: isMobile
            ? undefined
            : sidebarWidth === '84px'
              ? '92px'
              : '264px',
          paddingTop: isMobileViewport ? 'calc(3.5rem + 1rem)' : '1rem', // Add space for mobile header
          paddingBottom: isMobileViewport ? '80px' : undefined, // Add padding for mobile footer
        }}
      >
        <Topbar />
        <main className="mt-4 grid gap-4">{children}</main>
      </div>

      {/* Mobile Footer Navigation */}
      {isMobileViewport && <MobileFooterNav onAiChatClick={handleOpenChat} />}

      {/* Desktop Floating Chat Button */}
      {!isMobile && !chatOpen && (
        <AiChatFloatingButton onClick={handleOpenChat} />
      )}

      {/* Desktop Chat Overlay */}
      {!isMobile && (
        <AiChatOverlay
          isOpen={chatOpen}
          onClose={handleCloseChat}
          onMinimize={handleCloseChat}
        />
      )}

      {/* Mobile Fullscreen Chat */}
      {isMobile && chatOpen && (
        <div className="fixed inset-0 z-50 bg-white dark:bg-slate-900">
          <AiChatWidget
            isOpen={chatOpen}
            onClose={handleCloseChat}
            isMobile={true}
          />
        </div>
      )}
    </div>
  );
}
