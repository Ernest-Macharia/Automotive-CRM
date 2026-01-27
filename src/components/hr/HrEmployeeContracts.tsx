'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Calendar, Clock, AlertCircle, CheckCircle, XCircle, Filter, Search, Download, Edit, Eye, User, Building, Briefcase } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { hrService, EmployeeContract } from '@/services/settings/hrService';

interface HREmployeeContractsProps {
  contractId?: string;
}

export default function HREmployeeContracts({ contractId }: HREmployeeContractsProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [contracts, setContracts] = useState<EmployeeContract[]>([]);
  const [selectedContract, setSelectedContract] = useState<EmployeeContract | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [newEndDate, setNewEndDate] = useState('');

  useEffect(() => {
    if (contractId) {
      loadContractDetails();
    } else {
      loadAllContracts();
    }
  }, [contractId]);

  const loadAllContracts = async () => {
    try {
      setLoading(true);
      const data = await hrService.getAllContracts();
      setContracts(data);
    } catch (error) {
      console.error('Error loading contracts:', error);
      showToast('Failed to load contracts', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadContractDetails = async () => {
    try {
      setLoading(true);
      const allContracts = await hrService.getAllContracts();
      const contract = allContracts.find(c => c.id === contractId);
      setSelectedContract(contract || null);
    } catch (error) {
      console.error('Error loading contract details:', error);
      showToast('Failed to load contract details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getContractStatus = (contract: EmployeeContract) => {
    return hrService.getContractStatus(contract);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'expiring_soon': return 'bg-yellow-100 text-yellow-800';
      case 'expired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDaysUntilExpiry = (contract: EmployeeContract) => {
    return hrService.getDaysUntilExpiry(contract.contractEndDate);
  };

  const formatDate = (dateString?: string) => {
    return hrService.formatDate(dateString);
  };

  const handleRenewContract = async () => {
    if (!selectedContract || !newEndDate) return;

    try {
      // This would typically call an API endpoint to renew the contract
      showToast('Contract renewal request submitted', 'success');
      setShowRenewModal(false);
      setNewEndDate('');
      
      // Refresh the data
      if (contractId) {
        loadContractDetails();
      } else {
        loadAllContracts();
      }
    } catch (error) {
      console.error('Error renewing contract:', error);
      showToast('Failed to renew contract', 'error');
    }
  };

  const handleDownloadContract = (contract: EmployeeContract) => {
    if (contract.contractDocumentUrl) {
      window.open(contract.contractDocumentUrl, '_blank');
    } else {
      showToast('No contract document available for download', 'warning');
    }
  };

  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = searchTerm === '' || 
      `${contract.firstName} ${contract.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.department.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === 'all') return matchesSearch;
    
    const status = getContractStatus(contract);
    return matchesSearch && status === filterStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="ml-3 text-gray-600">Loading contract data...</p>
      </div>
    );
  }

  if (contractId && selectedContract) {
    const status = getContractStatus(selectedContract);
    const daysUntilExpiry = getDaysUntilExpiry(selectedContract);
    
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Contract Details</h2>
            <p className="text-gray-600 mt-1">
              {selectedContract.firstName} {selectedContract.lastName} • {selectedContract.employeeId}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleDownloadContract(selectedContract)}
              className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              <Download className="h-4 w-4" />
            </button>
            <button
              onClick={() => setShowRenewModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Renew Contract
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Contract Information</h3>
                  <p className="text-gray-600 mt-1">Employment contract details</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(status)}`}>
                  {status.replace('_', ' ')}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Employee Name</p>
                  <p className="font-medium text-gray-900">
                    {selectedContract.firstName} {selectedContract.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Employee ID</p>
                  <p className="font-medium text-gray-900 font-mono">{selectedContract.employeeId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Position</p>
                  <p className="font-medium text-gray-900">{selectedContract.position}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Department</p>
                  <p className="font-medium text-gray-900">{selectedContract.department}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Contract Type</p>
                  <p className="font-medium text-gray-900 capitalize">
                    {selectedContract.contractType || 'Not specified'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Employment Status</p>
                  <p className="font-medium text-gray-900 capitalize">
                    {selectedContract.employmentStatus || 'Not specified'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Contract Start Date</p>
                  <p className="font-medium text-gray-900">{formatDate(selectedContract.contractStartDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Contract End Date</p>
                  <p className="font-medium text-gray-900">{formatDate(selectedContract.contractEndDate)}</p>
                </div>
              </div>

              {selectedContract.probationEndDate && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-1">Probation End Date</p>
                  <p className="font-medium text-gray-900">{formatDate(selectedContract.probationEndDate)}</p>
                  {selectedContract.onProbation && (
                    <span className="inline-block mt-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                      On Probation
                    </span>
                  )}
                </div>
              )}

              {selectedContract.contractDocumentUrl && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-2">Contract Document</p>
                  <a
                    href={selectedContract.contractDocumentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800"
                  >
                    <FileText className="h-4 w-4" />
                    View Contract Document
                  </a>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-blue-600">Contract Status</p>
                {status === 'active' && <CheckCircle className="h-5 w-5 text-blue-600" />}
                {status === 'expiring_soon' && <Clock className="h-5 w-5 text-yellow-600" />}
                {status === 'expired' && <XCircle className="h-5 w-5 text-red-600" />}
              </div>
              <p className={`text-2xl font-bold ${
                status === 'active' ? 'text-blue-900' :
                status === 'expiring_soon' ? 'text-yellow-900' :
                'text-red-900'
              }`}>
                {status.replace('_', ' ')}
              </p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">Days Until Expiry</p>
                <Calendar className="h-5 w-5 text-gray-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {daysUntilExpiry !== null ? `${daysUntilExpiry} days` : 'N/A'}
              </p>
            </div>

            {selectedContract.reportingManager && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-green-600">Reporting Manager</p>
                  <User className="h-5 w-5 text-green-600" />
                </div>
                <p className="font-medium text-green-900">
                  {typeof selectedContract.reportingManager === 'object'
                    ? selectedContract.reportingManager.name
                    : selectedContract.reportingManager}
                </p>
              </div>
            )}

            {selectedContract.user && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-purple-600">User Account</p>
                  <User className="h-5 w-5 text-purple-600" />
                </div>
                <p className="font-medium text-purple-900">
                  {typeof selectedContract.user === 'object'
                    ? selectedContract.user.email
                    : 'Linked'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Renew Modal */}
        {showRenewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Renew Contract</h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Employee</p>
                  <p className="font-medium text-gray-900">
                    {selectedContract.firstName} {selectedContract.lastName}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-2">Current End Date</p>
                  <p className="font-medium text-gray-900">
                    {formatDate(selectedContract.contractEndDate)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Contract End Date
                  </label>
                  <input
                    type="date"
                    value={newEndDate}
                    onChange={(e) => setNewEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    min={selectedContract.contractEndDate || new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <p className="text-sm text-yellow-700">
                      Renewing this contract will create a new contract period. The employee will be notified.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => setShowRenewModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRenewContract}
                  disabled={!newEndDate}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Submit Renewal
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // All contracts view
  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Employee Contracts</h2>
            <p className="text-gray-600 mt-1">Manage and monitor employee contracts</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-64"
              />
            </div>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="all">All Contracts</option>
              <option value="active">Active</option>
              <option value="expiring_soon">Expiring Soon</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Employee</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Position/Dept</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Contract Type</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Start Date</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">End Date</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Days Left</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredContracts.map((contract, index) => {
              const status = getContractStatus(contract);
              const daysLeft = getDaysUntilExpiry(contract);
              
              return (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {contract.firstName} {contract.lastName}
                        </p>
                        <p className="text-sm text-gray-600">{contract.employeeId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-gray-900">{contract.position}</p>
                      <p className="text-sm text-gray-600">{contract.department}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                      {contract.contractType || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-gray-900">
                      <Calendar className="h-3 w-3" />
                      {formatDate(contract.contractStartDate)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-gray-900">
                      <Calendar className="h-3 w-3" />
                      {formatDate(contract.contractEndDate)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                      {status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-gray-400" />
                      <span className={`font-medium ${
                        daysLeft !== null && daysLeft < 30 ? 'text-yellow-600' : 'text-gray-900'
                      }`}>
                        {daysLeft !== null ? `${daysLeft} days` : 'N/A'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => router.push(`/hr/contracts/${contract.id}`)}
                        className="p-1 text-blue-600 hover:text-blue-800"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDownloadContract(contract)}
                        className="p-1 text-gray-600 hover:text-gray-800"
                        title="Download Contract"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => router.push(`/hr/contracts/${contract.id}/edit`)}
                        className="p-1 text-green-600 hover:text-green-800"
                        title="Edit Contract"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filteredContracts.length === 0 && (
        <div className="py-12 text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-gray-700 font-medium">No contracts found</h3>
          <p className="text-gray-500 text-sm mt-1">
            {searchTerm ? 'Try a different search term' : 'No employee contracts available'}
          </p>
        </div>
      )}
    </div>
  );
}