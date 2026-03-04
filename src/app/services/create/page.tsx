'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import ServiceCreate from '@/components/services/ServiceCreate';

export default function CreateServicePage() {
  return (
    <ProtectedRoute>
      <ServiceCreate />
    </ProtectedRoute>
  );
}
