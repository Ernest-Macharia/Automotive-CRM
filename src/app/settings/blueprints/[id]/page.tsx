'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import BlueprintDetailsPage from '@/components/settings/blueprints/BlueprintDetailsPage';
import { useParams } from 'next/navigation';

export default function BlueprintDetailsRoute() {
  const params = useParams();
  
  return (
    <ProtectedRoute>
      <BlueprintDetailsPage blueprintId={params.id as string} />
    </ProtectedRoute>
  );
}