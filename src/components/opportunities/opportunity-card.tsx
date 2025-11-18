// src/components/opportunity-card.tsx
'use client';

import Link from 'next/link';
import { MapPin, Package, MoreVertical } from 'lucide-react';
import { Opportunity } from '@/types/opportunity';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface OpportunityCardProps {
  opportunity: Opportunity;
}

export function OpportunityCard({ opportunity }: OpportunityCardProps) {
  // Map opportunity.type to icon
  const iconMap = {
    individual: { Icon: MapPin, color: 'text-purple-600 bg-purple-50' },
    organization: { Icon: Package, color: 'text-green-600 bg-green-50' },
  };

  const { Icon, color } = iconMap[opportunity.type];

  // Use first quote amount as value
  const quoteAmount = opportunity.quotes[0]?.totalAmount || 0;
  const formattedValue = new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
  }).format(quoteAmount);

  // ✅ FIX: Complete status badge mapping with all possible status values
  const statusBadge = {
    new: 'bg-blue-100 text-blue-800',
    qualified: 'bg-yellow-100 text-yellow-800',
    proposal: 'bg-purple-100 text-purple-800',
    closed: 'bg-gray-100 text-gray-800',
    open: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-yellow-100 text-yellow-800',
    won: 'bg-green-100 text-green-800',
    lost: 'bg-red-100 text-red-800',
    abandoned: 'bg-red-100 text-red-800', // ✅ Added
    negotiation: 'bg-orange-100 text-orange-800', // ✅ Added
    proposal_sent: 'bg-indigo-100 text-indigo-800', // ✅ Added
  }[opportunity.status] ?? 'bg-gray-100 text-gray-800';

  return (
    <div className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
      <div className="col-span-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${color}`}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-medium text-gray-900 truncate">{opportunity.subject}</h3>
            <p className="text-sm text-gray-500 truncate">
              {opportunity.customer.name}
              {opportunity.customer.companyName && ` · ${opportunity.customer.companyName}`}
            </p>
          </div>
        </div>
      </div>

      <div className="col-span-2">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize bg-gray-100 text-gray-800">
          {opportunity.type}
        </span>
      </div>

      <div className="col-span-2">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge}`}>
          {opportunity.status.replace('_', ' ')}
        </span>
      </div>

      <div className="col-span-2">
        <span className="text-sm font-medium text-gray-900">{formattedValue}</span>
      </div>

      <div className="col-span-2 flex items-center justify-end space-x-2">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/opportunities/${opportunity.id}`} className="text-primary-600 hover:text-primary-700">
            View
          </Link>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/opportunities/${opportunity.id}/edit`}>Edit</Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="text-red-600">
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}