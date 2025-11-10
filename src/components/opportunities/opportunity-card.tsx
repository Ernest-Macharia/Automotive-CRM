'use client';

import { MapPin, Calendar, Wrench, Package } from 'lucide-react';

interface Opportunity {
  id: string;
  subject: string;
  customerName: string;
  contactEmail: string;
  status: string;
  // We'll map these from your existing inquiry fields
}

interface OpportunityCardProps {
  opportunity: Opportunity;
}

export function OpportunityCard({ opportunity }: OpportunityCardProps) {
  // Temporary mapping until backend updates
  const getOpportunityType = (subject: string) => {
    if (subject.toLowerCase().includes('service') || subject.toLowerCase().includes('repair')) {
      return { type: 'service', icon: Wrench, color: 'text-blue-600 bg-blue-50' };
    }
    if (subject.toLowerCase().includes('product') || subject.toLowerCase().includes('sale')) {
      return { type: 'product', icon: Package, color: 'text-green-600 bg-green-50' };
    }
    return { type: 'service', icon: Wrench, color: 'text-blue-600 bg-blue-50' }; // default
  };

  const { type, icon: Icon, color } = getOpportunityType(opportunity.subject);

  return (
    <div className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
      {/* Opportunity Info */}
      <div className="col-span-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${color}`}>
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{opportunity.subject}</h3>
            <p className="text-sm text-gray-500">{opportunity.customerName}</p>
          </div>
        </div>
      </div>

      {/* Type */}
      <div className="col-span-2">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize bg-gray-100 text-gray-800">
          {type}
        </span>
      </div>

      {/* Status */}
      <div className="col-span-2">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          opportunity.status === 'open' ? 'bg-green-100 text-green-800' :
          opportunity.status === 'closed' ? 'bg-gray-100 text-gray-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {opportunity.status}
        </span>
      </div>

      {/* Value - Placeholder for now */}
      <div className="col-span-2">
        <span className="text-sm text-gray-900">-</span>
      </div>

      {/* Actions */}
      <div className="col-span-2">
        <div className="flex items-center space-x-2">
          <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
            View
          </button>
          <button className="text-gray-400 hover:text-gray-600">
            •••
          </button>
        </div>
      </div>
    </div>
  );
}