'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Wrench, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Truck,
  Calendar,
  FileText,
  Users,
  Sparkles,
  RefreshCw,
  Loader2,
  Package,
  AlertTriangle,
  Activity,
  TrendingUp,
  FolderPen,
  Car,
  Settings,
  Battery,
  Fuel,
  Gauge,
  Filter as FilterIcon,
  RotateCw,
  Zap,
  CalendarDays,
  ClipboardCheck,
  AlertOctagon,
  CheckSquare,
  Circle,
  Star,
  Target,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Shield,
  CalendarClock,
  User,
  Phone,
  Mail,
  MapPin,
  Navigation,
  Thermometer,
  Power
} from 'lucide-react';
import { authService } from '@/services/authService';
import { opportunityService } from '@/services/opportunityService';
import { workOrderService, WorkOrder } from '@/services/workOrderService';
import { jobCardService, JobCard } from '@/services/jobCardService';
import { vehicleService, Vehicle } from '@/services/vehicleService';

interface TechnicianDashboardProps {
  user: any;
}

interface Job {
  id: string;
  jobCardId?: string;
  workOrderId?: string;
  opportunityId: string;
  subject: string;
  customer: {
    name: string;
    phone?: string;
    email?: string;
  };
  vehicles: Array<{
    make: string;
    model: string;
    year?: string;
    licensePlate?: string;
    mileage?: string;
    color?: string;
    vin?: string;
  }>;
  services: Array<{
    title: string;
    type: 'SERVICE' | 'REPAIR' | 'MAINTENANCE' | 'INSPECTION';
    status: 'pending' | 'in_progress' | 'completed' | 'waiting_parts';
    estimatedTime: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
  }>;
  status: 'scheduled' | 'in_progress' | 'completed' | 'waiting_parts' | 'cancelled';
  scheduledDate?: string;
  scheduledTime?: string;
  assignedTo?: string;
  notes?: string;
  partsRequired: Array<{
    name: string;
    status: 'available' | 'ordered' | 'out_of_stock';
    estimatedArrival?: string;
  }>;
  estimatedDuration: string;
  actualDuration?: string;
  createdAt: string;
  updatedAt: string;
}

interface TechnicianStats {
  assignedJobs: number;
  completedToday: number;
  pendingParts: number;
  avgCompletionTime: string;
  efficiencyRate: number;
  qualityScore: number;
  urgentJobs: number;
  nextAppointment: string;
  waitingForInspection: number;
  awaitingCustomerApproval: number;
  monthlyCompletions: number;
  onTimeCompletionRate: number;
  customerSatisfaction: number;
  totalVehiclesServiced: number;
  inProgressJobs: number;
  totalHoursWorked: number;
}

interface VehicleStatus {
  id: string;
  make: string;
  model: string;
  registrationNumber?: string;
  status: 'in_shop' | 'ready' | 'waiting_parts' | 'diagnostics';
  since: string;
  technician: string;
  workOrderId?: string;
  jobCardId?: string;
}

export default function TechnicianDashboard({ user }: TechnicianDashboardProps) {
  const [stats, setStats] = useState<TechnicianStats>({
    assignedJobs: 0,
    completedToday: 0,
    pendingParts: 0,
    avgCompletionTime: '0h',
    efficiencyRate: 85,
    qualityScore: 92,
    urgentJobs: 0,
    nextAppointment: 'No upcoming jobs',
    waitingForInspection: 0,
    awaitingCustomerApproval: 0,
    monthlyCompletions: 0,
    onTimeCompletionRate: 88,
    customerSatisfaction: 94,
    totalVehiclesServiced: 0,
    inProgressJobs: 0,
    totalHoursWorked: 0,
  });

  const [jobs, setJobs] = useState<Job[]>([]);
  const [activeJobs, setActiveJobs] = useState<Job[]>([]);
  const [todaysSchedule, setTodaysSchedule] = useState<Job[]>([]);
  const [vehiclesInShop, setVehiclesInShop] = useState<VehicleStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today');
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [jobCards, setJobCards] = useState<JobCard[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  const userId = user?.id || user?._id || user?.userId;

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  };

  const getJobStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress': return 'text-blue-600 bg-blue-100';
      case 'scheduled': return 'text-amber-600 bg-amber-100';
      case 'completed': return 'text-emerald-600 bg-emerald-100';
      case 'waiting_parts': return 'text-red-600 bg-red-100';
      case 'cancelled': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-amber-600 bg-amber-100';
      case 'low': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getServiceIcon = (type: string) => {
    switch (type) {
      case 'MAINTENANCE': return <Fuel className="h-4 w-4" />;
      case 'REPAIR': return <Wrench className="h-4 w-4" />;
      case 'INSPECTION': return <ClipboardCheck className="h-4 w-4" />;
      case 'DIAGNOSTICS': return <Gauge className="h-4 w-4" />;
      default: return <FolderPen className="h-4 w-4" />;
    }
  };

  const getServiceColor = (type: string) => {
    switch (type) {
      case 'MAINTENANCE': return 'text-blue-600 bg-blue-100';
      case 'REPAIR': return 'text-red-600 bg-red-100';
      case 'INSPECTION': return 'text-emerald-600 bg-emerald-100';
      case 'DIAGNOSTICS': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getVehicleIcon = (make: string) => {
    const makeLower = make.toLowerCase();
    if (makeLower.includes('toyota')) return <Car className="h-4 w-4 text-red-500" />;
    if (makeLower.includes('honda') || makeLower.includes('ford')) return <Car className="h-4 w-4 text-blue-500" />;
    if (makeLower.includes('bmw') || makeLower.includes('mercedes')) return <Car className="h-4 w-4 text-gray-500" />;
    if (makeLower.includes('nissan') || makeLower.includes('mitsubishi')) return <Car className="h-4 w-4 text-orange-500" />;
    return <Car className="h-4 w-4 text-gray-400" />;
  };

  const calculateAverageCompletionTime = (jobCards: JobCard[]): string => {
    const completedJobs = jobCards.filter(jc => jc.status === 'completed' && jc.actualHours);
    if (completedJobs.length === 0) return '0h';
    
    const totalHours = completedJobs.reduce((sum, jc) => sum + (jc.actualHours || 0), 0);
    const avgHours = totalHours / completedJobs.length;
    
    if (avgHours < 1) {
      return `${Math.round(avgHours * 60)}m`;
    }
    return `${avgHours.toFixed(1)}h`;
  };

  const calculateOnTimeRate = (jobCards: JobCard[]): number => {
    const completedJobs = jobCards.filter(jc => jc.status === 'completed');
    if (completedJobs.length === 0) return 88; // Default fallback
    
    const onTime = completedJobs.filter(jc => {
      if (!jc.actualHours || !jc.estimatedHours) return true;
      return jc.actualHours <= jc.estimatedHours * 1.2; // Within 20% over estimate
    }).length;
    
    return Math.round((onTime / completedJobs.length) * 100);
  };

  const getNextAppointment = (jobs: Job[]): string => {
    const now = new Date();
    const upcoming = jobs
      .filter(j => j.status === 'scheduled' && new Date(j.scheduledDate || '') >= now)
      .sort((a, b) => new Date(a.scheduledDate || '').getTime() - new Date(b.scheduledDate || '').getTime());
    
    if (upcoming.length === 0) return 'No upcoming jobs';
    
    const next = upcoming[0];
    const date = new Date(next.scheduledDate || '');
    const today = new Date();
    
    if (date.toDateString() === today.toDateString()) {
      return `Today at ${formatTime(next.scheduledTime || '09:00')} - ${next.customer.name}`;
    }
    
    return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at ${formatTime(next.scheduledTime || '09:00')} - ${next.customer.name}`;
  };

  const fetchTechnicianData = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      // Fetch all necessary data in parallel
      const [workOrdersResponse, jobCardsResponse, vehiclesResponse, opportunitiesResponse] = await Promise.allSettled([
        workOrderService.getAllWorkOrders({ limit: 100 }),
        jobCardService.getAllJobCards({ limit: 100 }),
        vehicleService.getAllVehicles({ limit: 100 }),
        opportunityService.filterOpportunities({
          opportunityType: 'SERVICE',
          limit: 100,
          sort: 'createdAt:desc'
        })
      ]);

      let fetchedWorkOrders: WorkOrder[] = [];
      let fetchedJobCards: JobCard[] = [];
      let fetchedVehicles: Vehicle[] = [];
      let fetchedOpportunities: any[] = [];

      // Process work orders
      if (workOrdersResponse.status === 'fulfilled' && workOrdersResponse.value) {
        if (Array.isArray(workOrdersResponse.value)) {
          fetchedWorkOrders = workOrdersResponse.value;
        } else if (workOrdersResponse.value.data) {
          fetchedWorkOrders = workOrdersResponse.value.data;
        }
      }
      setWorkOrders(fetchedWorkOrders);

      // Process job cards
      if (jobCardsResponse.status === 'fulfilled' && jobCardsResponse.value) {
        if (Array.isArray(jobCardsResponse.value)) {
          fetchedJobCards = jobCardsResponse.value;
        }
      }
      setJobCards(fetchedJobCards);

      // Process vehicles
      if (vehiclesResponse.status === 'fulfilled' && vehiclesResponse.value) {
        if (Array.isArray(vehiclesResponse.value)) {
          fetchedVehicles = vehiclesResponse.value;
        }
      }
      setVehicles(fetchedVehicles);

      // Process opportunities
      if (opportunitiesResponse.status === 'fulfilled' && opportunitiesResponse.value) {
        fetchedOpportunities = opportunitiesResponse.value.data || [];
      }

      // Filter job cards assigned to current user
      const userJobCards = fetchedJobCards.filter(jc => {
        if (typeof jc.assignedTo === 'string') {
          return jc.assignedTo === userId;
        }
        return jc.assignedTo?._id === userId || jc.assignedTo?.id === userId;
      });

      // Get work orders that have job cards assigned to user
      const relevantWorkOrderIds = new Set(
        userJobCards
          .map(jc => typeof jc.opportunityId === 'string' ? jc.opportunityId : jc.opportunityId?._id)
          .filter(id => id)
      );

      const userWorkOrders = fetchedWorkOrders.filter(wo => {
        const oppId = typeof wo.opportunityId === 'string' ? wo.opportunityId : wo.opportunityId?._id;
        return oppId && relevantWorkOrderIds.has(oppId);
      });

      // Convert to Job format for UI
      const today = new Date().toISOString().split('T')[0];
      const allJobs: Job[] = [];

      // Create jobs from job cards
      userJobCards.forEach(jc => {
        // Find associated work order
        const workOrder = userWorkOrders.find(wo => {
          const oppId = typeof wo.opportunityId === 'string' ? wo.opportunityId : wo.opportunityId?._id;
          const jcOppId = typeof jc.opportunityId === 'string' ? jc.opportunityId : jc.opportunityId?._id;
          return oppId === jcOppId;
        });

        // Find associated opportunity
        const opportunity = fetchedOpportunities.find(opp => {
          const oppId = typeof jc.opportunityId === 'string' ? jc.opportunityId : jc.opportunityId?._id;
          return opp._id === oppId;
        });

        // Find vehicle
        const vehicle = fetchedVehicles.find(v => {
          if (typeof jc.vehicleId === 'string') {
            return v._id === jc.vehicleId || v.id === jc.vehicleId;
          }
          return v._id === jc.vehicleId?._id || v.id === jc.vehicleId?.id;
        });

        // Map job card status to UI status
        let jobStatus: Job['status'] = 'scheduled';
        if (jc.status === 'in_progress') jobStatus = 'in_progress';
        else if (jc.status === 'completed') jobStatus = 'completed';
        else if (jc.status === 'cancelled') jobStatus = 'cancelled';
        else if (workOrder?.delayInfo) jobStatus = 'waiting_parts';

        const job: Job = {
          id: jc.jobNumber || `JOB-${jc.id.slice(-6)}`,
          jobCardId: jc.id,
          workOrderId: workOrder?._id,
          opportunityId: typeof jc.opportunityId === 'string' ? jc.opportunityId : jc.opportunityId?._id || '',
          subject: jc.jobTitle,
          customer: {
            name: opportunity?.customer?.name || 'Unknown Customer',
            phone: opportunity?.customer?.phone,
            email: opportunity?.customer?.email
          },
          vehicles: vehicle ? [{
            make: vehicle.make || 'Unknown',
            model: vehicle.model || 'Vehicle',
            year: vehicle.year?.toString(),
            licensePlate: vehicle.registrationNumber,
            mileage: vehicle.mileage?.toString(),
            color: vehicle.color,
            vin: vehicle.vin
          }] : [{
            make: 'Unknown',
            model: 'Vehicle',
            licensePlate: 'N/A'
          }],
          services: [{
            title: jc.jobTitle,
            type: 'REPAIR',
            status: jc.status === 'in_progress' ? 'in_progress' : 
                    jc.status === 'completed' ? 'completed' : 'pending',
            estimatedTime: jc.estimatedHours ? `${jc.estimatedHours}h` : '2h',
            priority: jc.priority || 'medium'
          }],
          status: jobStatus,
          scheduledDate: jc.startDate?.split('T')[0] || today,
          scheduledTime: jc.startDate ? new Date(jc.startDate).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) : '09:00',
          assignedTo: typeof jc.assignedTo === 'string' ? 'Technician' : jc.assignedTo?.name || 'You',
          notes: jc.jobDescription,
          partsRequired: (jc.partsUsed || []).map(p => ({
            name: typeof p === 'string' ? p : p.partId || 'Part',
            status: 'available'
          })),
          estimatedDuration: jc.estimatedHours ? `${jc.estimatedHours}h` : '2h',
          actualDuration: jc.actualHours ? `${jc.actualHours}h` : undefined,
          createdAt: jc.createdAt || new Date().toISOString(),
          updatedAt: jc.updatedAt || new Date().toISOString()
        };

        allJobs.push(job);
      });

      setJobs(allJobs);

      // Calculate statistics
      const completedToday = allJobs.filter(j => 
        j.status === 'completed' && j.updatedAt.includes(today)
      ).length;

      const inProgressJobs = allJobs.filter(j => j.status === 'in_progress').length;

      const pendingParts = allJobs.reduce((count, job) => 
        count + (job.partsRequired.filter(p => p.status !== 'available').length), 0
      );

      const urgentJobs = allJobs.filter(j => 
        j.services.some(s => s.priority === 'urgent')
      ).length;

      const monthlyCompletions = allJobs.filter(j => {
        const jobDate = new Date(j.updatedAt);
        const now = new Date();
        return j.status === 'completed' && 
               jobDate.getMonth() === now.getMonth() &&
               jobDate.getFullYear() === now.getFullYear();
      }).length;

      const totalHoursWorked = userJobCards
        .filter(jc => jc.actualHours)
        .reduce((sum, jc) => sum + (jc.actualHours || 0), 0);

      // Set active jobs (in progress)
      setActiveJobs(allJobs.filter(j => j.status === 'in_progress'));

      // Set today's schedule
      setTodaysSchedule(allJobs.filter(j => 
        j.scheduledDate === today && j.status !== 'completed'
      ));

      // Generate vehicles in shop status from in-progress jobs
        const vehiclesStatus: VehicleStatus[] = allJobs
          .filter(j => j.status === 'in_progress' && j.vehicles.length > 0)
          .map(job => {
            // Determine the status with proper typing
            let vehicleStatus: 'in_shop' | 'ready' | 'waiting_parts' | 'diagnostics' = 'in_shop';
            
            if (job.partsRequired.some(p => p.status !== 'available')) {
              vehicleStatus = 'waiting_parts';
            } else if (job.status === 'completed') {
              vehicleStatus = 'ready';
            } else {
              vehicleStatus = 'in_shop';
            }
            
            return {
              id: job.vehicles[0].vin || `vehicle-${Math.random()}`,
              make: job.vehicles[0].make,
              model: job.vehicles[0].model,
              registrationNumber: job.vehicles[0].licensePlate,
              status: vehicleStatus, // Now properly typed
              since: formatTimeAgo(job.createdAt),
              technician: job.assignedTo || 'You',
              workOrderId: job.workOrderId,
              jobCardId: job.jobCardId
            };
          })
          .slice(0, 5);

      setVehiclesInShop(vehiclesStatus);

      // Update stats
      setStats(prev => ({
        ...prev,
        assignedJobs: allJobs.length,
        completedToday,
        pendingParts,
        urgentJobs,
        monthlyCompletions,
        inProgressJobs,
        totalHoursWorked,
        avgCompletionTime: calculateAverageCompletionTime(userJobCards),
        onTimeCompletionRate: calculateOnTimeRate(userJobCards),
        nextAppointment: getNextAppointment(allJobs),
        totalVehiclesServiced: vehiclesStatus.length + prev.totalVehiclesServiced,
        waitingForInspection: allJobs.filter(j => j.status === 'completed' && !j.actualDuration).length,
        awaitingCustomerApproval: allJobs.filter(j => j.notes?.toLowerCase().includes('awaiting approval')).length
      }));

    } catch (error) {
      console.error('Error fetching technician data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchTechnicianData();
    }
  }, [fetchTechnicianData, userId]);

  const handleRefresh = () => {
    fetchTechnicianData(true);
  };

  const getTrendColor = (value: number) => {
    if (value > 0) return 'text-emerald-600 bg-emerald-50';
    if (value < 0) return 'text-red-600 bg-red-50';
    return 'text-gray-600 bg-gray-50';
  };

  const getTrendIcon = (value: number) => {
    if (value > 0) return <ArrowUpRight className="h-3 w-3" />;
    if (value < 0) return <ArrowDownRight className="h-3 w-3" />;
    return null;
  };

  const getVehicleStatusColor = (status: string) => {
    switch (status) {
      case 'in_shop': return 'text-blue-600 bg-blue-100';
      case 'ready': return 'text-emerald-600 bg-emerald-100';
      case 'waiting_parts': return 'text-red-600 bg-red-100';
      case 'diagnostics': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getVehicleStatusIcon = (status: string) => {
    switch (status) {
      case 'in_shop': return <Wrench className="h-3 w-3" />;
      case 'ready': return <CheckCircle className="h-3 w-3" />;
      case 'waiting_parts': return <Package className="h-3 w-3" />;
      case 'diagnostics': return <Gauge className="h-3 w-3" />;
      default: return <Circle className="h-3 w-3" />;
    }
  };

  if (loading) {
    return (
      <div className="h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 overflow-hidden">
        <div className="h-16 bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg" />
        <div className="h-[calc(100vh-64px)] p-4 md:p-6 space-y-6 overflow-auto">
          <div className="animate-pulse space-y-6">
            {/* Header skeleton */}
            <div className="flex items-center justify-between">
              <div className="space-y-3">
                <div className="h-8 bg-gray-200 rounded w-64"></div>
                <div className="h-4 bg-gray-200 rounded w-48"></div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 bg-gray-200 rounded w-24"></div>
                <div className="h-10 bg-gray-200 rounded w-32"></div>
              </div>
            </div>

            {/* Stats grid skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-40 bg-gray-200 rounded-2xl"></div>
              ))}
            </div>

            {/* Job cards skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-96 bg-gray-200 rounded-2xl"></div>
              <div className="space-y-4">
                <div className="h-48 bg-gray-200 rounded-2xl"></div>
                <div className="h-48 bg-gray-200 rounded-2xl"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 overflow-hidden">
      {/* Gradient Header */}
      <div className="h-16 bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg flex items-center px-6">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Wrench className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Technician Dashboard</h1>
              <p className="text-blue-100 text-sm">
                Welcome back, <span className="font-semibold text-white">{user?.firstName || 'Technician'}</span>
                <span className="ml-2 px-2 py-0.5 bg-white/10 text-white text-xs rounded-full">
                  {user?.role?.name || 'Technician'}
                </span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Time range selector */}
            <div className="hidden md:flex items-center gap-1 bg-white/10 backdrop-blur-sm rounded-xl p-1">
              {['today', 'week', 'month'].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range as any)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    timeRange === range
                      ? 'bg-white/20 text-white'
                      : 'text-blue-100 hover:bg-white/10'
                  }`}
                >
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </button>
              ))}
            </div>
            
            <button 
              onClick={handleRefresh}
              disabled={refreshing}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                refreshing
                  ? 'bg-white/20 text-white/60 cursor-not-allowed'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              {refreshing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="hidden sm:inline">Refreshing...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  <span className="hidden sm:inline">Refresh</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="h-[calc(100vh-64px)] p-4 md:p-6 space-y-6 overflow-auto">
        {/* Job Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Assigned Jobs */}
          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 rounded-2xl opacity-0 group-hover:opacity-50 blur transition duration-500"></div>
            <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl border border-white/30 p-5 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100">
                  <Wrench className="h-6 w-6 text-blue-600" />
                </div>
                <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100/80 text-blue-600 text-xs font-medium">
                  <Activity className="h-3 w-3" />
                  <span>{stats.assignedJobs} total</span>
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium mb-1">Assigned Jobs</p>
                <p className="text-2xl font-bold text-gray-900">{stats.assignedJobs}</p>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100/50">
                <div className="text-sm text-gray-600">
                  <span>{stats.inProgressJobs} in progress • {stats.urgentJobs} urgent</span>
                </div>
              </div>
            </div>
          </div>

          {/* In Progress */}
          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-400 via-orange-400 to-red-400 rounded-2xl opacity-0 group-hover:opacity-50 blur transition duration-500"></div>
            <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl border border-white/30 p-5 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100">
                  <Activity className="h-6 w-6 text-amber-600" />
                </div>
                <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-100/80 text-amber-600 text-xs font-medium">
                  <Clock className="h-3 w-3" />
                  <span>Active</span>
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium mb-1">In Progress</p>
                <p className="text-2xl font-bold text-gray-900">{stats.inProgressJobs}</p>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100/50">
                <div className="flex items-center text-sm">
                  <Clock className="h-4 w-4 text-amber-500 mr-1" />
                  <span className="text-gray-600">{stats.totalHoursWorked.toFixed(1)} hours worked</span>
                </div>
              </div>
            </div>
          </div>

          {/* Completed Today */}
          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400 rounded-2xl opacity-0 group-hover:opacity-50 blur transition duration-500"></div>
            <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl border border-white/30 p-5 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-100 to-green-100">
                  <CheckCircle className="h-6 w-6 text-emerald-600" />
                </div>
                <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-100/80 text-green-600 text-xs font-medium">
                  <TrendingUp className="h-3 w-3" />
                  <span>Today</span>
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium mb-1">Completed Today</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completedToday}</p>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100/50">
                <div className="flex items-center text-sm">
                  <span className="text-gray-600">{stats.monthlyCompletions} this month</span>
                </div>
              </div>
            </div>
          </div>

          {/* Pending Parts */}
          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-red-400 via-rose-400 to-pink-400 rounded-2xl opacity-0 group-hover:opacity-50 blur transition duration-500"></div>
            <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl border border-white/30 p-5 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-red-100 to-rose-100">
                  <Package className="h-6 w-6 text-red-600" />
                </div>
                <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-100/80 text-red-600 text-xs font-medium">
                  <AlertCircle className="h-3 w-3" />
                  <span>Pending</span>
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium mb-1">Parts on Order</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingParts}</p>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100/50">
                <div className="text-sm text-gray-600">
                  <span>{stats.awaitingCustomerApproval} awaiting approval</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Current Jobs & Quick Tools */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Jobs */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/30 p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Jobs</h2>
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {activeJobs.length > 0 ? activeJobs.map((job, index) => (
                <div key={index} className="flex items-start justify-between p-3 hover:bg-gray-50 rounded-lg border border-gray-100 transition-all duration-300">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900">{job.id}</h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${getJobStatusColor(job.status)}`}>
                          {job.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(
                        job.services.some(s => s.priority === 'urgent') ? 'urgent' : 
                        job.services.some(s => s.priority === 'high') ? 'high' : 'medium'
                      )}`}>
                        {job.services.some(s => s.priority === 'urgent') ? 'URGENT' : 
                         job.services.some(s => s.priority === 'high') ? 'HIGH' : 'MEDIUM'}
                      </span>
                    </div>
                    
                    <div className="mb-3">
                      <p className="font-medium text-gray-900">{job.subject}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <User className="h-3 w-3 text-gray-500" />
                        <span className="text-sm text-gray-600">{job.customer.name}</span>
                        {job.customer.phone && (
                          <>
                            <Phone className="h-3 w-3 text-gray-500" />
                            <span className="text-sm text-gray-600">{job.customer.phone}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Vehicle Info */}
                    <div className="flex items-center gap-2 mb-3">
                      {job.vehicles.map((vehicle, vIndex) => (
                        <div key={vIndex} className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-lg">
                          {getVehicleIcon(vehicle.make)}
                          <span className="text-sm font-medium text-gray-700">
                            {vehicle.make} {vehicle.model}
                          </span>
                          {vehicle.licensePlate && (
                            <span className="text-xs text-gray-500">({vehicle.licensePlate})</span>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Services */}
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-gray-700">Services:</p>
                      <div className="flex flex-wrap gap-1">
                        {job.services.map((service, sIndex) => (
                          <span key={sIndex} className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${getServiceColor(service.type)}`}>
                            {getServiceIcon(service.type)}
                            {service.title}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Parts Status */}
                    {job.partsRequired.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-700">Parts Status:</span>
                          <span className={`text-xs ${
                            job.partsRequired.some(p => p.status === 'out_of_stock') ? 'text-red-600' :
                            job.partsRequired.some(p => p.status === 'ordered') ? 'text-amber-600' : 'text-emerald-600'
                          }`}>
                            {job.partsRequired.filter(p => p.status === 'available').length}/{job.partsRequired.length} available
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )) : (
                <div className="text-center py-8">
                  <Wrench className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">No active jobs</p>
                  <p className="text-sm text-gray-500 mt-1">Assignments will appear here</p>
                </div>
              )}
            </div>
          </div>

          {/* Performance & Tools */}
          <div className="space-y-6">
            {/* Performance Metrics */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/30 p-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Performance</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gradient-to-br from-gray-50 to-white rounded-lg border border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-600">Efficiency Rate</p>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getTrendColor(5)}`}>
                      {getTrendIcon(5)}
                      <span>+5%</span>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{stats.efficiencyRate}%</p>
                  <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-500"
                      style={{ width: `${stats.efficiencyRate}%` }}
                    />
                  </div>
                </div>
                
                <div className="p-4 bg-gradient-to-br from-gray-50 to-white rounded-lg border border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-600">Quality Score</p>
                    <div className="flex items-center gap-1 text-emerald-600">
                      <Star className="h-3 w-3" />
                      <span className="text-xs">Excellent</span>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{stats.qualityScore}%</p>
                  <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"
                      style={{ width: `${stats.qualityScore}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Additional Metrics */}
              <div className="grid grid-cols-3 gap-3 mt-4">
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">{stats.monthlyCompletions}</p>
                  <p className="text-xs text-gray-600">Monthly Jobs</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">{stats.totalVehiclesServiced}</p>
                  <p className="text-xs text-gray-600">Vehicles Total</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">{stats.customerSatisfaction}%</p>
                  <p className="text-xs text-gray-600">Satisfaction</p>
                </div>
              </div>
            </div>

            {/* Quick Tools */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/30 p-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Tools</h2>
              <div className="grid grid-cols-2 gap-3">
                <button className="group flex flex-col items-center justify-center p-4 bg-blue-50/50 border border-blue-200/50 hover:border-blue-300/50 hover:bg-blue-100/50 rounded-xl transition-all duration-300">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-blue-100 to-blue-50 mb-2 group-hover:from-blue-200 group-hover:to-blue-100">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">Job Cards</span>
                  <span className="text-xs text-gray-600">View all jobs</span>
                </button>
                
                <button className="group flex flex-col items-center justify-center p-4 bg-emerald-50/50 border border-emerald-200/50 hover:border-emerald-300/50 hover:bg-emerald-100/50 rounded-xl transition-all duration-300">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-100 to-emerald-50 mb-2 group-hover:from-emerald-200 group-hover:to-emerald-100">
                    <Truck className="h-6 w-6 text-emerald-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">Vehicle Info</span>
                  <span className="text-xs text-gray-600">Check specs</span>
                </button>
                
                <button className="group flex flex-col items-center justify-center p-4 bg-purple-50/50 border border-purple-200/50 hover:border-purple-300/50 hover:bg-purple-100/50 rounded-xl transition-all duration-300">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-purple-100 to-purple-50 mb-2 group-hover:from-purple-200 group-hover:to-purple-100">
                    <Calendar className="h-6 w-6 text-purple-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">Schedule</span>
                  <span className="text-xs text-gray-600">View calendar</span>
                </button>
                
                <button className="group flex flex-col items-center justify-center p-4 bg-amber-50/50 border border-amber-200/50 hover:border-amber-300/50 hover:bg-amber-100/50 rounded-xl transition-all duration-300">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-amber-100 to-amber-50 mb-2 group-hover:from-amber-200 group-hover:to-amber-100">
                    <Users className="h-6 w-6 text-amber-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">Team</span>
                  <span className="text-xs text-gray-600">Contact team</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming & Efficiency */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Schedule & Vehicles in Shop */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/30 p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Schedule & Vehicles</h2>
            <div className="space-y-6">
              {/* Upcoming Jobs */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-700">Today's Schedule</h3>
                  <span className="text-xs text-gray-500">{todaysSchedule.length} jobs</span>
                </div>
                <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2">
                  {todaysSchedule.length > 0 ? todaysSchedule.map((job, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg">
                          <Clock className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{formatTime(job.scheduledTime || '09:00')}</h3>
                          <p className="text-sm text-gray-600">{job.subject}</p>
                          <p className="text-xs text-gray-500">{job.customer.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{job.estimatedDuration}</p>
                        <div className="flex items-center gap-1 mt-1">
                          {job.vehicles.map((vehicle, vIndex) => (
                            <span key={vIndex} className="text-xs text-gray-500">
                              {vehicle.make} {vehicle.model}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-4">
                      <p className="text-gray-500 text-sm">No scheduled jobs for today</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Vehicles in Shop */}
              <div className="pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-700">Vehicles in Shop</h3>
                  <span className="text-xs text-gray-500">{vehiclesInShop.length} vehicles</span>
                </div>
                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                  {vehiclesInShop.map((vehicle, index) => (
                    <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-50/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded ${getVehicleStatusColor(vehicle.status)}`}>
                          {getVehicleStatusIcon(vehicle.status)}
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-900">{vehicle.make} {vehicle.model}</span>
                          {vehicle.registrationNumber && (
                            <p className="text-xs text-gray-500">{vehicle.registrationNumber}</p>
                          )}
                          <p className="text-xs text-gray-500">Since: {vehicle.since}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 text-xs rounded-full ${getVehicleStatusColor(vehicle.status)}`}>
                          {vehicle.status.replace('_', ' ').toUpperCase()}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">{vehicle.technician}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Efficiency Metrics */}
          <div className="bg-gradient-to-r from-orange-50/80 to-red-50/80 backdrop-blur-sm rounded-2xl border border-orange-100/50 p-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Efficiency Metrics</h2>
                <p className="text-gray-700">Your performance analytics</p>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-orange-600" />
                <span className="text-sm font-medium text-orange-700">Real-time</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/30">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-lg bg-green-100/50">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Productivity</span>
                </div>
                <p className="text-sm text-gray-700">
                  {stats.efficiencyRate}% efficiency rate
                </p>
                <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-500"
                    style={{ width: `${stats.efficiencyRate}%` }}
                  />
                </div>
              </div>
              
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/30">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-lg bg-blue-100/50">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Quality</span>
                </div>
                <p className="text-sm text-gray-700">
                  {stats.qualityScore}% satisfaction rate
                </p>
                <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"
                    style={{ width: `${stats.qualityScore}%` }}
                  />
                </div>
              </div>
              
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/30">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-lg bg-amber-100/50">
                    <Clock className="h-4 w-4 text-amber-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Time</span>
                </div>
                <p className="text-sm text-gray-700">
                  {stats.avgCompletionTime} avg. per job
                </p>
                <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
                    style={{ width: `${stats.onTimeCompletionRate}%` }}
                  />
                </div>
              </div>
              
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/30">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-lg bg-purple-100/50">
                    <Package className="h-4 w-4 text-purple-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Parts</span>
                </div>
                <p className="text-sm text-gray-700">
                  {stats.pendingParts} parts pending
                </p>
                <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
                    style={{ width: `${Math.min(stats.pendingParts * 20, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="mt-6 pt-4 border-t border-orange-100/50">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">{stats.completedToday}</p>
                  <p className="text-xs text-gray-600">Today</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">{stats.monthlyCompletions}</p>
                  <p className="text-xs text-gray-600">This Month</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">{stats.totalVehiclesServiced}</p>
                  <p className="text-xs text-gray-600">Total</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Next Appointment & Quick Actions */}
        <div className="bg-gradient-to-r from-blue-50/80 to-cyan-50/80 backdrop-blur-sm rounded-2xl border border-blue-100/50 p-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Next Appointment</h2>
              <p className="text-gray-700">{stats.nextAppointment}</p>
            </div>
            <div className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">Ready</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/30">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-red-100/50">
                  <AlertOctagon className="h-4 w-4 text-red-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">Urgent Jobs</span>
              </div>
              <p className="text-sm text-gray-700">
                {stats.urgentJobs} job{stats.urgentJobs !== 1 ? 's' : ''} require immediate attention
              </p>
              <button className="mt-2 w-full py-1.5 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100">
                View Urgent
              </button>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/30">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-amber-100/50">
                  <Package className="h-4 w-4 text-amber-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">Parts Status</span>
              </div>
              <p className="text-sm text-gray-700">
                {stats.pendingParts} part{stats.pendingParts !== 1 ? 's' : ''} awaiting delivery
              </p>
              <button className="mt-2 w-full py-1.5 text-sm bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100">
                Check Parts
              </button>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/30">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-green-100/50">
                  <ClipboardCheck className="h-4 w-4 text-green-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">Ready for Inspection</span>
              </div>
              <p className="text-sm text-gray-700">
                {stats.waitingForInspection} job{stats.waitingForInspection !== 1 ? 's' : ''} await final inspection
              </p>
              <button className="mt-2 w-full py-1.5 text-sm bg-green-50 text-green-600 rounded-lg hover:bg-green-100">
                Inspect Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
