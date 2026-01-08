'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PreChecklistDashboard from '@/components/pre-checklist/PreChecklistDashboard';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function PreChecklistDashboardRoute() {

  return (
    <ProtectedRoute>
      <PreChecklistDashboard />
    </ProtectedRoute>
  );
}