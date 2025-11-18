// src/components/dashboard/stats-cards.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useOpportunities } from '@/hooks/useOpportunities';
import { Target, TrendingUp, Clock, DollarSign } from 'lucide-react';
import type { Opportunity } from '@/types/opportunity';

export function StatsCards() {
  const { data: opportunities = [], isLoading } = useOpportunities();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Calculate pipeline value from quotes or amount
  const calculateOpportunityValue = (opportunity: Opportunity): number => {
    // Use the latest quote amount if available
    if (opportunity.quotes && opportunity.quotes.length > 0) {
      const lastQuote = opportunity.quotes[opportunity.quotes.length - 1];
      return lastQuote.totalAmount || 0;
    }
    // Fallback to amount field if it exists (you might need to add this to your type)
    return 0; // or opportunity.amount || 0 if you add amount to the Opportunity type
  };

  const stats = {
    total: opportunities.length,
    open: opportunities.filter(o => o.status === 'open').length,
    won: opportunities.filter(o => o.status === 'won').length,
    lost: opportunities.filter(o => o.status === 'lost').length,
    abandoned: opportunities.filter(o => o.status === 'abandoned').length,
    pipelineValue: opportunities.reduce((sum: number, o: Opportunity) => 
      sum + calculateOpportunityValue(o), 0
    ),
  };

  const conversionRate = stats.total > 0 ? Math.round((stats.won / stats.total) * 100) : 0;

  const formatCurrency = (amount: number): string => {
    return `KES ${amount.toLocaleString('en-KE')}`;
  };

  const cardData = [
    {
      title: 'Total Opportunities',
      value: stats.total,
      icon: Target,
      description: 'All deals in pipeline',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Open Deals',
      value: stats.open,
      icon: Clock,
      description: 'Active opportunities',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Pipeline Value',
      value: formatCurrency(stats.pipelineValue),
      icon: DollarSign,
      description: 'Total deal value',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Conversion Rate',
      value: `${conversionRate}%`,
      icon: TrendingUp,
      description: 'Win rate',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cardData.map((card, index) => (
        <Card key={index} className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <card.icon className={`h-4 w-4 ${card.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}