'use client';

import { useState } from 'react';
import { FileText, Calendar, AlertCircle } from 'lucide-react';
import { EmployeeContract } from '@/services/settings/hrService';

interface ContractRenewalModalProps {
  contract: EmployeeContract;
  onClose: () => void;
  onRenew: (data: { endDate: string; salary?: number; notes: string }) => Promise<void>;
}

export default function ContractRenewalModal({ contract, onClose, onRenew }: ContractRenewalModalProps) {
  const [endDate, setEndDate] = useState('');
  const [salary, setSalary] = useState<number | undefined>();
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!endDate) {
      setError('Please select a new contract end date');
      return;
    }

    const newEndDate = new Date(endDate);
    const currentEndDate = contract.contractEndDate ? new Date(contract.contractEndDate) : null;
    
    if (currentEndDate && newEndDate <= currentEndDate) {
      setError('New end date must be after current end date');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      await onRenew({ endDate, salary, notes });
      onClose();
    } catch (err) {
      setError('Failed to renew contract. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl max-w-lg w-full shadow-xl">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 rounded-lg">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Renew Contract</h3>
              <p className="text-sm text-gray-600">
                {contract.firstName} {contract.lastName} • {contract.position}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Current End Date</span>
              <span className="font-medium text-gray-900">
                {contract.contractEndDate 
                  ? new Date(contract.contractEndDate).toLocaleDateString()
                  : 'Not specified'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Contract Type</span>
              <span className="font-medium text-gray-900 capitalize">
                {contract.contractType || 'Not specified'}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Contract End Date <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                min={contract.contractEndDate || new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Salary (Optional)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">KES</span>
              <input
                type="number"
                value={salary || ''}
                onChange={(e) => setSalary(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full pl-12 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                placeholder="Enter new salary"
                min="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Renewal Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              rows={3}
              placeholder="Add notes about this contract renewal..."
            />
          </div>

          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <p className="text-sm text-yellow-700">
                Renewing this contract will extend the employment period. The employee will be notified automatically.
              </p>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !endDate}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Processing...
              </>
            ) : (
              'Renew Contract'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}