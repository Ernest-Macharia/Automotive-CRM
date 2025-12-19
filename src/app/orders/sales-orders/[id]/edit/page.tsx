'use client';

import { useParams } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import SalesOrderEdit from '@/components/orders/sales-orders/SalesOrderEdit';

export default function SalesOrderEditPage() {
  const params = useParams();
  
  return (
    <ProtectedRoute>
      <SalesOrderEdit />
    </ProtectedRoute>
  );
}