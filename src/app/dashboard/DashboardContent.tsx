'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Car, 
  Users, 
  Calendar, 
  DollarSign, 
  Settings, 
  LogOut,
  Menu,
  X,
  Search,
  Bell,
  ChevronDown
} from 'lucide-react';
import { authService } from '@/services/authService';

export default function DashboardContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(authService.getUser());
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await authService.logout();
      router.push('/auth/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const stats = [
    { label: 'Total Vehicles', value: '1,248', icon: Car, change: '+12%', color: 'bg-blue-500' },
    { label: 'Active Customers', value: '845', icon: Users, change: '+8%', color: 'bg-green-500' },
    { label: 'Appointments Today', value: '24', icon: Calendar, change: '-3%', color: 'bg-purple-500' },
    { label: 'Monthly Revenue', value: '$124,580', icon: DollarSign, change: '+23%', color: 'bg-amber-500' },
  ];

  const recentActivities = [
    { id: 1, activity: 'New vehicle added', time: '10 min ago', user: 'John Doe' },
    { id: 2, activity: 'Service appointment completed', time: '25 min ago', user: 'Jane Smith' },
    { id: 3, activity: 'Customer payment received', time: '1 hour ago', user: 'Mike Johnson' },
    { id: 4, activity: 'New lead registered', time: '2 hours ago', user: 'Sarah Williams' },
    { id: 5, activity: 'Monthly report generated', time: '3 hours ago', user: 'System' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg bg-white shadow-md"
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-sidebar text-sidebar-text
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:inset-auto
      `}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                <Car className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold">MAG CRM</h1>
                <p className="text-xs text-gray-400">Automotive Excellence</p>
              </div>
            </div>
          </div>

          <div className="p-6 border-b border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
              <div>
                <p className="font-semibold">{user?.firstName} {user?.lastName}</p>
                <p className="text-sm text-gray-400">{user?.email}</p>
                <span className="inline-block mt-1 px-2 py-1 text-xs bg-primary-500/20 text-primary-300 rounded-full">
                  {user?.role}
                </span>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-2">
            {[
              { name: 'Dashboard', icon: Car, active: true },
              { name: 'Vehicles', icon: Car },
              { name: 'Customers', icon: Users },
              { name: 'Appointments', icon: Calendar },
              { name: 'Finances', icon: DollarSign },
              { name: 'Settings', icon: Settings },
            ].map((item, index) => (
              <a
                key={index}
                href="#"
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  item.active 
                    ? 'bg-sidebar-accent text-white' 
                    : 'hover:bg-sidebar-hover'
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.name}</span>
              </a>
            ))}
          </nav>

          <div className="p-4 border-t border-gray-700">
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-red-500/10 text-red-300 hover:text-red-200 transition-colors w-full"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      <main className="lg:ml-64">
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600">Welcome back, {user?.firstName}!</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
              <button className="p-2 rounded-lg hover:bg-gray-100 relative">
                <Bell className="h-6 w-6 text-gray-600" />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  3
                </span>
              </button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                  {user?.firstName?.[0]}
                </div>
                <ChevronDown className="h-4 w-4 text-gray-600" />
              </div>
            </div>
          </div>
        </header>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                    <p className={`text-sm mt-1 ${stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                      {stat.change} from last month
                    </p>
                  </div>
                  <div className={`${stat.color} p-3 rounded-lg`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
              <button className="text-primary-600 hover:text-primary-700 text-sm font-semibold">
                View All →
              </button>
            </div>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-primary-500/10 to-primary-600/10 rounded-lg flex items-center justify-center">
                      <Car className="h-5 w-5 text-primary-500" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{activity.activity}</p>
                      <p className="text-sm text-gray-500">by {activity.user}</p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">{activity.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}