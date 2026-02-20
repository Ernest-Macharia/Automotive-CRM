// app/workorders/create/page.tsx
'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import WorkOrderCreate from '@/components/orders/work-orders/WorkOrderCreate';

export default function CreateWorkOrderPage() {
  return (
    <ProtectedRoute>
      <WorkOrderCreate />
    </ProtectedRoute>
  );
}