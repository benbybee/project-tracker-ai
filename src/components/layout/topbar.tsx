"use client";
import { useState, useEffect } from "react";
import { Search, Bell, Menu } from "lucide-react";
import { GradientButton } from "@/components/ui/gradient-button";
import SyncIndicator from "@/components/sync/SyncIndicator";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { ConflictReviewButton } from "@/components/sync/ConflictModal";

export function Topbar() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const openMobileSidebar = () => {
    // Dispatch custom event to open mobile sidebar
    window.dispatchEvent(new CustomEvent('openMobileSidebar'));
  };

  return (
    <header className="sticky top-0 z-40 bg-white/70 backdrop-blur border-b">
      <div className="mx-auto flex items-center gap-3 px-4 py-2">
        <input
          className="flex-1 rounded-lg border px-3 py-2 text-sm"
          placeholder="Search (Ctrl+K)"
        />
        <div className="flex items-center gap-3">
          <SyncIndicator />
          <ConflictReviewButton />
          <NotificationBell />
          <GradientButton
            onClick={() => {
              // TODO: Implement new task functionality
              console.log('New Task clicked');
            }}
          >
            New Task
          </GradientButton>
        </div>
      </div>
    </header>
  );
}
