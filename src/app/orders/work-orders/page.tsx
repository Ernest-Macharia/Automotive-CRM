'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import WorkOrdersList from '@/components/orders/work-orders/WorkOrdersList';

export default function WorkOrdersRoute() {
  return (
    <ProtectedRoute>
      <WorkOrdersList />
    </ProtectedRoute>
  );
}