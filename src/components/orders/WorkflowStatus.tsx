'use client';

import React from 'react';
import { CheckCircle, Circle, CircleDot } from 'lucide-react';

export type WorkflowStageStatus = {
  stage: string;
  label: string;
  completed: boolean;
  isCurrent: boolean;
  helperText?: string;
};

type Props = {
  title: string;
  subtitle?: string;
  currentStageLabel?: string;
  currentStageHelper?: string;
  stages: WorkflowStageStatus[];
  summaryCards?: React.ReactNode;
};

/**
 * SalesOrder-style workflow tracker.
 * - Compact header (title/subtitle + current stage)
 * - Horizontal timeline with Done/Active/Pending
 * - Optional summary cards section
 */
export default function WorkflowStatus({
  title,
  subtitle,
  currentStageLabel,
  currentStageHelper,
  stages,
  summaryCards,
}: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {subtitle ? <p className="text-sm text-gray-600">{subtitle}</p> : null}
        </div>
        <div className="text-right">
          {currentStageLabel ? (
            <>
              <p className="text-sm text-gray-600">Current Stage</p>
              <p className="text-lg font-semibold text-blue-700">{currentStageLabel}</p>
              {currentStageHelper ? (
                <p className="text-xs text-green-600">{currentStageHelper}</p>
              ) : null}
            </>
          ) : null}
        </div>
      </div>

      <div className="relative">
        <div className="absolute left-6 right-6 top-6 h-0.5 bg-gray-200" />
        <div className="relative flex justify-between">
          {stages.map((s) => (
            <div key={s.stage} className="flex flex-col items-center">
              <div
                className={`w-12 h-12 rounded-full border-4 flex items-center justify-center ${
                  s.completed
                    ? 'bg-green-50 border-green-500'
                    : s.isCurrent
                      ? 'bg-blue-50 border-blue-500'
                      : 'bg-gray-50 border-gray-300'
                }`}
              >
                {s.completed ? (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                ) : s.isCurrent ? (
                  <CircleDot className="h-6 w-6 text-blue-600" />
                ) : (
                  <Circle className="h-6 w-6 text-gray-400" />
                )}
              </div>
              <div className="mt-3 text-center">
                <p className="text-sm font-medium text-gray-900">{s.label}</p>
                <p className="text-xs text-gray-500">
                  {s.helperText ?? (s.completed ? 'Completed' : s.isCurrent ? 'In progress' : 'Pending')}
                </p>
                {s.completed ? (
                  <span className="inline-flex items-center mt-1 px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                    ✓ Done
                  </span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>

      {summaryCards ? <div className="mt-8">{summaryCards}</div> : null}
    </div>
  );
}
