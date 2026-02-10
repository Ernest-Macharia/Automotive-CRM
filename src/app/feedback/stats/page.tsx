'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import FeedbackStats from '@/components/feedback/FeedbackStats';

export default function StatsPage() {
  return (
    <ProtectedRoute>
      <FeedbackStats />
    </ProtectedRoute>
  );
}