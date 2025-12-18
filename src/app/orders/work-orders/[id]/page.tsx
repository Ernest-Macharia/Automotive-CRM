'use client';

import { useParams } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import WorkOrderDetail from '@/components/orders/work-orders/WorkOrderDetail';

export default function WorkOrderDetailPage() {
  const params = useParams();
  
  return (
    <ProtectedRoute>
      <WorkOrderDetail orderId={params.id as string} />
    </ProtectedRoute>
  );
}