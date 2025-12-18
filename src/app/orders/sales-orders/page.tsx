'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import SalesOrdersList from '@/components/orders/sales-orders/SalesOrdersList';

export default function SalesOrdersRoute() {
  return (
    <ProtectedRoute>
      <SalesOrdersList />
    </ProtectedRoute>
  );
}