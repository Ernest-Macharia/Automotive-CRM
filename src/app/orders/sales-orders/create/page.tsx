// app/salesorders/create/page.tsx
'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import SalesOrderCreate from '@/components/orders/sales-orders/SalesOrderCreate';

export default function CreateSalesOrderPage() {
  return (
    <ProtectedRoute>
      <SalesOrderCreate />
    </ProtectedRoute>
  );
}