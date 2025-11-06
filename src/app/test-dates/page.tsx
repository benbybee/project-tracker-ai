'use client';

import { useState } from 'react';

export default function TestDatesPage() {
  const [result, setResult] = useState('');
  const [testing, setTesting] = useState(false);

  const testDatabase = async () => {
    setTesting(true);
    try {
      // Direct database test
      const response = await fetch('/api/test-dates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dueDate: '2025-11-10' }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (error: any) {
      setResult(`ERROR: ${error.message}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Due Date Database Test</h1>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h2 className="font-semibold text-blue-900 mb-2">Test Purpose</h2>
        <p className="text-blue-800 text-sm">
          This page tests the database round-trip for due dates. It creates a
          task with a specific date, immediately reads it back, and verifies the
          date matches.
        </p>
      </div>

      <button
        onClick={testDatabase}
        disabled={testing}
        className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {testing ? 'Testing...' : 'Test Database Round Trip'}
      </button>

      {result && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">Result:</h2>
          <pre className="bg-gray-100 border border-gray-300 rounded-lg p-4 overflow-auto text-sm">
            {result}
          </pre>

          {result.includes('"match": true') && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 font-semibold">✅ SUCCESS</p>
              <p className="text-green-700 text-sm">
                Date was stored and retrieved correctly!
              </p>
            </div>
          )}

          {result.includes('"match": false') && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 font-semibold">❌ FAILURE</p>
              <p className="text-red-700 text-sm">
                Date mismatch detected. Check the console for details.
              </p>
            </div>
          )}

          {result.includes('ERROR') && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 font-semibold">❌ ERROR</p>
              <p className="text-red-700 text-sm">
                An error occurred during the test.
              </p>
            </div>
          )}
        </div>
      )}

      <div className="mt-8 border-t pt-6">
        <h2 className="text-lg font-semibold mb-3">How It Works</h2>
        <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
          <li>Sends dueDate: '2025-11-10' to /api/test-dates</li>
          <li>API creates a temporary task with this date</li>
          <li>API immediately reads the task back from database</li>
          <li>API deletes the test task</li>
          <li>
            Returns: sent value, inserted value, retrieved value, and match
            status
          </li>
        </ol>
      </div>
    </div>
  );
}
