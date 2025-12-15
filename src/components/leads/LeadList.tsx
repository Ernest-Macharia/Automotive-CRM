'use client';

import { Eye, Edit, Trash2, Phone, Mail, User, Building, Target, Users, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Lead } from '@/services/leadService';

interface LeadListProps {
  leads: Lead[];
  loading: boolean;
  onDelete: (leadId: string, leadName: string) => void;
  onRefresh?: () => void;
}

export default function LeadList({ leads, loading, onDelete, onRefresh }: LeadListProps) {
  const router = useRouter();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No leads found</h3>
        <p className="text-gray-600 mb-6">
          Try changing your filters or create a new lead
        </p>
        <button
          onClick={() => router.push('/leads/create')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Create Lead
        </button>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Lead
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Contact
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Source
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              LIS Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Created
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {leads.map((lead) => (
            <tr key={lead._id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4">
                <div className="flex items-center">
                  <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-medium flex-shrink-0">
                    {lead.name?.charAt(0).toUpperCase() || 'L'}
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">
                      {lead.name}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center gap-1">
                      {lead.type === 'individual' ? (
                        <User className="h-3 w-3" />
                      ) : (
                        <Building className="h-3 w-3" />
                      )}
                      {lead.type === 'individual' ? 'Individual' : 'Organization'}
                    </div>
                  </div>
                </div>
              </td>
              
              <td className="px-6 py-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-gray-900">
                    <Mail className="h-3 w-3 text-gray-400" />
                    {lead.email}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Phone className="h-3 w-3 text-gray-400" />
                    {lead.phone}
                  </div>
                </div>
              </td>
              
              <td className="px-6 py-4">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  lead.status === 'new' ? 'bg-blue-100 text-blue-800' :
                  lead.status === 'contacted' ? 'bg-yellow-100 text-yellow-800' :
                  lead.status === 'qualified' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {lead.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
              </td>
              
              <td className="px-6 py-4">
                <div className="text-sm text-gray-900">
                  {lead.source.charAt(0).toUpperCase() + lead.source.slice(1).replace('-', ' ')}
                </div>
              </td>
              
              <td className="px-6 py-4">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  lead.lisStatus === 'red' ? 'bg-red-100 text-red-800' :
                  lead.lisStatus === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {lead.lisStatus.toUpperCase()}
                </span>
              </td>
              
              <td className="px-6 py-4">
                <div className="text-sm text-gray-900">
                  {formatDate(lead.createdAt)}
                </div>
              </td>
              
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => router.push(`/leads/details?id=${lead._id}`)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="View"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  
                  <button
                    onClick={() => router.push(`/leads/edit?id=${lead._id}`)}
                    className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  
                  <button
                    onClick={() => onDelete(lead._id, lead.name)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  
                  <button
                    onClick={() => router.push(`/opportunities/create?leadId=${lead._id}`)}
                    className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                    title="Convert to Opportunity"
                  >
                    <Target className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}