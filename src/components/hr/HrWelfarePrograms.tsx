'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, Calendar, Users, DollarSign, MapPin, Search, Filter, Plus, Eye, Edit, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { hrService, WelfareProgram } from '@/services/settings/hrService';

interface HrWelfareProgramsProps {
  programId?: string;
}

export default function HrWelfarePrograms({ programId }: HrWelfareProgramsProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [programs, setPrograms] = useState<WelfareProgram[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<WelfareProgram | null>(null);
  const [filterActive, setFilterActive] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showParticipantModal, setShowParticipantModal] = useState(false);
  const [participantData, setParticipantData] = useState({
    employeeId: '',
    feedback: '',
    benefits: [''],
  });

  useEffect(() => {
    if (programId) {
      loadProgramDetails();
    } else {
      loadAllPrograms();
    }
  }, [programId]);

  useEffect(() => {
    if (!programId) {
      loadAllPrograms();
    }
  }, [filterActive]);

  const loadAllPrograms = async () => {
    try {
      setLoading(true);
      const active = filterActive === 'all' ? undefined : filterActive === 'active';
      const data = await hrService.getWelfarePrograms(active);
      setPrograms(data);
    } catch (error) {
      console.error('Error loading welfare programs:', error);
      showToast('Failed to load welfare programs', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadProgramDetails = async () => {
    try {
      setLoading(true);
      const program = await hrService.getWelfareProgram(programId!);
      setSelectedProgram(program);
    } catch (error) {
      console.error('Error loading program details:', error);
      showToast('Failed to load program details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'health': return 'bg-red-100 text-red-800';
      case 'financial': return 'bg-green-100 text-green-800';
      case 'education': return 'bg-blue-100 text-blue-800';
      case 'recreational': return 'bg-purple-100 text-purple-800';
      case 'wellness': return 'bg-pink-100 text-pink-800';
      case 'fitness': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    // This would use the same logic as getWelfareIcon in HrPage.tsx
    return Heart;
  };

  const handleAddParticipant = async () => {
    if (!selectedProgram) return;

    try {
      // In a real app, you would add participant via API
      showToast('Participant added successfully', 'success');
      setShowParticipantModal(false);
      setParticipantData({
        employeeId: '',
        feedback: '',
        benefits: [''],
      });
      loadProgramDetails();
    } catch (error) {
      console.error('Error adding participant:', error);
      showToast('Failed to add participant', 'error');
    }
  };

  const addBenefit = () => {
    setParticipantData(prev => ({
      ...prev,
      benefits: [...prev.benefits, ''],
    }));
  };

  const updateBenefit = (index: number, value: string) => {
    setParticipantData(prev => ({
      ...prev,
      benefits: prev.benefits.map((benefit, i) => 
        i === index ? value : benefit
      ),
    }));
  };

  const removeBenefit = (index: number) => {
    setParticipantData(prev => ({
      ...prev,
      benefits: prev.benefits.filter((_, i) => i !== index),
    }));
  };

  const filteredPrograms = programs.filter(program => {
    const matchesSearch = searchTerm === '' || 
      program.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      program.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      program.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="ml-3 text-gray-600">Loading welfare programs...</p>
      </div>
    );
  }

  if (programId && selectedProgram) {
    const CategoryIcon = getCategoryIcon(selectedProgram.category);
    const utilizationRate = selectedProgram.budget > 0 
      ? Math.round((selectedProgram.utilizedBudget || 0) / selectedProgram.budget * 100)
      : 0;
    const participationRate = selectedProgram.maxParticipants && selectedProgram.maxParticipants > 0
      ? Math.round((selectedProgram.currentParticipants || 0) / selectedProgram.maxParticipants * 100)
      : 0;
    
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{selectedProgram.title}</h2>
            <p className="text-gray-600 mt-1">
              {selectedProgram.category.replace('_', ' ').toUpperCase()} • 
              {selectedProgram.active ? ' Active' : ' Inactive'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowParticipantModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add Participant
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <div className="bg-white border border-gray-200 rounded-lg p-5 mb-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Program Details</h3>
                  <p className="text-gray-600 mt-1">Comprehensive program information</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(selectedProgram.category)}`}>
                    {selectedProgram.category.replace('_', ' ')}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    selectedProgram.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedProgram.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Description</p>
                  <p className="text-gray-700 whitespace-pre-line">{selectedProgram.description}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Coordinator</p>
                    <p className="font-medium text-gray-900">
                      {selectedProgram.coordinator?.name || 'Not assigned'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Location</p>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <p className="font-medium text-gray-900">{selectedProgram.location || 'Not specified'}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Start Date</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <p className="font-medium text-gray-900">
                        {hrService.formatDate(selectedProgram.startDate)}
                      </p>
                    </div>
                  </div>
                  {selectedProgram.endDate && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">End Date</p>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <p className="font-medium text-gray-900">
                          {hrService.formatDate(selectedProgram.endDate)}
                        </p>
                      </div>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Frequency</p>
                    <p className="font-medium text-gray-900 capitalize">{selectedProgram.frequency || 'One-time'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Registration Deadline</p>
                    <p className="font-medium text-gray-900">
                      {selectedProgram.registrationDeadline 
                        ? hrService.formatDate(selectedProgram.registrationDeadline)
                        : 'No deadline'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Budget</p>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-gray-500" />
                      <p className="font-medium text-gray-900">
                        KES {selectedProgram.budget.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Utilized Budget</p>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-gray-500" />
                      <p className="font-medium text-gray-900">
                        KES {(selectedProgram.utilizedBudget || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {selectedProgram.eligibleDepartments && selectedProgram.eligibleDepartments.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Eligible Departments</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedProgram.eligibleDepartments.map((dept, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                          {dept}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedProgram.eligiblePositions && selectedProgram.eligiblePositions.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Eligible Positions</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedProgram.eligiblePositions.map((position, index) => (
                        <span key={index} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                          {position}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedProgram.successMetrics && selectedProgram.successMetrics.length > 0 && (
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Success Metrics</p>
                    <ul className="space-y-1">
                      {selectedProgram.successMetrics.map((metric, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                          <span className="text-gray-700">{metric}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedProgram.feedback && (
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Program Feedback</p>
                    <p className="text-gray-700 whitespace-pre-line">{selectedProgram.feedback}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-green-600">Participation</p>
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-900">
                {selectedProgram.currentParticipants || 0} / {selectedProgram.maxParticipants || '∞'}
              </p>
              <div className="mt-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-green-700">Participation Rate</span>
                  <span className="font-medium">{participationRate}%</span>
                </div>
                <div className="mt-1 h-2 bg-green-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-600 rounded-full"
                    style={{ width: `${participationRate}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-blue-600">Budget Utilization</p>
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-blue-900">
                {utilizationRate}%
              </p>
              <div className="mt-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-blue-700">KES {(selectedProgram.utilizedBudget || 0).toLocaleString()} / {selectedProgram.budget.toLocaleString()}</span>
                </div>
                <div className="mt-1 h-2 bg-blue-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 rounded-full"
                    style={{ width: `${utilizationRate}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-purple-600">Time Remaining</p>
                <Clock className="h-5 w-5 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-purple-900">
                {selectedProgram.endDate ? (
                  (() => {
                    const today = new Date();
                    const endDate = new Date(selectedProgram.endDate);
                    const diffTime = endDate.getTime() - today.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    return `${Math.max(0, diffDays)} days`;
                  })()
                ) : 'Ongoing'}
              </p>
              <p className="text-sm text-purple-700 mt-1">
                {selectedProgram.endDate 
                  ? `Ends ${hrService.formatDate(selectedProgram.endDate)}`
                  : 'No end date'}
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Program Actions</h4>
              <div className="space-y-2">
                <button
                  onClick={() => setShowParticipantModal(true)}
                  className="w-full px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                >
                  Add Participant
                </button>
                <button
                  onClick={() => {
                    hrService
                      .updateWelfareProgram(selectedProgram.id, { active: !selectedProgram.active })
                      .then((response) => {
                        setSelectedProgram(response.program);
                        showToast(`Program ${response.program.active ? 'activated' : 'deactivated'}`, 'success');
                      })
                      .catch((error) => {
                        console.error('Error updating welfare program:', error);
                        showToast('Failed to update welfare program', 'error');
                      });
                  }}
                  className="w-full px-3 py-2 bg-yellow-600 text-white text-sm rounded-lg hover:bg-yellow-700"
                >
                  {selectedProgram.active ? 'Deactivate Program' : 'Activate Program'}
                </button>
                <button
                  onClick={() => router.push(`/hr-portal/welfare/${selectedProgram._id || selectedProgram.id}`)}
                  className="w-full px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                >
                  Manage Program
                </button>
              </div>
            </div>
          </div>
        </div>

        {showParticipantModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Participant</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Employee ID
                  </label>
                  <input
                    type="text"
                    value={participantData.employeeId}
                    onChange={(e) => setParticipantData(prev => ({ ...prev, employeeId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Enter employee ID"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Feedback (Optional)
                  </label>
                  <textarea
                    value={participantData.feedback}
                    onChange={(e) => setParticipantData(prev => ({ ...prev, feedback: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    rows={3}
                    placeholder="Enter participant feedback..."
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Benefits Received
                    </label>
                    <button
                      type="button"
                      onClick={addBenefit}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Add Benefit
                    </button>
                  </div>
                  <div className="space-y-2">
                    {participantData.benefits.map((benefit, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={benefit}
                          onChange={(e) => updateBenefit(index, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                          placeholder="Enter benefit received"
                        />
                        <button
                          type="button"
                          onClick={() => removeBenefit(index)}
                          className="p-1 text-red-600 hover:text-red-800"
                          disabled={participantData.benefits.length === 1}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => setShowParticipantModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddParticipant}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add Participant
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
            <h2 className="text-xl font-semibold text-gray-900">Welfare Programs</h2>
            <p className="text-gray-600 mt-1">Manage employee welfare and wellness programs</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search programs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-64"
              />
            </div>
            
            <select
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="all">All Programs</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
            
            <button
              onClick={() => router.push('/hr-portal/welfare/create')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              New Program
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
        {filteredPrograms.map((program, index) => {
          const CategoryIcon = getCategoryIcon(program.category);
          const utilizationRate = program.budget > 0 
            ? Math.round((program.utilizedBudget || 0) / program.budget * 100)
            : 0;
          
          return (
            <div key={index} className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-blue-100">
                    <CategoryIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{program.title}</h3>
                    <span className="text-xs text-gray-600 capitalize">{program.category.replace('_', ' ')}</span>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs rounded ${
                  program.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {program.active ? 'Active' : 'Inactive'}
                </span>
              </div>
              
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">{program.description}</p>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Budget:</span>
                  <span className="font-medium text-gray-900">KES {program.budget.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Utilization:</span>
                  <span className="font-medium text-gray-900">{utilizationRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Participants:</span>
                  <span className="font-medium text-gray-900">{program.currentParticipants || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Start Date:</span>
                  <span className="font-medium text-gray-900">{hrService.formatDate(program.startDate)}</span>
                </div>
              </div>
              
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => router.push(`/hr-portal/welfare/${program._id || program.id}`)}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                >
                  View Details
                </button>
                <button
                  onClick={() => router.push(`/hr-portal/welfare/${program._id || program.id}`)}
                  className="px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                >
                  Manage
                </button>
              </div>
            </div>
          );
        })}
        
        {filteredPrograms.length === 0 && (
          <div className="col-span-3 text-center py-12 text-gray-500">
            <Heart className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-gray-700 font-medium">No welfare programs found</h3>
            <p className="text-gray-500 text-sm mt-1">
              {searchTerm ? 'Try a different search term' : 'No welfare programs available'}
            </p>
            <button
              onClick={() => router.push('/hr-portal/welfare/create')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create First Program
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
