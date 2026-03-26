'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  Calendar,
  FileText,
  AlertCircle,
  TrendingUp,
  Clock,
  Shield,
  Heart,
  Briefcase,
  Building,
  CheckCircle,
  XCircle,
  Eye,
  Filter,
  Search,
  RefreshCw,
  ChevronRight,
  Plus,
  Download,
  Bell,
  BarChart3,
  UserCheck,
  UserX,
  Award,
  Target,
  AlertTriangle,
  ClipboardCheck,
  FileCheck,
  BookOpen,
  Stethoscope,
  GraduationCap,
  DollarSign,
  Coffee,
  Brain,
  Dumbbell,
  UsersRound,
  HeartHandshake,
  Home,
  UserPlus,
} from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { hrService, HrDashboard, HrAlert, EmployeeContract, IncidentReport, PerformancePlan, RecruitmentCandidate, WelfareProgram, CompanyPolicy, LeaveBalance } from '@/services/settings/hrService';
import HRStatsCards from './HrStatsCards';
import HRQuickActions from './HrQuickActions';
import HRAlertsPanel from './HrAlertsPanel';
import HRTabNavigation from './HrTabNavigation';
import HRTabContent from './HrTabContent';

interface DashboardStat {
  label: string;
  value: number;
  icon: any;
  color: string;
  trend?: string;
  link?: string;
}

interface QuickAction {
  label: string;
  icon: any;
  color: string;
  link: string;
  description: string;
}

export default function HRDashboardPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<HrDashboard | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'leaves' | 'contracts' | 'performance' | 'incidents' | 'recruitment' | 'welfare' | 'policies' | 'assets' | 'attendance'>('overview');
  const [showAlertModal, setShowAlertModal] = useState<HrAlert | null>(null);
  const [alerts, setAlerts] = useState<HrAlert[]>([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  
  const [contracts, setContracts] = useState<EmployeeContract[]>([]);
  const [incidents, setIncidents] = useState<IncidentReport[]>([]);
  const [performancePlans, setPerformancePlans] = useState<PerformancePlan[]>([]);
  const [candidates, setCandidates] = useState<RecruitmentCandidate[]>([]);
  const [welfarePrograms, setWelfarePrograms] = useState<WelfareProgram[]>([]);
  const [policies, setPolicies] = useState<CompanyPolicy[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    if (activeTab === 'leaves') {
      loadLeaveBalances();
    } else if (activeTab === 'contracts') {
      loadContracts();
    } else if (activeTab === 'incidents') {
      loadIncidents();
    } else if (activeTab === 'performance') {
      loadPerformancePlans();
    } else if (activeTab === 'recruitment') {
      loadRecruitmentCandidates();
    } else if (activeTab === 'welfare') {
      loadWelfarePrograms();
    } else if (activeTab === 'policies') {
      loadPolicies();
    }
  }, [activeTab, statusFilter, departmentFilter]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const [data, alertData] = await Promise.all([
        hrService.getDashboard(),
        hrService.getHrAlerts().catch(() => []),
      ]);
      setDashboardData(data);
      setAlerts(alertData.length > 0 ? alertData : data.alerts || []);
    } catch (error) {
      console.error('Error loading HR dashboard:', error);
      showToast('Failed to load HR dashboard', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadLeaveBalances = async () => {
    try {
      const data = await hrService.getLeaveBalances(departmentFilter !== 'all' ? departmentFilter : undefined);
      setLeaveBalances(data);
    } catch (error) {
      console.error('Error loading leave balances:', error);
      showToast('Failed to load leave balances', 'error');
    }
  };

  const loadContracts = async () => {
    try {
      const data = await hrService.getAllContracts(statusFilter !== 'all' ? statusFilter : undefined);
      setContracts(data);
    } catch (error) {
      console.error('Error loading contracts:', error);
      showToast('Failed to load contracts', 'error');
    }
  };

  const loadIncidents = async () => {
    try {
      const data = await hrService.getIncidentReports(
        undefined,
        statusFilter !== 'all' ? statusFilter as any : undefined
      );
      setIncidents(data);
    } catch (error) {
      console.error('Error loading incidents:', error);
      showToast('Failed to load incident reports', 'error');
    }
  };

  const loadPerformancePlans = async () => {
    try {
      const data = await hrService.getPerformancePlans(statusFilter !== 'all' ? statusFilter : undefined);
      setPerformancePlans(data);
    } catch (error) {
      console.error('Error loading performance plans:', error);
      showToast('Failed to load performance plans', 'error');
    }
  };

  const loadRecruitmentCandidates = async () => {
    try {
      const data = await hrService.getRecruitmentPipeline();
      setCandidates(data.candidates);
    } catch (error) {
      console.error('Error loading recruitment candidates:', error);
      showToast('Failed to load recruitment candidates', 'error');
    }
  };

  const loadWelfarePrograms = async () => {
    try {
      const data = await hrService.getWelfarePrograms();
      setWelfarePrograms(data);
    } catch (error) {
      console.error('Error loading welfare programs:', error);
      showToast('Failed to load welfare programs', 'error');
    }
  };

  const loadPolicies = async () => {
    try {
      const data = await hrService.getPolicies();
      setPolicies(data);
    } catch (error) {
      console.error('Error loading policies:', error);
      showToast('Failed to load policies', 'error');
    }
  };

  const handleAlertAction = (alert: HrAlert) => {
    setShowAlertModal(alert);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDaysUntil = (dateString?: string) => {
    if (!dateString) return null;
    
    const today = new Date();
    const targetDate = new Date(dateString);
    const diffTime = targetDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getContractStatus = (contract: EmployeeContract) => {
    return hrService.getContractStatus(contract);
  };

  const getContractStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'expiring_soon': return 'bg-yellow-100 text-yellow-800';
      case 'expired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getIncidentSeverityColor = (severity: string) => {
    return hrService.getSeverityColor(severity);
  };

  const getCandidateStatusColor = (status: string) => {
    return hrService.getCandidateStatusColor(status);
  };

  const getAlertPriorityColor = (priority: string) => {
    return hrService.getAlertPriorityColor(priority);
  };

  const getWelfareIcon = (category: string) => {
    switch (category) {
      case 'health': return Stethoscope;
      case 'financial': return DollarSign;
      case 'education': return GraduationCap;
      case 'recreational': return Coffee;
      case 'wellness': return Brain;
      case 'fitness': return Dumbbell;
      case 'family': return Home;
      case 'support': return HeartHandshake;
      case 'mental_health': return Brain;
      default: return Heart;
    }
  };

  const stats: DashboardStat[] = dashboardData ? [
    {
      label: 'Total Employees',
      value: dashboardData.statistics.totalEmployees,
      icon: Users,
      color: 'text-blue-600 bg-blue-100',
      link: '/hr-portal'
    },
    {
      label: 'Active Performance Plans',
      value: dashboardData.statistics.activePerformancePlans,
      icon: Target,
      color: 'text-purple-600 bg-purple-100',
      link: '/hr-portal/performance'
    },
    {
      label: 'Open Incidents',
      value: dashboardData.statistics.openIncidents,
      icon: AlertTriangle,
      color: 'text-red-600 bg-red-100',
      link: '/hr-portal/incidents/create'
    },
    {
      label: 'Active Policies',
      value: dashboardData.statistics.activePolicies,
      icon: FileCheck,
      color: 'text-green-600 bg-green-100',
      link: '/hr-portal/policies/create'
    },
    {
      label: 'Welfare Programs',
      value: dashboardData.statistics.activeWelfarePrograms,
      icon: Heart,
      color: 'text-pink-600 bg-pink-100',
      link: '/hr-portal/welfare/create'
    },
    {
      label: 'Active Candidates',
      value: dashboardData.statistics.activeCandidates,
      icon: UserCheck,
      color: 'text-orange-600 bg-orange-100',
      link: '/hr-portal/recruitment/create'
    },
    {
      label: 'Expiring Contracts',
      value: dashboardData.statistics.expiringContracts,
      icon: Clock,
      color: 'text-yellow-600 bg-yellow-100',
      link: '/hr-portal'
    },
    {
      label: 'Low Leave Balance',
      value: dashboardData.statistics.lowLeaveBalance,
      icon: Calendar,
      color: 'text-cyan-600 bg-cyan-100',
      link: '/hr-portal/leaves/create'
    }
  ] : [];

  const quickActions: QuickAction[] = [
    {
      label: 'Add New Employee',
      icon: UserPlus,
      color: 'bg-blue-500',
      link: '/settings/profiles/create',
      description: 'Create new employee profile'
    },
    {
      label: 'Create Performance Plan',
      icon: Target,
      color: 'bg-purple-500',
      link: '/hr-portal/performance/create',
      description: 'Set up performance improvement plan'
    },
    {
      label: 'Report Incident',
      icon: AlertTriangle,
      color: 'bg-red-500',
      link: '/hr-portal/incidents/create',
      description: 'Report workplace incident'
    },
    {
      label: 'Add Policy',
      icon: FileText,
      color: 'bg-green-500',
      link: '/hr-portal/policies/create',
      description: 'Create company policy'
    },
    {
      label: 'Plan Welfare Program',
      icon: Heart,
      color: 'bg-pink-500',
      link: '/hr-portal/welfare/create',
      description: 'Organize welfare activity'
    },
    {
      label: 'Add Candidate',
      icon: UserCheck,
      color: 'bg-orange-500',
      link: '/hr-portal/recruitment/create',
      description: 'Add recruitment candidate'
    },
    {
      label: 'Employee Leaves',
      icon: UserCheck,
      color: 'bg-orange-500',
      link: '/hr-portal/employeeleaves/create',
      description: 'Add Leaves for Employees'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading HR Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header Section */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">HR Management Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">Manage employees, performance, incidents, and welfare programs</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={loadDashboard}
              className="flex items-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={() => router.push('/reports')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              <BarChart3 className="h-5 w-5" />
              <span className="hidden sm:inline">Reports</span>
            </button>
          </div>
        </div>

        <HRStatsCards stats={stats} router={router} />
      </div>

      <div className="flex flex-col xl:flex-row gap-6">

        {/* Main Content */}
        <div className="flex-1">
          <HRTabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
          
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            {/* Toolbar */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder={`Search ${activeTab}...`}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  
                  {activeTab !== 'overview' && (
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-gray-400" />
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                      >
                        <option value="all">All Status</option>
                        {activeTab === 'contracts' && (
                          <>
                            <option value="active">Active</option>
                            <option value="expiring_soon">Expiring Soon</option>
                            <option value="expired">Expired</option>
                          </>
                        )}
                        {activeTab === 'incidents' && (
                          <>
                            <option value="open">Open</option>
                            <option value="investigating">Investigating</option>
                            <option value="resolved">Resolved</option>
                            <option value="closed">Closed</option>
                          </>
                        )}
                        {activeTab === 'performance' && (
                          <>
                            <option value="draft">Draft</option>
                            <option value="active">Active</option>
                            <option value="completed">Completed</option>
                            <option value="terminated">Terminated</option>
                          </>
                        )}
                        {activeTab === 'recruitment' && (
                          <>
                            <option value="screening">Screening</option>
                            <option value="interviewing">Interviewing</option>
                            <option value="offered">Offered</option>
                            <option value="accepted">Accepted</option>
                            <option value="rejected">Rejected</option>
                          </>
                        )}
                      </select>
                      
                      {(activeTab === 'leaves' || activeTab === 'contracts') && (
                        <select
                          value={departmentFilter}
                          onChange={(e) => setDepartmentFilter(e.target.value)}
                          className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                        >
                          <option value="all">All Departments</option>
                          <option value="Engineering">Engineering</option>
                          <option value="Sales">Sales</option>
                          <option value="Marketing">Marketing</option>
                          <option value="Finance">Finance</option>
                          <option value="HR">HR</option>
                        </select>
                      )}
                    </div>
                  )}
                </div>
                
                <button
                  onClick={() => {
                    if (activeTab === 'overview') router.push('/reports');
                    else if (activeTab === 'assets' || activeTab === 'attendance') return;
                    else router.push(`/hr-portal/${activeTab}/create`);
                  }}
                  disabled={activeTab === 'assets' || activeTab === 'attendance'}
                  className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
                >
                  <Plus className="h-4 w-4" />
                  {activeTab === 'overview'
                    ? 'Generate Report'
                    : activeTab === 'assets'
                      ? 'Use Assets Tab Actions'
                      : activeTab === 'attendance'
                        ? 'Attendance Sync'
                        : `Add ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`}
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="p-5">
              <HRTabContent
                activeTab={activeTab}
                dashboardData={dashboardData}
                contracts={contracts}
                incidents={incidents}
                performancePlans={performancePlans}
                candidates={candidates}
                welfarePrograms={welfarePrograms}
                policies={policies}
                leaveBalances={leaveBalances}
                searchTerm={searchTerm}
                router={router}
                formatDate={formatDate}
                getContractStatus={getContractStatus}
                getContractStatusColor={getContractStatusColor}
                getIncidentSeverityColor={getIncidentSeverityColor}
                getCandidateStatusColor={getCandidateStatusColor}
                getWelfareIcon={getWelfareIcon}
                getDaysUntil={getDaysUntil}
              />
            </div>
          </div>
        </div>

        <div className="xl:w-80">
          <HRAlertsPanel
            alerts={alerts}
            onAlertClick={handleAlertAction}
            getAlertPriorityColor={getAlertPriorityColor}
          />
        </div>
      </div>

      {/* Alert Modal */}
      {showAlertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-start gap-3 mb-4">
              <div className={`p-2 rounded-lg ${
                showAlertModal.type === 'danger' ? 'bg-red-100' :
                showAlertModal.type === 'warning' ? 'bg-yellow-100' : 'bg-blue-100'
              }`}>
                <AlertCircle className={`h-5 w-5 ${
                  showAlertModal.type === 'danger' ? 'text-red-600' :
                  showAlertModal.type === 'warning' ? 'text-yellow-600' : 'text-blue-600'
                }`} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">HR Alert</h3>
                <p className="text-xs text-gray-500 mt-1">Priority: {showAlertModal.priority}</p>
              </div>
            </div>
            
            <p className="text-gray-700 text-sm mb-5">{showAlertModal.message}</p>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowAlertModal(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors"
              >
                Dismiss
              </button>
              <button
                onClick={() => {
                  setShowAlertModal(null);
                  showToast('Alert action handled', 'success');
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
              >
                {showAlertModal.action || 'Take Action'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
