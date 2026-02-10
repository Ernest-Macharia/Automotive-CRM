// app/feedback/[id]/edit/page.tsx
'use client';

import { useParams } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import FeedbackEdit from '@/components/feedback/FeedbackEdit';

export default function EditFeedbackPage() {
  const params = useParams();
  
  return (
    <ProtectedRoute>
      <FeedbackEdit feedbackId={params.id as string} />
    </ProtectedRoute>
  );
}