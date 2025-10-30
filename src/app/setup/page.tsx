'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, RefreshCw, Database, ExternalLink } from 'lucide-react';

interface DBHealth {
  ok: boolean;
  status: string;
  message?: string;
  reason?: string;
  possibleCauses?: string[];
  solution?: Record<string, string>;
  error?: string;
}

export default function SetupPage() {
  const [dbHealth, setDbHealth] = useState<DBHealth | null>(null);
  const [loading, setLoading] = useState(true);

  const checkDatabase = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/health/db');
      const data = await response.json();
      setDbHealth(data);
    } catch (error) {
      setDbHealth({
        ok: false,
        status: 'error',
        message: 'Failed to check database connection',
        error: String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkDatabase();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <Database className="h-8 w-8 text-indigo-600" />
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Database Setup
            </h1>
          </div>

          <p className="text-slate-600 dark:text-slate-300 mb-8">
            This app requires a PostgreSQL database connection. Check your configuration below.
          </p>

          {/* Database Status Card */}
          <div className="border-2 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                Connection Status
              </h2>
              <button
                onClick={checkDatabase}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Test Connection
              </button>
            </div>

            {loading && (
              <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                <RefreshCw className="h-5 w-5 animate-spin" />
                <span>Testing database connection...</span>
              </div>
            )}

            {!loading && dbHealth && (
              <div>
                {dbHealth.ok ? (
                  <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-green-900 dark:text-green-100">
                        {dbHealth.message}
                      </p>
                      <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                        Your database is properly configured. You can now{' '}
                        <a href="/sign-in" className="underline font-medium">
                          sign in
                        </a>.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold text-red-900 dark:text-red-100 mb-2">
                        {dbHealth.message || 'Database Connection Failed'}
                      </p>

                      {dbHealth.possibleCauses && (
                        <div className="mb-4">
                          <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
                            Possible Causes:
                          </p>
                          <ul className="list-disc list-inside space-y-1 text-sm text-red-700 dark:text-red-300">
                            {dbHealth.possibleCauses.map((cause, i) => (
                              <li key={i}>{cause}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {dbHealth.solution && (
                        <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-red-200 dark:border-red-800">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
                            🔧 How to Fix:
                          </p>
                          <ol className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                            {Object.entries(dbHealth.solution).map(([key, value]) => (
                              <li key={key} className="flex gap-2">
                                <span className="font-mono text-indigo-600 dark:text-indigo-400">
                                  {key.replace('step', '')}
                                </span>
                                <span>{value}</span>
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}

                      {dbHealth.error && (
                        <details className="mt-4">
                          <summary className="text-sm font-medium text-red-800 dark:text-red-200 cursor-pointer">
                            Technical Details
                          </summary>
                          <pre className="mt-2 p-3 bg-slate-900 text-green-400 rounded text-xs overflow-x-auto">
                            {dbHealth.error}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Setup Instructions */}
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
              Setup Instructions
            </h2>

            <div className="space-y-4">
              <div className="border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
                  Option 1: Supabase (Recommended)
                </h3>
                <ol className="space-y-3 text-slate-700 dark:text-slate-300">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center text-sm font-bold">
                      1
                    </span>
                    <div>
                      <p>
                        Create a free Supabase account at{' '}
                        <a
                          href="https://supabase.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
                        >
                          supabase.com
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center text-sm font-bold">
                      2
                    </span>
                    <p>Create a new project</p>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center text-sm font-bold">
                      3
                    </span>
                    <p>
                      Go to Project Settings → Database → Copy the Connection String (URI format)
                    </p>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center text-sm font-bold">
                      4
                    </span>
                    <div className="flex-1">
                      <p className="mb-2">Create/update <code className="px-2 py-1 bg-slate-100 dark:bg-slate-900 rounded text-sm">.env</code> file:</p>
                      <pre className="p-4 bg-slate-900 text-green-400 rounded-lg text-sm overflow-x-auto">
{`DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
OPENAI_API_KEY="sk-your-key-here"
SUPABASE_URL="https://[YOUR-PROJECT-REF].supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"`}
                      </pre>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center text-sm font-bold">
                      5
                    </span>
                    <div className="flex-1">
                      <p className="mb-2">Run migrations and seed:</p>
                      <pre className="p-4 bg-slate-900 text-green-400 rounded-lg text-sm">
{`pnpm db:push
pnpm db:seed`}
                      </pre>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center text-sm font-bold">
                      6
                    </span>
                    <p>Restart the development server</p>
                  </li>
                </ol>
              </div>

              <div className="border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
                  Option 2: Local PostgreSQL
                </h3>
                <ol className="space-y-3 text-slate-700 dark:text-slate-300">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center text-sm font-bold">
                      1
                    </span>
                    <p>Install PostgreSQL on your system</p>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center text-sm font-bold">
                      2
                    </span>
                    <p>Create a database (e.g., <code className="px-2 py-1 bg-slate-100 dark:bg-slate-900 rounded text-sm">project_tracker</code>)</p>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center text-sm font-bold">
                      3
                    </span>
                    <div className="flex-1">
                      <p className="mb-2">Update <code className="px-2 py-1 bg-slate-100 dark:bg-slate-900 rounded text-sm">.env</code>:</p>
                      <pre className="p-4 bg-slate-900 text-green-400 rounded-lg text-sm">
{`DATABASE_URL="postgresql://username:password@localhost:5432/project_tracker"`}
                      </pre>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center text-sm font-bold">
                      4
                    </span>
                    <p>Follow steps 5-6 from Option 1</p>
                  </li>
                </ol>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8 flex gap-4">
            <a
              href="/sign-in"
              className="flex-1 text-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
            >
              Try Sign In
            </a>
            <button
              onClick={checkDatabase}
              className="flex-1 text-center px-6 py-3 border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950 rounded-lg font-medium transition-colors"
            >
              Recheck Connection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

