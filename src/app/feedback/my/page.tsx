'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import FeedbackList from '@/components/feedback/FeedbackList';

export default function MyFeedbackPage() {
  return (
    <ProtectedRoute>
      <FeedbackList mode="my" />
    </ProtectedRoute>
  );
}