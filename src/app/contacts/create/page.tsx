import ContactForm from '@/components/contacts/contactForm';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create New Contact',
  description: 'Add a new contact to your CRM',
};

export default function CreateContactPage() {
  return (
    <ProtectedRoute>
      <ContactForm mode="create" />
    </ProtectedRoute>
  );
}