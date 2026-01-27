'use client';

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
    <>
      <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
      <div className="space-y-2">
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          return (
            <button
              key={index}
              onClick={() => router.push(action.link)}
              className="w-full flex items-center gap-3 p-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors group"
            >
              <div className={`p-1.5 rounded-lg ${action.color} text-white`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="text-left">
                <p className="font-medium">{action.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{action.description}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400 ml-auto group-hover:text-gray-600" />
            </button>
          );
        })}
      </div>
    </>
  );
}