'use client';

import { useState } from 'react';
import { AlertTriangle, CheckCircle, Clock, FileText } from 'lucide-react';
import { IncidentReport } from '@/services/settings/hrService';

interface IncidentResolutionModalProps {
  incident: IncidentReport;
  onClose: () => void;
  onResolve: (data: {
    status: 'resolved' | 'closed';
    resolutionNotes: string;
    correctiveActions: string[];
    resolutionDate: string;
  }) => Promise<void>;
}

export default function IncidentResolutionModal({ 
  incident, 
  onClose, 
  onResolve 
}: IncidentResolutionModalProps) {
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [correctiveActions, setCorrectiveActions] = useState<string[]>(['']);
  const [resolutionDate, setResolutionDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addAction = () => {
    setCorrectiveActions([...correctiveActions, '']);
  };

  const updateAction = (index: number, value: string) => {
    const updated = [...correctiveActions];
    updated[index] = value;
    setCorrectiveActions(updated);
  };

  const removeAction = (index: number) => {
    if (correctiveActions.length > 1) {
      setCorrectiveActions(correctiveActions.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async () => {
    if (!resolutionNotes.trim()) {
      setError('Please provide resolution notes');
      return;
    }

    const validActions = correctiveActions.filter(a => a.trim() !== '');
    if (validActions.length === 0) {
      setError('Please add at least one corrective action');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      await onResolve({
        status: 'resolved',
        resolutionNotes,
        correctiveActions: validActions,
        resolutionDate
      });
      onClose();
    } catch (err) {
      setError('Failed to resolve incident. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl max-w-2xl w-full shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-green-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Resolve Incident</h3>
              <p className="text-sm text-gray-600">
                #{incident.id?.slice(-6)} • {incident.title}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Incident Description</p>
            <p className="text-gray-900">{incident.description}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Resolution Date
            </label>
            <input
              type="date"
              value={resolutionDate}
              onChange={(e) => setResolutionDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Resolution Notes <span className="text-red-500">*</span>
            </label>
            <textarea
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
              rows={4}
              placeholder="Describe how this incident was resolved..."
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Corrective Actions <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={addAction}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                + Add Action
              </button>
            </div>
            <div className="space-y-2">
              {correctiveActions.map((action, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={action}
                    onChange={(e) => updateAction(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                    placeholder={`Action ${index + 1}`}
                  />
                  {correctiveActions.length > 1 && (
                    <button
                      onClick={() => removeAction(index)}
                      className="p-2 text-red-600 hover:text-red-800"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
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
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Processing...
              </>
            ) : (
              'Resolve Incident'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}