'use client';

import { useParams } from 'next/navigation';
import CustomerDetails from '@/components/customers/CustomerDetails';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function CustomerDetailsPage() {
  const params = useParams();
  const customerId = params.id as string;

  return (
    <ProtectedRoute>
      <CustomerDetails customerId={customerId} />
    </ProtectedRoute>
  );
}