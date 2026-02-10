'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import FeedbackCreate from '@/components/feedback/FeedbackCreate';

export default function CreateFeedbackPage() {
  return (
    <ProtectedRoute>
      <FeedbackCreate />
    </ProtectedRoute>
  );
}