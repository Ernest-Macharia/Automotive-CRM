'use client';

import { useParams } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import WorkOrderEdit from '@/components/orders/work-orders/WorkOrderEdit';

export default function WorkOrderEditPage() {
  const params = useParams();
  
  return (
    <ProtectedRoute>
      <WorkOrderEdit />
    </ProtectedRoute>
  );
}