// components/dashboards/PartnerDashboard.tsx - WITH GRADIENT
'use client';

import { useState, useEffect } from 'react';
import { 
  Handshake, 
  TrendingUp, 
  Users, 
  FileText, 
  DollarSign,
  BarChart3,
  Calendar,
  MessageSquare,
  Truck,
  Shield,
  Target,
  Clock,
  CheckCircle,
  Sparkles,
  RefreshCw,
  Loader2,
  Package,
  Megaphone,
  Car
} from 'lucide-react';
import { authService } from '@/services/authService';

interface PartnerDashboardProps {
  user: any;
}

export default function PartnerDashboard({ user }: PartnerDashboardProps) {
  const [partnerData, setPartnerData] = useState({
    totalClients: 0,
    activeContracts: 0,
    monthlyRevenue: 0,
    conversionRate: 0,
    pendingRequests: 0,
    performanceScore: 0,
    inventoryValue: 0,
    leadResponseTime: '2.4h',
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchPartnerData();
  }, []);

  const fetchPartnerData = async (isRefresh = false) => {
    try {
      if (!isRefresh) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      // Simulate API call
      setTimeout(() => {
        setPartnerData({
          totalClients: 48,
          activeContracts: 12,
          monthlyRevenue: 85000,
          conversionRate: 32,
          pendingRequests: 7,
          performanceScore: 88,
          inventoryValue: 125000,
          leadResponseTime: '2.4h',
        });
        setLoading(false);
        setRefreshing(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching partner data:', error);
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getPartnerType = () => {
    const types: Record<string, string> = {
      dealer: 'Dealer',
      partner: 'Business Partner',
      insurer: 'Insurance Provider',
    };
    return types[user.role] || 'Partner';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 overflow-hidden">
        <div className="h-16 bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg" />
        <div className="h-[calc(100vh-64px)] p-4 md:p-6 space-y-6 overflow-auto">
          {/* Loading skeleton */}
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
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
              <Handshake className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{getPartnerType()} Dashboard</h1>
              <p className="text-orange-100 text-sm">
                Welcome back, <span className="font-semibold text-white">{user?.firstName || getPartnerType()}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => fetchPartnerData(true)}
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
        {/* Partner Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-orange-100 p-5 hover:shadow-lg transition-all hover:scale-[1.02]">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-orange-100/50 backdrop-blur-sm">
                <Users className="h-6 w-6 text-orange-600" />
              </div>
              <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-orange-100/80 text-orange-600 text-xs font-medium">
                <TrendingUp className="h-3 w-3" />
                <span>+12</span>
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium mb-1">Total Clients</p>
              <p className="text-2xl font-bold text-gray-900">{partnerData.totalClients}</p>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100/50">
              <div className="flex items-center text-sm">
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-gray-600">+12 this quarter</span>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-green-100 p-5 hover:shadow-lg transition-all hover:scale-[1.02]">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-green-100/50 backdrop-blur-sm">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-100/80 text-green-600 text-xs font-medium">
                <TrendingUp className="h-3 w-3" />
                <span>+18%</span>
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium mb-1">Monthly Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(partnerData.monthlyRevenue)}</p>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100/50">
              <div className="flex items-center text-sm">
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-gray-600">+18% from last month</span>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-blue-100 p-5 hover:shadow-lg transition-all hover:scale-[1.02]">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-blue-100/50 backdrop-blur-sm">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100/80 text-blue-600 text-xs font-medium">
                <CheckCircle className="h-3 w-3" />
                <span>Active</span>
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium mb-1">Active Contracts</p>
              <p className="text-2xl font-bold text-gray-900">{partnerData.activeContracts}</p>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100/50">
              <div className="text-sm text-gray-600">
                <span>3 expiring soon</span>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-purple-100 p-5 hover:shadow-lg transition-all hover:scale-[1.02]">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-purple-100/50 backdrop-blur-sm">
                <Target className="h-6 w-6 text-purple-600" />
              </div>
              <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-purple-100/80 text-purple-600 text-xs font-medium">
                <TrendingUp className="h-3 w-3" />
                <span>Score</span>
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium mb-1">Performance</p>
              <p className="text-2xl font-bold text-gray-900">{partnerData.performanceScore}/100</p>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100/50">
              <div className="flex items-center text-sm">
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-gray-600">Excellent rating</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Contracts */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/30 p-5">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Active Contracts</h2>
              <span className="px-3 py-1 bg-orange-100 text-orange-600 text-sm rounded-full">
                {partnerData.pendingRequests} pending
              </span>
            </div>
            
            <div className="space-y-4">
              {[
                { id: 'CTR-001', client: 'Premium Motors', value: '$25,000', status: 'Active', expires: '2024-06-15', type: 'Vehicle Supply' },
                { id: 'CTR-002', client: 'City Auto Group', value: '$18,500', status: 'Active', expires: '2024-05-20', type: 'Parts Supply' },
                { id: 'CTR-003', client: 'Metro Dealers', value: '$12,000', status: 'Pending Review', expires: '2024-04-10', type: 'Service Agreement' },
                { id: 'CTR-004', client: 'Global Cars', value: '$8,500', status: 'Active', expires: '2024-07-01', type: 'Maintenance' },
              ].map((contract, index) => (
                <div key={index} className="p-4 border border-gray-100 rounded-xl hover:bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-gray-900">{contract.id}</h3>
                      <p className="text-sm text-gray-600">{contract.client}</p>
                      <p className="text-xs text-gray-500">{contract.type}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      contract.status === 'Active' ? 'bg-green-100 text-green-600' :
                      contract.status === 'Pending Review' ? 'bg-amber-100 text-amber-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {contract.status}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <span className="text-gray-600">Value: </span>
                      <span className="font-medium text-gray-900">{contract.value}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Calendar className="h-3 w-3 mr-1" />
                      <span>Expires: {contract.expires}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Partner Performance */}
          <div className="space-y-6">
            {/* Performance Overview */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/30 p-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance Overview</h2>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Conversion Rate</span>
                    <span className="font-medium text-gray-900">{partnerData.conversionRate}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: `${partnerData.conversionRate}%` }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Client Satisfaction</span>
                    <span className="font-medium text-gray-900">92%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '92%' }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Response Time</span>
                    <span className="font-medium text-gray-900">{partnerData.leadResponseTime}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Inventory Value */}
            <div className="bg-gradient-to-r from-orange-50/80 to-red-50/80 backdrop-blur-sm rounded-2xl border border-orange-100/50 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">Inventory Value</h3>
                  <p className="text-sm text-gray-700">Current stock valuation</p>
                </div>
                <Package className="h-5 w-5 text-orange-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(partnerData.inventoryValue)}</p>
              <p className="text-sm text-gray-600 mt-1">42 vehicles • 156 parts in stock</p>
            </div>
          </div>
        </div>

        {/* Top Clients & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Clients */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/30 p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Clients</h2>
            <div className="space-y-4">
              {[
                { id: 1, name: 'Premium Motors', value: '$25,000', status: 'Active', type: 'Dealer' },
                { id: 2, name: 'City Auto Group', value: '$18,500', status: 'Active', type: 'Dealer' },
                { id: 3, name: 'Metro Dealers', value: '$12,000', status: 'Pending', type: 'Service Center' },
                { id: 4, name: 'Global Cars', value: '$8,500', status: 'Active', type: 'Rental Company' },
              ].map((client) => (
                <div key={client.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                      <span className="font-medium text-gray-700">
                        {client.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{client.name}</h4>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          client.status === 'Active' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'
                        }`}>
                          {client.status}
                        </span>
                        <span className="text-xs text-gray-500">{client.type}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{client.value}</p>
                    <p className="text-sm text-gray-600">Total value</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Partner Tools */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/30 p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Partner Tools</h2>
            <div className="grid grid-cols-2 gap-3">
              <button className="flex flex-col items-center justify-center p-4 bg-orange-50 hover:bg-orange-100 rounded-xl transition-colors">
                <FileText className="h-8 w-8 text-orange-600 mb-2" />
                <span className="text-sm font-medium text-gray-900">Contracts</span>
                <span className="text-xs text-gray-600">Manage agreements</span>
              </button>
              
              <button className="flex flex-col items-center justify-center p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors">
                <MessageSquare className="h-8 w-8 text-blue-600 mb-2" />
                <span className="text-sm font-medium text-gray-900">Messages</span>
                <span className="text-xs text-gray-600">Contact team</span>
              </button>
              
              <button className="flex flex-col items-center justify-center p-4 bg-green-50 hover:bg-green-100 rounded-xl transition-colors">
                <BarChart3 className="h-8 w-8 text-green-600 mb-2" />
                <span className="text-sm font-medium text-gray-900">Reports</span>
                <span className="text-xs text-gray-600">View analytics</span>
              </button>
              
              <button className="flex flex-col items-center justify-center p-4 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors">
                <Truck className="h-8 w-8 text-purple-600 mb-2" />
                <span className="text-sm font-medium text-gray-900">Inventory</span>
                <span className="text-xs text-gray-600">View stock</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}