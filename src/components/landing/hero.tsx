'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight } from 'lucide-react';

interface HeroProps {
  isAuthenticated: boolean;
}

export function Hero({ isAuthenticated }: HeroProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-white via-purple-50/30 to-blue-50/30 py-20 md:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-purple-100 px-4 py-2 text-sm font-medium text-purple-700">
            <Sparkles className="h-4 w-4" />
            AI-Powered Task Management
          </div>

          <h1 className="mb-6 text-5xl font-bold tracking-tight text-slate-900 sm:text-6xl md:text-7xl">
            Maximize your
            <span className="bg-gradient-to-r from-brand-500 to-brand-700 bg-clip-text text-transparent">
              {' '}
              productivity
            </span>
          </h1>

          <p className="mb-10 text-xl text-slate-600 sm:text-2xl">
            Organize tasks, collaborate on projects, and streamline your
            workflow—all in one place, enhanced by AI.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            {isAuthenticated ? (
              <Button
                asChild
                size="lg"
                className="bg-brand-500 hover:bg-brand-600 text-white px-8 py-6 text-lg"
              >
                <Link href="/dashboard">
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            ) : (
              <>
                <Button
                  asChild
                  size="lg"
                  className="bg-brand-500 hover:bg-brand-600 text-white px-8 py-6 text-lg"
                >
                  <Link href="/sign-up">
                    Get Started
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-brand-500 text-brand-600 hover:bg-brand-50 px-8 py-6 text-lg"
                >
                  <Link href="/sign-in">Sign In</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}