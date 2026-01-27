'use client';

import { Bell } from 'lucide-react';
import { HrAlert } from '@/services/settings/hrService';

interface HRAlertsPanelProps {
  alerts: HrAlert[];
  onAlertClick: (alert: HrAlert) => void;
  getAlertPriorityColor: (priority: string) => string;
}

export default function HRAlertsPanel({ alerts, onAlertClick, getAlertPriorityColor }: HRAlertsPanelProps) {
  return (
    <div className="mt-6 pt-6 border-t border-gray-200">
      <h3 className="font-semibold text-gray-900 mb-3">HR Alerts</h3>
      <div className="space-y-2">
        {alerts.slice(0, 3).map((alert, index) => (
          <button
            key={index}
            onClick={() => onAlertClick(alert)}
            className="w-full text-left p-2.5 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start gap-2">
              <Bell className={`h-4 w-4 mt-0.5 ${
                alert.type === 'danger' ? 'text-red-600' :
                alert.type === 'warning' ? 'text-yellow-600' : 'text-blue-600'
              }`} />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 line-clamp-2">{alert.message}</p>
                <span className={`inline-block mt-1 px-1.5 py-0.5 text-[10px] rounded ${getAlertPriorityColor(alert.priority)}`}>
                  {alert.priority}
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}