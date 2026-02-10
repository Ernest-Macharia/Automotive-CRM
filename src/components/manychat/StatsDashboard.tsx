'use client';

import { useState, useEffect } from 'react';
import {
  Users, MessageSquare, BarChart3, TrendingUp,
  Calendar, Download, RefreshCw, Eye,
  Mail, Phone, CheckCircle, XCircle
} from 'lucide-react';
import { manychatService, ManyChatStats } from '@/services/manychatService';
import { useToast } from '@/contexts/ToastContext';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from 'recharts';

export default function StatsDashboard() {
  const { showToast } = useToast();
  const [stats, setStats] = useState<ManyChatStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'year'>('week');

  useEffect(() => {
    fetchStats();
  }, [timeRange]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await manychatService.getStats();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      showToast('Failed to load statistics', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchStats();
    showToast('Statistics refreshed', 'success');
  };

  const handleExport = () => {
    showToast('Export started', 'info');
    // Export logic here
  };

  // Mock data for charts
  const messageData = [
    { day: 'Mon', sent: 120, received: 80 },
    { day: 'Tue', sent: 150, received: 100 },
    { day: 'Wed', sent: 180, received: 120 },
    { day: 'Thu', sent: 140, received: 90 },
    { day: 'Fri', sent: 200, received: 150 },
    { day: 'Sat', sent: 160, received: 110 },
    { day: 'Sun', sent: 130, received: 85 },
  ];

  const channelData = [
    { name: 'Messenger', value: 65 },
    { name: 'Instagram', value: 20 },
    { name: 'WhatsApp', value: 10 },
    { name: 'SMS', value: 5 },
  ];

  const statusData = [
    { name: 'Subscribed', value: 75 },
    { name: 'Unsubscribed', value: 15 },
    { name: 'Blocked', value: 10 },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
  const STATUS_COLORS = ['#10b981', '#ef4444', '#6b7280'];

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-3" />
        <p className="text-gray-500">Loading statistics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Analytics Dashboard</h3>
            <p className="text-sm text-gray-600">ManyChat performance and engagement metrics</p>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 border border-gray-300 rounded-lg overflow-hidden">
              {(['today', 'week', 'month', 'year'] as const).map(range => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1.5 text-sm ${timeRange === range ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </button>
              ))}
            </div>
            
            <button
              onClick={handleRefresh}
              className="p-2 hover:bg-gray-100 rounded-lg"
              title="Refresh"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              onClick={handleExport}
              className="p-2 hover:bg-gray-100 rounded-lg"
              title="Export"
            >
              <Download className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: 'Total Subscribers',
            value: stats?.totalSubscribers || 0,
            change: '+12%',
            icon: Users,
            color: 'bg-blue-100 text-blue-800',
            trend: 'up',
          },
          {
            title: 'Active Subscribers',
            value: stats?.activeSubscribers || 0,
            change: '+8%',
            icon: Users,
            color: 'bg-green-100 text-green-800',
            trend: 'up',
          },
          {
            title: 'Messages Sent',
            value: stats?.messagesSent || 0,
            change: '+23%',
            icon: MessageSquare,
            color: 'bg-purple-100 text-purple-800',
            trend: 'up',
          },
          {
            title: 'Messages Received',
            value: stats?.messagesReceived || 0,
            change: '+15%',
            icon: MessageSquare,
            color: 'bg-pink-100 text-pink-800',
            trend: 'up',
          },
        ].map((stat, index) => (
          <div key={index} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <span className={`text-sm font-medium ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                {stat.change}
              </span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stat.value.toLocaleString()}</p>
              <p className="text-sm text-gray-600 mt-1">{stat.title}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Message Activity */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h4 className="font-semibold text-gray-900 mb-4">Message Activity</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={messageData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="sent" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="Messages Sent"
                />
                <Line 
                  type="monotone" 
                  dataKey="received" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="Messages Received"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Channel Distribution */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h4 className="font-semibold text-gray-900 mb-4">Channel Distribution</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={channelData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {channelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}%`, 'Percentage']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Subscription Status */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h4 className="font-semibold text-gray-900 mb-4">Subscription Status</h4>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}%`, 'Percentage']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {statusData.map((status, index) => (
              <div key={status.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: STATUS_COLORS[index] }}
                  />
                  <span className="text-sm text-gray-700">{status.name}</span>
                </div>
                <span className="font-medium">{status.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Engagement Metrics */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 md:col-span-2">
          <h4 className="font-semibold text-gray-900 mb-4">Engagement Metrics</h4>
          <div className="space-y-4">
            {[
              { label: 'Average Response Time', value: '2.4 mins', change: '-15%', trend: 'good' },
              { label: 'Click-Through Rate', value: '18.2%', change: '+3%', trend: 'good' },
              { label: 'Conversion Rate', value: '7.8%', change: '+1.2%', trend: 'good' },
              { label: 'Unsubscribe Rate', value: '0.8%', change: '-0.2%', trend: 'good' },
            ].map((metric, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{metric.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{metric.value}</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${metric.trend === 'good' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {metric.change}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}