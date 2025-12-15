'use client';

import LeadsDashboard from '@/components/leads/LeadsDashboard';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function LeadsPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <LeadsDashboard />
        </div>
      </div>
    </ProtectedRoute>
  );
}