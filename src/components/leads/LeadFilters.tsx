'use client';

import { Search, Filter, XCircle } from 'lucide-react';
import { useState } from 'react';

interface LeadFiltersProps {
  filters: {
    search: string;
    status: string;
    source: string;
    type: string;
  };
  onFilterChange: (filters: any) => void;
  onApply: () => void;
}

export default function LeadFilters({ filters, onFilterChange, onApply }: LeadFiltersProps) {
  const [localSearch, setLocalSearch] = useState(filters.search);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFilterChange({ ...filters, search: localSearch });
    onApply();
  };

  const handleClear = () => {
    setLocalSearch('');
    onFilterChange({
      search: '',
      status: '',
      source: '',
      type: '',
    });
    onApply();
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center gap-4">
      <form onSubmit={handleSubmit} className="flex-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Search leads by name, email, phone..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </form>
      
      <div className="flex flex-wrap gap-3">
        <select
          value={filters.status}
          onChange={(e) => onFilterChange({ ...filters, status: e.target.value })}
          className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Status</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="qualified">Qualified</option>
          <option value="proposal-sent">Proposal Sent</option>
          <option value="negotiation">Negotiation</option>
          <option value="closed-won">Closed Won</option>
          <option value="closed-lost">Closed Lost</option>
        </select>
        
        <select
          value={filters.source}
          onChange={(e) => onFilterChange({ ...filters, source: e.target.value })}
          className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Sources</option>
          <option value="website">Website</option>
          <option value="referral">Referral</option>
          <option value="walk-in">Walk-in</option>
          <option value="phone-call">Phone Call</option>
          <option value="email">Email</option>
          <option value="social-media">Social Media</option>
          <option value="trade-show">Trade Show</option>
        </select>
        
        <button
          onClick={handleSubmit}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Filter className="h-4 w-4" />
          Apply Filters
        </button>
        
        <button
          onClick={handleClear}
          className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          <XCircle className="h-4 w-4" />
          Clear
        </button>
      </div>
    </div>
  );
}