// src/app/opportunities/page.tsx
'use client';

import { OpportunityKanbanBoard } from '@/components/opportunities/OpportunityKanbanBoard';
import { Button } from '@/components/ui/button';
import { Plus, ChevronDown, Filter, ArrowUpDown, MoreVertical } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function OpportunitiesPage() {
  const router = useRouter();
  const [sortBy, setSortBy] = useState('created_date');
  const [sortOrder, setSortOrder] = useState('desc');

  const handleCreateOpportunity = () => {
    router.push('/opportunities/new');
  };

  const sortOptions = [
    { value: 'created_date', label: 'Created Date' },
    { value: 'updated_date', label: 'Updated Date' },
    { value: 'amount', label: 'Amount' },
    { value: 'customer_name', label: 'Customer Name' },
    { value: 'subject', label: 'Opportunity Name' },
  ];

  const bulkActions = [
    { value: 'assign', label: 'Assign to User', icon: '👤' },
    { value: 'change_status', label: 'Change Status', icon: '🔄' },
    { value: 'add_tag', label: 'Add Tag', icon: '🏷️' },
    { value: 'export', label: 'Export Selected', icon: '📤' },
    { value: 'print', label: 'Print', icon: '🖨️' },
    { value: 'email', label: 'Send Email', icon: '✉️' },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Filter Panel - Slim */}
      <aside className="w-56 p-3 bg-white border-r border-gray-200 flex-shrink-0">
        <div className="space-y-4">
          {/* Search */}
          <div>
            <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Filters</h3>
            <input
              type="text"
              placeholder="Search opportunities..."
              className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
          
          {/* Quick Status Filter */}
          <div>
            <h4 className="text-xs font-medium text-gray-700 mb-2">Status</h4>
            <div className="space-y-1">
              {['All', 'New', 'Qualified', 'Proposal', 'Won', 'Lost'].map((status) => (
                <button
                  key={status}
                  className="block w-full text-left text-xs text-gray-600 hover:text-orange-600 px-1 py-0.5 rounded hover:bg-orange-50"
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Amount Filter */}
          <div>
            <h4 className="text-xs font-medium text-gray-700 mb-2">Amount</h4>
            <div className="space-y-1">
              {['All', 'High (>50K)', 'Medium (10-50K)', 'Low (<10K)'].map((amount) => (
                <button
                  key={amount}
                  className="block w-full text-left text-xs text-gray-600 hover:text-orange-600 px-1 py-0.5 rounded hover:bg-orange-50"
                >
                  {amount}
                </button>
              ))}
            </div>
          </div>

          {/* Source Filter */}
          <div>
            <h4 className="text-xs font-medium text-gray-700 mb-2">Source</h4>
            <div className="space-y-1">
              {['All', 'Website', 'Referral', 'Walk-in', 'Phone', 'Email'].map((source) => (
                <button
                  key={source}
                  className="block w-full text-left text-xs text-gray-600 hover:text-orange-600 px-1 py-0.5 rounded hover:bg-orange-50"
                >
                  {source}
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content - Takes remaining space */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Enhanced Header with Sort & Actions */}
        <header className="bg-white border-b px-4 py-2 flex-shrink-0">
          <div className="flex items-center justify-between">
            {/* Left Side - Create Button */}
            <Button 
              size="sm"
              className="bg-orange-500 hover:bg-orange-600 text-white"
              onClick={handleCreateOpportunity}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Opportunity
            </Button>
            
            {/* Right Side - Sort & Actions */}
            <div className="flex items-center gap-3">
              {/* Sort Dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Sort:</span>
                <div className="relative">
                  <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="appearance-none bg-white border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500 pr-6"
                  >
                    {sortOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-1 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
                </div>
                
                {/* Sort Order Toggle */}
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="p-1 hover:bg-gray-100 rounded border border-gray-300"
                  title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                >
                  <ArrowUpDown className="h-3 w-3 text-gray-600" />
                </button>
              </div>

              {/* Actions Dropdown */}
              <div className="relative group">
                <Button 
                  size="sm" 
                  variant="outline"
                  className="flex items-center gap-1 border-gray-300"
                >
                  <MoreVertical className="h-4 w-4" />
                  Actions
                  <ChevronDown className="h-3 w-3" />
                </Button>
                
                {/* Dropdown Menu */}
                <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                  <div className="py-1">
                    <div className="px-3 py-2 text-xs font-medium text-gray-500 border-b border-gray-100">
                      Bulk Actions
                    </div>
                    {bulkActions.map((action) => (
                      <button
                        key={action.value}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-2"
                        onClick={() => console.log('Action:', action.value)}
                      >
                        <span className="text-xs">{action.icon}</span>
                        {action.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Filter Toggle */}
              <button className="p-1 hover:bg-gray-100 rounded border border-gray-300">
                <Filter className="h-4 w-4 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Secondary Info Bar */}
          <div className="flex items-center justify-between mt-2">
            <div className="text-xs text-gray-500">
              Drag and drop cards to update opportunity status
            </div>
            <div className="text-xs text-gray-500">
              Showing <span className="font-medium">all opportunities</span>
            </div>
          </div>
        </header>

        {/* Kanban Board - Takes all remaining space */}
        <div className="flex-1 min-h-0">
          <OpportunityKanbanBoard 
            sortBy={sortBy}
            sortOrder={sortOrder}
          />
        </div>
      </div>
    </div>
  );
}