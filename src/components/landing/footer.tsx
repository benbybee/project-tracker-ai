'use client';

import Link from 'next/link';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              TaskTracker AI
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              AI-powered task and project management application
            </p>
          </div>
          
          <div>
            <h4 className="text-sm font-semibold text-slate-900 mb-4">Product</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="#features"
                  className="text-sm text-slate-600 hover:text-brand-600 transition-colors"
                >
                  Features
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-sm font-semibold text-slate-900 mb-4">Company</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/sign-in"
                  className="text-sm text-slate-600 hover:text-brand-600 transition-colors"
                >
                  Login
                </Link>
              </li>
              <li>
                <Link
                  href="/sign-up"
                  className="text-sm text-slate-600 hover:text-brand-600 transition-colors"
                >
                  Sign Up
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 border-t border-slate-200 pt-8">
          <p className="text-sm text-slate-600 text-center">
          © {currentYear} TaskTracker AI. All rights reserved.
        </p>
        </div>
      </div>
    </footer>
  );
}

