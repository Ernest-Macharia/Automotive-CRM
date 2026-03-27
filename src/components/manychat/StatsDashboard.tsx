'use client';

import { useEffect, useState } from 'react';
import {
  Users,
  MessageSquare,
  Tag,
  Send,
  RefreshCw,
  Info,
} from 'lucide-react';
import { manychatService, ManyChatStats } from '@/services/manychatService';
import { useToast } from '@/contexts/ToastContext';

export default function StatsDashboard() {
  const { showToast } = useToast();
  const [stats, setStats] = useState<ManyChatStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await manychatService.getStats();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      showToast('Failed to load ManyChat statistics', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-3" />
        <p className="text-gray-500">Loading statistics...</p>
      </div>
    );
  }

  const cards = [
    {
      title: 'Subscribers',
      value: stats?.totalSubscribers ?? 0,
      icon: Users,
      color: 'bg-blue-100 text-blue-700',
    },
    {
      title: 'Active Subscribers',
      value: stats?.activeSubscribers ?? 0,
      icon: Users,
      color: 'bg-green-100 text-green-700',
    },
    {
      title: 'Messages Sent',
      value: stats?.messagesSent ?? 0,
      icon: MessageSquare,
      color: 'bg-purple-100 text-purple-700',
    },
    {
      title: 'Tags',
      value: stats?.tagsCount ?? 0,
      icon: Tag,
      color: 'bg-amber-100 text-amber-700',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">ManyChat Summary</h3>
            <p className="text-sm text-gray-600">Live values returned by the current ManyChat backend integration.</p>
          </div>
          <button
            onClick={fetchStats}
            className="p-2 hover:bg-gray-100 rounded-lg"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div key={card.title} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${card.color}`}>
                <card.icon className="h-5 w-5" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{card.value.toLocaleString()}</span>
            </div>
            <p className="text-sm text-gray-600">{card.title}</p>
          </div>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-white rounded-lg">
            <Info className="h-4 w-4 text-blue-600" />
          </div>
          <div className="space-y-2">
            <h4 className="font-medium text-blue-900">Integration scope</h4>
            <p className="text-sm text-blue-800">
              This portal currently supports connection checks, message sending, and tag management.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-blue-800">
              <div className="flex items-center gap-2">
                <Send className="h-4 w-4" />
                <span>Direct messaging</span>
              </div>
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                <span>Tag creation and listing</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
