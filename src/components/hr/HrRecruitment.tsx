'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserCheck, Calendar, Mail, Phone, FileText, Search, Filter, Plus, Eye, Edit, MessageSquare, CheckCircle, Clock, XCircle, TrendingUp, ChevronDown } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { hrService, RecruitmentCandidate, RecruitmentPipeline } from '@/services/settings/hrService';

interface HrRecruitmentProps {
  candidateId?: string;
}

export default function HrRecruitment({ candidateId }: HrRecruitmentProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [pipelineData, setPipelineData] = useState<RecruitmentPipeline | null>(null);
  const [candidates, setCandidates] = useState<RecruitmentCandidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<RecruitmentCandidate | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [interviewData, setInterviewData] = useState({
    date: '',
    interviewer: '',
    type: 'phone_interview',
    notes: '',
    rating: 3,
    duration: 30,
    location: '',
  });
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerData, setOfferData] = useState({
    salary: 0,
    startDate: '',
    notes: '',
  });

  useEffect(() => {
    if (candidateId) {
      loadCandidateDetails();
    } else {
      loadRecruitmentPipeline();
    }
  }, [candidateId]);

  useEffect(() => {
    if (!candidateId) {
      loadRecruitmentPipeline();
    }
  }, [filterStatus]);

  const loadRecruitmentPipeline = async () => {
    try {
      setLoading(true);
      const data = await hrService.getRecruitmentPipeline(
        filterStatus !== 'all' ? filterStatus : undefined
      );
      setPipelineData(data);
      setCandidates(data.candidates);
    } catch (error) {
      console.error('Error loading recruitment pipeline:', error);
      showToast('Failed to load recruitment data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadCandidateDetails = async () => {
    try {
      setLoading(true);
      const pipeline = await hrService.getRecruitmentPipeline();
      const candidate = pipeline.candidates.find(c => c.id === candidateId || c._id === candidateId);
      setSelectedCandidate(candidate || null);
    } catch (error) {
      console.error('Error loading candidate details:', error);
      showToast('Failed to load candidate details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    return hrService.getCandidateStatusColor(status);
  };

  const getStatusText = (status: string) => {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const handleScheduleInterview = async () => {
    if (!selectedCandidate) return;

    try {
      // In a real app, you would schedule interview via API
      showToast('Interview scheduled successfully', 'success');
      setShowInterviewModal(false);
      setInterviewData({
        date: '',
        interviewer: '',
        type: 'phone_interview',
        notes: '',
        rating: 3,
        duration: 30,
        location: '',
      });
      loadCandidateDetails();
    } catch (error) {
      console.error('Error scheduling interview:', error);
      showToast('Failed to schedule interview', 'error');
    }
  };

  const handleMakeOffer = async () => {
    if (!selectedCandidate) return;

    try {
      // In a real app, you would make offer via API
      showToast('Offer made successfully', 'success');
      setShowOfferModal(false);
      setOfferData({
        salary: 0,
        startDate: '',
        notes: '',
      });
      loadCandidateDetails();
    } catch (error) {
      console.error('Error making offer:', error);
      showToast('Failed to make offer', 'error');
    }
  };

  const filteredCandidates = candidates.filter(candidate => {
    const matchesSearch = searchTerm === '' || 
      `${candidate.firstName} ${candidate.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.positionApplied.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === 'all') return matchesSearch;
    return matchesSearch && candidate.status === filterStatus;
  });

  // Helper function to safely access candidate interviews (type-safe)
  const getCandidateInterviews = (candidate: RecruitmentCandidate) => {
    // Check if interviews property exists and is an array
    if ('interviews' in candidate && Array.isArray((candidate as any).interviews)) {
      return (candidate as any).interviews as Array<{
        date: string | Date;
        interviewer: string;
        type: string;
        notes?: string;
        rating?: number;
        duration?: number;
        completed?: boolean;
        feedback?: string;
      }>;
    }
    return [];
  };

  // Helper function to safely format dates
  const formatDateSafe = (date: string | Date | undefined): string => {
    if (!date) return 'N/A';
    return hrService.formatDate(typeof date === 'string' ? date : date.toISOString());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="ml-3 text-gray-600">Loading recruitment data...</p>
      </div>
    );
  }

  if (candidateId && selectedCandidate) {
    const candidateInterviews = getCandidateInterviews(selectedCandidate);
    
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {selectedCandidate.firstName} {selectedCandidate.lastName}
            </h2>
            <p className="text-gray-600 mt-1">
              {selectedCandidate.positionApplied} • {selectedCandidate.department}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowInterviewModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              disabled={selectedCandidate.status === 'rejected' || selectedCandidate.status === 'accepted'}
            >
              Schedule Interview
            </button>
            <button
              onClick={() => setShowOfferModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              disabled={!['technical_interview', 'final_interview'].includes(selectedCandidate.status)}
            >
              Make Offer
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <div className="bg-white border border-gray-200 rounded-lg p-5 mb-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Candidate Information</h3>
                  <p className="text-gray-600 mt-1">Comprehensive candidate details</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedCandidate.status)}`}>
                  {getStatusText(selectedCandidate.status)}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Full Name</p>
                  <p className="font-medium text-gray-900">
                    {selectedCandidate.firstName} {selectedCandidate.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Contact Information</p>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-900">{selectedCandidate.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-900">{selectedCandidate.phone || 'N/A'}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Position Applied</p>
                  <p className="font-medium text-gray-900">{selectedCandidate.positionApplied}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Department</p>
                  <p className="font-medium text-gray-900">{selectedCandidate.department}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Application Date</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="font-medium text-gray-900">
                      {formatDateSafe(selectedCandidate.appliedDate)}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Source</p>
                  <p className="font-medium text-gray-900 capitalize">{selectedCandidate.source || 'N/A'}</p>
                </div>
                {selectedCandidate.currentCompany && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Current Company</p>
                    <p className="font-medium text-gray-900">{selectedCandidate.currentCompany}</p>
                  </div>
                )}
                {selectedCandidate.currentPosition && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Current Position</p>
                    <p className="font-medium text-gray-900">{selectedCandidate.currentPosition}</p>
                  </div>
                )}
                {selectedCandidate.expectedSalary && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Expected Salary</p>
                    <p className="font-medium text-gray-900">
                      KES {selectedCandidate.expectedSalary.toLocaleString()}
                    </p>
                  </div>
                )}
                {selectedCandidate.noticePeriod && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Notice Period</p>
                    <p className="font-medium text-gray-900">{selectedCandidate.noticePeriod}</p>
                  </div>
                )}
                {selectedCandidate.yearsOfExperience && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Years of Experience</p>
                    <p className="font-medium text-gray-900">{selectedCandidate.yearsOfExperience} years</p>
                  </div>
                )}
              </div>

              {selectedCandidate.skills && selectedCandidate.skills.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-2">Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedCandidate.skills.map((skill, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedCandidate.qualifications && selectedCandidate.qualifications.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-2">Qualifications</p>
                  <ul className="space-y-1">
                    {selectedCandidate.qualifications.map((qualification, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                        <span className="text-gray-700">{qualification}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedCandidate.resumeUrl && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-2">Resume</p>
                  <a
                    href={selectedCandidate.resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800"
                  >
                    <FileText className="h-4 w-4" />
                    View Resume
                  </a>
                </div>
              )}

              {selectedCandidate.coverLetterUrl && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-2">Cover Letter</p>
                  <a
                    href={selectedCandidate.coverLetterUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800"
                  >
                    <FileText className="h-4 w-4" />
                    View Cover Letter
                  </a>
                </div>
              )}
            </div>

            {candidateInterviews.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Interview History</h3>
                <div className="space-y-4">
                  {candidateInterviews.map((interview, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {interview.type.replace('_', ' ').toUpperCase()} Interview
                          </h4>
                          <p className="text-sm text-gray-600">
                            {formatDateSafe(interview.date)} • {interview.interviewer}
                          </p>
                        </div>
                        {interview.completed && (
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 text-xs rounded ${
                              interview.rating && interview.rating >= 4 ? 'bg-green-100 text-green-800' :
                              interview.rating && interview.rating >= 3 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              Rating: {interview.rating || 0}/5
                            </span>
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </div>
                        )}
                      </div>
                      {interview.notes && (
                        <p className="text-sm text-gray-700 mt-2">{interview.notes}</p>
                      )}
                      {interview.feedback && (
                        <div className="mt-2 p-2 bg-gray-50 rounded">
                          <p className="text-sm text-gray-600">Feedback:</p>
                          <p className="text-sm text-gray-700">{interview.feedback}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-blue-600">Application Timeline</p>
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-blue-900">
                {(() => {
                  const appliedDate = new Date(selectedCandidate.appliedDate);
                  const today = new Date();
                  const diffTime = Math.abs(today.getTime() - appliedDate.getTime());
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  return `${diffDays} days`;
                })()}
              </p>
              <p className="text-sm text-blue-700 mt-1">
                Applied {formatDateSafe(selectedCandidate.appliedDate)}
              </p>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-purple-600">Recruitment Stage</p>
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-purple-900">
                {getStatusText(selectedCandidate.status)}
              </p>
              <div className="mt-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-purple-700">Progress</span>
                  <span className="font-medium">
                    {(() => {
                      const stages = ['screening', 'phone_interview', 'technical_interview', 'hr_interview', 'final_interview', 'offer_pending', 'offered', 'accepted'];
                      const currentIndex = stages.indexOf(selectedCandidate.status);
                      return currentIndex >= 0 ? `${Math.round((currentIndex + 1) / stages.length * 100)}%` : 'N/A';
                    })()}
                  </span>
                </div>
                <div className="mt-1 h-2 bg-purple-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-purple-600 rounded-full"
                    style={{
                      width: (() => {
                        const stages = ['screening', 'phone_interview', 'technical_interview', 'hr_interview', 'final_interview', 'offer_pending', 'offered', 'accepted'];
                        const currentIndex = stages.indexOf(selectedCandidate.status);
                        return currentIndex >= 0 ? `${Math.round((currentIndex + 1) / stages.length * 100)}%` : '0%';
                      })()
                    }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-green-600">Assigned Recruiter</p>
                <UserCheck className="h-5 w-5 text-green-600" />
              </div>
              <p className="font-medium text-green-900">
                {selectedCandidate.assignedRecruiter?.name || 'Not assigned'}
              </p>
              {selectedCandidate.assignedRecruiter?.email && (
                <p className="text-sm text-green-700 mt-1">{selectedCandidate.assignedRecruiter.email}</p>
              )}
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Quick Actions</h4>
              <div className="space-y-2">
                <button
                  onClick={() => setShowInterviewModal(true)}
                  className="w-full px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                  disabled={selectedCandidate.status === 'rejected' || selectedCandidate.status === 'accepted'}
                >
                  Schedule Interview
                </button>
                <button
                  onClick={() => setShowOfferModal(true)}
                  className="w-full px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                  disabled={!['technical_interview', 'final_interview'].includes(selectedCandidate.status)}
                >
                  Make Offer
                </button>
                <button
                  onClick={() => {
                    // Update status to rejected
                    showToast('Candidate rejected', 'success');
                  }}
                  className="w-full px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
                  disabled={selectedCandidate.status === 'rejected' || selectedCandidate.status === 'accepted'}
                >
                  Reject Candidate
                </button>
              </div>
            </div>
          </div>
        </div>

        {showInterviewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Schedule Interview</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Interview Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={interviewData.date}
                    onChange={(e) => setInterviewData(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Interviewer
                  </label>
                  <input
                    type="text"
                    value={interviewData.interviewer}
                    onChange={(e) => setInterviewData(prev => ({ ...prev, interviewer: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Enter interviewer name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Interview Type
                  </label>
                  <select
                    value={interviewData.type}
                    onChange={(e) => setInterviewData(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="phone_interview">Phone Interview</option>
                    <option value="video_interview">Video Interview</option>
                    <option value="in_person">In-Person Interview</option>
                    <option value="technical_test">Technical Test</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={interviewData.duration}
                    onChange={(e) => setInterviewData(prev => ({ ...prev, duration: parseInt(e.target.value) || 30 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    min="15"
                    max="120"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location/Details
                  </label>
                  <input
                    type="text"
                    value={interviewData.location}
                    onChange={(e) => setInterviewData(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Enter location or meeting link"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={interviewData.notes}
                    onChange={(e) => setInterviewData(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    rows={3}
                    placeholder="Add interview notes or agenda..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => setShowInterviewModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleScheduleInterview}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Schedule Interview
                </button>
              </div>
            </div>
          </div>
        )}

        {showOfferModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Make Job Offer</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Offer Salary (KES)
                  </label>
                  <input
                    type="number"
                    value={offerData.salary}
                    onChange={(e) => setOfferData(prev => ({ ...prev, salary: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    min="0"
                  />
                  {selectedCandidate?.expectedSalary && (
                    <p className="text-sm text-gray-600 mt-1">
                      Candidate expects: KES {selectedCandidate.expectedSalary.toLocaleString()}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Proposed Start Date
                  </label>
                  <input
                    type="date"
                    value={offerData.startDate}
                    onChange={(e) => setOfferData(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Offer Notes
                  </label>
                  <textarea
                    value={offerData.notes}
                    onChange={(e) => setOfferData(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    rows={3}
                    placeholder="Add offer details, benefits, or special conditions..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => setShowOfferModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMakeOffer}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Make Offer
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
            <h2 className="text-xl font-semibold text-gray-900">Recruitment Pipeline</h2>
            <p className="text-gray-600 mt-1">Manage recruitment candidates and interviews</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search candidates..."
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
              <option value="all">All Candidates</option>
              <option value="screening">Screening</option>
              <option value="phone_interview">Phone Interview</option>
              <option value="technical_interview">Technical Interview</option>
              <option value="hr_interview">HR Interview</option>
              <option value="final_interview">Final Interview</option>
              <option value="background_check">Background Check</option>
              <option value="offer_pending">Offer Pending</option>
              <option value="offered">Offered</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>
            
            <button
              onClick={() => router.push('/hr-portal/recruitment/create')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Candidate
            </button>
          </div>
        </div>
      </div>

      {pipelineData && (
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
            {Object.entries(pipelineData.statistics).map(([key, value]) => (
              <div key={key} className="text-center">
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-600 capitalize">{key.replace('_', ' ')}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Candidate</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Position</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Applied Date</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Source</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Experience</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCandidates.map((candidate, index) => (
              <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <UserCheck className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{candidate.firstName} {candidate.lastName}</p>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Mail className="h-3 w-3" />
                        {candidate.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div>
                    <p className="text-gray-900">{candidate.positionApplied}</p>
                    <p className="text-sm text-gray-600">{candidate.department}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1 text-gray-900">
                    <Calendar className="h-3 w-3" />
                    {formatDateSafe(candidate.appliedDate)}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(candidate.status)}`}>
                    {getStatusText(candidate.status)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-gray-900 capitalize">{candidate.source || 'N/A'}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-gray-900">{candidate.yearsOfExperience || 0} years</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => router.push(`/hr-portal/recruitment/${candidate._id || candidate.id}`)}
                      className="p-1 text-blue-600 hover:text-blue-800"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => router.push(`/hr-portal/recruitment/${candidate._id || candidate.id}/edit`)}
                      className="p-1 text-green-600 hover:text-green-800"
                      title="Edit Candidate"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedCandidate(candidate);
                        setShowInterviewModal(true);
                      }}
                      className="p-1 text-purple-600 hover:text-purple-800"
                      title="Schedule Interview"
                      disabled={candidate.status === 'rejected' || candidate.status === 'accepted'}
                    >
                      <MessageSquare className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredCandidates.length === 0 && (
        <div className="py-12 text-center">
          <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-gray-700 font-medium">No candidates found</h3>
          <p className="text-gray-500 text-sm mt-1">
            {searchTerm ? 'Try a different search term' : 'No recruitment candidates available'}
          </p>
          <button
            onClick={() => router.push('/hr-portal/recruitment/create')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Add First Candidate
          </button>
        </div>
      )}
    </div>
  );
}
