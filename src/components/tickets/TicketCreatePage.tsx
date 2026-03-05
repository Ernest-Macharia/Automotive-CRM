'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Send, Ticket } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { ticketService } from '@/services/ticketService';

export default function TicketCreatePage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [saving, setSaving] = useState(false);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [category, setCategory] = useState('general');
  const [requesterName, setRequesterName] = useState('');
  const [requesterEmail, setRequesterEmail] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!subject.trim() || !description.trim()) {
      showToast('Subject and description are required', 'error');
      return;
    }

    if (!requesterName.trim() || !requesterEmail.trim()) {
      showToast('Requester name and email are required', 'error');
      return;
    }

    try {
      setSaving(true);
      const ticket = await ticketService.createPublicTicket({
        subject: subject.trim(),
        description: description.trim(),
        priority,
        category,
        requesterName: requesterName.trim(),
        requesterEmail: requesterEmail.trim(),
      });

      const id = ticket.id || ticket._id;
      showToast('Ticket created successfully', 'success');
      if (id) {
        router.push(`/tickets/${id}`);
      } else {
        router.push('/tickets');
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
      showToast('Failed to create ticket', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-3xl mx-auto">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-5 mb-5">
          <button
            onClick={() => router.push('/tickets')}
            className="inline-flex items-center gap-2 text-blue-100 hover:text-white mb-3 text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Tickets
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white/20">
              <Ticket className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-white">Create Ticket</h1>
              <p className="text-blue-100 text-sm">Submit a new support request</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
            <input
              value={subject}
              onChange={e => setSubject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Ticket subject"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Describe the issue"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <input
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="general"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Requester Name</label>
              <input
                value={requesterName}
                onChange={e => setRequesterName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Requester Email</label>
              <input
                value={requesterEmail}
                onChange={e => setRequesterEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="email@example.com"
                type="email"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              disabled={saving}
              type="submit"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {saving ? 'Submitting...' : 'Submit Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
