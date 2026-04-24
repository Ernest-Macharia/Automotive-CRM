'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import ContactList from '@/components/manychat/ContactList';
import ContactDetail from '@/components/manychat/ContactDetail';
import { ManyChatContact } from '@/services/manychatService';
import { Users, ClipboardCheck } from 'lucide-react';

export default function ContactsPage() {
  const router = useRouter();
  const [selectedContact, setSelectedContact] = useState<ManyChatContact | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const handleSelectContact = (contact: ManyChatContact) => {
    setSelectedContact(contact);
    setShowDetail(true);
  };

  const handleCreateChecklist = (contact?: ManyChatContact) => {
    const query = new URLSearchParams({
      source: 'manychat',
    });
    const suggestedClient = contact?.fullName || `${contact?.firstName || ''} ${contact?.lastName || ''}`.trim();
    if (suggestedClient) {
      query.set('clientSearch', suggestedClient);
    }
    router.push(`/pre-checklist/create?${query.toString()}`);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 shadow-md">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">ManyChat Contacts</h1>
                  <p className="text-blue-100 text-sm">Manage your chatbot subscribers</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleCreateChecklist()}
                className="px-4 py-2 bg-white text-indigo-700 rounded-lg hover:bg-indigo-50 font-medium flex items-center gap-2"
              >
                <ClipboardCheck className="h-4 w-4" />
                Create Checklist
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto p-4">
          <ContactList 
            onSelectContact={handleSelectContact}
            onCreateContact={() => {/* Open create modal */}}
            onSendMessage={(contact) => {/* Open message composer */}}
            onCreateChecklist={handleCreateChecklist}
          />
        </div>

        {/* Contact Detail Modal */}
        {showDetail && selectedContact && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="w-full max-w-4xl">
              <ContactDetail
                contact={selectedContact}
                onClose={() => setShowDetail(false)}
              />
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
