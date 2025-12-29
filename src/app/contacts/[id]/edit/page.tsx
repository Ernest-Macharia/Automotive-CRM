'use client';

import { useParams } from 'next/navigation';
import ContactForm from '@/components/contacts/contactForm';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function EditContactPage() {
  const params = useParams();
  const contactId = params.id as string;

  return (
    <ProtectedRoute>
      <ContactForm contactId={contactId} mode="edit" />
    </ProtectedRoute>
  );
}