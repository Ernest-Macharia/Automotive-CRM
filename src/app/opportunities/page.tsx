'use client';

import { useState } from 'react';
import { Search, Plus, Filter, Calendar, MoveRight, ChevronDown } from 'lucide-react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

function OpportunitiesContent() {
  const [stages] = useState([
    { id: 1, name: "New", color: "bg-gray-700" },
    { id: 2, name: "Contacted", color: "bg-blue-700" },
    { id: 3, name: "Qualified", color: "bg-amber-700" },
    { id: 4, name: "Quote Sent", color: "bg-orange-700" },
    { id: 5, name: "Job Confirmed", color: "bg-green-700" },
    { id: 6, name: "Closed – Won", color: "bg-emerald-800" },
  ]);

  const sampleLeads = [
    { id: 1, name: "John Mwangi", vehicle: "Toyota Mark X", value: "Ksh 45,000", stage: "New", lastContact: "2 hours ago" },
    { id: 2, name: "Mercy Wanjiru", vehicle: "Subaru Forester", value: "Ksh 30,000", stage: "Qualified", lastContact: "1 day ago" },
    { id: 3, name: "Ali Yusuf", vehicle: "Mazda Axela", value: "Ksh 20,000", stage: "Quote Sent", lastContact: "3 days ago" },
    { id: 4, name: "David Kimani", vehicle: "Toyota Premio", value: "Ksh 35,000", stage: "Contacted", lastContact: "5 hours ago" },
    { id: 5, name: "Sarah Omondi", vehicle: "Honda Fit", value: "Ksh 25,000", stage: "New", lastContact: "Just now" },
    { id: 6, name: "Robert Otieno", vehicle: "Nissan X-Trail", value: "Ksh 50,000", stage: "Job Confirmed", lastContact: "2 days ago" },
    { id: 7, name: "Grace Akinyi", vehicle: "Toyota RAV4", value: "Ksh 40,000", stage: "Closed – Won", lastContact: "1 week ago" },
    { id: 8, name: "Peter Kipchoge", vehicle: "Mitsubishi Lancer", value: "Ksh 28,000", stage: "Quote Sent", lastContact: "4 days ago" },
  ];

  const filters = [
    "Touched Records",
    "Untouched Records",
    "Locked",
    "Activities",
    "Campaigns",
    "Vehicle Make",
    "Vehicle Model",
    "Car Colour",
    "Service Type",
    "Lead Source",
    "Assigned Advisor",
    "Stage",
    "Time Visited",
    "Visitor Score",
    "Average Time Spent (min)",
    "Days Visited",
    "Referrer",
  ];

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  const toggleFilter = (filter: string) => {
    setSelectedFilters(prev =>
      prev.includes(filter) 
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
  };

  // Color mapping for Tailwind classes to actual colors
  const colorClasses = {
    "bg-gray-700": "#374151",    // Gray 700
    "bg-blue-700": "#1D4ED8",    // Blue 700
    "bg-amber-700": "#B45309",   // Amber 700
    "bg-orange-700": "#C2410C",  // Orange 700
    "bg-green-700": "#15803D",   // Green 700
    "bg-emerald-800": "#065F46", // Emerald 800
  };

  return (
    <div className="h-full flex flex-col">
      {/* Page Header */}
      <div className="pb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold" style={{ color: '#FFFFFF' }}>Opportunities</h1>
            <p className="mt-2" style={{ color: '#CCCCCC' }}>Track and manage your leads through the sales pipeline</p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:flex-initial">
              <input
                type="text"
                placeholder="Search opportunities..."
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
              New Opportunity
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden">
        <aside className="w-full lg:w-72 flex flex-col">
          <div style={{
            backgroundColor: '#1A1A1A',
            borderRadius: '0.75rem',
            border: '1px solid #2A2A2A',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            height: '100%',
            overflow: 'hidden'
          }}>
            <h2 className="text-lg font-semibold" style={{ color: '#FFFFFF' }}>Lead Board</h2>

            <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
              <div className="flex items-center gap-2">
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
                  cursor: 'pointer',
                  flex: 1
                }} className="hover:opacity-90 transition-opacity">
                  <Plus size={16} /> New Lead
                </button>
                <button style={{
                  backgroundColor: '#1A1A1A',
                  color: '#CCCCCC',
                  border: '1px solid #2A2A2A',
                  borderRadius: '0.5rem',
                  padding: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }} className="hover:opacity-80 transition-opacity">
                  <Filter size={18} />
                </button>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: '#0B0B0B',
                borderRadius: '0.5rem',
                padding: '0.5rem',
                border: '1px solid #2A2A2A'
              }}>
                <Search size={16} style={{ color: '#666666' }} />
                <input
                  type="text"
                  placeholder="Search leads..."
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#CCCCCC',
                    outline: 'none',
                    fontSize: '0.875rem',
                    width: '100%'
                  }}
                />
              </div>

              <div className="flex flex-col gap-2">
                <button style={{
                  backgroundColor: '#1A1A1A',
                  color: '#CCCCCC',
                  border: '1px solid #2A2A2A',
                  borderRadius: '0.5rem',
                  padding: '0.5rem 0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.875rem',
                  cursor: 'pointer'
                }} className="hover:opacity-80 transition-opacity">
                  <span>Sort by Stage</span> <ChevronDown size={14} />
                </button>
                <button style={{
                  backgroundColor: '#1A1A1A',
                  color: '#CCCCCC',
                  border: '1px solid #2A2A2A',
                  borderRadius: '0.5rem',
                  padding: '0.5rem 0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.875rem',
                  cursor: 'pointer'
                }} className="hover:opacity-80 transition-opacity">
                  <span>Sort by Date</span> <Calendar size={14} />
                </button>
              </div>

              <div className="mt-4 flex-1 overflow-hidden flex flex-col">
                <h3 className="text-sm font-semibold mb-3" style={{ color: '#E65C00' }}>Filters</h3>
                <div className="space-y-2 flex-1 overflow-y-auto pr-2">
                  {filters.map((filter, idx) => (
                    <label key={idx} className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: '#CCCCCC' }}>
                      <input
                        type="checkbox"
                        checked={selectedFilters.includes(filter)}
                        onChange={() => toggleFilter(filter)}
                        style={{
                          accentColor: '#E65C00',
                          borderRadius: '0.25rem',
                          borderColor: '#2A2A2A'
                        }}
                      />
                      <span className="truncate">{filter}</span>
                    </label>
                  ))}
                </div>
                {selectedFilters.length > 0 && (
                  <div className="mt-4 pt-4" style={{ borderTop: '1px solid #2A2A2A' }}>
                    <div className="text-xs mb-2" style={{ color: '#666666' }}>Active filters ({selectedFilters.length}):</div>
                    <div className="flex flex-wrap gap-2">
                      {selectedFilters.map(filter => (
                        <span key={filter} style={{
                          backgroundColor: '#0B0B0B',
                          color: '#E65C00',
                          border: '1px solid #2A2A2A',
                          fontSize: '0.75rem',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '9999px'
                        }}>
                          {filter}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-hidden">
          <div className="flex gap-4 overflow-x-auto h-full pb-4">
            {stages.map((stage) => {
              const stageLeads = sampleLeads.filter((lead) => lead.stage === stage.name);
              const stageBorderColors = {
                "New": "#E65C00",
                "Contacted": "#C44A00",
                "Qualified": "#E65C00",
                "Quote Sent": "#C44A00",
                "Job Confirmed": "#E65C00",
                "Closed – Won": "#C44A00"
              };
              
              const borderColor = stageBorderColors[stage.name as keyof typeof stageBorderColors] || '#E65C00';
              const backgroundColor = colorClasses[stage.color as keyof typeof colorClasses] || '#1A1A1A';
              
              return (
                <div key={stage.id} className="min-w-[280px] flex flex-col">
                  <div style={{
                    backgroundColor: backgroundColor,
                    border: '1px solid #2A2A2A',
                    color: '#FFFFFF',
                    fontWeight: '500',
                    padding: '1rem',
                    borderTopLeftRadius: '0.75rem',
                    borderTopRightRadius: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '0.75rem',
                    borderLeft: `4px solid ${borderColor}`
                  }}>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{stage.name}</span>
                      <span className="text-xs opacity-90">({stageLeads.length})</span>
                    </div>
                    <button style={{ color: '#CCCCCC' }} className="hover:text-white transition-colors">
                      <Plus size={16} />
                    </button>
                  </div>

                  <div className="flex flex-col gap-3 flex-1 overflow-y-auto">
                    {stageLeads.map((lead) => (
                      <div 
                        key={lead.id} 
                        style={{
                          backgroundColor: '#1A1A1A',
                          borderRadius: '0.5rem',
                          border: '1px solid #2A2A2A',
                          padding: '1rem',
                          cursor: 'pointer'
                        }}
                        className="hover:border-orange-500 transition-all"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold" style={{ color: '#FFFFFF' }}>
                              {lead.name}
                            </h3>
                            <p className="text-sm mt-1" style={{ color: '#CCCCCC' }}>{lead.vehicle}</p>
                          </div>
                          <MoveRight size={16} style={{ color: '#E65C00', opacity: 0 }} className="group-hover:opacity-100 transition-opacity" />
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="font-bold" style={{ color: '#E65C00' }}>{lead.value}</span>
                          <span className="text-xs" style={{ color: '#666666' }}>{lead.lastContact}</span>
                        </div>

                        <div className="mt-3 pt-3" style={{ borderTop: '1px solid #2A2A2A' }}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div style={{
                                width: '1.5rem',
                                height: '1.5rem',
                                backgroundColor: '#0B0B0B',
                                borderRadius: '9999px',
                                border: '1px solid #2A2A2A'
                              }}></div>
                              <span className="text-xs" style={{ color: '#CCCCCC' }}>Unassigned</span>
                            </div>
                            <button className="text-xs" style={{ color: '#666666' }}>View details</button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {stageLeads.length === 0 && (
                      <div style={{
                        backgroundColor: '#0B0B0B',
                        borderRadius: '0.5rem',
                        border: '2px dashed #2A2A2A',
                        padding: '2rem',
                        textAlign: 'center',
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <div>
                          <p className="text-sm" style={{ color: '#666666' }}>No opportunities in this stage</p>
                          <button className="mt-2 text-sm" style={{ color: '#E65C00' }}>
                            + Add opportunity
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>

      <div className="pt-6 mt-6" style={{ borderTop: '1px solid #2A2A2A' }}>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm" style={{ color: '#CCCCCC' }}>
            <span className="font-medium" style={{ color: '#FFFFFF' }}>{sampleLeads.length}</span> total opportunities
          </div>
          <div className="flex items-center gap-6">
            <div className="text-sm">
              <span className="font-medium" style={{ color: '#E65C00' }}>Ksh 273,000</span>
              <span className="ml-2" style={{ color: '#666666' }}>Total pipeline value</span>
            </div>
            <div className="text-sm">
              <span className="font-medium" style={{ color: '#C44A00' }}>42%</span>
              <span className="ml-2" style={{ color: '#666666' }}>Win rate</span>
            </div>
            <div className="text-sm">
              <span className="font-medium" style={{ color: '#E65C00' }}>8 days</span>
              <span className="ml-2" style={{ color: '#666666' }}>Avg. deal cycle</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OpportunitiesPage() {
  return (
    <ProtectedRoute>
      <OpportunitiesContent />
    </ProtectedRoute>
  );
}