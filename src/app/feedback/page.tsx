'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import FeedbackList from '@/components/feedback/FeedbackList';

export default function FeedbackPage() {
  return (
    <ProtectedRoute>
      <FeedbackList/>
    </ProtectedRoute>
  );
}