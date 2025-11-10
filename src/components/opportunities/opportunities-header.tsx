'use client';

import { Filter, Plus, Download } from 'lucide-react';

export function OpportunitiesHeader() {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Opportunities</h1>
        <p className="text-gray-600 mt-1">Manage all service and sales opportunities</p>
      </div>
      
      <div className="flex items-center space-x-3">
        <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
          <Filter className="h-4 w-4" />
          <span>Filter</span>
        </button>
        
        <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
          <Download className="h-4 w-4" />
          <span>Export</span>
        </button>
        
        <button className="flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700">
          <Plus className="h-4 w-4" />
          <span>New Opportunity</span>
        </button>
      </div>
    </div>
  );
}