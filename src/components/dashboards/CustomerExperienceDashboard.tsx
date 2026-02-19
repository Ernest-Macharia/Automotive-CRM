'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Car, 
  Calendar, 
  FileText, 
  CreditCard, 
  MessageSquare,
  Phone,
  Clock,
  CheckCircle,
  AlertCircle,
  ShoppingBag,
  Settings,
  Star,
  MapPin,
  User,
  RefreshCw,
  Loader2,
  History,
  HelpCircle,
  Plus,
  Wrench,
  TrendingUp,
  DollarSign,
  Shield,
  Battery,
  Fuel,
  Gauge,
  ChevronRight,
  AlertTriangle,
  Bell,
  Package,
  Thermometer,
  Zap
} from 'lucide-react';
import { opportunityService, Opportunity } from '@/services/opportunityService';
import { workOrderService } from '@/services/workOrderService';
import { invoiceService } from '@/services/invoiceService';
import { authService } from '@/services/authService';
import { createPermissionChecker } from '@/services/settings/roleService';

interface CustomerDashboardProps {
  user: any;
}

interface CustomerVehicle {
  id: string;
  make: string;
  model: string;
  year: string;
  licensePlate?: string;
  vin?: string;
  mileage?: string;
  color?: string;
  nextServiceDue?: string;
  lastServiceDate?: string;
  warrantyExpiry?: string;
  serviceHistory: Array<{
    id: string;
    date: string;
    service: string;
    cost: number;
    rating?: number;
    technician?: string;
  }>;
}

interface CustomerAppointment {
  id: string;
  opportunityId: string;
  service: string;
  date: string;
  time: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  vehicle: string;
  vehicleId: string;
  estimatedDuration: string;
  assignedTo?: string;
}

interface CustomerInvoice {
  id: string;
  invoiceNumber: string;
  opportunityId: string;
  amount: number;
  date: string;
  dueDate?: string;
  status: 'paid' | 'pending' | 'overdue' | 'draft' | 'sent' | 'cancelled';
  description: string;
  services: string[];
  vehicle?: string;
}

interface CustomerStats {
  totalVehicles: number;
  upcomingAppointments: number;
  pendingInvoices: number;
  loyaltyPoints: number;
  membershipTier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  totalSpent: number;
  avgServiceRating: number;
  warrantyStatus: 'active' | 'expiring_soon' | 'expired';
  nextServiceDue?: string;
}

export default function CustomerDashboard({ user }: CustomerDashboardProps) {
  const [vehicles, setVehicles] = useState<CustomerVehicle[]>([]);
  const [appointments, setAppointments] = useState<CustomerAppointment[]>([]);
  const [invoices, setInvoices] = useState<CustomerInvoice[]>([]);
  const [recentServices, setRecentServices] = useState<any[]>([]);
  const [stats, setStats] = useState<CustomerStats>({
    totalVehicles: 0,
    upcomingAppointments: 0,
    pendingInvoices: 0,
    loyaltyPoints: 0,
    membershipTier: 'Bronze',
    totalSpent: 0,
    avgServiceRating: 0,
    warrantyStatus: 'active',
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [permissionChecker, setPermissionChecker] = useState<any>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  };

  const getAppointmentStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'text-green-600 bg-green-100';
      case 'scheduled': return 'text-blue-600 bg-blue-100';
      case 'completed': return 'text-emerald-600 bg-emerald-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getInvoiceStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'text-green-600 bg-green-100';
      case 'sent': return 'text-blue-600 bg-blue-100';
      case 'pending': return 'text-amber-600 bg-amber-100';
      case 'overdue': return 'text-red-600 bg-red-100';
      case 'draft': return 'text-gray-600 bg-gray-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getWarrantyStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'expiring_soon': return 'text-amber-600 bg-amber-100';
      case 'expired': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getVehicleIcon = (make: string) => {
    const makeLower = make.toLowerCase();
    if (makeLower.includes('toyota')) return <Car className="h-5 w-5 text-red-500" />;
    if (makeLower.includes('honda') || makeLower.includes('ford')) return <Car className="h-5 w-5 text-blue-500" />;
    if (makeLower.includes('bmw') || makeLower.includes('mercedes')) return <Car className="h-5 w-5 text-gray-500" />;
    if (makeLower.includes('nissan') || makeLower.includes('mitsubishi')) return <Car className="h-5 w-5 text-orange-500" />;
    return <Car className="h-5 w-5 text-gray-400" />;
  };

  const fetchCustomerData = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const customerEmail = user?.email;
      if (!customerEmail) {
        throw new Error('Customer email not found');
      }

      const customerId = user?._id || user?.id;

      // Fetch all customer opportunities
      const customerOpportunities = await opportunityService.filterOpportunities({
        customerEmail: customerEmail,
        sort: 'createdAt:desc',
        limit: 100
      });

      const opportunities = customerOpportunities.data || [];

      // Process vehicles from opportunities
      const vehicleMap = new Map<string, CustomerVehicle>();
      const serviceHistory: any[] = [];
      let totalSpent = 0;
      let totalRatings = 0;
      let ratingCount = 0;

      // Fetch work orders for this customer to get service completion data
      let customerWorkOrders: any[] = [];
      try {
        // This would need a proper API endpoint - placeholder
        const workOrdersResponse = await workOrderService.getAllWorkOrders({ 
          limit: 50 
        });
        // Filter work orders by customer (would need proper filtering)
        customerWorkOrders = workOrdersResponse.data || [];
      } catch (error) {
        console.error('Error fetching work orders:', error);
      }

      // Process each opportunity
      for (const opp of opportunities) {
        // Process vehicles
        if (opp.vehicles && opp.vehicles.length > 0) {
          opp.vehicles.forEach(vehicle => {
            const vehicleId = vehicle._id || `${vehicle.make}-${vehicle.model}-${vehicle.year}`;
            
            if (!vehicleMap.has(vehicleId)) {
              vehicleMap.set(vehicleId, {
                id: vehicleId,
                make: vehicle.make || 'Unknown',
                model: vehicle.model || 'Unknown',
                year: vehicle.year?.toString() || 'Unknown',
                licensePlate: vehicle.licensePlate,
                vin: vehicle.vin,
                mileage: vehicle.mileage,
                color: vehicle.color,
                serviceHistory: []
              });
            }
          });
        }

        // Add to service history for completed/won opportunities
        if (opp.status === 'won' && opp.servicesProducts) {
          const serviceDate = opp.updatedAt || opp.createdAt;
          
          // Find matching work order for this opportunity
          const workOrder = customerWorkOrders.find(wo => 
            (typeof wo.opportunityId === 'object' && wo.opportunityId._id === opp._id) ||
            wo.opportunityId === opp._id
          );

          const service = {
            id: opp._id,
            date: serviceDate,
            service: opp.subject || 'General Service',
            cost: opp.total || 0,
            rating: 5, // Would come from feedback system
            technician: workOrder?.assignedTo && typeof workOrder.assignedTo === 'object' 
              ? `${workOrder.assignedTo.firstName || ''} ${workOrder.assignedTo.lastName || ''}`.trim()
              : undefined
          };
          
          serviceHistory.push(service);
          totalSpent += opp.total || 0;
          
          if (service.rating) {
            totalRatings += service.rating;
            ratingCount++;
          }
        }
      }

      // Add service history to vehicles
      const processedVehicles = Array.from(vehicleMap.values()).map(vehicle => {
        const vehicleServices = serviceHistory.filter(service => {
          // Find opportunities for this vehicle - simplified logic
          const opp = opportunities.find(o => o._id === service.id);
          return opp?.vehicles?.some(v => 
            v._id === vehicle.id || 
            (v.make === vehicle.make && v.model === vehicle.model)
          );
        });
        
        return {
          ...vehicle,
          serviceHistory: vehicleServices.slice(0, 5)
        };
      });

      // Process appointments (opportunities with appointment_scheduled status)
      const appointmentOpportunities = opportunities.filter(opp => 
        opp.status === 'appointment_scheduled'
      );
      
      const processedAppointments: CustomerAppointment[] = appointmentOpportunities.map(opp => {
        const vehicle = opp.vehicles?.[0];
        const appointmentDate = opp.createdAt;
        
        return {
          id: opp._id,
          opportunityId: opp._id,
          service: opp.subject || 'Service Appointment',
          date: appointmentDate?.split('T')[0] || '',
          time: appointmentDate?.split('T')[1]?.substring(0, 5) || '09:00',
          status: 'scheduled',
          vehicle: vehicle ? `${vehicle.make} ${vehicle.model}` : 'Vehicle',
          vehicleId: vehicle?._id || '',
          estimatedDuration: '2h',
          assignedTo: opp.assignedTo && typeof opp.assignedTo === 'object' 
            ? `${opp.assignedTo.firstName || ''} ${opp.assignedTo.lastName || ''}`.trim()
            : undefined
        };
      });

      // Fetch real invoices for this customer
      let processedInvoices: CustomerInvoice[] = [];
      try {
        // This would need a proper customer invoice endpoint
        // For now, get invoices from won opportunities
        const wonOpportunities = opportunities.filter(opp => opp.status === 'won');
        
        for (const opp of wonOpportunities) {
          try {
            // Try to get invoice by opportunity ID
            const invoice = await invoiceService.getInvoicesByOpportunity(opp._id).catch(() => null);
            
            if (invoice) {
              const vehicle = opp.vehicles?.[0];
              processedInvoices.push({
                id: invoice._id || invoice.id,
                invoiceNumber: invoice.invoiceNumber || `INV-${invoice._id?.slice(-6)}`,
                opportunityId: opp._id,
                amount: invoice.total || opp.total || 0,
                date: invoice.createdAt || opp.createdAt,
                dueDate: invoice.dueDate,
                status: invoice.status || 'pending',
                description: opp.subject || 'Service Invoice',
                services: opp.servicesProducts?.map(sp => sp.title) || ['Service'],
                vehicle: vehicle ? `${vehicle.make} ${vehicle.model}` : undefined
              });
            }
          } catch (error) {
            console.error(`Error fetching invoice for opportunity ${opp._id}:`, error);
          }
        }
      } catch (error) {
        console.error('Error fetching invoices:', error);
      }

      // Process recent services (last 5)
      const processedRecentServices = serviceHistory
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5)
        .map(service => {
          const opp = opportunities.find(o => o._id === service.id);
          const vehicle = opp?.vehicles?.[0];
          return {
            ...service,
            vehicle: vehicle ? `${vehicle.make} ${vehicle.model}` : 'Vehicle'
          };
        });

      // Calculate statistics
      const pendingInvoices = processedInvoices.filter(inv => 
        inv.status === 'pending' || inv.status === 'overdue'
      ).length;
      
      const upcomingAppointments = processedAppointments.filter(app => 
        ['scheduled', 'confirmed'].includes(app.status)
      ).length;

      // Determine membership tier based on total spent
      let membershipTier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' = 'Bronze';
      if (totalSpent >= 100000) membershipTier = 'Platinum';
      else if (totalSpent >= 50000) membershipTier = 'Gold';
      else if (totalSpent >= 10000) membershipTier = 'Silver';

      // Calculate loyalty points (1 point per KES 100 spent)
      const loyaltyPoints = Math.floor(totalSpent / 100);

      // Calculate average service rating
      const avgServiceRating = ratingCount > 0 ? totalRatings / ratingCount : 0;

      // Determine warranty status based on vehicle data
      const warrantyStatus = 'active'; // Would need proper warranty tracking

      // Find next service due
      const nextServiceDue = processedVehicles[0]?.nextServiceDue;

      // Update state
      setVehicles(processedVehicles);
      setAppointments(processedAppointments);
      setInvoices(processedInvoices);
      setRecentServices(processedRecentServices);
      
      setStats({
        totalVehicles: processedVehicles.length,
        upcomingAppointments,
        pendingInvoices,
        loyaltyPoints,
        membershipTier,
        totalSpent,
        avgServiceRating,
        warrantyStatus,
        nextServiceDue
      });

    } catch (error) {
      console.error('Error fetching customer data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCustomerData();
    
    // Set up polling for real-time updates
    const intervalId = setInterval(() => {
      fetchCustomerData(true);
    }, 60000); // Refresh every minute
    
    return () => clearInterval(intervalId);
  }, [fetchCustomerData]);

  const handleRefresh = () => {
    fetchCustomerData(true);
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
              <div className="h-10 bg-gray-200 rounded w-32"></div>
            </div>

            {/* Stats grid skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-40 bg-gray-200 rounded-2xl"></div>
              ))}
            </div>

            {/* Content skeleton */}
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
              <User className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Customer Dashboard</h1>
              <p className="text-indigo-100 text-sm">
                Welcome back, <span className="font-semibold text-white">{user?.firstName || user?.email?.split('@')[0] || 'Customer'}</span>
                <span className="ml-2 px-2 py-0.5 bg-white/10 text-white text-xs rounded-full">
                  {stats.membershipTier} Member
                </span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
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
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* My Vehicles */}
          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-400 via-blue-400 to-cyan-400 rounded-2xl opacity-0 group-hover:opacity-50 blur transition duration-500"></div>
            <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl border border-white/30 p-5 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-100 to-blue-100">
                  <Car className="h-6 w-6 text-indigo-600" />
                </div>
                <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-indigo-100/80 text-indigo-600 text-xs font-medium">
                  <Car className="h-3 w-3" />
                  <span>{stats.totalVehicles}</span>
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium mb-1">My Vehicles</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalVehicles}</p>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100/50">
                <div className="text-sm text-gray-600">
                  <span>Next service: {stats.nextServiceDue ? formatDate(stats.nextServiceDue) : 'None scheduled'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Appointments */}
          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 rounded-2xl opacity-0 group-hover:opacity-50 blur transition duration-500"></div>
            <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl border border-white/30 p-5 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100">
                  <Calendar className="h-6 w-6 text-green-600" />
                </div>
                <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-100/80 text-green-600 text-xs font-medium">
                  <Clock className="h-3 w-3" />
                  <span>Upcoming</span>
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium mb-1">Appointments</p>
                <p className="text-2xl font-bold text-gray-900">{stats.upcomingAppointments}</p>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100/50">
                <div className="flex items-center text-sm">
                  <Clock className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-gray-600">
                    {appointments[0]?.time ? `Next: ${formatTime(appointments[0].time)}` : 'No appointments'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Loyalty Points */}
          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-400 rounded-2xl opacity-0 group-hover:opacity-50 blur transition duration-500"></div>
            <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl border border-white/30 p-5 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100">
                  <Star className="h-6 w-6 text-amber-600" />
                </div>
                <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-100/80 text-amber-600 text-xs font-medium">
                  <Star className="h-3 w-3" />
                  <span>{stats.membershipTier}</span>
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium mb-1">Loyalty Points</p>
                <p className="text-2xl font-bold text-gray-900">{stats.loyaltyPoints}</p>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100/50">
                <div className="text-sm text-gray-600">
                  <span>{stats.membershipTier} Tier Member</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Services */}
          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 rounded-2xl opacity-0 group-hover:opacity-50 blur transition duration-500"></div>
            <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl border border-white/30 p-5 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100">
                  <ShoppingBag className="h-6 w-6 text-blue-600" />
                </div>
                <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100/80 text-blue-600 text-xs font-medium">
                  <CheckCircle className="h-3 w-3" />
                  <span>Recent</span>
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium mb-1">Total Spent</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalSpent)}</p>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100/50">
                <div className="flex items-center text-sm">
                  <TrendingUp className="h-4 w-4 text-blue-500 mr-1" />
                  <span className="text-gray-600">{recentServices.length} services this year</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* My Vehicles */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/30 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">My Vehicles</h2>
              <button className="text-indigo-600 hover:text-indigo-700 font-medium text-sm flex items-center gap-1">
                <Plus className="h-4 w-4" />
                <span>Add Vehicle</span>
              </button>
            </div>
            <div className="space-y-4">
              {vehicles.length > 0 ? vehicles.map((vehicle) => (
                <div key={vehicle.id} className="group p-4 border border-gray-100 rounded-xl hover:bg-gray-50/50 hover:border-gray-200 transition-all duration-300">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{vehicle.make} {vehicle.model}</h3>
                      <p className="text-sm text-gray-600">
                        Year: {vehicle.year} 
                        {vehicle.mileage && ` • Mileage: ${vehicle.mileage}`}
                        {vehicle.color && ` • Color: ${vehicle.color}`}
                      </p>
                      {vehicle.licensePlate && (
                        <p className="text-xs text-gray-500 mt-1">Plate: {vehicle.licensePlate}</p>
                      )}
                    </div>
                    <div className="p-2 bg-indigo-50 rounded-lg group-hover:bg-indigo-100 transition-colors">
                      {getVehicleIcon(vehicle.make)}
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {vehicle.nextServiceDue && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-2 text-amber-500" />
                        <span>Next Service: {formatDate(vehicle.nextServiceDue)}</span>
                      </div>
                    )}
                    
                    {vehicle.warrantyExpiry && (
                      <div className="flex items-center text-sm">
                        <Shield className="h-4 w-4 mr-2 text-emerald-500" />
                        <span className="text-gray-600">Warranty: </span>
                        <span className={`ml-1 px-2 py-0.5 text-xs rounded-full ${getWarrantyStatusColor(stats.warrantyStatus)}`}>
                          {stats.warrantyStatus.replace('_', ' ')}
                        </span>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2 border-t border-gray-100">
                      <button className="flex-1 py-2 text-sm bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors">
                        Service History
                      </button>
                      <button className="flex-1 py-2 text-sm bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors">
                        Schedule Service
                      </button>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8">
                  <Car className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">No vehicles registered</p>
                  <p className="text-sm text-gray-500 mt-1">Add your first vehicle to get started</p>
                  <button className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                    Add Vehicle
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Appointments & Quick Actions */}
          <div className="space-y-6">
            {/* Upcoming Appointments */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/30 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Upcoming Appointments</h2>
                <button className="text-indigo-600 hover:text-indigo-700 font-medium text-sm">
                  View All
                </button>
              </div>
              <div className="space-y-4">
                {appointments.length > 0 ? appointments.slice(0, 3).map((appointment) => (
                  <div key={appointment.id} className="p-3 border border-gray-100 rounded-lg hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-gray-900">{appointment.service}</h4>
                        <p className="text-sm text-gray-600">
                          {formatDate(appointment.date)} at {formatTime(appointment.time)}
                        </p>
                        <p className="text-xs text-gray-500">{appointment.vehicle}</p>
                        {appointment.assignedTo && (
                          <p className="text-xs text-gray-500 mt-1">Technician: {appointment.assignedTo}</p>
                        )}
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${getAppointmentStatusColor(appointment.status)}`}>
                        {appointment.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button className="flex-1 py-2 text-sm bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors">
                        Reschedule
                      </button>
                      <button className="flex-1 py-2 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors">
                        Cancel
                      </button>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-6">
                    <Calendar className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">No upcoming appointments</p>
                  </div>
                )}
                
                <button className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:text-gray-800 hover:border-gray-400 transition-colors flex items-center justify-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Book New Appointment</span>
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/30 p-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-3">
                <button className="group flex flex-col items-center justify-center p-4 bg-indigo-50/50 border border-indigo-200/50 hover:border-indigo-300/50 hover:bg-indigo-100/50 rounded-xl transition-all duration-300">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-100 to-indigo-50 mb-2 group-hover:from-indigo-200 group-hover:to-indigo-100">
                    <Calendar className="h-6 w-6 text-indigo-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">Book Service</span>
                  <span className="text-xs text-gray-600">Schedule appointment</span>
                </button>
                
                <button className="group flex flex-col items-center justify-center p-4 bg-green-50/50 border border-green-200/50 hover:border-green-300/50 hover:bg-green-100/50 rounded-xl transition-all duration-300">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-green-100 to-green-50 mb-2 group-hover:from-green-200 group-hover:to-green-100">
                    <FileText className="h-6 w-6 text-green-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">View Invoices</span>
                  <span className="text-xs text-gray-600">Payment history</span>
                </button>
                
                <button className="group flex flex-col items-center justify-center p-4 bg-amber-50/50 border border-amber-200/50 hover:border-amber-300/50 hover:bg-amber-100/50 rounded-xl transition-all duration-300">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-amber-100 to-amber-50 mb-2 group-hover:from-amber-200 group-hover:to-amber-100">
                    <MessageSquare className="h-6 w-6 text-amber-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">Contact Support</span>
                  <span className="text-xs text-gray-600">Get help</span>
                </button>
                
                <button className="group flex flex-col items-center justify-center p-4 bg-purple-50/50 border border-purple-200/50 hover:border-purple-300/50 hover:bg-purple-100/50 rounded-xl transition-all duration-300">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-purple-100 to-purple-50 mb-2 group-hover:from-purple-200 group-hover:to-purple-100">
                    <Settings className="h-6 w-6 text-purple-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">Profile</span>
                  <span className="text-xs text-gray-600">Edit details</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Services */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/30 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recent Services</h2>
              <button className="text-indigo-600 hover:text-indigo-700 font-medium text-sm">
                View All
              </button>
            </div>
            <div className="space-y-4">
              {recentServices.length > 0 ? recentServices.slice(0, 5).map((service) => (
                <div key={service.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50/50 transition-colors">
                  <div>
                    <h4 className="font-medium text-gray-900">{service.service}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-gray-600">{formatDate(service.date)}</span>
                      <span className="text-sm font-medium text-gray-900">{formatCurrency(service.cost)}</span>
                      <span className="text-sm text-gray-600">• {service.vehicle}</span>
                    </div>
                  </div>
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`h-4 w-4 ${
                        i < (service.rating || 0) ? 'text-amber-500 fill-amber-500' : 'text-gray-300'
                      }`} />
                    ))}
                  </div>
                </div>
              )) : (
                <div className="text-center py-8">
                  <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No recent services</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Invoices */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/30 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recent Invoices</h2>
              <button className="text-indigo-600 hover:text-indigo-700 font-medium text-sm">
                View All
              </button>
            </div>
            <div className="space-y-4">
              {invoices.length > 0 ? invoices.slice(0, 5).map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50/50 transition-colors">
                  <div>
                    <h4 className="font-medium text-gray-900">Invoice #{invoice.id.slice(-6)}</h4>
                    <p className="text-sm text-gray-600">{invoice.description}</p>
                    <p className="text-xs text-gray-500">{formatDate(invoice.date)}</p>
                    {invoice.vehicle && (
                      <p className="text-xs text-gray-500 mt-1">Vehicle: {invoice.vehicle}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{formatCurrency(invoice.amount)}</p>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${getInvoiceStatusColor(invoice.status)}`}>
                      {invoice.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No invoices found</p>
                </div>
              )}
              
              {invoices.length > 0 && (
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Total Outstanding:</span>
                    <span className="font-medium text-gray-900">
                      {formatCurrency(invoices.filter(i => i.status === 'pending').reduce((sum, i) => sum + i.amount, 0))}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}