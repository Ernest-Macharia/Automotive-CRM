'use client';

import { useState } from 'react';
import { Building, Search, Filter, Plus, MoreVertical } from 'lucide-react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

function ClientsContent() {
  const [searchQuery, setSearchQuery] = useState('');
  
  const clients = [
    { id: 1, name: 'John Doe', email: 'john@example.com', phone: '+1234567890', status: 'Active' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', phone: '+1234567891', status: 'Active' },
    { id: 3, name: 'Mike Johnson', email: 'mike@example.com', phone: '+1234567892', status: 'Inactive' },
    { id: 4, name: 'Sarah Williams', email: 'sarah@example.com', phone: '+1234567893', status: 'Active' },
  ];

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="pb-6 flex-shrink-0">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold" style={{ color: '#FFFFFF' }}>Clients</h1>
            <p className="mt-2" style={{ color: '#CCCCCC' }}>Manage your client relationships</p>
          </div>
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
            Add New Client
          </button>
        </div>
      </div>

      <div style={{
        backgroundColor: '#1A1A1A',
        borderRadius: '0.75rem',
        border: '1px solid #2A2A2A',
        padding: '1rem',
        marginBottom: '1.5rem'
      }}>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search clients..."
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
            color: '#CCCCCC',
            border: '1px solid #2A2A2A',
            borderRadius: '0.5rem',
            padding: '0.625rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontWeight: '500',
            cursor: 'pointer'
          }} className="hover:opacity-80 transition-opacity">
            <Filter className="h-5 w-5" />
            Filter
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        <div style={{
          backgroundColor: '#1A1A1A',
          borderRadius: '0.75rem',
          border: '1px solid #2A2A2A',
          overflow: 'hidden',
          height: '100%'
        }}>
          <div className="h-full overflow-auto">
            <table className="min-w-full divide-y" style={{ borderColor: '#2A2A2A' }}>
              <thead className="bg-[#1A1A1A]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#CCCCCC', borderColor: '#2A2A2A' }}>
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#CCCCCC', borderColor: '#2A2A2A' }}>
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#CCCCCC', borderColor: '#2A2A2A' }}>
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#CCCCCC', borderColor: '#2A2A2A' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: '#2A2A2A' }}>
                {clients.map((client) => (
                  <tr key={client.id} className="hover:bg-[#2A2A2A] transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0" style={{
                          backgroundColor: 'rgba(230, 92, 0, 0.1)',
                          borderRadius: '0.5rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <Building className="h-5 w-5" style={{ color: '#E65C00' }} />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium" style={{ color: '#FFFFFF' }}>{client.name}</div>
                          <div className="text-sm" style={{ color: '#CCCCCC' }}>{client.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm" style={{ color: '#FFFFFF' }}>{client.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full" style={{
                        backgroundColor: client.status === 'Active' 
                          ? 'rgba(34, 197, 94, 0.1)' 
                          : 'rgba(239, 68, 68, 0.1)',
                        color: client.status === 'Active' 
                          ? '#22C55E' 
                          : '#EF4444'
                      }}>
                        {client.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="hover:text-[#E65C00] transition-colors" style={{ color: '#CCCCCC' }}>
                        <MoreVertical className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ClientsPage() {
  return (
    <ProtectedRoute>
      <ClientsContent />
    </ProtectedRoute>
  );
}