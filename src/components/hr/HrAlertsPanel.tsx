'use client';

import React from 'react';
import { AlertCircle, Bell } from 'lucide-react';

interface HrAlert {
  type: string;
  message: string;
  priority: string;
  action?: string;
}

interface HRAlertsPanelProps {
  alerts: HrAlert[];
  onAlertClick: (alert: HrAlert) => void;
  getAlertPriorityColor: (priority: string) => string;
}

export default function HRAlertsPanel({ alerts, onAlertClick, getAlertPriorityColor }: HRAlertsPanelProps) {
  if (alerts.length === 0) {
    return (
      <div className="text-center py-4">
        <Bell className="h-8 w-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-500">No alerts</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="font-semibold text-gray-900 mb-3">Alerts & Notifications</h3>
      <div className="space-y-2">
        {alerts.slice(0, 5).map((alert, index) => (
          <button
            key={index}
            onClick={() => onAlertClick(alert)}
            className="w-full text-left p-3 rounded-lg border transition-colors hover:bg-gray-50"
          >
            <div className="flex items-start gap-3">
              <div className={`p-1.5 rounded-lg mt-0.5 ${
                alert.type === 'danger' ? 'bg-red-100' :
                alert.type === 'warning' ? 'bg-yellow-100' : 'bg-blue-100'
              }`}>
                <AlertCircle className={`h-4 w-4 ${
                  alert.type === 'danger' ? 'text-red-600' :
                  alert.type === 'warning' ? 'text-yellow-600' : 'text-blue-600'
                }`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-medium px-2 py-1 rounded ${getAlertPriorityColor(alert.priority)}`}>
                    {alert.priority}
                  </span>
                  {alert.action && (
                    <span className="text-xs text-blue-600 font-medium">Take action →</span>
                  )}
                </div>
                <p className="text-sm text-gray-700">{alert.message}</p>
              </div>
            </div>
          </button>
        ))}
        
        {alerts.length > 5 && (
          <p className="text-xs text-gray-500 text-center mt-2">
            +{alerts.length - 5} more alerts
          </p>
        )}
      </div>
    </div>
  );
}