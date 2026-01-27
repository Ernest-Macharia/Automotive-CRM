'use client';

import { ChevronRight } from 'lucide-react';
import { HrDashboard, EmployeeContract, IncidentReport, PerformancePlan, RecruitmentCandidate, WelfareProgram, CompanyPolicy, LeaveBalance } from '@/services/settings/hrService';
import { hrService } from '@/services/settings/hrService';

interface HRTabContentProps {
  activeTab: 'overview' | 'leaves' | 'contracts' | 'performance' | 'incidents' | 'recruitment' | 'welfare' | 'policies';
  dashboardData: HrDashboard | null;
  contracts: EmployeeContract[];
  incidents: IncidentReport[];
  performancePlans: PerformancePlan[];
  candidates: RecruitmentCandidate[];
  welfarePrograms: WelfareProgram[];
  policies: CompanyPolicy[];
  leaveBalances: LeaveBalance[];
  searchTerm: string;
  router: any;
  formatDate: (dateString?: string) => string;
  getContractStatus: (contract: EmployeeContract) => string; // Prop
  getContractStatusColor: (status: string) => string;
  getIncidentSeverityColor: (severity: string) => string;
  getCandidateStatusColor: (status: string) => string;
  getWelfareIcon: (category: string) => any;
  getDaysUntil: (dateString?: string) => number | null;
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
  getContractStatus, // Now using the prop version
  getContractStatusColor,
  getIncidentSeverityColor,
  getCandidateStatusColor,
  getWelfareIcon,
  getDaysUntil,
}: HRTabContentProps) {
  // Helper function - renamed to avoid conflict
  const getContractStatusFromService = (contract: EmployeeContract) => {
    return hrService.getContractStatus(contract);
  };

  const filterBySearchTerm = <T,>(items: T[], getSearchText: (item: T) => string): T[] => {
    if (!searchTerm) return items;
    const term = searchTerm.toLowerCase();
    return items.filter(item => getSearchText(item).toLowerCase().includes(term));
  };

  if (activeTab === 'overview') {
    const filteredContracts = filterBySearchTerm(
      contracts.filter(c => getContractStatus(c) === 'expiring_soon'),
      (contract) => `${contract.firstName} ${contract.lastName} ${contract.position} ${contract.department}`
    ).slice(0, 5);

    return (
      <div className="space-y-6">
        {/* Recent Incidents */}
        {dashboardData?.recentIncidents && dashboardData.recentIncidents.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Recent Incidents</h3>
            <div className="space-y-2">
              {dashboardData.recentIncidents.slice(0, 5).map((incident, index) => (
                <div
                  key={index}
                  className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => router.push(`/hr/incidents/${incident.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{incident.title}</p>
                      <p className="text-sm text-gray-600 mt-0.5">{formatDate(incident.incidentDate)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs rounded ${getIncidentSeverityColor(incident.severity)}`}>
                        {incident.severity}
                      </span>
                      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">
                        {incident.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Reviews */}
        {dashboardData?.upcomingReviews && dashboardData.upcomingReviews.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Upcoming Performance Reviews</h3>
            <div className="space-y-2">
              {dashboardData.upcomingReviews.slice(0, 5).map((review, index) => (
                <div
                  key={index}
                  className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => router.push(`/hr/performance/${review.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{review.title}</p>
                      <p className="text-sm text-gray-600 mt-0.5">
                        {review.employeeProfile?.name || 'Employee'} • Ends {formatDate(review.endDate)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs rounded ${
                        review.status === 'active' ? 'bg-green-100 text-green-800' :
                        review.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {review.status}
                      </span>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Expiring Contracts */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Contracts Expiring Soon</h3>
          <div className="space-y-2">
            {filteredContracts.map((contract, index) => (
              <div
                key={index}
                className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                onClick={() => router.push(`/hr/contracts/${contract.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      {contract.firstName} {contract.lastName}
                    </p>
                    <p className="text-sm text-gray-600 mt-0.5">
                      {contract.position} • {contract.department}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs rounded ${getContractStatusColor(getContractStatus(contract))}`}>
                      {getContractStatus(contract)}
                    </span>
                    <span className="text-sm text-gray-600">
                      {getDaysUntil(contract.contractEndDate)} days
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === 'leaves') {
    const filteredLeaves = filterBySearchTerm(
      leaveBalances,
      (balance) => `${balance.name} ${balance.employeeId} ${balance.position} ${balance.department}`
    );

    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Employee</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Department</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Position</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Accrued</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Used</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Balance</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Pending</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeaves.map((balance, index) => {
              const leaveDays = hrService.calculateTotalLeaveDays(balance);
              return (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900">{balance.name}</p>
                      <p className="text-sm text-gray-600">{balance.employeeId}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">{balance.department}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{balance.position}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{leaveDays.accrued} days</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{leaveDays.used} days</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded ${
                      leaveDays.remaining < 5 ? 'bg-red-100 text-red-800' :
                      leaveDays.remaining < 10 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {leaveDays.remaining} days
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">{leaveDays.pending} days</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => router.push(`/hr/leaves/${balance.profileId}`)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  if (activeTab === 'contracts') {
    const filteredContracts = filterBySearchTerm(
      contracts,
      (contract) => `${contract.firstName} ${contract.lastName} ${contract.employeeId} ${contract.position} ${contract.department}`
    );

    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Employee</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Position</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Contract Type</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Start Date</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">End Date</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Status</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Days Left</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredContracts.map((contract, index) => {
              const status = getContractStatus(contract); // Using prop function
              const daysLeft = getDaysUntil(contract.contractEndDate);
              return (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900">{contract.firstName} {contract.lastName}</p>
                      <p className="text-sm text-gray-600">{contract.employeeId}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">{contract.position}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 capitalize">{contract.contractType || 'N/A'}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{formatDate(contract.contractStartDate)}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{formatDate(contract.contractEndDate)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded ${getContractStatusColor(status)}`}>
                      {status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {daysLeft !== null ? `${daysLeft} days` : 'N/A'}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => router.push(`/hr/contracts/${contract.id}`)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      View
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  if (activeTab === 'performance') {
    const filteredPlans = filterBySearchTerm(
      performancePlans,
      (plan) => `${plan.title} ${plan.employeeProfile?.name || plan.employee} ${plan.description}`
    );

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPlans.map((plan, index) => (
          <div
            key={index}
            className="p-4 border border-gray-200 rounded-lg hover:shadow-md cursor-pointer"
            onClick={() => router.push(`/hr/performance/${plan.id}`)}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-medium text-gray-900">{plan.title}</h4>
                <p className="text-sm text-gray-600 mt-0.5">
                  {plan.employeeProfile?.name || plan.employee}
                </p>
              </div>
              <span className={`px-2 py-1 text-xs rounded ${
                plan.status === 'active' ? 'bg-green-100 text-green-800' :
                plan.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {plan.status}
              </span>
            </div>
            <p className="text-sm text-gray-600 line-clamp-2 mb-3">{plan.description}</p>
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>Ends: {formatDate(plan.endDate)}</span>
              <span>{plan.reviews?.length || 0} reviews</span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activeTab === 'incidents') {
    const filteredIncidents = filterBySearchTerm(
      incidents,
      (incident) => `${incident.title} ${incident.description} ${incident.category || ''}`
    );

    return (
      <div className="space-y-3">
        {filteredIncidents.map((incident, index) => (
          <div
            key={index}
            className="p-4 border border-gray-200 rounded-lg hover:shadow-md cursor-pointer"
            onClick={() => router.push(`/hr/incidents/${incident.id}`)}
          >
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-medium text-gray-900">{incident.title}</h4>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 text-xs rounded ${getIncidentSeverityColor(incident.severity)}`}>
                  {incident.severity}
                </span>
                <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">
                  {incident.status}
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-600 line-clamp-2 mb-3">{incident.description}</p>
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>Reported: {formatDate(incident.reportedDate)}</span>
              <span>{incident.involvedEmployees?.length || 0} involved</span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activeTab === 'recruitment') {
    const filteredCandidates = filterBySearchTerm(
      candidates,
      (candidate) => `${candidate.firstName} ${candidate.lastName} ${candidate.email} ${candidate.positionApplied} ${candidate.department}`
    );

    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Candidate</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Position</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Department</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Status</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Applied</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Source</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCandidates.map((candidate, index) => (
              <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium text-gray-900">{candidate.firstName} {candidate.lastName}</p>
                    <p className="text-sm text-gray-600">{candidate.email}</p>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">{candidate.positionApplied}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{candidate.department}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 text-xs rounded ${getCandidateStatusColor(candidate.status)}`}>
                    {candidate.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">{formatDate(candidate.appliedDate)}</td>
                <td className="px-4 py-3 text-sm text-gray-900 capitalize">{candidate.source?.replace('_', ' ') || 'N/A'}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => router.push(`/hr/recruitment/${candidate.id}`)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (activeTab === 'welfare') {
    const filteredPrograms = filterBySearchTerm(
      welfarePrograms,
      (program) => `${program.title} ${program.description} ${program.category}`
    );

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPrograms.map((program, index) => {
          const Icon = getWelfareIcon(program.category);
          return (
            <div
              key={index}
              className="p-4 border border-gray-200 rounded-lg hover:shadow-md cursor-pointer"
              onClick={() => router.push(`/hr/welfare/${program.id}`)}
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Icon className="h-5 w-5 text-gray-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{program.title}</h4>
                  <p className="text-xs text-gray-600 mt-0.5 capitalize">{program.category.replace('_', ' ')}</p>
                </div>
                {program.active && (
                  <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">Active</span>
                )}
              </div>
              <p className="text-sm text-gray-600 line-clamp-2 mb-3">{program.description}</p>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>{program.currentParticipants}/{program.maxParticipants || '∞'} participants</span>
                <span>Budget: ${program.budget.toLocaleString()}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  if (activeTab === 'policies') {
    const filteredPolicies = filterBySearchTerm(
      policies,
      (policy) => `${policy.title} ${policy.description} ${policy.category}`
    );

    return (
      <div className="space-y-3">
        {filteredPolicies.map((policy, index) => (
          <div
            key={index}
            className="p-4 border border-gray-200 rounded-lg hover:shadow-md cursor-pointer"
            onClick={() => router.push(`/hr/policies/${policy.id}`)}
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <h4 className="font-medium text-gray-900">{policy.title}</h4>
                <p className="text-xs text-gray-600 mt-0.5 capitalize">{policy.category.replace('_', ' ')}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">
                  v{policy.version}
                </span>
                {policy.active && (
                  <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">Active</span>
                )}
              </div>
            </div>
            <p className="text-sm text-gray-600 line-clamp-2 mb-3">{policy.description}</p>
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>Effective: {formatDate(policy.effectiveDate)}</span>
              <span>{policy.views} views</span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return null;
}