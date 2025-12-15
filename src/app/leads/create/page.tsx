'use client';

import { useSearchParams } from 'next/navigation';
import CreateLeadForm from '@/components/leads/CreateLeadForm';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function CreateLeadPage() {
  const searchParams = useSearchParams();
  const opportunityId = searchParams.get('opportunityId');

  return (
    <ProtectedRoute>
      <CreateLeadForm opportunityId={opportunityId || undefined} />
    </ProtectedRoute>
  );
}