// src/components/debug/ConnectionTest.tsx
'use client';

import { useState } from 'react';

export function ConnectionTest() {
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const testConnection = async () => {
    setStatus('testing');
    setMessage('Testing connection to backend...');
    
    try {
      const response = await fetch('https://mag-backend-0gn4.onrender.com/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: "superadmin@crm.local",
          password: "ChangeMe123!"
        }),
      });

      if (response.ok) {
        setStatus('success');
        setMessage('✅ Backend is reachable and responding!');
      } else {
        setStatus('error');
        setMessage(`❌ Backend responded with status: ${response.status}`);
      }
    } catch (error: any) {
      setStatus('error');
      setMessage(`❌ Connection failed: ${error.message}`);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <h3 className="font-semibold mb-2">Backend Connection Test</h3>
      <button
        onClick={testConnection}
        disabled={status === 'testing'}
        className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
      >
        {status === 'testing' ? 'Testing...' : 'Test Connection'}
      </button>
      {message && (
        <p className={`mt-2 text-sm ${
          status === 'success' ? 'text-green-600' : 
          status === 'error' ? 'text-red-600' : 'text-gray-600'
        }`}>
          {message}
        </p>
      )}
    </div>
  );
}