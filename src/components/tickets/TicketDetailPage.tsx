'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, MessageSquare, Send } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { ticketService, Ticket, TicketReply } from '@/services/ticketService';
import { useCurrentUser } from '@/hooks/useCurrentUser';

interface TicketDetailPageProps {
  id: string;
}

export default function TicketDetailPage({ id }: TicketDetailPageProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const { user } = useCurrentUser();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reply, setReply] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('open');

  const roleName = useMemo(() => {
    const role = (user as unknown as { role?: unknown } | null)?.role;
    if (typeof role === 'string') return role.toLowerCase();
    if (role && typeof role === 'object') {
      const name = (role as Record<string, unknown>).name;
      if (typeof name === 'string') return name.toLowerCase();
    }
    return '';
  }, [user]);

  const canManage = roleName === 'admin' || roleName === 'superadmin' || roleName === 'super_administrator';

  const loadTicket = useCallback(async () => {
    try {
      setLoading(true);
      const data = await ticketService.getTicketById(id);
      setTicket(data);
      setSelectedStatus(data.status || 'open');
    } catch (error) {
      console.error('Error loading ticket:', error);
      showToast('Failed to load ticket', 'error');
      router.push('/tickets');
    } finally {
      setLoading(false);
    }
  }, [id, router, showToast]);

  useEffect(() => {
    loadTicket();
  }, [loadTicket]);

  const handleAddReply = async (e: FormEvent) => {
    e.preventDefault();
    if (!reply.trim()) return;

    try {
      setSaving(true);
      const response = await ticketService.addReply(id, { message: reply.trim() });
      const currentReplies = ticket?.replies || [];
      setTicket(prev => (prev ? { ...prev, replies: [...currentReplies, response] } : prev));
      setReply('');
      showToast('Reply added', 'success');
    } catch (error) {
      console.error('Error adding reply:', error);
      showToast('Failed to add reply', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!ticket || !selectedStatus) return;
    try {
      setSaving(true);
      const updated = await ticketService.updateTicketStatus(id, { status: selectedStatus });
      setTicket(updated);
      showToast('Ticket status updated', 'success');
    } catch (error) {
      console.error('Error updating status:', error);
      showToast('Failed to update ticket status', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleQueueTicket = async () => {
    try {
      setSaving(true);
      const updated = await ticketService.queueTicket(id, { queue: 'default' });
      setTicket(updated);
      showToast('Ticket queued', 'success');
    } catch (error) {
      console.error('Error queueing ticket:', error);
      showToast('Failed to queue ticket', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading ticket...</div>;
  }

  if (!ticket) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Ticket not found.</div>;
  }

  const replies: TicketReply[] = ticket.replies || [];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-5xl mx-auto space-y-5">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-5">
          <button
            onClick={() => router.push('/tickets')}
            className="inline-flex items-center gap-2 text-blue-100 hover:text-white mb-3 text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Tickets
          </button>
          <h1 className="text-xl font-semibold text-white">{ticket.subject}</h1>
          <p className="text-blue-100 text-sm mt-1">Status: {ticket.status} | Priority: {ticket.priority}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Description</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{ticket.description}</p>

            <div className="mt-6 pt-5 border-t border-gray-200">
              <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Replies ({replies.length})
              </h3>

              {replies.length === 0 ? (
                <p className="text-sm text-gray-500">No replies yet.</p>
              ) : (
                <div className="space-y-3 mb-4">
                  {replies.map(item => (
                    <div key={item.id || item._id} className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <p className="text-sm text-gray-800">{item.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {item.authorName || 'User'} | {item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <form onSubmit={handleAddReply} className="space-y-2">
                <textarea
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Write a reply..."
                />
                <div className="flex justify-end">
                  <button
                    disabled={saving}
                    type="submit"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Send Reply
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-5 h-fit">
            <h3 className="font-semibold text-gray-900 mb-3">Ticket Info</h3>
            <div className="space-y-2 text-sm">
              <p><span className="text-gray-500">ID:</span> {ticket.id || ticket._id}</p>
              <p><span className="text-gray-500">Category:</span> {ticket.category || 'general'}</p>
              <p><span className="text-gray-500">Requester:</span> {ticket.requesterName || '-'}</p>
              <p><span className="text-gray-500">Email:</span> {ticket.requesterEmail || '-'}</p>
              <p><span className="text-gray-500">Created:</span> {ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : '-'}</p>
            </div>

            {canManage && (
              <div className="mt-5 pt-4 border-t border-gray-200 space-y-3">
                <h4 className="font-medium text-gray-900 text-sm">Admin Actions</h4>
                <select
                  value={selectedStatus}
                  onChange={e => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="open">Open</option>
                  <option value="queued">Queued</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
                <button
                  onClick={handleUpdateStatus}
                  disabled={saving}
                  className="w-full px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-60"
                >
                  Update Status
                </button>
                <button
                  onClick={handleQueueTicket}
                  disabled={saving}
                  className="w-full px-3 py-2 border border-indigo-300 text-indigo-700 rounded-lg text-sm hover:bg-indigo-50 disabled:opacity-60"
                >
                  Queue Ticket
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
