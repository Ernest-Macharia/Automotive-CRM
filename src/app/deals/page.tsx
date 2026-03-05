'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DealsPage from '@/components/deals/DealsPage';

export default function DealsRoute() {
  return (
    <ProtectedRoute>
      <DealsPage />
    </ProtectedRoute>
  );
}
