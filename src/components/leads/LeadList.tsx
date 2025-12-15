'use client';

import { Eye, Edit, Trash2, Phone, Mail, User, Building, Target, Users } from 'lucide-react';
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

  const getStatusClasses = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-600 border border-blue-200';
      case 'attempted_to_contact': return 'bg-purple-100 text-purple-600 border border-purple-200';
      case 'prospecting': return 'bg-amber-100 text-amber-600 border border-amber-200';
      case 'appointment_scheduled': return 'bg-orange-100 text-orange-600 border border-orange-200';
      case 'non_progressive': return 'bg-gray-100 text-gray-600 border border-gray-200';
      case 'lost': return 'bg-red-100 text-red-600 border border-red-200';
      case 'won': return 'bg-green-100 text-green-600 border border-green-200';
      default: return 'bg-gray-100 text-gray-600 border border-gray-200';
    }
  };

  if (loading) {
    return <LeadListSkeleton />;
  }

  if (leads.length === 0) {
    return (
      <div className="text-center py-8 md:py-12">
        <Users className="h-10 w-10 md:h-12 md:w-12 text-gray-400 mx-auto mb-3 md:mb-4" />
        <h3 className="text-base md:text-lg font-medium text-gray-900 mb-1 md:mb-2">No leads found</h3>
        <p className="text-gray-600 text-sm mb-4 md:mb-6">
          Try changing your filters or create a new lead
        </p>
        <button
          onClick={() => router.push('/leads/create')}
          className="inline-flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm md:text-base"
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
            <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Lead
            </th>
            <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Contact
            </th>
            <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Source
            </th>
            <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              LIS Status
            </th>
            <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Created
            </th>
            <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {leads.map((lead) => (
            <tr key={lead._id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 md:px-6 py-3 md:py-4">
                <div className="flex items-center">
                  <div className="h-8 w-8 md:h-10 md:w-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-medium flex-shrink-0">
                    {lead.name?.charAt(0).toUpperCase() || 'L'}
                  </div>
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900">
                      {lead.name}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      {lead.type === 'individual' ? (
                        <User className="h-2.5 w-2.5" />
                      ) : (
                        <Building className="h-2.5 w-2.5" />
                      )}
                      {lead.type === 'individual' ? 'Individual' : 'Organization'}
                    </div>
                  </div>
                </div>
              </td>
              
              <td className="px-4 md:px-6 py-3 md:py-4">
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
              
              <td className="px-4 md:px-6 py-3 md:py-4">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusClasses(lead.status)}`}>
                  {(() => {
                    const statusMap: Record<string, string> = {
                      'new': 'New',
                      'attempted_to_contact': 'Attempted Contact',
                      'prospecting': 'Prospecting',
                      'appointment_scheduled': 'Appointment Scheduled',
                      'non_progressive': 'Non Progressive',
                      'lost': 'Lost',
                      'won': 'Won'
                    };
                    return statusMap[lead.status] || lead.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
                  })()}
                </span>
              </td>
              
              <td className="px-4 md:px-6 py-3 md:py-4">
                <div className="text-sm text-gray-900">
                  {lead.source.charAt(0).toUpperCase() + lead.source.slice(1).replace('-', ' ')}
                </div>
              </td>
              
              <td className="px-4 md:px-6 py-3 md:py-4">
                <span className={`px-1.5 py-0.5 text-xs font-medium rounded-full ${
                  lead.lisStatus === 'red' ? 'bg-red-100 text-red-800' :
                  lead.lisStatus === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {lead.lisStatus.toUpperCase()}
                </span>
              </td>
              
              <td className="px-4 md:px-6 py-3 md:py-4">
                <div className="text-sm text-gray-900">
                  {formatDate(lead.createdAt)}
                </div>
              </td>
              
              <td className="px-4 md:px-6 py-3 md:py-4">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => router.push(`/leads/details?id=${lead._id}`)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="View"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </button>
                  
                  <button
                    onClick={() => router.push(`/leads/edit?id=${lead._id}`)}
                    className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </button>
                  
                  <button
                    onClick={() => onDelete(lead._id, lead.name)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                  
                  <button
                    onClick={() => router.push(`/opportunities/create?leadId=${lead._id}`)}
                    className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                    title="Convert to Opportunity"
                  >
                    <Target className="h-3.5 w-3.5" />
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

// Skeletal Loading for Lead List
function LeadListSkeleton() {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {[...Array(7)].map((_, index) => (
              <th key={index} className="px-4 md:px-6 py-3">
                <div className="h-3 bg-gray-200 rounded animate-pulse w-20"></div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {[...Array(5)].map((_, rowIndex) => (
            <tr key={rowIndex}>
              {[...Array(7)].map((_, colIndex) => (
                <td key={colIndex} className="px-4 md:px-6 py-3 md:py-4">
                  {colIndex === 0 ? (
                    <div className="flex items-center">
                      <div className="h-8 w-8 md:h-10 md:w-10 bg-gray-200 rounded-full animate-pulse"></div>
                      <div className="ml-3 space-y-1.5">
                        <div className="h-3 bg-gray-200 rounded animate-pulse w-32"></div>
                        <div className="h-2 bg-gray-200 rounded animate-pulse w-24"></div>
                      </div>
                    </div>
                  ) : colIndex === 6 ? (
                    <div className="flex items-center gap-1.5">
                      {[...Array(4)].map((_, btnIndex) => (
                        <div key={btnIndex} className="h-8 w-8 bg-gray-200 rounded-lg animate-pulse"></div>
                      ))}
                    </div>
                  ) : colIndex === 2 || colIndex === 4 ? (
                    <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse"></div>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-24"></div>
                      {colIndex === 1 && (
                        <div className="h-2 bg-gray-200 rounded animate-pulse w-20"></div>
                      )}
                    </div>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}