import InvoicesDashboard from '@/components/invoices/InvoicesDashboard';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Invoices Management',
  description: 'Create and manage customer invoices',
};

export default function InvoicesPage() {
  return (
    <ProtectedRoute>
      <InvoicesDashboard />
    </ProtectedRoute>
  );
}