'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import FeedbackList from '@/components/feedback/FeedbackList';

export default function AssignedFeedbackPage() {
  return (
    <ProtectedRoute>
      <FeedbackList mode="assigned" />
    </ProtectedRoute>
  );
}