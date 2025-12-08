'use client';

import { useState } from 'react';
import { Building, Search, Filter, Plus, MoreVertical, User, Sparkles } from 'lucide-react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

function CustomersContent() {
  const [searchQuery, setSearchQuery] = useState('');
  
  const clients = [
    { id: 1, name: 'John Doe', email: 'john@example.com', phone: '+1234567890', status: 'Active', vehicles: 2 },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', phone: '+1234567891', status: 'Active', vehicles: 1 },
    { id: 3, name: 'Mike Johnson', email: 'mike@example.com', phone: '+1234567892', status: 'Inactive', vehicles: 0 },
    { id: 4, name: 'Sarah Williams', email: 'sarah@example.com', phone: '+1234567893', status: 'Active', vehicles: 3 },
  ];

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 overflow-hidden">
      {/* Fixed Header */}
      <div className="h-16 bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg flex items-center px-6">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <User className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Customers</h1>
              <p className="text-blue-100 text-sm">Manage your customer relationships</p>
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium shadow-sm transition-all">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add New</span>
          </button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="h-[calc(100vh-64px)] p-4 md:p-6 space-y-6 overflow-auto">
        {/* Search and Filter */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/30 p-5">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search customers by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-white/50 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-3 rounded-xl border border-gray-200 bg-white/50 hover:bg-white text-gray-600 hover:text-gray-700 text-sm font-medium transition-colors">
              <Filter className="h-4 w-4" />
              Filter
            </button>
            <button className="flex items-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 text-sm font-medium shadow-sm transition-all">
              <Plus className="h-4 w-4" />
              New Customer
            </button>
          </div>
        </div>

        {/* Customers Table */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/30 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200/50">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Vehicles
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white/50 divide-y divide-gray-200/30">
                {clients.map((client) => (
                  <tr key={client.id} className="hover:bg-white/70 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{client.name}</div>
                          <div className="text-sm text-gray-600">{client.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{client.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="text-sm text-gray-900">{client.vehicles}</div>
                        <span className="text-xs text-gray-500">vehicles</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        client.status === 'Active' 
                          ? 'bg-green-100/80 text-green-800' 
                          : 'bg-red-100/80 text-red-800'
                      }`}>
                        {client.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button className="text-blue-600 hover:text-blue-800 transition-colors p-1 hover:bg-blue-50/50 rounded-lg">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Table Footer */}
          <div className="px-6 py-4 border-t border-gray-200/50 bg-white/30">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {clients.length} of {clients.length} customers
              </div>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1 rounded-lg border border-gray-200 bg-white/50 text-sm text-gray-600 hover:bg-white transition-colors">
                  Previous
                </button>
                <button className="px-3 py-1 rounded-lg bg-blue-50/50 text-blue-600 text-sm font-medium hover:bg-blue-100/50 transition-colors">
                  1
                </button>
                <button className="px-3 py-1 rounded-lg border border-gray-200 bg-white/50 text-sm text-gray-600 hover:bg-white transition-colors">
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-50/80 to-blue-100/50 backdrop-blur-sm rounded-2xl border border-blue-100/50 p-5">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-blue-100/50">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Customers</p>
                <p className="text-2xl font-bold text-gray-900">{clients.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-50/80 to-green-100/50 backdrop-blur-sm rounded-2xl border border-green-100/50 p-5">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-green-100/50">
                <User className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Active Customers</p>
                <p className="text-2xl font-bold text-gray-900">{clients.filter(c => c.status === 'Active').length}</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-50/80 to-purple-100/50 backdrop-blur-sm rounded-2xl border border-purple-100/50 p-5">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-purple-100/50">
                <Building className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Vehicles</p>
                <p className="text-2xl font-bold text-gray-900">
                  {clients.reduce((sum, client) => sum + client.vehicles, 0)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ClientsPage() {
  return (
    <ProtectedRoute>
      <CustomersContent />
    </ProtectedRoute>
  );
}