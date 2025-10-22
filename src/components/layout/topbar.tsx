"use client";
import { useState, useEffect } from "react";
import { Search, Bell, Menu } from "lucide-react";
import { GradientButton } from "@/components/ui/gradient-button";

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
    <header
      className="sticky top-4 z-30 mx-4 md:mx-6 rounded-[var(--radius-xl)] border shadow-soft px-4 md:px-6 py-3 backdrop-blur-xl
                 bg-[color:rgb(var(--glass-bg))] border-[color:rgb(var(--glass-border))]"
    >
      <div className="flex items-center gap-3">
        {isMobile && (
          <button 
            onClick={openMobileSidebar}
            aria-label="Open navigation menu"
            className="h-9 w-9 rounded-full border border-white/40 bg-white/50 backdrop-blur hover:bg-white/70 transition flex items-center justify-center"
          >
            <Menu className="h-4 w-4" />
          </button>
        )}
        <div className="flex items-center gap-3">
          <img 
            src="/tasktracker-logo.png" 
            alt="TaskTracker AI" 
            className="h-8 w-auto"
          />
        </div>
        <button 
          aria-label="Search" 
          className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300"
          onClick={() => document.dispatchEvent(new KeyboardEvent("keydown", { ctrlKey: true, key: "k" }))}
        >
          <Search className="h-4 w-4" /> <span className="hidden sm:block">Search (Ctrl+K)</span>
        </button>
        <div className="ml-auto flex items-center gap-2">
          <button 
            aria-label="Notifications" 
            className="h-9 w-9 rounded-full border border-white/40 bg-white/50 backdrop-blur hover:bg-white/70 transition"
            onClick={() => {
              // TODO: Implement notifications functionality
              console.log('Notifications clicked');
            }}
          >
            <Bell className="mx-auto h-4 w-4" />
          </button>
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
