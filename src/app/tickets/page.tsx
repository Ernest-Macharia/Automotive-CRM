import ProtectedRoute from '@/components/auth/ProtectedRoute';
import TicketsPage from '@/components/tickets/TicketsPage';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tickets',
  description: 'Manage support tickets',
};

export default function TicketsRoutePage() {
  return (
    <ProtectedRoute>
      <TicketsPage />
    </ProtectedRoute>
  );
}
