import QuotesDashboard from '@/components/quotes/QuotesDashboard';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Quotes Management',
  description: 'Create and manage customer quotes',
};

export default function QuotesPage() {
  return (
    <ProtectedRoute>
      <QuotesDashboard />
    </ProtectedRoute>
  );
}