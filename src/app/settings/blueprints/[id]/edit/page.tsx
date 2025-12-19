'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import EditBlueprintPage from '@/components/settings/blueprints/EditBlueprintPage';
import { useParams } from 'next/navigation';

export default function EditBlueprintRoute() {
  const params = useParams();
  
  return (
    <ProtectedRoute>
      <EditBlueprintPage blueprintId={params.id as string} />
    </ProtectedRoute>
  );
}