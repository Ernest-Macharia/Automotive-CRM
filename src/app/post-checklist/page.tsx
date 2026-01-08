'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PostChecklistDashboard from '@/components/post-checklist/PostChecklistDashboard';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function PostChecklistDashboardRoute() {

  return (
    <ProtectedRoute>
      <PostChecklistDashboard />
    </ProtectedRoute>
  );
}