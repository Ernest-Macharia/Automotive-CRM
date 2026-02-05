'use client';

import { WorkOrder } from '@/services/workOrderService';
import { ClipboardCheck, Wrench, ClipboardList, ReceiptIcon, Trophy, BarChart3, ChevronRight } from 'lucide-react';
import { workOrderService } from '@/services/workOrderService';

interface WorkflowProgressProps {
  workOrder: WorkOrder;
}

export default function WorkflowProgress({ workOrder }: WorkflowProgressProps) {
  const stagesConfig = {
    pre_checklist: {
      label: 'Pre-Service',
      description: 'Initial inspection',
      icon: <ClipboardCheck className="h-5 w-5" />,
      color: 'bg-gradient-to-r from-blue-500 to-blue-600'
    },
    job_card: {
      label: 'Execution',
      description: 'Service work',
      icon: <Wrench className="h-5 w-5" />,
      color: 'bg-gradient-to-r from-indigo-500 to-indigo-600'
    },
    post_checklist: {
      label: 'Quality',
      description: 'Verification',
      icon: <ClipboardList className="h-5 w-5" />,
      color: 'bg-gradient-to-r from-purple-500 to-purple-600'
    },
    invoice: {
      label: 'Billing',
      description: 'Payment',
      icon: <ReceiptIcon className="h-5 w-5" />,
      color: 'bg-gradient-to-r from-green-500 to-emerald-600'
    }
  };

  const stages = Object.keys(stagesConfig);
  const currentIndex = stages.indexOf(workOrder.currentStage || 'pre_checklist');
  const progress = ((currentIndex + 1) / stages.length) * 100;

  const getStageStatus = (stage: string, index: number) => {
    if (workOrder.status === 'completed') return 'completed';
    if (index < currentIndex) return 'completed';
    if (index === currentIndex) return 'current';
    return 'pending';
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Workflow Progress</h3>
        <div className="text-sm font-medium text-gray-600">
          Stage {currentIndex + 1} of {stages.length}
        </div>
      </div>
      
      {/* Enhanced Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-medium text-gray-700">Overall Completion</div>
          <div className="text-lg font-bold text-blue-600">{Math.round(progress)}%</div>
        </div>
        <div className="relative">
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-green-500 rounded-full transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-2">
            {stages.map((stage, index) => (
              <div key={stage} className="relative">
                <div className={`w-2 h-2 rounded-full ${
                  getStageStatus(stage, index) === 'completed' ? 'bg-green-500' :
                  getStageStatus(stage, index) === 'current' ? 'bg-blue-500 ring-4 ring-blue-100' :
                  'bg-gray-300'
                }`} />
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Stage Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {stages.map((stage, index) => {
          const status = getStageStatus(stage, index);
          const stageData = stagesConfig[stage as keyof typeof stagesConfig];
          
          return (
            <div
              key={stage}
              className={`p-4 rounded-xl border transition-all duration-300 ${
                status === 'current' 
                  ? 'border-blue-300 bg-gradient-to-br from-blue-50 to-white shadow-md' 
                  : status === 'completed'
                  ? 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-white'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-lg ${
                  status === 'current' ? 'bg-blue-100' : 
                  status === 'completed' ? 'bg-emerald-100' : 'bg-gray-100'
                }`}>
                  <div className={
                    status === 'current' ? 'text-blue-600' :
                    status === 'completed' ? 'text-emerald-600' : 'text-gray-400'
                  }>
                    {stageData.icon}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{stageData.label}</h4>
                  <p className="text-xs text-gray-600">{stageData.description}</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className={`text-xs font-medium px-2 py-1 rounded ${
                  status === 'current' ? 'bg-blue-100 text-blue-700' : 
                  status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 
                  'bg-gray-100 text-gray-500'
                }`}>
                  {status === 'current' ? 'In Progress' : 
                   status === 'completed' ? '✓ Complete' : 'Upcoming'}
                </div>
                {index < stages.length - 1 && (
                  <ChevronRight className={`h-4 w-4 ${
                    status === 'completed' ? 'text-emerald-400' : 'text-gray-300'
                  }`} />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}