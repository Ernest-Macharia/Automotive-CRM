'use client';

import { TrendingUp } from 'lucide-react';

interface DashboardStat {
  label: string;
  value: number;
  icon: any;
  color: string;
  trend?: string;
  link?: string;
}

interface HRStatsCardsProps {
  stats: DashboardStat[];
  router: any;
}

export default function HRStatsCards({ stats, router }: HRStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div 
            key={index} 
            className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => stat.link && router.push(stat.link)}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 uppercase tracking-wider">{stat.label}</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={`p-2 rounded-lg ${stat.color.split(' ')[1]}`}>
                <Icon className={`h-5 w-5 ${stat.color.split(' ')[0]}`} />
              </div>
            </div>
            {stat.trend && (
              <div className="mt-2 flex items-center gap-1 text-xs">
                <TrendingUp className="h-3 w-3 text-green-600" />
                <span className="text-green-600">{stat.trend}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}