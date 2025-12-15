import QuotesManagement from '@/components/quotes/QuotesManagement';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Quotes Management',
  description: 'Create and manage quotes',
};

export default function QuotesPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <QuotesManagement />
      </div>
    </ProtectedRoute>
  );
}