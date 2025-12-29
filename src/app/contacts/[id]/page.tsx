// app/contacts/[id]/page.tsx
'use client';

import { useParams } from 'next/navigation';
import ContactDetails from '@/components/contacts/contactDetails';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function ContactDetailsPage() {
  const params = useParams();
  const contactId = params.id as string;

  return (
    <ProtectedRoute>
      <ContactDetails contactId={contactId} />
    </ProtectedRoute>
  );
}