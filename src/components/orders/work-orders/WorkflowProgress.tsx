import { WorkOrder } from '@/services/workOrderService';

interface WorkflowProgressProps {
  workOrder: WorkOrder;
}

export default function WorkflowProgress({ workOrder }: WorkflowProgressProps) {
  const stagesConfig = {
    pre_checklist: {
      label: 'Pre-Checklist',
      icon: '📋'
    },
    job_card: {
      label: 'Job Card',
      icon: '🔧'
    },
    post_checklist: {
      label: 'Post-Checklist',
      icon: '✅'
    },
    invoice: {
      label: 'Invoice',
      icon: '💰'
    }
  };

  const stages = Object.keys(stagesConfig);
  const currentIndex = stages.indexOf(workOrder.currentStage || 'pre_checklist');
  const progress = ((currentIndex + 1) / stages.length) * 100;

  const getStageStatus = (stage: string, index: number) => {
    if (index < currentIndex) return 'completed';
    if (index === currentIndex) return 'current';
    return 'pending';
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Workflow Progress</h3>
      
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-medium text-gray-700">Overall Progress</div>
          <div className="text-lg font-bold text-blue-600">{Math.round(progress)}%</div>
        </div>
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      
      {/* Stage Indicators */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stages.map((stage, index) => {
          const status = getStageStatus(stage, index);
          const stageData = stagesConfig[stage as keyof typeof stagesConfig];
          
          return (
            <div
              key={stage}
              className={`p-4 rounded-lg border ${
                status === 'current' 
                  ? 'border-blue-500 bg-blue-50' 
                  : status === 'completed'
                  ? 'border-green-200 bg-green-50'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg ${
                  status === 'current' ? 'bg-blue-100' : 
                  status === 'completed' ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  <span className={
                    status === 'current' ? 'text-blue-600' :
                    status === 'completed' ? 'text-green-600' : 'text-gray-400'
                  }>
                    {stageData.icon}
                  </span>
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{stageData.label}</h4>
                  <p className="text-xs text-gray-600">
                    {(() => {
                      switch (stage) {
                        case 'pre_checklist': return 'Pre-service inspection';
                        case 'job_card': return 'Technician assignments';
                        case 'post_checklist': return 'Quality verification';
                        case 'invoice': return 'Billing and payment';
                        default: return '';
                      }
                    })()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className={`text-xs font-medium ${
                  status === 'current' ? 'text-blue-600' : 
                  status === 'completed' ? 'text-green-600' : 'text-gray-400'
                }`}>
                  {status === 'current' ? 'Current' : 
                   status === 'completed' ? '✓ Complete' : 'Pending'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}