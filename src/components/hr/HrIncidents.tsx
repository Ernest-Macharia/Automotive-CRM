'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Calendar, User, Eye, Edit, FileText, Search, Filter, Plus, CheckCircle, Clock, XCircle, ChevronDown } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { hrService, IncidentReport } from '@/services/settings/hrService';

interface HrIncidentsProps {
  incidentId?: string;
}

export default function HrIncidents({ incidentId }: HrIncidentsProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [incidents, setIncidents] = useState<IncidentReport[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<IncidentReport | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showInvestigationModal, setShowInvestigationModal] = useState(false);
  const [investigationNotes, setInvestigationNotes] = useState('');
  const [showResolutionModal, setShowResolutionModal] = useState(false);
  const [resolutionDetails, setResolutionDetails] = useState({
    status: 'resolved',
    correctiveActions: [''],
    notes: '',
  });

  useEffect(() => {
    if (incidentId) {
      loadIncidentDetails();
    } else {
      loadAllIncidents();
    }
  }, [incidentId]);

  useEffect(() => {
    if (!incidentId) {
      loadAllIncidents();
    }
  }, [filterStatus, filterSeverity]);

  const loadAllIncidents = async () => {
    try {
      setLoading(true);
      const data = await hrService.getIncidentReports(
        filterSeverity !== 'all' ? filterSeverity : undefined,
        filterStatus !== 'all' ? filterStatus : undefined
      );
      setIncidents(data);
    } catch (error) {
      console.error('Error loading incidents:', error);
      showToast('Failed to load incidents', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadIncidentDetails = async () => {
    try {
      setLoading(true);
      const allIncidents = await hrService.getIncidentReports();
      const incident = allIncidents.find(i => i.id === incidentId || i._id === incidentId);
      setSelectedIncident(incident || null);
    } catch (error) {
      console.error('Error loading incident details:', error);
      showToast('Failed to load incident details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-800';
      case 'investigating': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return AlertTriangle;
      case 'investigating': return Clock;
      case 'resolved': return CheckCircle;
      case 'closed': return XCircle;
      default: return FileText;
    }
  };

  const handleStartInvestigation = async () => {
    if (!selectedIncident) return;

    try {
      // In a real app, you would update the incident status via API
      showToast('Investigation started', 'success');
      setShowInvestigationModal(false);
      setInvestigationNotes('');
      loadIncidentDetails();
    } catch (error) {
      console.error('Error starting investigation:', error);
      showToast('Failed to start investigation', 'error');
    }
  };

  const handleResolveIncident = async () => {
    if (!selectedIncident) return;

    try {
      // In a real app, you would update the incident status via API
      showToast('Incident resolved', 'success');
      setShowResolutionModal(false);
      setResolutionDetails({
        status: 'resolved',
        correctiveActions: [''],
        notes: '',
      });
      loadIncidentDetails();
    } catch (error) {
      console.error('Error resolving incident:', error);
      showToast('Failed to resolve incident', 'error');
    }
  };

  const addCorrectiveAction = () => {
    setResolutionDetails(prev => ({
      ...prev,
      correctiveActions: [...prev.correctiveActions, ''],
    }));
  };

  const updateCorrectiveAction = (index: number, value: string) => {
    setResolutionDetails(prev => ({
      ...prev,
      correctiveActions: prev.correctiveActions.map((action, i) => 
        i === index ? value : action
      ),
    }));
  };

  const removeCorrectiveAction = (index: number) => {
    setResolutionDetails(prev => ({
      ...prev,
      correctiveActions: prev.correctiveActions.filter((_, i) => i !== index),
    }));
  };

  const filteredIncidents = incidents.filter(incident => {
    const matchesSearch = searchTerm === '' || 
      incident.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incident.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (incident.category && incident.category.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = filterStatus === 'all' || incident.status === filterStatus;
    const matchesSeverity = filterSeverity === 'all' || incident.severity === filterSeverity;
    
    return matchesSearch && matchesStatus && matchesSeverity;
  });

  // Helper function to safely format dates
  const formatDateSafe = (date: string | Date | null | undefined): string => {
    if (!date) return 'N/A';
    
    try {
      const dateString = typeof date === 'string' ? date : date.toISOString();
      return hrService.formatDate(dateString);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="ml-3 text-gray-600">Loading incident data...</p>
      </div>
    );
  }

  if (incidentId && selectedIncident) {
    const StatusIcon = getStatusIcon(selectedIncident.status);
    
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{selectedIncident.title}</h2>
            <p className="text-gray-600 mt-1">
              Reported on {formatDateSafe(selectedIncident.reportedDate)} • 
              Incident Date: {formatDateSafe(selectedIncident.incidentDate)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowInvestigationModal(true)}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
              disabled={selectedIncident.status !== 'open'}
            >
              Start Investigation
            </button>
            <button
              onClick={() => setShowResolutionModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              disabled={selectedIncident.status === 'closed'}
            >
              Resolve Incident
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <div className="bg-white border border-gray-200 rounded-lg p-5 mb-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Incident Details</h3>
                  <p className="text-gray-600 mt-1">Comprehensive incident information</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${hrService.getSeverityColor(selectedIncident.severity)}`}>
                    {selectedIncident.severity}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedIncident.status)}`}>
                    {selectedIncident.status}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Description</p>
                  <p className="text-gray-700 whitespace-pre-line">{selectedIncident.description}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Category</p>
                    <p className="font-medium text-gray-900 capitalize">{selectedIncident.category || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Location</p>
                    <p className="font-medium text-gray-900">{selectedIncident.location || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Reporter</p>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <p className="font-medium text-gray-900">
                        {selectedIncident.reporter?.name || 'Anonymous'}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Incident Date</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <p className="font-medium text-gray-900">
                        {formatDateSafe(selectedIncident.incidentDate)}
                      </p>
                    </div>
                  </div>
                </div>

                {selectedIncident.witnesses && selectedIncident.witnesses.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Witnesses</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedIncident.witnesses.map((witness, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                          {witness}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedIncident.involvedEmployees && selectedIncident.involvedEmployees.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Involved Employees</p>
                    <div className="space-y-2">
                      {selectedIncident.involvedEmployees.map((employee, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-700">{typeof employee === 'string' ? employee : employee.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedIncident.investigationNotes && (
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Investigation Notes</p>
                    <p className="text-gray-700 whitespace-pre-line">{selectedIncident.investigationNotes}</p>
                  </div>
                )}

                {selectedIncident.correctiveActions && selectedIncident.correctiveActions.length > 0 && (
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Corrective Actions</p>
                    <ul className="space-y-1">
                      {selectedIncident.correctiveActions.map((action, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                          <span className="text-gray-700">{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className={`border rounded-lg p-4 ${
              selectedIncident.severity === 'critical' ? 'border-red-200 bg-red-50' :
              selectedIncident.severity === 'high' ? 'border-orange-200 bg-orange-50' :
              selectedIncident.severity === 'medium' ? 'border-yellow-200 bg-yellow-50' :
              'border-blue-200 bg-blue-50'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">Severity Level</p>
                <AlertTriangle className="h-5 w-5" />
              </div>
              <p className={`text-2xl font-bold ${
                selectedIncident.severity === 'critical' ? 'text-red-900' :
                selectedIncident.severity === 'high' ? 'text-orange-900' :
                selectedIncident.severity === 'medium' ? 'text-yellow-900' :
                'text-blue-900'
              }`}>
                {selectedIncident.severity.toUpperCase()}
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">Current Status</p>
                <StatusIcon className="h-5 w-5 text-gray-600" />
              </div>
              <p className={`text-2xl font-bold ${getStatusColor(selectedIncident.status)}`}>
                {selectedIncident.status}
              </p>
              {selectedIncident.resolutionDate && (
                <p className="text-sm text-gray-600 mt-1">
                  Resolved on {formatDateSafe(selectedIncident.resolutionDate)}
                </p>
              )}
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">Time Since Report</p>
                <Clock className="h-5 w-5 text-gray-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {(() => {
                  const reportedDate = new Date(selectedIncident.reportedDate);
                  const today = new Date();
                  const diffTime = Math.abs(today.getTime() - reportedDate.getTime());
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  return `${diffDays} days`;
                })()}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Reported {formatDateSafe(selectedIncident.reportedDate)}
              </p>
            </div>
          </div>
        </div>

        {showInvestigationModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Start Investigation</h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Incident</p>
                  <p className="font-medium text-gray-900">{selectedIncident.title}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Investigation Notes
                  </label>
                  <textarea
                    value={investigationNotes}
                    onChange={(e) => setInvestigationNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    rows={4}
                    placeholder="Enter investigation notes, initial findings, or action plan..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => {
                    setShowInvestigationModal(false);
                    setInvestigationNotes('');
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStartInvestigation}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                >
                  Start Investigation
                </button>
              </div>
            </div>
          </div>
        )}

        {showResolutionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Resolve Incident</h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Incident</p>
                  <p className="font-medium text-gray-900">{selectedIncident.title}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Resolution Status
                  </label>
                  <select
                    value={resolutionDetails.status}
                    onChange={(e) => setResolutionDetails(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Corrective Actions
                    </label>
                    <button
                      type="button"
                      onClick={addCorrectiveAction}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Add Action
                    </button>
                  </div>
                  <div className="space-y-2">
                    {resolutionDetails.correctiveActions.map((action, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={action}
                          onChange={(e) => updateCorrectiveAction(index, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                          placeholder="Enter corrective action"
                        />
                        <button
                          type="button"
                          onClick={() => removeCorrectiveAction(index)}
                          className="p-1 text-red-600 hover:text-red-800"
                          disabled={resolutionDetails.correctiveActions.length === 1}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Resolution Notes
                  </label>
                  <textarea
                    value={resolutionDetails.notes}
                    onChange={(e) => setResolutionDetails(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    rows={3}
                    placeholder="Enter resolution details and final notes..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => {
                    setShowResolutionModal(false);
                    setResolutionDetails({
                      status: 'resolved',
                      correctiveActions: [''],
                      notes: '',
                    });
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResolveIncident}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Resolve Incident
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
            <h2 className="text-xl font-semibold text-gray-900">Incident Reports</h2>
            <p className="text-gray-600 mt-1">Manage workplace incident reports and investigations</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search incidents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-64"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="investigating">Investigating</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
              
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="all">All Severity</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            
            <button
              onClick={() => router.push('/hr/incidents/create')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              New Incident
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Incident</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Severity</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Category</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Reporter</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredIncidents.map((incident, index) => {
              const StatusIcon = getStatusIcon(incident.status);
              
              return (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{incident.title}</p>
                      <p className="text-sm text-gray-600 line-clamp-1">{incident.description}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${hrService.getSeverityColor(incident.severity)}`}>
                      {incident.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-gray-900">
                      <Calendar className="h-3 w-3" />
                      {formatDateSafe(incident.incidentDate)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <StatusIcon className="h-4 w-4" />
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(incident.status)}`}>
                        {incident.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-900 capitalize">{incident.category || 'N/A'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <User className="h-3 w-3 text-gray-500" />
                      <span className="text-gray-900">
                        {incident.reporter?.name?.split(' ')[0] || 'Anonymous'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => router.push(`/hr/incidents/${incident._id || incident.id}`)}
                        className="p-1 text-blue-600 hover:text-blue-800"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => router.push(`/hr/incidents/${incident._id || incident.id}/edit`)}
                        className="p-1 text-green-600 hover:text-green-800"
                        title="Edit Incident"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      {incident.status === 'open' && (
                        <button
                          onClick={() => {
                            setSelectedIncident(incident);
                            setShowInvestigationModal(true);
                          }}
                          className="p-1 text-yellow-600 hover:text-yellow-800"
                          title="Start Investigation"
                        >
                          <AlertTriangle className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filteredIncidents.length === 0 && (
        <div className="py-12 text-center">
          <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-gray-700 font-medium">No incidents found</h3>
          <p className="text-gray-500 text-sm mt-1">
            {searchTerm ? 'Try a different search term' : 'No incident reports available'}
          </p>
          <button
            onClick={() => router.push('/hr/incidents/create')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Report First Incident
          </button>
        </div>
      )}
    </div>
  );
}