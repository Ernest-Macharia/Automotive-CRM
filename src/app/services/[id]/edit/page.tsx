// app/services/[id]/edit/page.tsx
'use client';

import { useParams } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import ServiceEdit from '@/components/services/ServiceEdit';

export default function EditServicePage() {
  const params = useParams();
  
  return (
    <ProtectedRoute>
      <ServiceEdit serviceId={params.id as string} />
    </ProtectedRoute>
  );
}