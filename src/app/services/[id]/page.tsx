// app/services/[id]/page.tsx
'use client';

import { useParams } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import ServiceDetail from '@/components/services/ServiceDetail';

export default function ServiceDetailPage() {
  const params = useParams();
  
  return (
    <ProtectedRoute>
      <ServiceDetail serviceId={params.id as string} />
    </ProtectedRoute>
  );
}