import ContactsDashboard from '@/components/contacts/contactsDashboard';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contacts Management',
  description: 'Manage and communicate with your contacts',
};

export default function ContactsPage() {
  return (
    <ProtectedRoute>
      <ContactsDashboard />
    </ProtectedRoute>
  );
}