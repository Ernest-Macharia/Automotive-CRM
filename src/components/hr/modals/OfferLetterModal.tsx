'use client';

import { useState } from 'react';
import { Briefcase, DollarSign, Calendar, FileText, Mail, Phone } from 'lucide-react';
import { RecruitmentCandidate } from '@/services/settings/hrService';

interface OfferLetterModalProps {
  candidate: RecruitmentCandidate;
  onClose: () => void;
  onSendOffer: (data: {
    salary: number;
    startDate: string;
    position: string;
    department: string;
    reportingManager?: string;
    benefits: string[];
    offerLetterUrl?: string;
    notes: string;
  }) => Promise<void>;
}

export default function OfferLetterModal({ candidate, onClose, onSendOffer }: OfferLetterModalProps) {
  const [salary, setSalary] = useState(candidate.expectedSalary || 0);
  const [startDate, setStartDate] = useState('');
  const [position, setPosition] = useState(candidate.positionApplied);
  const [department, setDepartment] = useState(candidate.department);
  const [reportingManager, setReportingManager] = useState('');
  const [benefits, setBenefits] = useState<string[]>(['']);
  const [offerLetterUrl, setOfferLetterUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addBenefit = () => {
    setBenefits([...benefits, '']);
  };

  const updateBenefit = (index: number, value: string) => {
    const updated = [...benefits];
    updated[index] = value;
    setBenefits(updated);
  };

  const removeBenefit = (index: number) => {
    if (benefits.length > 1) {
      setBenefits(benefits.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async () => {
    if (!salary || salary <= 0) {
      setError('Please enter a valid salary');
      return;
    }

    if (!startDate) {
      setError('Please select a start date');
      return;
    }

    if (!position.trim()) {
      setError('Please enter the position');
      return;
    }

    if (!department.trim()) {
      setError('Please enter the department');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      await onSendOffer({
        salary,
        startDate,
        position,
        department,
        reportingManager: reportingManager || undefined,
        benefits: benefits.filter(b => b.trim() !== ''),
        offerLetterUrl: offerLetterUrl || undefined,
        notes
      });
      onClose();
    } catch (err) {
      setError('Failed to send offer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl max-w-2xl w-full shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100 sticky top-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-green-100 rounded-lg">
              <Briefcase className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Make Job Offer</h3>
              <p className="text-sm text-gray-600">
                {candidate.firstName} {candidate.lastName} • {candidate.positionApplied}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Candidate Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-lg">
                  {candidate.firstName[0]}{candidate.lastName[0]}
                </span>
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{candidate.firstName} {candidate.lastName}</h4>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Mail className="h-3 w-3" />
                    {candidate.email}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Phone className="h-3 w-3" />
                    {candidate.phone || 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Offer Details */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Offer Details</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Salary (KES) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">KES</span>
                  <input
                    type="number"
                    value={salary}
                    onChange={(e) => setSalary(Number(e.target.value))}
                    className="w-full pl-12 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                    min="0"
                  />
                </div>
                {candidate.expectedSalary && (
                  <p className="text-xs text-gray-600 mt-1">
                    Expected: KES {candidate.expectedSalary.toLocaleString()}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Position <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reporting Manager
                </label>
                <input
                  type="text"
                  value={reportingManager}
                  onChange={(e) => setReportingManager(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                  placeholder="Enter manager name"
                />
              </div>
            </div>

            {/* Benefits */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Benefits
                </label>
                <button
                  type="button"
                  onClick={addBenefit}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  + Add Benefit
                </button>
              </div>
              <div className="space-y-2">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={benefit}
                      onChange={(e) => updateBenefit(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                      placeholder={`Benefit ${index + 1}`}
                    />
                    {benefits.length > 1 && (
                      <button
                        onClick={() => removeBenefit(index)}
                        className="p-2 text-red-600 hover:text-red-800"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Offer Letter URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Offer Letter Document URL
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="url"
                  value={offerLetterUrl}
                  onChange={(e) => setOfferLetterUrl(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                  placeholder="https://..."
                />
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Link to the formal offer letter document
              </p>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Offer Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                rows={3}
                placeholder="Additional notes about this offer..."
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 sticky bottom-0 bg-white flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Sending...
              </>
            ) : (
              'Send Offer'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}