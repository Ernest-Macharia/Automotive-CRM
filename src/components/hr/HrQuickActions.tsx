'use client';

import React from 'react';
import { ChevronRight } from 'lucide-react';

interface QuickAction {
  label: string;
  icon: any;
  color: string;
  link: string;
  description: string;
}

interface HRQuickActionsProps {
  quickActions: QuickAction[];
  router: any;
}

export default function HRQuickActions({ quickActions, router }: HRQuickActionsProps) {
  return (
    <div className="mb-6">
      <h3 className="font-semibold text-gray-900 mb-3">Quick Actions</h3>
      <div className="space-y-2">
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          
          return (
            <button
              key={index}
              onClick={() => router.push(action.link)}
              className="w-full flex items-center justify-between p-3 text-left rounded-lg hover:bg-gray-50 border border-gray-200 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${action.color}`}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">{action.label}</p>
                  <p className="text-xs text-gray-500">{action.description}</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </button>
          );
        })}
      </div>
    </div>
  );
}