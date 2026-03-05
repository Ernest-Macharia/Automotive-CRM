'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, RefreshCw, Search, Ticket, CircleDot } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { ticketService, Ticket as TicketEntity } from '@/services/ticketService';

function getStatusClass(status: string): string {
  switch (status) {
    case 'resolved':
    case 'closed':
      return 'bg-green-100 text-green-800';
    case 'queued':
      return 'bg-yellow-100 text-yellow-800';
    case 'in_progress':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

function getPriorityClass(priority: string): string {
  switch (priority) {
    case 'urgent':
    case 'high':
      return 'bg-red-100 text-red-700';
    case 'medium':
      return 'bg-orange-100 text-orange-700';
    default:
      return 'bg-slate-100 text-slate-700';
  }
}

export default function TicketsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [tickets, setTickets] = useState<TicketEntity[]>([]);

  const loadTickets = useCallback(async () => {
    try {
      setLoading(true);
      const data = await ticketService.listTickets({
        search: search || undefined,
        status: status === 'all' ? undefined : status,
      });
      setTickets(data);
    } catch (error) {
      console.error('Error loading tickets:', error);
      showToast('Failed to load tickets', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, showToast, status]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const stats = useMemo(() => {
    const total = tickets.length;
    const open = tickets.filter(item => (item.status || '').toLowerCase() === 'open').length;
    const inProgress = tickets.filter(item => (item.status || '').toLowerCase() === 'in_progress').length;
    const resolved = tickets.filter(item => ['resolved', 'closed'].includes((item.status || '').toLowerCase())).length;
    return { total, open, inProgress, resolved };
  }, [tickets]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="h-16 bg-gradient-to-r from-blue-600 to-indigo-700 px-4 md:px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <Ticket className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white">Tickets</h1>
            <p className="text-blue-100 text-xs">Track and resolve support requests</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadTickets}
            className="p-2 rounded-lg hover:bg-white/20 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4 text-white" />
          </button>
          <Link
            href="/tickets/create"
            className="inline-flex items-center gap-2 px-3 py-2 bg-white text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-50"
          >
            <Plus className="h-4 w-4" />
            New Ticket
          </Link>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 bg-gray-50">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-600">Total</p>
            <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-600">Open</p>
            <p className="text-2xl font-semibold text-gray-900">{stats.open}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-600">In Progress</p>
            <p className="text-2xl font-semibold text-gray-900">{stats.inProgress}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-600">Resolved</p>
            <p className="text-2xl font-semibold text-gray-900">{stats.resolved}</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="Search tickets..."
              />
            </div>
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="queued">Queued</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading tickets...</div>
          ) : tickets.length === 0 ? (
            <div className="p-10 text-center text-gray-500">No tickets found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Subject</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Priority</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {tickets.map(ticket => {
                    const id = ticket.id || ticket._id || '';
                    return (
                      <tr
                        key={id}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => router.push(`/tickets/${id}`)}
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{ticket.subject}</p>
                          <p className="text-xs text-gray-500 line-clamp-1">{ticket.description}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(ticket.status)}`}>
                            <CircleDot className="h-3 w-3" />
                            {ticket.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getPriorityClass(ticket.priority)}`}>
                            {ticket.priority}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
