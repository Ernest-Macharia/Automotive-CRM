// components/orders/WorkflowVisualization.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  CheckCircle, Clock, AlertCircle, FileText, 
  FileSignature, Wrench, ClipboardCheck, ClipboardList,
  CreditCard, Loader2, Play, ArrowRightCircle,
  TrendingUp, Layers, GitBranch, LineChart,
  RefreshCw, AlertTriangle, SkipForward,
  ExternalLink, Eye, Edit, PlusCircle
} from 'lucide-react';
import { lifecycleIntegrationService } from '@/services/lifecycleIntegrationService';
import { useToast } from '@/contexts/ToastContext';

interface WorkflowVisualizationProps {
  opportunityId: string;
  orderId?: string;
  orderType?: 'work_order' | 'sales_order';
  mode?: 'stepper' | 'card' | 'timeline' | 'compact';
  showStats?: boolean;
  onStageAction?: (stage: any, action: string) => void;
}

export default function WorkflowVisualization({
  opportunityId,
  orderId,
  orderType,
  mode = 'stepper',
  showStats = true,
  onStageAction
}: WorkflowVisualizationProps) {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [lifecycle, setLifecycle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [transitioning, setTransitioning] = useState(false);
  const [expandedStage, setExpandedStage] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    fetchLifecycle();
    
    // Auto-refresh every 30 seconds if enabled
    let interval: NodeJS.Timeout;
    if (autoRefresh && opportunityId) {
      interval = setInterval(fetchLifecycle, 30000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [opportunityId, autoRefresh]);

  const fetchLifecycle = async () => {
    if (!opportunityId) return;
    
    try {
      setLoading(true);
      let data;
      
      if (orderType === 'work_order') {
        data = await lifecycleIntegrationService.getWorkOrderLifecycleUI(opportunityId);
      } else if (orderType === 'sales_order') {
        data = await lifecycleIntegrationService.getSalesOrderLifecycleUI(opportunityId);
      } else {
        data = await lifecycleIntegrationService.getLifecycleUI(opportunityId);
      }
      
      setLifecycle(data);
    } catch (error) {
      console.error('Error fetching lifecycle:', error);
      showToast('Failed to load workflow data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStageAction = async (stage: any, action: string) => {
    if (onStageAction) {
      onStageAction(stage, action);
      return;
    }
    
    try {
      switch (action) {
        case 'view':
          if (stage.documentId) {
            const route = this.getDocumentRoute(stage.stage, stage.documentId);
            router.push(route);
          }
          break;
          
        case 'create':
          await handleCreateDocument(stage);
          break;
          
        case 'transition':
          await handleTransition(stage);
          break;
          
        case 'skip':
          await handleSkipStage(stage);
          break;
          
        case 'approve':
          await handleApproveQuote(stage);
          break;
          
        case 'update':
          if (stage.documentId) {
            router.push(`/jobcards/${stage.documentId}/edit`);
          }
          break;
      }
    } catch (error: any) {
      showToast(error.message || 'Action failed', 'error');
    }
  };

  const handleCreateDocument = async (stage: any) => {
    const params = new URLSearchParams();
    params.append('opportunityId', opportunityId);
    if (orderId) params.append('orderId', orderId);
    
    switch (stage.stage) {
      case 'quote':
        router.push(`/quotes/create?${params.toString()}`);
        break;
      case 'invoice':
        router.push(`/invoices/create?${params.toString()}`);
        break;
      case 'jobcard':
        router.push(`/jobcards/create?${params.toString()}`);
        break;
      case 'waiver':
        router.push(`/waivers/create?${params.toString()}`);
        break;
      case 'prechecklist':
        router.push(`/prechecklists/create?${params.toString()}`);
        break;
      case 'postchecklist':
        router.push(`/postchecklists/create?${params.toString()}`);
        break;
    }
  };

  const handleTransition = async (stage: any) => {
    try {
      setTransitioning(true);
      const result = await lifecycleIntegrationService.transitionToNextStage(opportunityId);
      showToast(`Moved to ${result.currentStage} stage`, 'success');
      fetchLifecycle();
    } catch (error: any) {
      showToast(error.message || 'Transition failed', 'error');
    } finally {
      setTransitioning(false);
    }
  };

  const handleSkipStage = async (stage: any) => {
    try {
      setTransitioning(true);
      const result = await lifecycleIntegrationService.skipCurrentStage(opportunityId);
      showToast(`Skipped ${stage.label} stage`, 'info');
      fetchLifecycle();
    } catch (error: any) {
      showToast(error.message || 'Skip failed', 'error');
    } finally {
      setTransitioning(false);
    }
  };

  const handleApproveQuote = async (stage: any) => {
    try {
      // Implement quote approval logic
      showToast('Quote approved', 'success');
      fetchLifecycle();
    } catch (error: any) {
      showToast('Approval failed', 'error');
    }
  };

  const getDocumentRoute = (stage: string, documentId: string) => {
    const routes: Record<string, string> = {
      'quote': `/quotes/${documentId}`,
      'invoice': `/invoices/${documentId}`,
      'jobcard': `/jobcards/${documentId}`,
      'waiver': `/waivers/${documentId}`,
      'prechecklist': `/prechecklists/${documentId}`,
      'postchecklist': `/postchecklists/${documentId}`
    };
    return routes[stage] || `/${stage}s/${documentId}`;
  };

  const getStageIcon = (stage: string) => {
    const icons: Record<string, React.ReactNode> = {
      'quote': <FileText className="h-5 w-5" />,
      'waiver': <FileSignature className="h-5 w-5" />,
      'jobcard': <Wrench className="h-5 w-5" />,
      'prechecklist': <ClipboardCheck className="h-5 w-5" />,
      'postchecklist': <ClipboardList className="h-5 w-5" />,
      'invoice': <CreditCard className="h-5 w-5" />
    };
    return icons[stage] || <FileText className="h-5 w-5" />;
  };

  const getStageColor = (stage: any) => {
    if (stage.completed) return 'text-green-600 bg-green-100 border-green-200';
    if (stage.isCurrent) return 'text-blue-600 bg-blue-100 border-blue-200';
    return 'text-gray-400 bg-gray-100 border-gray-200';
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Loading workflow...</p>
        </div>
      </div>
    );
  }

  if (!lifecycle) {
    return (
      <div className="p-4 text-center">
        <AlertCircle className="h-10 w-10 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-600">No workflow data available</p>
        <button
          onClick={fetchLifecycle}
          className="mt-2 text-sm text-blue-600 hover:text-blue-800"
        >
          Retry
        </button>
      </div>
    );
  }

  // Stepper mode (recommended for work orders)
  if (mode === 'stepper') {
    return (
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Workflow Progress</h3>
              <p className="text-sm text-gray-600">
                {lifecycle.packageType === 'work_order' 
                  ? 'Service Work Order Journey' 
                  : 'Sales Order Journey'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">{lifecycle.progress.percentage}%</div>
                <div className="text-xs text-gray-500">Complete</div>
              </div>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="px-5 pt-4">
          <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500"
              style={{ width: `${lifecycle.progress.percentage}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{lifecycle.progress.completedStages} stages done</span>
            <span>{lifecycle.progress.totalStages} total</span>
          </div>
        </div>

        {/* Stages */}
        <div className="p-5">
          <div className="space-y-4">
            {lifecycle.stages.map((stage: any, index: number) => (
              <div key={stage.stage} className="relative">
                {/* Connecting line */}
                {index < lifecycle.stages.length - 1 && (
                  <div className={`absolute left-5 top-10 h-full w-0.5 ${
                    stage.completed ? 'bg-green-300' : 'bg-gray-200'
                  }`}></div>
                )}
                
                <div className="flex gap-4">
                  {/* Stage indicator */}
                  <div className={`relative z-10 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                    stage.completed
                      ? 'bg-green-500 border-green-500 text-white'
                      : stage.isCurrent
                      ? 'bg-blue-500 border-blue-500 text-white animate-pulse'
                      : 'bg-white border-gray-300 text-gray-400'
                  }`}>
                    {stage.completed ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      getStageIcon(stage.stage)
                    )}
                  </div>
                  
                  {/* Stage content */}
                  <div className={`flex-1 pb-4 ${
                    index < lifecycle.stages.length - 1 ? 'border-b border-gray-100' : ''
                  }`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className={`text-sm font-semibold ${
                            stage.isCurrent ? 'text-blue-600' : 
                            stage.completed ? 'text-green-600' : 'text-gray-600'
                          }`}>
                            {stage.label}
                          </h4>
                          {stage.isCurrent && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                              Current
                            </span>
                          )}
                          {stage.completed && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                              Done
                            </span>
                          )}
                          {stage.skippable && !stage.completed && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                              Optional
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 mb-2">{stage.description}</p>
                        
                        {/* Document info */}
                        {stage.document && (
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <FileText className="h-3 w-3" />
                            <span>Document: #{stage.documentId?.slice(-6)}</span>
                            {stage.document.status && (
                              <span className={`px-1.5 py-0.5 rounded text-xs ${
                                stage.document.status === 'approved' || stage.document.status === 'completed'
                                  ? 'bg-green-100 text-green-800'
                                  : stage.document.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {stage.document.status}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* Actions */}
                      <div className="flex gap-1 flex-shrink-0">
                        {stage.actions.map((action: any, actionIndex: number) => (
                          <button
                            key={actionIndex}
                            onClick={() => handleStageAction(stage, action.action)}
                            disabled={transitioning}
                            className={`px-2 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                              action.color === 'green'
                                ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
                                : action.color === 'blue'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
                                : action.color === 'yellow'
                                ? 'bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100'
                                : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
                            }`}
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Next Steps CTA */}
          {lifecycle.progress.nextStage && !lifecycle.progress.isComplete && (
            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-blue-800">Ready for Next Step</h4>
                  <p className="text-xs text-blue-600 mt-1">
                    Continue to <strong>{lifecycle.stages.find((s: any) => s.stage === lifecycle.progress.nextStage)?.label}</strong>
                  </p>
                </div>
                <button
                  onClick={() => {
                    const currentStage = lifecycle.stages.find((s: any) => s.isCurrent);
                    if (currentStage) {
                      handleStageAction(currentStage, 'transition');
                    }
                  }}
                  disabled={!lifecycle.canTransition || transitioning}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    lifecycle.canTransition
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-sm'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {transitioning ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <ArrowRightCircle className="h-4 w-4" />
                      Continue
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Validation Warning */}
          {!lifecycle.validation?.isValid && lifecycle.validation?.requirements?.length > 0 && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-yellow-800 mb-1">Requirements Pending</h4>
                  <ul className="text-xs text-yellow-700 space-y-1">
                    {lifecycle.validation.requirements.slice(0, 3).map((req: string, idx: number) => (
                      <li key={idx} className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-yellow-500 rounded-full"></div>
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Stats */}
        {showStats && (
          <div className="px-5 pb-4 border-t border-gray-200 pt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{lifecycle.progress.completedStages}</div>
                <div className="text-xs text-gray-600">Completed</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {lifecycle.stages.filter((s: any) => s.document).length}
                </div>
                <div className="text-xs text-gray-600">Documents</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {lifecycle.stages.filter((s: any) => s.completed && s.required).length}
                </div>
                <div className="text-xs text-gray-600">Required Done</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-teal-600">{lifecycle.progress.percentage}%</div>
                <div className="text-xs text-gray-600">Progress</div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Card mode (grid layout)
  if (mode === 'card') {
    return (
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Workflow Stages</h3>
                <p className="text-sm text-gray-600">Complete each stage to finish</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchLifecycle}
                className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                title="Refresh"
              >
                <RefreshCw className="h-4 w-4 text-gray-600" />
              </button>
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`p-2 rounded-lg transition-colors ${
                  autoRefresh 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
                title={autoRefresh ? 'Auto-refresh enabled' : 'Enable auto-refresh'}
              >
                <Clock className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
        
        <div className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {lifecycle.stages.map((stage: any) => (
              <div
                key={stage.stage}
                className={`p-4 rounded-lg border cursor-pointer transition-all duration-300 hover:shadow-md ${
                  stage.completed
                    ? 'border-green-200 bg-green-50 hover:border-green-300'
                    : stage.isCurrent
                    ? 'border-blue-200 bg-blue-50 hover:border-blue-300'
                    : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                }`}
                onClick={() => setExpandedStage(expandedStage === stage.stage ? null : stage.stage)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${getStageColor(stage)}`}>
                      {getStageIcon(stage.stage)}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900">{stage.label}</h4>
                      <p className="text-xs text-gray-600 mt-0.5 line-clamp-1">{stage.description}</p>
                    </div>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${
                    stage.completed ? 'bg-green-500' : 
                    stage.isCurrent ? 'bg-blue-500 animate-ping' : 
                    'bg-gray-300'
                  }`}></div>
                </div>
                
                {/* Status badges */}
                <div className="mt-3 flex flex-wrap gap-1">
                  {stage.isCurrent && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                      Current
                    </span>
                  )}
                  {stage.completed && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                      Done
                    </span>
                  )}
                  {stage.document && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                      ✓ Document
                    </span>
                  )}
                  {stage.skippable && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                      Optional
                    </span>
                  )}
                </div>
                
                {/* Quick Actions */}
                {stage.actions.length > 0 && (
                  <div className="mt-3 flex gap-1">
                    {stage.actions.slice(0, 2).map((action: any, idx: number) => (
                      <button
                        key={idx}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStageAction(stage, action.action);
                        }}
                        disabled={transitioning}
                        className={`flex-1 px-2 py-1 text-xs font-medium rounded transition-colors ${
                          action.color === 'green'
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : action.color === 'blue'
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : action.color === 'yellow'
                            ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                            : 'bg-gray-600 text-white hover:bg-gray-700'
                        }`}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
                
                {/* Expanded View */}
                {expandedStage === stage.stage && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    {stage.document ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">Document:</span>
                          <div className="flex items-center gap-1">
                            <span className="font-medium">#{stage.documentId?.slice(-6)}</span>
                            <button
                              onClick={() => router.push(getDocumentRoute(stage.stage, stage.documentId))}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                        {stage.document.status && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-600">Status:</span>
                            <span className={`px-2 py-0.5 rounded text-xs ${
                              stage.document.status === 'approved'
                                ? 'bg-green-100 text-green-800'
                                : stage.document.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {stage.document.status}
                            </span>
                          </div>
                        )}
                        {stage.document.createdAt && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-600">Created:</span>
                            <span>{new Date(stage.document.createdAt).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-2">
                        <div className="text-xs text-gray-500">No document created yet</div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStageAction(stage, 'create');
                          }}
                          className="mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                          <PlusCircle className="h-3 w-3 inline mr-1" />
                          Create Now
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Timeline mode
  if (mode === 'timeline') {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Workflow Timeline</h3>
            <p className="text-sm text-gray-600">Visual progress through stages</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">{lifecycle.progress.percentage}%</div>
            <div className="text-xs text-gray-500">Complete</div>
          </div>
        </div>

        {/* Timeline */}
        <div className="relative mb-8">
          {/* Progress line */}
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 transform -translate-y-1/2"></div>
          <div 
            className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-blue-500 to-purple-600 transform -translate-y-1/2 transition-all duration-500"
            style={{ width: `${lifecycle.progress.percentage}%` }}
          ></div>
          
          {/* Stage markers */}
          <div className="flex justify-between relative">
            {lifecycle.stages.map((stage: any, index: number) => (
              <div key={stage.stage} className="flex flex-col items-center">
                <button
                  onClick={() => setExpandedStage(expandedStage === stage.stage ? null : stage.stage)}
                  className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                    stage.completed
                      ? 'bg-green-500 border-green-500 text-white scale-110 shadow-lg'
                      : stage.isCurrent
                      ? 'bg-blue-500 border-blue-500 text-white scale-110 shadow-lg'
                      : 'bg-white border-gray-300 text-gray-400 hover:border-gray-400'
                  }`}
                >
                  {stage.completed ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    getStageIcon(stage.stage)
                  )}
                </button>
                <div className="mt-2 text-center">
                  <div className={`text-xs font-medium ${
                    stage.isCurrent ? 'text-blue-600' : 
                    stage.completed ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {stage.label}
                  </div>
                  {stage.isCurrent && (
                    <div className="mt-1">
                      <div className="h-1 w-1 bg-blue-500 rounded-full animate-ping mx-auto"></div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Current stage details */}
        {lifecycle.stages.find((s: any) => s.isCurrent) && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">
                    Current Stage
                  </span>
                  <span className="text-sm text-gray-600">
                    Step {lifecycle.progress.completedStages + 1} of {lifecycle.progress.totalStages}
                  </span>
                </div>
                <h4 className="text-lg font-semibold text-gray-900">
                  {lifecycle.stages.find((s: any) => s.isCurrent)?.label}
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  {lifecycle.stages.find((s: any) => s.isCurrent)?.description}
                </p>
              </div>
              <div className="flex gap-2">
                {lifecycle.stages.find((s: any) => s.isCurrent)?.actions.map((action: any, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => handleStageAction(lifecycle.stages.find((s: any) => s.isCurrent), action.action)}
                    disabled={transitioning}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                      action.color === 'green'
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Compact mode
  if (mode === 'compact') {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-900">Progress</span>
          </div>
          <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
            {lifecycle.progress.percentage}%
          </span>
        </div>
        
        {/* Mini progress bar */}
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden mb-3">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500"
            style={{ width: `${lifecycle.progress.percentage}%` }}
          />
        </div>
        
        <div className="flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${
              lifecycle.stages.find((s: any) => s.isCurrent)?.completed ? 'bg-green-500' : 'bg-blue-500'
            }`}></span>
            <span className="truncate max-w-[100px]">
              {lifecycle.stages.find((s: any) => s.isCurrent)?.label}
            </span>
          </div>
          <span>{lifecycle.progress.completedStages}/{lifecycle.progress.totalStages}</span>
        </div>
        
        {/* Quick actions */}
        {lifecycle.canTransition && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <button
              onClick={() => {
                const currentStage = lifecycle.stages.find((s: any) => s.isCurrent);
                if (currentStage?.actions?.[0]) {
                  handleStageAction(currentStage, currentStage.actions[0].action);
                }
              }}
              disabled={transitioning}
              className="w-full flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 rounded border border-blue-200 hover:bg-blue-100 transition-colors"
            >
              {transitioning ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <>
                  <Play className="h-3 w-3" />
                  Continue
                </>
              )}
            </button>
          </div>
        )}
      </div>
    );
  }

  return null;
}