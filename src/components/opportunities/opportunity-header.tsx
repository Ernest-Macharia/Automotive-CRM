// src/components/opportunities/opportunity-header.tsx
'use client';

import { ArrowLeft, MoreVertical, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { Opportunity } from '@/types/opportunity';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useDeleteOpportunity } from '@/hooks/useOpportunities';
import { useRouter } from 'next/navigation';

interface OpportunityHeaderProps {
  opportunity: Opportunity;
}

export function OpportunityHeader({ opportunity }: OpportunityHeaderProps) {
  const router = useRouter();
  const deleteOpportunity = useDeleteOpportunity();

  const handleDelete = async () => {
    if (confirm('Delete this opportunity? This cannot be undone.')) {
      await deleteOpportunity.mutateAsync(opportunity.id);
      router.push('/opportunities');
    }
  };

  // ✅ FIX: Add all possible status values from OpportunityStatus type
  const statusColors = {
    new: 'bg-blue-100 text-blue-800',
    qualified: 'bg-purple-100 text-purple-800',
    proposal: 'bg-indigo-100 text-indigo-800',
    closed: 'bg-gray-100 text-gray-800',
    open: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-yellow-100 text-yellow-800',
    won: 'bg-green-100 text-green-800',
    lost: 'bg-red-100 text-red-800',
    abandoned: 'bg-red-100 text-red-800',
    negotiation: 'bg-orange-100 text-orange-800',
    proposal_sent: 'bg-indigo-100 text-indigo-800',
  };

  const quoteAmount = opportunity.quotes[0]?.totalAmount || 0;

  return (
    <div className="border-b border-gray-200 bg-white">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost" size="icon">
              <Link href="/opportunities">
                <ArrowLeft className="h-5 w-5" />
                <span className="sr-only">Back to opportunities</span>
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{opportunity.subject}</h1>
              <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                <span>{opportunity.customer.name}</span>
                {opportunity.customer.companyName && (
                  <>
                    <span className="text-gray-400">•</span>
                    <span>{opportunity.customer.companyName}</span>
                  </>
                )}
                <span className="text-gray-400">•</span>
                <span className="font-medium">
                  KES {quoteAmount.toLocaleString('en-KE')}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge 
              className={statusColors[opportunity.status] || 'bg-gray-100 text-gray-800'} 
              variant="secondary"
            >
              {opportunity.status.replace('_', ' ')}
            </Badge>

            <Button asChild variant="outline">
              <Link href={`/opportunities/${opportunity.id}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Link>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-5 w-5" />
                  <span className="sr-only">More actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="text-red-600" onClick={handleDelete}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Opportunity
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
}