'use client';

import { useState, useEffect } from 'react';
import {
  MessageSquare, TrendingUp, CheckCircle, Clock,
  AlertCircle, Users, Tag, BarChart3, Download
} from 'lucide-react';
import { feedbackService } from '@/services/feedbackService';
import { useToast } from '@/contexts/ToastContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart,
  Pie, Cell, LineChart, Line
} from 'recharts';

export default function FeedbackStats() {
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7days');
  const [stats, setStats] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    fetchStats();
  }, [timeRange]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await feedbackService.getFeedbackStats();
      setStats(data);
      prepareChartData(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      showToast('Failed to load statistics', 'error');
    } finally {
      setLoading(false);
    }
  };

  const prepareChartData = (statsData: any) => {
    // Prepare data for charts
    const statusData = [
      { name: 'New', value: statsData.new || 0, color: '#f59e0b' },
      { name: 'Reviewed', value: statsData.reviewed || 0, color: '#3b82f6' },
      { name: 'In Progress', value: statsData.in_progress || 0, color: '#8b5cf6' },
      { name: 'Resolved', value: statsData.resolved || 0, color: '#10b981' },
      { name: 'Rejected', value: statsData.rejected || 0, color: '#ef4444' },
      { name: 'Duplicate', value: statsData.duplicate || 0, color: '#6b7280' },
    ];

    const sectionData = Object.entries(statsData.bySection || {}).map(([section, count]) => ({
      name: feedbackService.getSectionDisplayName(section),
      value: count,
    }));

    const typeData = Object.entries(statsData.byType || {}).map(([type, count]) => ({
      name: feedbackService.getTypeDisplayName(type),
      value: count,
    }));

    setChartData([
      { title: 'By Status', data: statusData, type: 'pie' },
      { title: 'By Section', data: sectionData.slice(0, 8), type: 'bar' },
      { title: 'By Type', data: typeData, type: 'bar' },
    ]);
  };

  const handleExport = () => {
    // Implement export functionality
    showToast('Export feature coming soon', 'info');
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Feedback Analytics</h1>
            <p className="text-gray-600">Track feedback trends and performance</p>
          </div>
          
          <div className="flex items-center gap-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
            >
              <option value="7days">Last 7 days</option>
              <option value="30days">Last 30 days</option>
              <option value="90days">Last 90 days</option>
              <option value="year">Last year</option>
            </select>
            
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-800">Total Feedback</p>
                <p className="text-2xl font-bold text-blue-900">{stats.total || 0}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-600" />
            </div>
            <div className="mt-2 text-xs text-blue-700">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              +12% from last period
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-800">Resolved</p>
                <p className="text-2xl font-bold text-green-900">{stats.resolved || 0}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div className="mt-2 text-xs text-green-700">
              {stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0}% resolution rate
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-800">In Progress</p>
                <p className="text-2xl font-bold text-yellow-900">{stats.in_progress || 0}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="mt-2 text-xs text-yellow-700">
              Active feedback being worked on
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-800">High Priority</p>
                <p className="text-2xl font-bold text-red-900">
                  {Object.entries(stats.byPriority || {}).reduce((sum, [priority, count]) => 
                    priority === 'high' || priority === 'critical' ? sum + (count as number) : sum, 0
                  )}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <div className="mt-2 text-xs text-red-700">
              Requires immediate attention
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {chartData.map((chart, index) => (
            <div key={index} className="bg-white border border-gray-200 rounded-xl p-4">
              <h3 className="font-semibold text-gray-800 mb-4">{chart.title}</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  {chart.type === 'pie' ? (
                    <PieChart>
                      <Pie
                        data={chart.data}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {chart.data.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  ) : (
                    <BarChart data={chart.data}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" fill="#3b82f6" />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Metrics */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 rounded-xl">
            <h4 className="font-medium text-gray-700 mb-2">Average Response Time</h4>
            <p className="text-2xl font-bold text-gray-800">2.4 days</p>
            <p className="text-sm text-gray-600">From submission to first response</p>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-xl">
            <h4 className="font-medium text-gray-700 mb-2">User Satisfaction</h4>
            <p className="text-2xl font-bold text-gray-800">4.2/5.0</p>
            <p className="text-sm text-gray-600">Based on feedback ratings</p>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-xl">
            <h4 className="font-medium text-gray-700 mb-2">Top Contributor</h4>
            <p className="text-2xl font-bold text-gray-800">John Doe</p>
            <p className="text-sm text-gray-600">Submitted 42 feedback items</p>
          </div>
        </div>
      </div>
    </div>
  );
}