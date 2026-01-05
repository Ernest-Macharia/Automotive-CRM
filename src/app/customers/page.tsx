import CustomersDashboard from '@/components/customers/customersDashboard';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Customers Management',
  description: 'Manage and view all customer information',
};

export default function CustomersPage() {
  return (
    <ProtectedRoute>
      <CustomersDashboard />
    </ProtectedRoute>
  );
}