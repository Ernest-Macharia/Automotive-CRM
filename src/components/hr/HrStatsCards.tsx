'use client';

import React from 'react';
import { ChevronRight } from 'lucide-react';

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
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        
        return (
          <div
            key={index}
            className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow cursor-pointer"
            onClick={() => stat.link && router.push(stat.link)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`p-2 rounded-lg ${stat.color.split(' ')[1]}`}>
                <Icon className={`h-5 w-5 ${stat.color.split(' ')[0]}`} />
              </div>
              {stat.trend && (
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-800">
                  {stat.trend}
                </span>
              )}
            </div>
            
            <p className="text-2xl font-bold text-gray-900 mb-1">{stat.value.toLocaleString()}</p>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">{stat.label}</p>
              {stat.link && (
                <ChevronRight className="h-4 w-4 text-gray-400" />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}