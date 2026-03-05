'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import HrIncidents from '@/components/hr/HrIncidents';

interface PageProps {
  params: {
    incidentId: string;
  };
}

export default function HrIncidentDetailPage({ params }: PageProps) {
  return (
    <ProtectedRoute>
      <HrIncidents incidentId={params.incidentId} />
    </ProtectedRoute>
  );
}
