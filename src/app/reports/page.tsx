'use client';

import ReportsDashboard from '@/components/reports/ReportsDashboard';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function ReportsPage() {
  return (
    <ProtectedRoute>
      <ReportsDashboard />
    </ProtectedRoute>
  );
}