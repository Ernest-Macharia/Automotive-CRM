import { Metadata } from 'next';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import TicketDetailPage from '@/components/tickets/TicketDetailPage';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Ticket ${id}`,
    description: 'Ticket details',
  };
}

export default async function TicketDetailsRoutePage({ params }: PageProps) {
  const { id } = await params;

  if (!id || id === 'undefined') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-gray-600">Invalid ticket ID</div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <TicketDetailPage id={id} />
    </ProtectedRoute>
  );
}
