'use client';

import { useSearchParams } from 'next/navigation';
import { GlassCard } from '@/components/ui/glass-card';

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'Configuration':
        return {
          title: 'Authentication Configuration Error',
          message: 'The authentication system is not properly configured.',
          details: 'Missing required environment variables: NEXTAUTH_SECRET, NEXTAUTH_URL, or DATABASE_URL',
          solution: 'Please contact the administrator to configure the authentication system.'
        };
      case 'AccessDenied':
        return {
          title: 'Access Denied',
          message: 'You do not have permission to access this resource.',
          details: 'Your account may not have the required permissions.',
          solution: 'Please contact your administrator for access.'
        };
      case 'Verification':
        return {
          title: 'Verification Error',
          message: 'There was an error verifying your credentials.',
          details: 'The verification token may be invalid or expired.',
          solution: 'Please try signing in again.'
        };
      default:
        return {
          title: 'Authentication Error',
          message: 'An unexpected error occurred during authentication.',
          details: error ? `Error code: ${error}` : 'Unknown error',
          solution: 'Please try again or contact support if the problem persists.'
        };
    }
  };

  const errorInfo = getErrorMessage(error);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <GlassCard className="p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              {errorInfo.title}
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              {errorInfo.message}
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
              Details:
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
              {errorInfo.details}
            </p>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
              Solution:
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {errorInfo.solution}
            </p>
          </div>

          <div className="space-y-3">
            <a
              href="/sign-in"
              className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Try Again
            </a>
            <a
              href="/"
              className="block w-full bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-slate-100 font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Go Home
            </a>
          </div>

          {error === 'Configuration' && (
            <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">
                For Administrators:
              </h4>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                This error indicates missing environment variables. Check the Vercel deployment guide for setup instructions.
              </p>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}