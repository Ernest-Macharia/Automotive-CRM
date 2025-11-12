'use client';

import Link from 'next/link';
import { MapPin, Calendar, Wrench, Package, MoreVertical } from 'lucide-react';
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
  // ── Icon / Color mapping based on **type** (lead vs deal) ──
  const iconMap = {
    service: { Icon: Wrench, color: 'text-blue-600 bg-blue-50' },
    product: { Icon: Package, color: 'text-green-600 bg-green-50' },
    lead: { Icon: MapPin, color: 'text-purple-600 bg-purple-50' },
    deal: { Icon: Calendar, color: 'text-orange-600 bg-orange-50' },
  };

  const typeKey = opportunity.type === 'lead' ? 'lead' :
                 opportunity.type === 'deal' ? 'deal' :
                 // fallback – look at subject
                 (opportunity.subject.toLowerCase().includes('service') || opportunity.subject.toLowerCase().includes('repair'))
                   ? 'service' : 'product';

  const { Icon, color } = iconMap[typeKey];

  // ── Format currency (Kenyan Shilling default) ──
  const formattedValue = new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: opportunity.currency || 'KES',
  }).format(opportunity.value);

  // ── Status badge styling ──
  const statusBadge = {
    open: 'bg-green-100 text-green-800',
    won: 'bg-emerald-100 text-emerald-800',
    lost: 'bg-red-100 text-red-800',
    abandoned: 'bg-gray-100 text-gray-800',
  }[opportunity.status] ?? 'bg-yellow-100 text-yellow-800';

  return (
    <div className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
      {/* ── Opportunity Info ── */}
      <div className="col-span-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${color}`}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-medium text-gray-900 truncate">{opportunity.subject}</h3>
            <p className="text-sm text-gray-500 truncate">{opportunity.customerName}</p>
          </div>
        </div>
      </div>

      {/* ── Type ── */}
      <div className="col-span-2">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize bg-gray-100 text-gray-800">
          {opportunity.type}
        </span>
      </div>

      {/* ── Status ── */}
      <div className="col-span-2">
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge}`}
        >
          {opportunity.status}
        </span>
      </div>

      {/* ── Value ── */}
      <div className="col-span-2">
        <span className="text-sm font-medium text-gray-900">{formattedValue}</span>
      </div>

      {/* ── Actions ── */}
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