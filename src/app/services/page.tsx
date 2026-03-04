'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import ServicesList from '@/components/services/ServicesList';

export default function ServicesPage() {
  return (
    <ProtectedRoute>
      <ServicesList />
    </ProtectedRoute>
  );
}
