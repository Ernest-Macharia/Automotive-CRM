'use client';

import { useState, useEffect } from 'react';
import { 
  Search, Filter, Download, Plus, MoreVertical,
  ChevronRight, Eye, Edit, Trash2, Target, Calendar,
  CheckCircle, Clock, AlertCircle
} from 'lucide-react';
import { kpiService, KPI } from '@/services/kpiService';
import { useToast } from '@/contexts/ToastContext';
import Link from 'next/link';

export default function KPIListPage() {
  const { showToast } = useToast();
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    fetchKPIs();
  }, [selectedStatus]);

  const fetchKPIs = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (selectedStatus !== 'all') {
        params.status = selectedStatus;
      }
      if (searchQuery) {
        params.search = searchQuery;
      }
      
      const response = await kpiService.getAllKPIs(params);
      setKpis(response.data);
    } catch (error) {
      console.error('Error fetching KPIs:', error);
      showToast('Failed to load KPIs', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchKPIs();
  };

  const getStatusIcon = (status: KPI['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in_progress': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'overdue': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'overdue', label: 'Overdue' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                <Target className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">All KPIs</h1>
                <p className="text-gray-600 text-sm mt-1">
                  Manage and track all performance metrics
                </p>
              </div>
            </div>
            
            <Link
              href="/kpi/create"
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg text-sm font-medium hover:from-blue-600 hover:to-purple-700 transition-all"
            >
              <Plus className="h-4 w-4" />
              New KPI
            </Link>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search KPIs by title, description..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </form>
            
            {/* Filters */}
            <div className="flex items-center gap-3">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              
              <button className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <Filter className="h-4 w-4 text-gray-600" />
              </button>
              
              <button className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <Download className="h-4 w-4 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* KPI List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    KPI Title
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned To
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Period
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Frequency
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {kpis.map((kpi) => {
                  const progress = kpiService.calculateKPIProgress(kpi);
                  const statusColor = kpiService.getStatusColor(kpi.status);
                  
                  return (
                    <tr key={kpi._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(kpi.status)}
                            <Link
                              href={`/kpi/${kpi._id}`}
                              className="font-medium text-gray-900 hover:text-blue-600"
                            >
                              {kpi.title}
                            </Link>
                          </div>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                            {kpi.description}
                          </p>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
                            {typeof kpi.assignedTo === 'object' && kpi.assignedTo.name
                              ? kpi.assignedTo.name.charAt(0).toUpperCase()
                              : 'U'}
                          </div>
                          <span className="text-sm text-gray-900">
                            {typeof kpi.assignedTo === 'object' 
                              ? kpi.assignedTo.name
                              : 'Unknown User'}
                          </span>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="w-32">
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Progress</span>
                            <span>{progress}%</span>
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                progress >= 100 ? 'bg-green-500' :
                                progress >= 70 ? 'bg-blue-500' :
                                progress >= 40 ? 'bg-yellow-500' :
                                                'bg-red-500'
                              }`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 text-xs rounded-full ${statusColor}`}>
                          {kpi.status.replace('_', ' ')}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {formatDate(kpi.periodStart)}
                        </div>
                        <div className="text-xs text-gray-500">
                          to {formatDate(kpi.periodEnd)}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-900">
                          {kpiService.getFrequencyLabel(kpi.frequency)}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/kpi/${kpi._id}`}
                            className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-700"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <Link
                            href={`/kpi/${kpi._id}/edit`}
                            className="p-1.5 hover:bg-blue-50 rounded text-blue-500 hover:text-blue-700"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                          <button
                            className="p-1.5 hover:bg-red-50 rounded text-red-500 hover:text-red-700"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {/* Empty State */}
          {kpis.length === 0 && (
            <div className="text-center py-12">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Target className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No KPIs found</h3>
              <p className="text-gray-600 mb-6">Get started by creating your first KPI.</p>
              <Link
                href="/kpi/create"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg text-sm font-medium hover:from-blue-600 hover:to-purple-700 transition-all"
              >
                <Plus className="h-4 w-4" />
                Create KPI
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}