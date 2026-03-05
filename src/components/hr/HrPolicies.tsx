'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, FileText, Calendar, Eye, Download, Search, Filter, Plus, CheckCircle, Users, Clock } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { hrService, CompanyPolicy } from '@/services/settings/hrService';

interface HrPoliciesProps {
  policyId?: string;
}

export default function HrPolicies({ policyId }: HrPoliciesProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [policies, setPolicies] = useState<CompanyPolicy[]>([]);
  const [selectedPolicy, setSelectedPolicy] = useState<CompanyPolicy | null>(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterActive, setFilterActive] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAcknowledgementModal, setShowAcknowledgementModal] = useState(false);
  const [acknowledgementData, setAcknowledgementData] = useState({
    acknowledged: true,
    comments: '',
  });

  useEffect(() => {
    if (policyId) {
      loadPolicyDetails();
    } else {
      loadAllPolicies();
    }
  }, [policyId]);

  useEffect(() => {
    if (!policyId) {
      loadAllPolicies();
    }
  }, [filterCategory, filterActive]);

  const loadAllPolicies = async () => {
    try {
      setLoading(true);
      const active = filterActive === 'all' ? undefined : filterActive === 'active';
      const data = await hrService.getPolicies(
        filterCategory !== 'all' ? filterCategory : undefined,
        active
      );
      setPolicies(data);
    } catch (error) {
      console.error('Error loading policies:', error);
      showToast('Failed to load policies', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadPolicyDetails = async () => {
    try {
      setLoading(true);
      const allPolicies = await hrService.getPolicies();
      const policy = allPolicies.find(p => p.id === policyId || p._id === policyId);
      setSelectedPolicy(policy || null);
    } catch (error) {
      console.error('Error loading policy details:', error);
      showToast('Failed to load policy details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'hr': return 'bg-blue-100 text-blue-800';
      case 'finance': return 'bg-green-100 text-green-800';
      case 'operations': return 'bg-purple-100 text-purple-800';
      case 'safety': return 'bg-red-100 text-red-800';
      case 'it': return 'bg-orange-100 text-orange-800';
      case 'code_of_conduct': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryName = (category: string) => {
    return category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const handleAcknowledgePolicy = async () => {
    if (!selectedPolicy) return;

    try {
      // In a real app, you would acknowledge policy via API
      showToast('Policy acknowledged successfully', 'success');
      setShowAcknowledgementModal(false);
      setAcknowledgementData({
        acknowledged: true,
        comments: '',
      });
      loadPolicyDetails();
    } catch (error) {
      console.error('Error acknowledging policy:', error);
      showToast('Failed to acknowledge policy', 'error');
    }
  };

  const handleDownloadPolicy = () => {
    if (!selectedPolicy || !selectedPolicy.documentUrl) {
      showToast('No document available for download', 'warning');
      return;
    }
    
    window.open(selectedPolicy.documentUrl, '_blank');
  };

  const filteredPolicies = policies.filter(policy => {
    const matchesSearch = searchTerm === '' || 
      policy.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      policy.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      policy.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="ml-3 text-gray-600">Loading policies...</p>
      </div>
    );
  }

  if (policyId && selectedPolicy) {
    const daysSinceEffective = Math.floor(
      (new Date().getTime() - new Date(selectedPolicy.effectiveDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{selectedPolicy.title}</h2>
            <p className="text-gray-600 mt-1">
              Version {selectedPolicy.version} • Effective {hrService.formatDate(selectedPolicy.effectiveDate)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPolicy}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download
            </button>
            {selectedPolicy.mandatoryAcknowledgement && (
              <button
                onClick={() => setShowAcknowledgementModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Acknowledge Policy
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <div className="bg-white border border-gray-200 rounded-lg p-5 mb-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Policy Details</h3>
                  <p className="text-gray-600 mt-1">Comprehensive policy information</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(selectedPolicy.category)}`}>
                    {getCategoryName(selectedPolicy.category)}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    selectedPolicy.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedPolicy.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Description</p>
                  <p className="text-gray-700 whitespace-pre-line">{selectedPolicy.description}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Version</p>
                    <p className="font-medium text-gray-900">{selectedPolicy.version}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Effective Date</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <p className="font-medium text-gray-900">
                        {hrService.formatDate(selectedPolicy.effectiveDate)}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Approved By</p>
                    <p className="font-medium text-gray-900">{selectedPolicy.approvedBy}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Views</p>
                    <p className="font-medium text-gray-900">{selectedPolicy.views}</p>
                  </div>
                </div>

                {selectedPolicy.applicableDepartments && selectedPolicy.applicableDepartments.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Applicable Departments</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedPolicy.applicableDepartments.map((dept, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                          {dept}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedPolicy.applicablePositions && selectedPolicy.applicablePositions.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Applicable Positions</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedPolicy.applicablePositions.map((position, index) => (
                        <span key={index} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                          {position}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedPolicy.mandatoryAcknowledgement && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-yellow-800">Mandatory Acknowledgement Required</p>
                        <p className="text-sm text-yellow-700 mt-1">
                          All employees must acknowledge this policy by {selectedPolicy.acknowledgementDeadline 
                            ? hrService.formatDate(selectedPolicy.acknowledgementDeadline)
                            : 'the specified deadline'}.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {selectedPolicy.documentUrl && (
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600 mb-2">Policy Document</p>
                    <a
                      href={selectedPolicy.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800"
                    >
                      <FileText className="h-4 w-4" />
                      View Policy Document
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-blue-600">Policy Age</p>
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-blue-900">
                {daysSinceEffective} days
              </p>
              <p className="text-sm text-blue-700 mt-1">
                Effective since {hrService.formatDate(selectedPolicy.effectiveDate)}
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-green-600">Views</p>
                <Eye className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-900">
                {selectedPolicy.views}
              </p>
              <p className="text-sm text-green-700 mt-1">
                Times viewed by employees
              </p>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-purple-600">Acknowledgement Status</p>
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-purple-900">
                {selectedPolicy.mandatoryAcknowledgement ? 'Required' : 'Optional'}
              </p>
              {selectedPolicy.acknowledgementDeadline && (
                <p className="text-sm text-purple-700 mt-1">
                  Deadline: {hrService.formatDate(selectedPolicy.acknowledgementDeadline)}
                </p>
              )}
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Policy Actions</h4>
              <div className="space-y-2">
                <button
                  onClick={handleDownloadPolicy}
                  className="w-full px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download Policy
                </button>
                {selectedPolicy.mandatoryAcknowledgement && (
                  <button
                    onClick={() => setShowAcknowledgementModal(true)}
                    className="w-full px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                  >
                    Acknowledge Policy
                  </button>
                )}
                <button
                  onClick={() => router.push(`/hr-portal/policies/${selectedPolicy._id || selectedPolicy.id}/edit`)}
                  className="w-full px-3 py-2 bg-yellow-600 text-white text-sm rounded-lg hover:bg-yellow-700"
                >
                  Edit Policy
                </button>
              </div>
            </div>
          </div>
        </div>

        {showAcknowledgementModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Acknowledge Policy</h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Policy</p>
                  <p className="font-medium text-gray-900">{selectedPolicy.title}</p>
                  <p className="text-sm text-gray-600 mt-1">Version {selectedPolicy.version}</p>
                </div>

                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-700">
                    By acknowledging this policy, you confirm that you have read, understood, and agree to comply with its terms and conditions.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comments (Optional)
                  </label>
                  <textarea
                    value={acknowledgementData.comments}
                    onChange={(e) => setAcknowledgementData(prev => ({ ...prev, comments: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    rows={3}
                    placeholder="Add any comments or feedback about this policy..."
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="acknowledged"
                    checked={acknowledgementData.acknowledged}
                    onChange={(e) => setAcknowledgementData(prev => ({ ...prev, acknowledged: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                  <label htmlFor="acknowledged" className="ml-2 text-sm text-gray-700">
                    I acknowledge that I have read and understood this policy
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => setShowAcknowledgementModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAcknowledgePolicy}
                  disabled={!acknowledgementData.acknowledged}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Acknowledge Policy
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Company Policies</h2>
            <p className="text-gray-600 mt-1">Manage and distribute company policies</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search policies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-64"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="all">All Categories</option>
                <option value="hr">HR</option>
                <option value="finance">Finance</option>
                <option value="operations">Operations</option>
                <option value="safety">Safety</option>
                <option value="it">IT</option>
                <option value="code_of_conduct">Code of Conduct</option>
                <option value="leave">Leave</option>
                <option value="attendance">Attendance</option>
                <option value="general">General</option>
              </select>
              
              <select
                value={filterActive}
                onChange={(e) => setFilterActive(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="all">All Status</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>
            
            <button
              onClick={() => router.push('/hr-portal/policies/create')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              New Policy
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Policy</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Category</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Effective Date</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Version</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Views</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPolicies.map((policy, index) => (
              <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium text-gray-900">{policy.title}</p>
                    <p className="text-sm text-gray-600 line-clamp-1">{policy.description}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(policy.category)}`}>
                    {getCategoryName(policy.category)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1 text-gray-900">
                    <Calendar className="h-3 w-3" />
                    {hrService.formatDate(policy.effectiveDate)}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-gray-900">{policy.version}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3 text-gray-400" />
                    <span className="text-gray-900">{policy.views}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    policy.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {policy.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => router.push(`/hr-portal/policies/${policy._id || policy.id}`)}
                      className="p-1 text-blue-600 hover:text-blue-800"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (policy.documentUrl) {
                          window.open(policy.documentUrl, '_blank');
                        } else {
                          showToast('No document available', 'warning');
                        }
                      }}
                      className="p-1 text-gray-600 hover:text-gray-800"
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => router.push(`/hr-portal/policies/${policy._id || policy.id}/edit`)}
                      className="p-1 text-green-600 hover:text-green-800"
                      title="Edit Policy"
                    >
                      <FileText className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredPolicies.length === 0 && (
        <div className="py-12 text-center">
          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-gray-700 font-medium">No policies found</h3>
          <p className="text-gray-500 text-sm mt-1">
            {searchTerm ? 'Try a different search term' : 'No company policies available'}
          </p>
          <button
            onClick={() => router.push('/hr-portal/policies/create')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create First Policy
          </button>
        </div>
      )}
    </div>
  );
}
