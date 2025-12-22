import CreateInvoicePage from '@/components/invoices/CreateInvoicePage';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create Invoice',
  description: 'Generate a new invoice from a quote or sales order',
};

export default function CreateInvoicePageRoute() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <CreateInvoicePage />
      </div>
    </ProtectedRoute>
  );
}