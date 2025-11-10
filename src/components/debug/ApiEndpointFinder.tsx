// src/components/debug/ApiEndpointFinder.tsx
'use client';

import { useState } from 'react';

export function ApiEndpointFinder() {
  const [results, setResults] = useState<any[]>([]);
  const [isTesting, setIsTesting] = useState(false);

  const testAllEndpoints = async () => {
    setIsTesting(true);
    setResults([]);

    const testCases = [
      {
        name: 'Pattern 1: /api/v1/auth/login',
        url: '/api/proxy/api/v1/auth/login',
        method: 'POST',
        body: { email: "superadmin@crm.local", password: "ChangeMe123!" }
      },
      {
        name: 'Pattern 2: /v1/auth/login',
        url: '/api/proxy/v1/auth/login',
        method: 'POST',
        body: { email: "superadmin@crm.local", password: "ChangeMe123!" }
      },
      {
        name: 'Pattern 3: /auth/login',
        url: '/api/proxy/auth/login',
        method: 'POST',
        body: { email: "superadmin@crm.local", password: "ChangeMe123!" }
      },
      {
        name: 'Pattern 4: Direct to /api/v1/auth/login',
        url: 'https://mag-backend-0gn4.onrender.com/api/v1/auth/login',
        method: 'POST',
        body: { email: "superadmin@crm.local", password: "ChangeMe123!" },
        direct: true
      }
    ];

    for (const testCase of testCases) {
      try {
        console.log(`🧪 Testing: ${testCase.name}`);
        
        let response;
        if (testCase.direct) {
          // Test direct call (will fail due to CORS, but we can see the attempt)
          response = await fetch(testCase.url, {
            method: testCase.method,
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(testCase.body),
          });
        } else {
          // Test through proxy
          response = await fetch(testCase.url, {
            method: testCase.method,
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(testCase.body),
          });
        }

        let data;
        try {
          data = await response.json();
        } catch {
          data = { error: 'No JSON response' };
        }
        
        setResults(prev => [...prev, {
          name: testCase.name,
          url: testCase.url,
          status: response.status,
          success: response.ok,
          data: data
        }]);

      } catch (error: any) {
        setResults(prev => [...prev, {
          name: testCase.name,
          url: testCase.url,
          status: 'ERROR',
          success: false,
          error: error.message
        }]);
      }
    }
    
    setIsTesting(false);
  };

  return (
    <div className="p-4 border rounded-lg bg-yellow-50 max-w-2xl">
      <h3 className="font-semibold mb-2">API Endpoint Finder</h3>
      <p className="text-sm text-yellow-700 mb-4">
        Testing different endpoint patterns to find the correct one
      </p>
      
      <button
        onClick={testAllEndpoints}
        disabled={isTesting}
        className="px-4 py-2 bg-yellow-500 text-white rounded disabled:opacity-50 mb-4"
      >
        {isTesting ? 'Testing All Patterns...' : 'Test All Endpoint Patterns'}
      </button>

      {results.length > 0 && (
        <div className="space-y-3">
          {results.map((result, index) => (
            <div 
              key={index}
              className={`p-3 border rounded ${
                result.success 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium">{result.name}</h4>
                  <p className="text-sm text-gray-600">{result.url}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  result.success 
                    ? 'bg-green-100 text-green-800' 
                    : result.status === 404 
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {result.success ? `✅ ${result.status}` : 
                   result.status === 404 ? `🔍 404 - Not Found` : 
                   `❌ ${result.status || 'ERROR'}`}
                </span>
              </div>
              
              {result.success && result.data && (
                <pre className="text-xs mt-2 p-2 bg-white rounded border overflow-auto">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              )}
              
              {result.error && (
                <p className="text-red-600 text-xs mt-1">{result.error}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}