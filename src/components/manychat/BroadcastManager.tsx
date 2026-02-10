'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Send, Calendar, Users, Tag, Clock, Search,
  Filter, RefreshCw, Eye, Copy, Trash2, Edit2,
  CheckCircle, AlertCircle, BarChart3, Download,
  ChevronDown, ChevronRight, Loader2, Plus,
  MessageSquare, TrendingUp, Timer, Pause, Play
} from 'lucide-react';
import { manychatService, ManyChatTag } from '@/services/manychatService';
import { useToast } from '@/contexts/ToastContext';
import { format } from 'date-fns';
import MessageComposer from './MessageComposer';

interface Broadcast {
  id: string;
  name: string;
  message: string;
  type: 'text' | 'image' | 'file' | 'carousel';
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled' | 'failed';
  tags: string[];
  segment?: string;
  scheduledAt?: string;
  sentAt?: string;
  totalRecipients: number;
  delivered: number;
  opened: number;
  clicked: number;
  createdAt: string;
  createdBy: string;
}

interface BroadcastFilterParams {
  status?: string;
  type?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  sort?: string;
}

export default function BroadcastManager() {
  const { showToast } = useToast();
  
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingBroadcast, setEditingBroadcast] = useState<Broadcast | null>(null);
  const [selectedBroadcast, setSelectedBroadcast] = useState<Broadcast | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  
  const [filters, setFilters] = useState<BroadcastFilterParams>({
    status: 'all',
    type: 'all',
    sort: '-createdAt',
  });
  
  const [availableTags, setAvailableTags] = useState<ManyChatTag[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    sent: 0,
    scheduled: 0,
    draft: 0,
    averageOpenRate: 0,
    averageClickRate: 0,
  });

  // Mock data for demonstration
  const mockBroadcasts: Broadcast[] = [
    {
      id: '1',
      name: 'Welcome New Subscribers',
      message: 'Welcome to our community! Get 10% off your first order with code WELCOME10',
      type: 'text',
      status: 'sent',
      tags: ['welcome', 'new-subscribers'],
      scheduledAt: '2024-01-15T10:00:00Z',
      sentAt: '2024-01-15T10:00:00Z',
      totalRecipients: 1250,
      delivered: 1220,
      opened: 890,
      clicked: 210,
      createdAt: '2024-01-14T09:00:00Z',
      createdBy: 'John Doe',
    },
    {
      id: '2',
      name: 'Flash Sale Announcement',
      message: '🔥 FLASH SALE! 50% OFF everything for the next 24 hours! Shop now!',
      type: 'text',
      status: 'scheduled',
      tags: ['promotion', 'sale'],
      scheduledAt: '2024-01-20T14:00:00Z',
      totalRecipients: 4500,
      delivered: 0,
      opened: 0,
      clicked: 0,
      createdAt: '2024-01-18T11:30:00Z',
      createdBy: 'Jane Smith',
    },
    {
      id: '3',
      name: 'Product Launch',
      message: 'Introducing our new product line! Check out the amazing features...',
      type: 'carousel',
      status: 'sending',
      tags: ['product', 'launch'],
      scheduledAt: '2024-01-19T09:00:00Z',
      totalRecipients: 3200,
      delivered: 1200,
      opened: 450,
      clicked: 120,
      createdAt: '2024-01-17T15:45:00Z',
      createdBy: 'Mike Johnson',
    },
    {
      id: '4',
      name: 'Weekly Newsletter',
      message: 'This week: Industry insights, tips & tricks, and exclusive offers...',
      type: 'text',
      status: 'draft',
      tags: ['newsletter', 'weekly'],
      totalRecipients: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      createdAt: '2024-01-19T10:20:00Z',
      createdBy: 'Sarah Williams',
    },
    {
      id: '5',
      name: 'Abandoned Cart Reminder',
      message: 'You left something in your cart! Complete your purchase now...',
      type: 'text',
      status: 'sent',
      tags: ['cart', 'reminder'],
      sentAt: '2024-01-16T16:30:00Z',
      totalRecipients: 850,
      delivered: 830,
      opened: 520,
      clicked: 180,
      createdAt: '2024-01-16T14:00:00Z',
      createdBy: 'Robert Brown',
    },
  ];

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // In real implementation, fetch from API
      // const response = await manychatService.getBroadcasts(filters);
      
      // For now, use mock data with filtering
      let filteredBroadcasts = [...mockBroadcasts];
      
      if (filters.status && filters.status !== 'all') {
        filteredBroadcasts = filteredBroadcasts.filter(b => b.status === filters.status);
      }
      
      if (filters.type && filters.type !== 'all') {
        filteredBroadcasts = filteredBroadcasts.filter(b => b.type === filters.type);
      }
      
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        filteredBroadcasts = filteredBroadcasts.filter(b => 
          b.name.toLowerCase().includes(searchTerm) ||
          b.message.toLowerCase().includes(searchTerm)
        );
      }
      
      // Apply sorting
      filteredBroadcasts.sort((a, b) => {
        if (filters.sort?.startsWith('-')) {
          const field = filters.sort.slice(1);
          return new Date(b[field as keyof Broadcast] as string).getTime() - 
                 new Date(a[field as keyof Broadcast] as string).getTime();
        }
        return 0;
      });
      
      setBroadcasts(filteredBroadcasts);
      
      // Calculate stats
      const total = filteredBroadcasts.length;
      const sent = filteredBroadcasts.filter(b => b.status === 'sent').length;
      const scheduled = filteredBroadcasts.filter(b => b.status === 'scheduled').length;
      const draft = filteredBroadcasts.filter(b => b.status === 'draft').length;
      
      const sentBroadcasts = filteredBroadcasts.filter(b => b.status === 'sent' && b.opened > 0);
      const avgOpenRate = sentBroadcasts.length > 0 
        ? sentBroadcasts.reduce((acc, b) => acc + (b.opened / b.delivered), 0) / sentBroadcasts.length
        : 0;
      
      const avgClickRate = sentBroadcasts.length > 0
        ? sentBroadcasts.reduce((acc, b) => acc + (b.clicked / b.opened), 0) / sentBroadcasts.length
        : 0;
      
      setStats({
        total,
        sent,
        scheduled,
        draft,
        averageOpenRate: avgOpenRate * 100,
        averageClickRate: avgClickRate * 100,
      });
      
      // Fetch tags
      const tags = await manychatService.getTags();
      setAvailableTags(tags);
      
    } catch (error) {
      console.error('Error fetching broadcasts:', error);
      showToast('Failed to load broadcasts', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBroadcast = () => {
    setShowCreateModal(true);
  };

  const handleEditBroadcast = (broadcast: Broadcast) => {
    setEditingBroadcast(broadcast);
    setShowCreateModal(true);
  };

  const handleDuplicateBroadcast = async (broadcast: Broadcast) => {
    try {
      showToast('Duplicating broadcast...', 'info');
      // In real implementation, duplicate via API
      await new Promise(resolve => setTimeout(resolve, 1000));
      showToast('Broadcast duplicated successfully', 'success');
      fetchData();
    } catch (error) {
      console.error('Error duplicating broadcast:', error);
      showToast('Failed to duplicate broadcast', 'error');
    }
  };

  const handleDeleteBroadcast = async (id: string) => {
    if (!confirm('Are you sure you want to delete this broadcast? This action cannot be undone.')) {
      return;
    }
    
    try {
      showToast('Deleting broadcast...', 'info');
      // In real implementation, delete via API
      await new Promise(resolve => setTimeout(resolve, 1000));
      showToast('Broadcast deleted successfully', 'success');
      fetchData();
    } catch (error) {
      console.error('Error deleting broadcast:', error);
      showToast('Failed to delete broadcast', 'error');
    }
  };

  const handleChangeStatus = async (id: string, newStatus: Broadcast['status']) => {
    try {
      showToast('Updating broadcast status...', 'info');
      // In real implementation, update via API
      await new Promise(resolve => setTimeout(resolve, 1000));
      showToast(`Broadcast ${newStatus}`, 'success');
      fetchData();
    } catch (error) {
      console.error('Error updating broadcast status:', error);
      showToast('Failed to update broadcast status', 'error');
    }
  };

  const handleRefresh = () => {
    fetchData();
    showToast('Broadcasts refreshed', 'success');
  };

  const handleExport = () => {
    showToast('Exporting broadcast data...', 'info');
    // Export logic here
  };

  const handleFilterChange = (key: keyof BroadcastFilterParams, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const getStatusColor = (status: Broadcast['status']) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'sending': return 'bg-yellow-100 text-yellow-800';
      case 'sent': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: Broadcast['status']) => {
    switch (status) {
      case 'draft': return <Edit2 className="h-3 w-3" />;
      case 'scheduled': return <Calendar className="h-3 w-3" />;
      case 'sending': return <Send className="h-3 w-3" />;
      case 'sent': return <CheckCircle className="h-3 w-3" />;
      case 'cancelled': return <AlertCircle className="h-3 w-3" />;
      case 'failed': return <AlertCircle className="h-3 w-3" />;
      default: return <MessageSquare className="h-3 w-3" />;
    }
  };

  const getTypeIcon = (type: Broadcast['type']) => {
    switch (type) {
      case 'text': return <MessageSquare className="h-4 w-4" />;
      case 'image': return <Image className="h-4 w-4" />;
      case 'file': return <FileText className="h-4 w-4" />;
      case 'carousel': return <Layers className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not scheduled';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch {
      return 'Invalid date';
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  const calculateOpenRate = (broadcast: Broadcast) => {
    if (broadcast.delivered === 0) return 0;
    return Math.round((broadcast.opened / broadcast.delivered) * 100);
  };

  const calculateClickRate = (broadcast: Broadcast) => {
    if (broadcast.opened === 0) return 0;
    return Math.round((broadcast.clicked / broadcast.opened) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: 'Total Broadcasts',
            value: stats.total,
            icon: Send,
            color: 'bg-blue-100 text-blue-800',
            trend: '+12%',
          },
          {
            title: 'Sent',
            value: stats.sent,
            icon: CheckCircle,
            color: 'bg-green-100 text-green-800',
            trend: '+8%',
          },
          {
            title: 'Scheduled',
            value: stats.scheduled,
            icon: Calendar,
            color: 'bg-purple-100 text-purple-800',
            trend: '+5%',
          },
          {
            title: 'Drafts',
            value: stats.draft,
            icon: Edit2,
            color: 'bg-gray-100 text-gray-800',
            trend: '+3%',
          },
        ].map((stat, index) => (
          <div key={index} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium text-green-600">{stat.trend}</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-600 mt-1">{stat.title}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-900">Average Open Rate</h4>
            <TrendingUp className="h-5 w-5 text-green-600" />
          </div>
          <div className="flex items-end gap-2">
            <p className="text-3xl font-bold text-gray-900">{stats.averageOpenRate.toFixed(1)}%</p>
            <span className="text-sm text-green-600 mb-1">+2.5% from last month</span>
          </div>
          <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full"
              style={{ width: `${Math.min(stats.averageOpenRate, 100)}%` }}
            />
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-900">Average Click Rate</h4>
            <TrendingUp className="h-5 w-5 text-green-600" />
          </div>
          <div className="flex items-end gap-2">
            <p className="text-3xl font-bold text-gray-900">{stats.averageClickRate.toFixed(1)}%</p>
            <span className="text-sm text-green-600 mb-1">+1.8% from last month</span>
          </div>
          <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
              style={{ width: `${Math.min(stats.averageClickRate, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Broadcast Manager</h3>
              <p className="text-sm text-gray-600">Create and manage broadcast messages</p>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Refresh"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={handleExport}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Export"
              >
                <Download className="h-4 w-4" />
              </button>
              <button
                onClick={handleCreateBroadcast}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                New Broadcast
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={filters.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Search broadcasts..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <select
                  value={filters.status || 'all'}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="pl-3 pr-8 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                >
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="sending">Sending</option>
                  <option value="sent">Sent</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <Filter className="absolute right-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
              
              <div className="relative">
                <select
                  value={filters.type || 'all'}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  className="pl-3 pr-8 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                >
                  <option value="all">All Types</option>
                  <option value="text">Text</option>
                  <option value="image">Image</option>
                  <option value="file">File</option>
                  <option value="carousel">Carousel</option>
                </select>
                <MessageSquare className="absolute right-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Broadcasts Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Broadcast</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Status</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Recipients</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Performance</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Schedule</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 px-4 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">Loading broadcasts...</p>
                  </td>
                </tr>
              ) : broadcasts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 px-4 text-center">
                    <Send className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <h4 className="text-gray-700 font-medium mb-2">No broadcasts found</h4>
                    <p className="text-gray-500 max-w-md mx-auto mb-4">
                      {filters.status !== 'all' || filters.type !== 'all' || filters.search
                        ? 'Try adjusting your filters.'
                        : 'Create your first broadcast to reach your subscribers.'}
                    </p>
                    <button
                      onClick={handleCreateBroadcast}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Create First Broadcast
                    </button>
                  </td>
                </tr>
              ) : (
                broadcasts.map((broadcast) => (
                  <tr 
                    key={broadcast.id} 
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg">
                          {getTypeIcon(broadcast.type)}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{broadcast.name}</h4>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {broadcast.message}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {broadcast.tags.slice(0, 2).map(tag => (
                              <span
                                key={tag}
                                className="px-2 py-0.5 bg-gray-100 text-gray-800 text-xs rounded-full"
                              >
                                {tag}
                              </span>
                            ))}
                            {broadcast.tags.length > 2 && (
                              <span className="text-xs text-gray-500">
                                +{broadcast.tags.length - 2} more
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(broadcast.status)}`}>
                        {getStatusIcon(broadcast.status)}
                        {broadcast.status.charAt(0).toUpperCase() + broadcast.status.slice(1)}
                      </span>
                    </td>
                    
                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Total:</span>
                          <span className="font-medium">{formatNumber(broadcast.totalRecipients)}</span>
                        </div>
                        {broadcast.status === 'sent' && (
                          <>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Delivered:</span>
                              <span className="font-medium">{formatNumber(broadcast.delivered)}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Opened:</span>
                              <span className="font-medium">{formatNumber(broadcast.opened)}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                    
                    <td className="py-4 px-4">
                      {broadcast.status === 'sent' ? (
                        <div className="space-y-2">
                          <div>
                            <div className="flex justify-between text-xs text-gray-600 mb-1">
                              <span>Open Rate</span>
                              <span>{calculateOpenRate(broadcast)}%</span>
                            </div>
                            <div className="w-32 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-green-500 rounded-full"
                                style={{ width: `${calculateOpenRate(broadcast)}%` }}
                              />
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-xs text-gray-600 mb-1">
                              <span>Click Rate</span>
                              <span>{calculateClickRate(broadcast)}%</span>
                            </div>
                            <div className="w-32 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-blue-500 rounded-full"
                                style={{ width: `${calculateClickRate(broadcast)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-500 text-sm">Pending</span>
                      )}
                    </td>
                    
                    <td className="py-4 px-4">
                      {broadcast.scheduledAt ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm text-gray-900">
                            <Calendar className="h-3 w-3" />
                            {formatDate(broadcast.scheduledAt)}
                          </div>
                          {broadcast.sentAt && (
                            <div className="flex items-center gap-1 text-xs text-gray-600">
                              <Clock className="h-3 w-3" />
                              Sent: {formatDate(broadcast.sentAt)}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-500 text-sm">Not scheduled</span>
                      )}
                    </td>
                    
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setSelectedBroadcast(broadcast)}
                          className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        
                        {broadcast.status === 'draft' && (
                          <>
                            <button
                              onClick={() => handleEditBroadcast(broadcast)}
                              className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleChangeStatus(broadcast.id, 'scheduled')}
                              className="p-1.5 hover:bg-green-50 rounded-lg text-green-600 transition-colors"
                              title="Schedule"
                            >
                              <Calendar className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        
                        {broadcast.status === 'scheduled' && (
                          <>
                            <button
                              onClick={() => handleChangeStatus(broadcast.id, 'cancelled')}
                              className="p-1.5 hover:bg-red-50 rounded-lg text-red-600 transition-colors"
                              title="Cancel"
                            >
                              <Pause className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleChangeStatus(broadcast.id, 'sending')}
                              className="p-1.5 hover:bg-green-50 rounded-lg text-green-600 transition-colors"
                              title="Send Now"
                            >
                              <Send className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        
                        <button
                          onClick={() => handleDuplicateBroadcast(broadcast)}
                          className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
                          title="Duplicate"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        
                        {broadcast.status === 'draft' && (
                          <button
                            onClick={() => handleDeleteBroadcast(broadcast.id)}
                            className="p-1.5 hover:bg-red-50 rounded-lg text-red-600 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {broadcasts.length > 0 && (
          <div className="p-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing {broadcasts.length} of {mockBroadcasts.length} broadcasts
              </p>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50">
                  Previous
                </button>
                <span className="text-sm text-gray-700 px-2">1</span>
                <button className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <MessageComposer
              broadcastMode={true}
              onSent={(result) => {
                setShowCreateModal(false);
                setEditingBroadcast(null);
                showToast('Broadcast created successfully', 'success');
                fetchData();
              }}
              onCancel={() => {
                setShowCreateModal(false);
                setEditingBroadcast(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedBroadcast && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-4xl bg-white rounded-xl overflow-hidden">
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedBroadcast.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Created by {selectedBroadcast.createdBy} • {formatDate(selectedBroadcast.createdAt)}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedBroadcast(null)}
                  className="p-2 hover:bg-white rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Message Preview */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Message Preview</h4>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-gray-800 whitespace-pre-line">{selectedBroadcast.message}</p>
                  {selectedBroadcast.type !== 'text' && (
                    <div className="mt-3 text-sm text-gray-600">
                      Type: {selectedBroadcast.type.charAt(0).toUpperCase() + selectedBroadcast.type.slice(1)}
                    </div>
                  )}
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-gray-900">{formatNumber(selectedBroadcast.totalRecipients)}</p>
                  <p className="text-sm text-gray-600">Total Recipients</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-gray-900">{formatNumber(selectedBroadcast.delivered)}</p>
                  <p className="text-sm text-gray-600">Delivered</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-gray-900">{calculateOpenRate(selectedBroadcast)}%</p>
                  <p className="text-sm text-gray-600">Open Rate</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-gray-900">{calculateClickRate(selectedBroadcast)}%</p>
                  <p className="text-sm text-gray-600">Click Rate</p>
                </div>
              </div>

              {/* Timeline */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Timeline</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Created</p>
                      <p className="text-sm text-gray-600">{formatDate(selectedBroadcast.createdAt)}</p>
                    </div>
                  </div>
                  {selectedBroadcast.scheduledAt && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Calendar className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Scheduled</p>
                        <p className="text-sm text-gray-600">{formatDate(selectedBroadcast.scheduledAt)}</p>
                      </div>
                    </div>
                  )}
                  {selectedBroadcast.sentAt && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <Send className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Sent</p>
                        <p className="text-sm text-gray-600">{formatDate(selectedBroadcast.sentAt)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Tags */}
              {selectedBroadcast.tags.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedBroadcast.tags.map(tag => (
                      <span
                        key={tag}
                        className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setSelectedBroadcast(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  onClick={() => handleDuplicateBroadcast(selectedBroadcast)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Duplicate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Add missing imports
import { Image, FileText, Layers, X } from 'lucide-react';