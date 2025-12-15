import InvoicesManagement from '@/components/invoices/InvoicesManagement';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Invoices Management',
  description: 'Create and manage invoices',
};

export default function InvoicesPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <InvoicesManagement />
      </div>
    </ProtectedRoute>
  );
}