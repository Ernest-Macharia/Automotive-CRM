'use client';

import { useState, useEffect } from 'react';
import { 
  Car,
  Users,
  Calendar,
  DollarSign,
  Search,
  Bell,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  FileText,
  MessageSquare,
  Plus,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Download,
  Filter
} from 'lucide-react';
import { authService } from '@/services/authService';

export default function DashboardContent() {
  const [user, setUser] = useState(authService.getUser());
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const currentUser = authService.getUser();
    if (currentUser !== user) {
      setUser(currentUser);
    }
  }, []);

  const stats = [
    { 
      label: 'Total Vehicles', 
      value: '1,248', 
      icon: Car, 
      change: '+12%', 
      trend: 'up',
      description: 'Active in system'
    },
    { 
      label: 'Active Customers', 
      value: '845', 
      icon: Users, 
      change: '+8%', 
      trend: 'up',
      description: 'Last 30 days'
    },
    { 
      label: 'Appointments Today', 
      value: '24', 
      icon: Calendar, 
      change: '-3%', 
      trend: 'down',
      description: 'Scheduled'
    },
    { 
      label: 'Monthly Revenue', 
      value: 'Ksh 124,580', 
      icon: DollarSign, 
      change: '+23%', 
      trend: 'up',
      description: 'Current month'
    },
  ];

  const recentActivities = [
    { id: 1, activity: 'New vehicle added', time: '10 min ago', user: 'John Doe', type: 'vehicle', icon: Car },
    { id: 2, activity: 'Service appointment completed', time: '25 min ago', user: 'Jane Smith', type: 'appointment', icon: Calendar },
    { id: 3, activity: 'Customer payment received', time: '1 hour ago', user: 'Mike Johnson', type: 'payment', icon: DollarSign },
    { id: 4, activity: 'New lead registered', time: '2 hours ago', user: 'Sarah Williams', type: 'lead', icon: Users },
    { id: 5, activity: 'Monthly report generated', time: '3 hours ago', user: 'System', type: 'report', icon: FileText },
  ];

  const urgentAlerts = [
    { id: 1, message: 'Lead #2345 has not been contacted for 48 hours', priority: 'high', time: '2 hours ago' },
    { id: 2, message: 'Quote #7890 is about to expire', priority: 'medium', time: '5 hours ago' },
    { id: 3, message: 'Service appointment #5678 requires follow-up', priority: 'low', time: '1 day ago' },
  ];

  const quickStats = [
    { label: 'Pending Invoices', value: '12', icon: FileText, color: 'rgba(230, 92, 0, 0.1)', iconColor: '#E65C00' },
    { label: 'Today\'s Appointments', value: '8', icon: Calendar, color: 'rgba(196, 74, 0, 0.1)', iconColor: '#C44A00' },
    { label: 'Unread Messages', value: '5', icon: MessageSquare, color: 'rgba(255, 51, 0, 0.1)', iconColor: '#FF3300' },
  ];

  return (
    <div className="h-full">
      <div style={{
        backgroundColor: '#1A1A1A',
        borderRadius: '0.75rem',
        border: '1px solid #2A2A2A',
        padding: '1.5rem',
        marginBottom: '1.5rem'
      }}>
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl lg:text-3xl font-bold" style={{ color: '#FFFFFF' }}>Dashboard</h1>
              <span style={{
                backgroundColor: '#E65C00',
                color: 'white',
                fontSize: '0.75rem',
                fontWeight: '500',
                padding: '0.25rem 0.625rem',
                borderRadius: '9999px'
              }}>Live</span>
            </div>
            <p style={{ color: '#CCCCCC' }}>Welcome back, <span style={{ color: '#E65C00', fontWeight: '600' }}>{user?.firstName || user?.name || 'User'}</span>! Here's what's happening today.</p>
          </div>
          <div className="flex items-center gap-3 w-full lg:w-auto">
            <div className="relative flex-1 lg:flex-initial">
              <input
                type="text"
                placeholder="Search dashboard..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  backgroundColor: '#1A1A1A',
                  border: '1px solid #2A2A2A',
                  color: '#CCCCCC',
                  borderRadius: '0.5rem',
                  padding: '0.625rem 2.5rem 0.625rem 2.5rem',
                  width: '100%'
                }}
                className="focus:outline-none focus:ring-2 placeholder-gray-400"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5" style={{ color: '#666666' }} />
            </div>
            <button style={{
              backgroundColor: '#1A1A1A',
              border: '1px solid #2A2A2A',
              borderRadius: '0.5rem',
              padding: '0.625rem',
              position: 'relative',
              cursor: 'pointer'
            }} className="hover:opacity-80 transition-opacity">
              <Bell className="h-5 w-5" style={{ color: '#CCCCCC' }} />
              <span style={{
                position: 'absolute',
                top: '-0.25rem',
                right: '-0.25rem',
                width: '1.25rem',
                height: '1.25rem',
                backgroundColor: '#FF3300',
                color: 'white',
                fontSize: '0.75rem',
                borderRadius: '9999px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '600'
              }}>3</span>
            </button>
            <button style={{
              backgroundColor: '#E65C00',
              color: 'white',
              borderRadius: '0.5rem',
              padding: '0.625rem 1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: '500',
              border: 'none',
              cursor: 'pointer'
            }} className="hover:opacity-90 transition-opacity">
              <Plus className="h-5 w-5" />
              New
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {stats.map((stat, index) => (
          <div key={index} style={{
            backgroundColor: '#1A1A1A',
            borderRadius: '0.75rem',
            border: '1px solid #2A2A2A',
            padding: '1.25rem'
          }} className="hover:border-orange-500 transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div style={{
                  padding: '0.625rem',
                  borderRadius: '0.5rem',
                  backgroundColor: stat.trend === 'up' ? 'rgba(230, 92, 0, 0.1)' : 'rgba(255, 51, 0, 0.1)'
                }}>
                  <stat.icon className="h-5 w-5" style={{ color: stat.trend === 'up' ? '#E65C00' : '#FF3300' }} />
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: '#CCCCCC' }}>{stat.label}</p>
                  <p className="text-xs" style={{ color: '#666666' }}>{stat.description}</p>
                </div>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.25rem 0.5rem',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: '600',
                backgroundColor: stat.trend === 'up' ? 'rgba(230, 92, 0, 0.2)' : 'rgba(255, 51, 0, 0.2)',
                color: stat.trend === 'up' ? '#E65C00' : '#FF3300'
              }}>
                {stat.trend === 'up' ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
                  <ArrowDownRight className="h-3 w-3" />
                )}
                {stat.change}
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold" style={{ color: '#FFFFFF' }}>{stat.value}</p>
            </div>
            <div className="mt-4 pt-4" style={{ borderTop: '1px solid #2A2A2A' }}>
              <button className="text-sm font-medium flex items-center gap-1" style={{ color: '#E65C00' }}>
                View details
                <ChevronDown className="h-4 w-4 rotate-90" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2" style={{
          backgroundColor: '#1A1A1A',
          borderRadius: '0.75rem',
          border: '1px solid #2A2A2A',
          padding: '1.5rem'
        }}>
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
            <div>
              <h2 className="text-xl font-bold mb-1" style={{ color: '#FFFFFF' }}>Recent Activity</h2>
              <p className="text-sm" style={{ color: '#666666' }}>Latest updates from your team</p>
            </div>
            <div className="flex items-center gap-3">
              <button style={{
                backgroundColor: '#1A1A1A',
                color: '#CCCCCC',
                border: '1px solid #2A2A2A',
                borderRadius: '0.5rem',
                padding: '0.5rem 1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontWeight: '500',
                cursor: 'pointer'
              }} className="hover:opacity-80 transition-opacity">
                <Filter className="h-4 w-4" />
                Filter
              </button>
              <button className="text-sm font-semibold flex items-center gap-1" style={{ color: '#E65C00' }}>
                View All
                <ChevronDown className="h-4 w-4 rotate-90" />
              </button>
            </div>
          </div>
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4" style={{
                backgroundColor: '#0B0B0B',
                borderRadius: '0.75rem',
                border: '1px solid #2A2A2A'
              }}>
                <div className="flex items-center gap-4 mb-3 sm:mb-0">
                  <div style={{
                    padding: '0.625rem',
                    borderRadius: '0.5rem',
                    backgroundColor: '#1A1A1A',
                    border: '1px solid #2A2A2A'
                  }}>
                    <activity.icon className="h-5 w-5" style={{ color: '#E65C00' }} />
                  </div>
                  <div>
                    <p className="font-semibold" style={{ color: '#FFFFFF' }}>{activity.activity}</p>
                    <p className="text-sm" style={{ color: '#666666' }}>by <span style={{ color: '#CCCCCC' }}>{activity.user}</span></p>
                  </div>
                </div>
                <div className="flex items-center gap-4 justify-between sm:justify-end">
                  <span className="text-sm" style={{ color: '#666666' }}>{activity.time}</span>
                  <button className="hover:text-orange-500 transition-colors" style={{ color: '#666666' }}>
                    <Eye className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div style={{
            backgroundColor: '#1A1A1A',
            borderRadius: '0.75rem',
            border: '1px solid #2A2A2A',
            padding: '1.5rem'
          }}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" style={{ color: '#FF3300' }} />
                <h2 className="text-xl font-bold" style={{ color: '#FFFFFF' }}>Urgent Alerts</h2>
              </div>
              <span style={{
                backgroundColor: '#E65C00',
                color: 'white',
                fontSize: '0.75rem',
                fontWeight: '500',
                padding: '0.25rem 0.5rem',
                borderRadius: '9999px'
              }}>3 New</span>
            </div>
            <div className="space-y-4">
              {urgentAlerts.map((alert) => (
                <div key={alert.id} style={{
                  padding: '1rem',
                  borderRadius: '0.75rem',
                  backgroundColor: alert.priority === 'high' ? 'rgba(255, 51, 0, 0.1)' : 
                                  alert.priority === 'medium' ? 'rgba(230, 92, 0, 0.1)' : 
                                  'rgba(196, 74, 0, 0.1)',
                  border: `1px solid ${alert.priority === 'high' ? 'rgba(255, 51, 0, 0.2)' : 
                                  alert.priority === 'medium' ? 'rgba(230, 92, 0, 0.2)' : 
                                  'rgba(196, 74, 0, 0.2)'}`,
                  color: alert.priority === 'high' ? '#FF3300' : 
                         alert.priority === 'medium' ? '#E65C00' : 
                         '#C44A00'
                }}>
                  <div className="flex items-start gap-3">
                    <div style={{
                      width: '0.5rem',
                      height: '0.5rem',
                      marginTop: '0.5rem',
                      borderRadius: '9999px',
                      backgroundColor: alert.priority === 'high' ? '#FF3300' : 
                                      alert.priority === 'medium' ? '#E65C00' : 
                                      '#C44A00'
                    }}></div>
                    <div className="flex-1">
                      <p className="text-sm">{alert.message}</p>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs" style={{ color: '#666666' }}>{alert.time}</span>
                        <button className="text-xs font-semibold" style={{ color: '#E65C00' }}>
                          Take action →
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{
            backgroundColor: '#1A1A1A',
            borderRadius: '0.75rem',
            border: '1px solid #2A2A2A',
            padding: '1.5rem'
          }}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold" style={{ color: '#FFFFFF' }}>Quick Stats</h2>
              <button className="text-sm font-medium flex items-center gap-1" style={{ color: '#E65C00' }}>
                <Download className="h-4 w-4" />
                Export
              </button>
            </div>
            <div className="space-y-4">
              {quickStats.map((stat, index) => (
                <div key={index} className="p-4" style={{
                  backgroundColor: '#0B0B0B',
                  borderRadius: '0.75rem',
                  borderLeft: '4px solid #E65C00'
                }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm" style={{ color: '#CCCCCC' }}>{stat.label}</p>
                      <p className="text-2xl font-bold mt-1" style={{ color: '#FFFFFF' }}>{stat.value}</p>
                    </div>
                    <div style={{
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      backgroundColor: stat.color
                    }}>
                      <stat.icon className="h-6 w-6" style={{ color: stat.iconColor }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}