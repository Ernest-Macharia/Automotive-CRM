'use client';

import { useParams } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import FeedbackDetail from '@/components/feedback/FeedbackDetail';

export default function FeedbackDetailPage() {
  const params = useParams();
  
  return (
    <ProtectedRoute>
      <FeedbackDetail feedbackId={params.id as string} />
    </ProtectedRoute>
  );
}