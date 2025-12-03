'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { authService } from '@/services/authService';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Car,
  Calendar,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Bell,
  Plus,
  Filter,
  Download,
  AlertCircle,
  CheckCircle,
  Clock,
  Target,
  BarChart3,
  PieChart,
} from 'lucide-react';

function DashboardContent() {
  const [user, setUser] = useState(authService.getUser());
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const currentUser = authService.getUser();
    if (currentUser !== user) {
      setUser(currentUser);
    }
  }, []);

  const kpiCards = [
    {
      title: 'Total Vehicles',
      value: '1,248',
      change: '+12%',
      trend: 'up',
      icon: Car,
      color: 'from-blue-400 to-blue-500',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Active Customers',
      value: '845',
      change: '+8%',
      trend: 'up',
      icon: Users,
      color: 'from-purple-400 to-purple-500',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Today\'s Appointments',
      value: '24',
      change: '-3%',
      trend: 'down',
      icon: Calendar,
      color: 'from-amber-400 to-amber-500',
      bgColor: 'bg-amber-50',
    },
    {
      title: 'Monthly Revenue',
      value: 'Ksh 124,580',
      change: '+23%',
      trend: 'up',
      icon: DollarSign,
      color: 'from-green-400 to-green-500',
      bgColor: 'bg-green-50',
    },
  ];

  const recentActivity = [
    {
      id: 1,
      title: 'New vehicle added',
      description: 'Toyota Mark X · KCD 890J',
      time: '10 min ago',
      icon: Car,
      color: 'text-blue-500 bg-blue-100',
    },
    {
      id: 2,
      title: 'Service appointment completed',
      description: 'Jane Smith · Subaru Forester',
      time: '25 min ago',
      icon: CheckCircle,
      color: 'text-green-500 bg-green-100',
    },
    {
      id: 3,
      title: 'Customer payment received',
      description: 'Mike Johnson · Invoice #3421',
      time: '1 hour ago',
      icon: DollarSign,
      color: 'text-emerald-500 bg-emerald-100',
    },
    {
      id: 4,
      title: 'New lead created',
      description: 'Sarah Omondi · Honda Fit',
      time: '2 hours ago',
      icon: Users,
      color: 'text-purple-500 bg-purple-100',
    },
  ];

  const urgentAlerts = [
    {
      id: 1,
      title: 'Lead #2345 has not been contacted for 48 hours',
      time: '2 hours ago',
      priority: 'high',
    },
    {
      id: 2,
      title: 'Quote #7890 is about to expire',
      time: '5 hours ago',
      priority: 'medium',
    },
    {
      id: 3,
      title: 'Service appointment #5678 requires follow-up',
      time: '1 day ago',
      priority: 'low',
    },
  ];

  const pipelineData = [
    { stage: 'New', leads: 3, amount: 'Ksh 100,000', color: 'bg-blue-100', progress: 'w-3/4' },
    { stage: 'Contacted', leads: 1, amount: 'Ksh 35,000', color: 'bg-purple-100', progress: 'w-2/4' },
    { stage: 'Qualified', leads: 1, amount: 'Ksh 30,000', color: 'bg-amber-100', progress: 'w-1/4' },
    { stage: 'Quotation', leads: 1, amount: 'Ksh 650,000', color: 'bg-orange-100', progress: 'w-1/2' },
    { stage: 'Won', leads: 1, amount: 'Ksh 1,200,000', color: 'bg-green-100', progress: 'w-full' },
  ];

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1">
              Welcome back, <span className="font-semibold text-blue-600">{user?.firstName || 'Admin'}</span>! Here's what's happening today.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search dashboard..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 w-full md:w-64"
              />
            </div>
            <button className="relative p-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors">
              <Bell className="h-5 w-5 text-gray-600" />
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white font-medium">
                3
              </span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 text-sm font-medium shadow-sm transition-all">
              <Plus className="h-4 w-4" />
              New Task
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card, index) => {
          const Icon = card.icon;
          const isUp = card.trend === 'up';
          
          return (
            <div
              key={index}
              className={`${card.bgColor} rounded-2xl border border-gray-200 p-5 hover:shadow-md transition-shadow`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-2.5 rounded-xl bg-gradient-to-r ${card.color} bg-opacity-10`}>
                  <Icon className="h-5 w-5 text-gray-700" />
                </div>
                <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-white text-xs font-medium text-gray-600">
                  {isUp ? (
                    <>
                      <ArrowUpRight className="h-3 w-3 text-green-500" />
                      <span className="text-green-600">{card.change}</span>
                    </>
                  ) : (
                    <>
                      <ArrowDownRight className="h-3 w-3 text-red-500" />
                      <span className="text-red-600">{card.change}</span>
                    </>
                  )}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium mb-1">{card.title}</p>
                <p className="text-2xl font-bold text-gray-800">{card.value}</p>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200/50">
                <button className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
                  View details
                  <ArrowUpRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Revenue & Deals</h2>
              <p className="text-sm text-gray-500">Performance for the current month</p>
            </div>
            <div className="flex items-center gap-2 mt-3 sm:mt-0">
              <button className="px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 text-sm font-medium">
                Revenue
              </button>
              <button className="px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 text-sm font-medium hover:bg-gray-200">
                Vehicles
              </button>
              <button className="px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 text-sm font-medium hover:bg-gray-200">
                Appointments
              </button>
            </div>
          </div>
          <div className="h-64 rounded-xl bg-gradient-to-b from-gray-50 to-gray-100/50 flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Chart component goes here</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Lead Pipeline</h2>
              <p className="text-sm text-gray-500">Current opportunities by stage</p>
            </div>
            <Target className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {pipelineData.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{item.stage}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">{item.leads} leads</span>
                    <span className="text-sm font-medium text-gray-700">{item.amount}</span>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div className={`h-full rounded-full ${item.color} ${item.progress}`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Recent Activity</h2>
              <p className="text-sm text-gray-500">Latest updates from your team</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-600 text-sm font-medium hover:bg-gray-100">
                <Filter className="h-4 w-4" />
                Filter
              </button>
              <button className="text-sm font-medium text-blue-600 hover:text-blue-700">
                View all
              </button>
            </div>
          </div>
          <div className="space-y-4">
            {recentActivity.map((activity) => {
              const Icon = activity.icon;
              return (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <div className={`p-2 rounded-lg ${activity.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <h4 className="font-medium text-gray-800">{activity.title}</h4>
                      <span className="text-xs text-gray-500">{activity.time}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{activity.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              <h2 className="text-lg font-semibold text-gray-800">Urgent Alerts</h2>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-orange-50 text-orange-600 text-xs font-medium">
              {urgentAlerts.length} New
            </span>
          </div>
          <div className="space-y-4">
            {urgentAlerts.map((alert) => (
              <div
                key={alert.id}
                className="p-4 rounded-xl border border-orange-100 bg-orange-50/50"
              >
                <p className="text-sm font-medium text-gray-800 mb-2">{alert.title}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{alert.time}</span>
                  <button className="text-xs font-medium text-orange-600 hover:text-orange-700">
                    Take action →
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-800">Quick Stats</h3>
              <button className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700">
                <Download className="h-4 w-4" />
                Export
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
                <p className="text-xs text-gray-500 mb-1">Pending Invoices</p>
                <p className="text-xl font-bold text-gray-800">12</p>
              </div>
              <div className="p-3 rounded-xl bg-green-50 border border-green-100">
                <p className="text-xs text-gray-500 mb-1">Today's Appointments</p>
                <p className="text-xl font-bold text-gray-800">8</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}