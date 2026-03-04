import CreateQuotePage from '@/components/quotes/CreateQuotePage';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create Quote',
  description: 'Create a new quote',
};

export default function CreateQuoteRoute() {
  return (
    <ProtectedRoute>
      <CreateQuotePage />
    </ProtectedRoute>
  );
}
