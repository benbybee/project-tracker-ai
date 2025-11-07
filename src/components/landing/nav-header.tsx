'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react';

export function NavHeader() {
  const { data: session } = useSession();

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/tasktracker-logo.png"
              alt="TaskTracker AI"
              width={32}
              height={32}
              priority
              className="h-8 w-auto"
            />
            <span className="text-xl font-semibold text-slate-900">
              TaskTracker<span className="text-brand-600">AI</span>
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href="#features"
              className="hidden text-sm font-medium text-slate-700 hover:text-brand-600 transition-colors sm:block"
            >
              Features
            </Link>

            {session?.user ? (
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/sign-in">Login</Link>
                </Button>
                <Button
                  asChild
                  size="sm"
                  className="bg-brand-500 hover:bg-brand-600 text-white"
                >
                  <Link href="/sign-up">Sign Up</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
