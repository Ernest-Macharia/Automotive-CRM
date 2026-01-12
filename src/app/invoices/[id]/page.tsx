// app/invoices/[id]/page.tsx
import { Metadata } from 'next';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import InvoiceDetailPage from '@/components/invoices/InvoiceDetailPage';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Invoice ${id} - Details`,
  };
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  
  if (!id || id === 'undefined') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4" />
          <p className="text-gray-600">Invalid invoice ID</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <InvoiceDetailPage id={id} />
    </ProtectedRoute>
  );
}