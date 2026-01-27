'use client';

import React from 'react';
import { 
  Users, Calendar, FileText, AlertCircle, CheckCircle, Clock, 
  Eye, Download, Edit, User, Building, Briefcase, Target, 
  Heart, UserCheck, UserPlus, TrendingUp, TrendingDown 
} from 'lucide-react';

interface HRTabContentProps {
  activeTab: string;
  dashboardData: any;
  contracts: any[];
  incidents: any[];
  performancePlans: any[];
  candidates: any[];
  welfarePrograms: any[];
  policies: any[];
  leaveBalances: any[];
  searchTerm: string;
  router: any;
  formatDate: (date?: string) => string;
  getContractStatus: (contract: any) => string;
  getContractStatusColor: (status: string) => string;
  getIncidentSeverityColor: (severity: string) => string;
  getCandidateStatusColor: (status: string) => string;
  getWelfareIcon: (category: string) => any;
  getDaysUntil: (date?: string) => number | null;
}

export default function HRTabContent({
  activeTab,
  dashboardData,
  contracts,
  incidents,
  performancePlans,
  candidates,
  welfarePrograms,
  policies,
  leaveBalances,
  searchTerm,
  router,
  formatDate,
  getContractStatus,
  getContractStatusColor,
  getIncidentSeverityColor,
  getCandidateStatusColor,
  getWelfareIcon,
  getDaysUntil
}: HRTabContentProps) {
  
  const filteredContracts = contracts.filter(contract => 
    `${contract.firstName} ${contract.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contract.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contract.position.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredIncidents = incidents.filter(incident =>
    incident.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    incident.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPerformancePlans = performancePlans.filter(plan =>
    plan.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plan.employee.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCandidates = candidates.filter(candidate =>
    `${candidate.firstName} ${candidate.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    candidate.positionApplied.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredWelfarePrograms = welfarePrograms.filter(program =>
    program.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    program.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPolicies = policies.filter(policy =>
    policy.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    policy.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredLeaveBalances = leaveBalances.filter(leave =>
    leave.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    leave.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (activeTab === 'overview') {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Leave Requests */}
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Pending Leave Requests</h3>
          <div className="space-y-3">
            {dashboardData?.pendingLeaves?.slice(0, 5).map((leave: any) => (
              <div key={leave.requestId} className="p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{leave.employeeName}</p>
                    <p className="text-sm text-gray-600">{leave.department}</p>
                  </div>
                  <button
                    onClick={() => router.push(`/hr/leaves/${leave.profileId}`)}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg"
                  >
                    Review
                  </button>
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  {leave.leaveType} • {formatDate(leave.startDate)} to {formatDate(leave.endDate)}
                </div>
              </div>
            ))}
            {(!dashboardData?.pendingLeaves || dashboardData.pendingLeaves.length === 0) && (
              <p className="text-gray-500 text-center py-4">No pending leave requests</p>
            )}
          </div>
        </div>

        {/* Recent Incidents */}
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Recent Incidents</h3>
          <div className="space-y-3">
            {dashboardData?.recentIncidents?.map((incident: any) => (
              <div key={incident._id} className="p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{incident.title}</p>
                    <p className="text-sm text-gray-600">{formatDate(incident.incidentDate)}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded ${getIncidentSeverityColor(incident.severity)}`}>
                    {incident.severity}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-2 line-clamp-2">{incident.description}</p>
              </div>
            ))}
            {(!dashboardData?.recentIncidents || dashboardData.recentIncidents.length === 0) && (
              <p className="text-gray-500 text-center py-4">No recent incidents</p>
            )}
          </div>
        </div>

        {/* Upcoming Performance Reviews */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Upcoming Performance Reviews</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 text-sm font-medium text-gray-500">Employee</th>
                  <th className="text-left py-2 text-sm font-medium text-gray-500">Plan</th>
                  <th className="text-left py-2 text-sm font-medium text-gray-500">End Date</th>
                  <th className="text-left py-2 text-sm font-medium text-gray-500">Status</th>
                  <th className="text-left py-2 text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {dashboardData?.upcomingReviews?.map((plan: any) => {
                  const daysLeft = getDaysUntil(plan.endDate);
                  return (
                    <tr key={plan._id} className="border-b border-gray-100">
                      <td className="py-3">
                        <p className="font-medium text-gray-900">{plan.employee?.name || 'N/A'}</p>
                        <p className="text-sm text-gray-600">{plan.employeeProfile?.position || 'N/A'}</p>
                      </td>
                      <td className="py-3">
                        <p className="text-gray-900">{plan.title}</p>
                      </td>
                      <td className="py-3">
                        <p className="text-gray-900">{formatDate(plan.endDate)}</p>
                        {daysLeft !== null && (
                          <p className="text-sm text-gray-600">{daysLeft} days left</p>
                        )}
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-1 text-xs rounded ${
                          plan.status === 'active' ? 'bg-green-100 text-green-800' :
                          plan.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                          plan.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {plan.status}
                        </span>
                      </td>
                      <td className="py-3">
                        <button
                          onClick={() => router.push(`/hr/performance/${plan._id}`)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {(!dashboardData?.upcomingReviews || dashboardData.upcomingReviews.length === 0) && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-500">
                      No upcoming performance reviews
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === 'leaves') {
    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Employee</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Department</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Balance</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Used</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Pending</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeaveBalances.map((leave, index) => (
              <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{leave.name}</p>
                      <p className="text-sm text-gray-600">{leave.employeeId}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <p className="text-gray-900">{leave.department}</p>
                  <p className="text-sm text-gray-600">{leave.position}</p>
                </td>
                <td className="px-4 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    leave.currentLeaveBalance < 5 ? 'bg-red-100 text-red-800' :
                    leave.currentLeaveBalance < 10 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {leave.currentLeaveBalance} days
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span className="font-medium text-gray-900">{leave.totalLeaveUsed}</span>
                </td>
                <td className="px-4 py-4">
                  <span className="font-medium text-gray-900">{leave.pendingRequests}</span>
                </td>
                <td className="px-4 py-4">
                  <button
                    onClick={() => router.push(`/hr/leaves/${leave.profileId}`)}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg"
                  >
                    Manage
                  </button>
                </td>
              </tr>
            ))}
            {filteredLeaveBalances.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  No leave balances found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  }

  if (activeTab === 'contracts') {
    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Employee</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Position/Dept</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Start Date</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">End Date</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredContracts.map((contract, index) => {
              const status = getContractStatus(contract);
              const daysUntil = getDaysUntil(contract.contractEndDate);
              
              return (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{contract.firstName} {contract.lastName}</p>
                        <p className="text-sm text-gray-600">{contract.employeeId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-gray-900">{contract.position}</p>
                    <p className="text-sm text-gray-600">{contract.department}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-gray-900">{formatDate(contract.contractStartDate)}</p>
                  </td>
                  <td className="px-4 py-4">
                    <div>
                      <p className="text-gray-900">{formatDate(contract.contractEndDate)}</p>
                      {daysUntil !== null && daysUntil <= 30 && (
                        <p className="text-sm text-yellow-600">{daysUntil} days left</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getContractStatusColor(status)}`}>
                      {status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <button
                      onClick={() => router.push(`/hr/contracts/${contract._id}`)}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg"
                    >
                      View
                    </button>
                  </td>
                </tr>
              );
            })}
            {filteredContracts.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  No contracts found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  }

  if (activeTab === 'incidents') {
    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Title</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Severity</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Category</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredIncidents.map((incident, index) => (
              <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-4">
                  <p className="font-medium text-gray-900">{incident.title}</p>
                  <p className="text-sm text-gray-600 line-clamp-1">{incident.description}</p>
                </td>
                <td className="px-4 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getIncidentSeverityColor(incident.severity)}`}>
                    {incident.severity}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <p className="text-gray-900">{formatDate(incident.incidentDate)}</p>
                </td>
                <td className="px-4 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    incident.status === 'open' ? 'bg-red-100 text-red-800' :
                    incident.status === 'investigating' ? 'bg-yellow-100 text-yellow-800' :
                    incident.status === 'resolved' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {incident.status}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span className="text-gray-900 capitalize">{incident.category}</span>
                </td>
                <td className="px-4 py-4">
                  <button
                    onClick={() => router.push(`/hr/incidents/${incident._id}`)}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
            {filteredIncidents.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  No incidents found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  }

  if (activeTab === 'performance') {
    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Plan</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Employee</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Timeline</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Reviews</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPerformancePlans.map((plan, index) => {
              const daysLeft = getDaysUntil(plan.endDate);
              
              return (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <p className="font-medium text-gray-900">{plan.title}</p>
                    <p className="text-sm text-gray-600 line-clamp-1">{plan.description}</p>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="text-gray-900">{plan.employee?.name || plan.employeeProfile?.name || plan.employee}</p>
                        <p className="text-sm text-gray-600">{plan.employeeProfile?.position || 'N/A'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div>
                      <p className="text-sm text-gray-900">Start: {formatDate(plan.startDate)}</p>
                      <p className="text-sm text-gray-600">End: {formatDate(plan.endDate)}</p>
                      {daysLeft !== null && (
                        <p className="text-sm text-yellow-600">{daysLeft} days left</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      plan.status === 'active' ? 'bg-green-100 text-green-800' :
                      plan.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                      plan.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {plan.status}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-gray-900">{plan.reviews?.length || 0}</span>
                  </td>
                  <td className="px-4 py-4">
                    <button
                      onClick={() => router.push(`/hr/performance/${plan._id}`)}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg"
                    >
                      View
                    </button>
                  </td>
                </tr>
              );
            })}
            {filteredPerformancePlans.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  No performance plans found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  }

  if (activeTab === 'recruitment') {
    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Candidate</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Position</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Applied Date</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Source</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCandidates.map((candidate, index) => (
              <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{candidate.firstName} {candidate.lastName}</p>
                      <p className="text-sm text-gray-600">{candidate.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <p className="text-gray-900">{candidate.positionApplied}</p>
                  <p className="text-sm text-gray-600">{candidate.department}</p>
                </td>
                <td className="px-4 py-4">
                  <p className="text-gray-900">{formatDate(candidate.appliedDate)}</p>
                </td>
                <td className="px-4 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCandidateStatusColor(candidate.status)}`}>
                    {candidate.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span className="text-gray-900 capitalize">{candidate.source || 'N/A'}</span>
                </td>
                <td className="px-4 py-4">
                  <button
                    onClick={() => router.push(`/hr/recruitment/${candidate._id}`)}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
            {filteredCandidates.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  No candidates found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  }

  if (activeTab === 'welfare') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredWelfarePrograms.map((program, index) => {
          const WelfareIcon = getWelfareIcon(program.category);
          const daysLeft = getDaysUntil(program.endDate);
          
          return (
            <div key={index} className="bg-white border border-gray-200 rounded-lg p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <WelfareIcon className="h-5 w-5 text-blue-600" />
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
                  <span className="font-medium text-gray-900">KES {program.budget?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Start Date:</span>
                  <span className="font-medium text-gray-900">{formatDate(program.startDate)}</span>
                </div>
                {program.endDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">End Date:</span>
                    <span className="font-medium text-gray-900">{formatDate(program.endDate)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Participants:</span>
                  <span className="font-medium text-gray-900">{program.currentParticipants || 0}</span>
                </div>
              </div>
              
              <button
                onClick={() => router.push(`/hr/welfare/${program._id}`)}
                className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                View Details
              </button>
            </div>
          );
        })}
        
        {filteredWelfarePrograms.length === 0 && (
          <div className="col-span-3 text-center py-12 text-gray-500">
            No welfare programs found
          </div>
        )}
      </div>
    );
  }

  if (activeTab === 'policies') {
    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Policy</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Category</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Effective Date</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Version</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPolicies.map((policy, index) => (
              <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-4">
                  <p className="font-medium text-gray-900">{policy.title}</p>
                  <p className="text-sm text-gray-600 line-clamp-1">{policy.description}</p>
                </td>
                <td className="px-4 py-4">
                  <span className="text-gray-900 capitalize">{policy.category.replace('_', ' ')}</span>
                </td>
                <td className="px-4 py-4">
                  <p className="text-gray-900">{formatDate(policy.effectiveDate)}</p>
                </td>
                <td className="px-4 py-4">
                  <span className="text-gray-900">{policy.version}</span>
                </td>
                <td className="px-4 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    policy.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {policy.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <button
                    onClick={() => router.push(`/hr/policies/${policy._id}`)}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
            {filteredPolicies.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  No policies found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  }

  return null;
}