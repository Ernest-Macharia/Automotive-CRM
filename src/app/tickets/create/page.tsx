import ProtectedRoute from '@/components/auth/ProtectedRoute';
import TicketCreatePage from '@/components/tickets/TicketCreatePage';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create Ticket',
  description: 'Create a new support ticket',
};

export default function TicketCreateRoutePage() {
  return (
    <ProtectedRoute>
      <TicketCreatePage />
    </ProtectedRoute>
  );
}
