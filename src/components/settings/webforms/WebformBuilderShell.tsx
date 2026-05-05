'use client';

import { ReactNode } from 'react';

export interface BuilderShellTab {
  id: string;
  label: string;
}

interface WebformBuilderShellProps {
  title: string;
  subtitle?: string;
  tabs: BuilderShellTab[];
  activeTab: string;
  onTabChange: (id: string) => void;
  actions?: ReactNode;
}

export default function WebformBuilderShell({
  title,
  subtitle,
  tabs,
  activeTab,
  onTabChange,
  actions,
}: WebformBuilderShellProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
              activeTab === tab.id
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
