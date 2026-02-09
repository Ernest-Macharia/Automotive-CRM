// src/components/sales/SalesOrderLifecycleWidget.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  TrendingUp, CheckCircle, Clock, AlertCircle, 
  Play, FileText, CreditCard, Truck,
  ChevronRight, Loader2
} from 'lucide-react';
import { lifecycleIntegrationService } from '@/services/lifecycleIntegrationService';
import { useToast } from '@/contexts/ToastContext';

interface SalesOrderLifecycleWidgetProps {
  opportunityId: string;
  salesOrderId?: string;
  compact?: boolean;
}

export default function SalesOrderLifecycleWidget({
  opportunityId,
  salesOrderId,
  compact = false
}: SalesOrderLifecycleWidgetProps) {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [lifecycle, setLifecycle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    if (opportunityId) {
      fetchLifecycle();
    }
  }, [opportunityId]);

  const fetchLifecycle = async () => {
    try {
      setLoading(true);
      const data = await lifecycleIntegrationService.getSalesOrderLifecycleUI(opportunityId);
      setLifecycle(data);
    } catch (error) {
      console.error('Error fetching sales order lifecycle:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (stage: any, action: string) => {
    try {
      if (action === 'create') {
        if (stage.stage === 'quote') {
          router.push(`/quotes/create?opportunityId=${opportunityId}${salesOrderId ? `&orderId=${salesOrderId}` : ''}`);
        } else if (stage.stage === 'invoice') {
          router.push(`/invoices/create?opportunityId=${opportunityId}${salesOrderId ? `&orderId=${salesOrderId}` : ''}`);
        }
      } else if (action === 'view' && stage.documentId) {
        router.push(`/${stage.documentType?.toLowerCase()}s/${stage.documentId}`);
      }
    } catch (error: any) {
      showToast(error.message || 'Action failed', 'error');
    } finally {
      setTransitioning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!lifecycle) return null;

  if (compact) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-900">Sales Progress</span>
          </div>
          <span className="text-xs font-medium text-blue-600">
            {lifecycle.progress.percentage}%
          </span>
        </div>
        
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-3">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500"
            style={{ width: `${lifecycle.progress.percentage}%` }}
          />
        </div>
        
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span>{lifecycle.currentStage}</span>
          <span>{lifecycle.progress.completedStages}/{lifecycle.progress.totalStages}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <h3 className="text-sm font-semibold text-gray-900">Sales Workflow</h3>
          </div>
          <div className="text-xs text-gray-600">
            {lifecycle.progress.completedStages} of {lifecycle.progress.totalStages} stages
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-2">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-gray-600">Overall Progress</span>
            <span className="font-medium text-blue-600">{lifecycle.progress.percentage}%</span>
          </div>
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500"
              style={{ width: `${lifecycle.progress.percentage}%` }}
            />
          </div>
        </div>
      </div>
      
      {/* Stages */}
      <div className="p-4">
        <div className="space-y-3">
          {lifecycle.stages.map((stage: any, index: number) => (
            <div
              key={stage.stage}
              className={`p-3 rounded-lg border ${
                stage.completed
                  ? 'border-green-200 bg-green-50'
                  : stage.isCurrent
                  ? 'border-blue-200 bg-blue-50'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded ${
                    stage.completed
                      ? 'bg-green-100 text-green-600'
                      : stage.isCurrent
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    {stage.completed ? (
                      <CheckCircle className="h-3 w-3" />
                    ) : stage.isCurrent ? (
                      <Clock className="h-3 w-3" />
                    ) : (
                      <div className="w-3 h-3 border border-gray-300 rounded-full"></div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-gray-900">{stage.label}</span>
                      {stage.isCurrent && (
                        <span className="px-1.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5">{stage.description}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  {stage.actions.map((action: any, actionIndex: number) => (
                    <button
                      key={actionIndex}
                      onClick={() => handleAction(stage, action.action)}
                      disabled={transitioning}
                      className={`px-2 py-1 text-xs font-medium rounded border transition-colors ${
                        action.color === 'green'
                          ? 'border-green-300 bg-green-50 text-green-700 hover:bg-green-100'
                          : action.color === 'blue'
                          ? 'border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100'
                          : 'border-purple-300 bg-purple-50 text-purple-700 hover:bg-purple-100'
                      }`}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Document info */}
              {stage.document && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">{stage.documentType}:</span>
                    <span className="font-medium">{stage.documentId?.slice(-6)}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* Next Actions */}
        {lifecycle.nextActions.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="text-xs font-semibold text-gray-900 mb-2">Quick Actions</h4>
            <div className="space-y-2">
              {lifecycle.nextActions.map((action: any, index: number) => (
                <button
                  key={index}
                  onClick={action.action}
                  className="w-full flex items-center justify-between p-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span>{action.icon}</span>
                    <span>{action.label}</span>
                  </div>
                  <ChevronRight className="h-3 w-3 text-gray-400" />
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Validation Status */}
        {!lifecycle.validation?.isValid && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="h-3 w-3 text-yellow-600" />
              <span className="text-xs font-semibold text-yellow-800">Requirements Pending</span>
            </div>
            <ul className="text-xs text-yellow-700 space-y-0.5">
              {lifecycle.validation?.requirements.slice(0, 2).map((req: string, index: number) => (
                <li key={index} className="flex items-center gap-1.5">
                  <span className="w-1 h-1 bg-yellow-500 rounded-full"></span>
                  {req}
                </li>
              ))}
              {lifecycle.validation?.requirements.length > 2 && (
                <li className="text-xs text-yellow-600">
                  +{lifecycle.validation.requirements.length - 2} more
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}