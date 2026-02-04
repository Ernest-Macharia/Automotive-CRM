import { useState, useEffect } from 'react';
import { 
  Clock, AlertTriangle, CheckCircle, Calendar,
  Edit2, XCircle, Loader2, FileText,
  TrendingUp, AlertCircle, History, ChevronRight
} from 'lucide-react';
import { WorkOrder, DelayInfo } from '@/services/workOrderService';
import { workOrderService } from '@/services/workOrderService';
import { format, differenceInDays, differenceInHours, parseISO } from 'date-fns';

interface DelayTabProps {
  workOrder: WorkOrder;
  isTransitioning: boolean;
  onAction: (action: () => Promise<void>) => Promise<void>;
}

interface DelayFormData {
  reason: string;
  category: string;
  expectedCompletionDate: string;
  notes: string;
}

export default function DelayTab({ 
  workOrder, 
  isTransitioning, 
  onAction 
}: DelayTabProps) {
  const [isDelayed, setIsDelayed] = useState(workOrder.status === 'delayed');
  const [delayInfo, setDelayInfo] = useState<DelayInfo | null>(workOrder.delayInfo || null);
  const [editing, setEditing] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState<DelayFormData>({
    reason: '',
    category: 'technical',
    expectedCompletionDate: '',
    notes: ''
  });

  useEffect(() => {
    setIsDelayed(workOrder.status === 'delayed');
    setDelayInfo(workOrder.delayInfo || null);
  }, [workOrder]);

  const calculateDelayDuration = (detectedAt: string, expectedCompletionDate?: string) => {
    const detected = parseISO(detectedAt);
    const now = new Date();
    const expected = expectedCompletionDate ? parseISO(expectedCompletionDate) : null;
    
    const days = differenceInDays(now, detected);
    const hours = differenceInHours(now, detected) % 24;
    
    return { days, hours };
  };

  const getDelayCategoryOptions = () => [
    { value: 'technical', label: 'Technical Issue', color: 'bg-red-100 text-red-800' },
    { value: 'parts', label: 'Parts Unavailable', color: 'bg-orange-100 text-orange-800' },
    { value: 'weather', label: 'Weather Conditions', color: 'bg-blue-100 text-blue-800' },
    { value: 'customer', label: 'Customer Related', color: 'bg-purple-100 text-purple-800' },
    { value: 'scheduling', label: 'Scheduling Conflict', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'other', label: 'Other', color: 'bg-gray-100 text-gray-800' }
  ];

  const handleMarkAsDelayed = async () => {
    if (!formData.reason.trim() || !formData.expectedCompletionDate) {
      alert('Please provide a reason and expected completion date');
      return;
    }

    setLoading(true);
    try {
      await onAction(async () => {
        const data = {
          reason: formData.reason,
          expectedCompletionDate: formData.expectedCompletionDate,
          notes: formData.notes
        };
        
        await workOrderService.markAsDelayed(workOrder._id, data);
        setIsDelayed(true);
        setEditing(false);
        resetForm();
        
        // Reload work order data
        const updatedWorkOrder = await workOrderService.getWorkOrderById(workOrder._id);
        setDelayInfo(updatedWorkOrder.delayInfo || null);
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDelay = async () => {
    if (!formData.reason.trim() || !formData.expectedCompletionDate) {
      alert('Please provide a reason and expected completion date');
      return;
    }

    setLoading(true);
    try {
      await onAction(async () => {
        await workOrderService.updateWorkOrder(workOrder._id, {
          delayInfo: {
            ...delayInfo,
            reason: formData.reason,
            category: formData.category,
            expectedCompletionDate: formData.expectedCompletionDate,
            notes: formData.notes
          }
        });
        
        setIsDelayed(true);
        setEditing(false);
        resetForm();
        
        // Reload work order data
        const updatedWorkOrder = await workOrderService.getWorkOrderById(workOrder._id);
        setDelayInfo(updatedWorkOrder.delayInfo || null);
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResolveDelay = async () => {
    setResolving(true);
    try {
      await onAction(async () => {
        await workOrderService.resolveDelay(workOrder._id);
        setIsDelayed(false);
        setDelayInfo(null);
        
        // Also update work order status if needed
        if (workOrder.currentStage) {
          await workOrderService.updateWorkOrder(workOrder._id, {
            status: workOrder.currentStage.replace('_', ' ').toLowerCase()
          });
        }
      });
    } finally {
      setResolving(false);
    }
  };

  const startEditing = () => {
    if (delayInfo) {
      setFormData({
        reason: delayInfo.reason || '',
        category: delayInfo.category || 'technical',
        expectedCompletionDate: delayInfo.expectedCompletionDate 
          ? format(parseISO(delayInfo.expectedCompletionDate), 'yyyy-MM-dd')
          : format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
        notes: delayInfo.notes || ''
      });
    } else {
      const defaultDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      setFormData({
        ...formData,
        expectedCompletionDate: format(defaultDate, 'yyyy-MM-dd')
      });
    }
    setEditing(true);
  };

  const resetForm = () => {
    setFormData({
      reason: '',
      category: 'technical',
      expectedCompletionDate: '',
      notes: ''
    });
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    return format(parseISO(dateString), 'MMM dd, yyyy HH:mm');
  };

  const getDelaySeverity = (days?: number) => {
    if (!days) return 'none';
    if (days <= 2) return 'minor';
    if (days <= 5) return 'moderate';
    return 'severe';
  };

  const getDelaySeverityColor = (days?: number) => {
    const severity = getDelaySeverity(days);
    switch (severity) {
      case 'minor': return 'bg-yellow-100 text-yellow-800';
      case 'moderate': return 'bg-orange-100 text-orange-800';
      case 'severe': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDelayCategoryColor = (category?: string) => {
    const option = getDelayCategoryOptions().find(opt => opt.value === category);
    return option?.color || 'bg-gray-100 text-gray-800';
  };

  const getDelayCategoryLabel = (category?: string) => {
    const option = getDelayCategoryOptions().find(opt => opt.value === category);
    return option?.label || 'Unknown';
  };

  const delayDuration = delayInfo ? calculateDelayDuration(
    delayInfo.detectedAt,
    delayInfo.expectedCompletionDate
  ) : { days: 0, hours: 0 };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Delay Management</h3>
            <p className="text-sm text-gray-600">
              Track and manage work order delays
            </p>
          </div>
          
          {!isDelayed ? (
            <button
              onClick={startEditing}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-2"
            >
              <AlertTriangle className="h-4 w-4" />
              Mark as Delayed
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={startEditing}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Edit2 className="h-4 w-4" />
                Edit Delay Info
              </button>
              <button
                onClick={handleResolveDelay}
                disabled={resolving || isTransitioning}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 disabled:opacity-50"
              >
                {resolving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                Resolve Delay
              </button>
            </div>
          )}
        </div>

        {/* Delay Status Card */}
        <div className={`rounded-xl p-6 mb-6 ${
          isDelayed 
            ? 'bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200' 
            : 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200'
        }`}>
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-full ${
              isDelayed ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'
            }`}>
              {isDelayed ? (
                <AlertTriangle className="h-8 w-8" />
              ) : (
                <CheckCircle className="h-8 w-8" />
              )}
            </div>
            <div className="flex-1">
              <h4 className="text-xl font-bold text-gray-900 mb-2">
                {isDelayed ? 'Work Order Delayed' : 'Work Order On Track'}
              </h4>
              <p className="text-gray-600 mb-4">
                {isDelayed 
                  ? `Delayed since ${formatDate(delayInfo?.detectedAt)}`
                  : 'No delays reported. Work order is progressing as scheduled.'
                }
              </p>
              
              {isDelayed && delayInfo && (
                <div className="flex flex-wrap gap-3">
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${getDelaySeverityColor(delayDuration.days)}`}>
                    {delayDuration.days > 0 ? `${delayDuration.days} days delayed` : 'New delay'}
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${getDelayCategoryColor(delayInfo.category)}`}>
                    {getDelayCategoryLabel(delayInfo.category)}
                  </div>
                  {delayInfo.resolvedAt && (
                    <div className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      Resolved {formatDate(delayInfo.resolvedAt)}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Delay Form (Edit/Create) */}
        {(editing || !isDelayed) && (
          <div className="mb-6 bg-gray-50 rounded-xl p-6 border border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-gray-600" />
              <h4 className="font-medium text-gray-900">
                {delayInfo ? 'Update Delay Information' : 'Report Delay'}
              </h4>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Delay Reason *
                </label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({...formData, reason: e.target.value})}
                  placeholder="Describe the reason for the delay..."
                  className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  disabled={loading || isTransitioning}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Delay Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    disabled={loading || isTransitioning}
                  >
                    {getDelayCategoryOptions().map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expected Completion Date *
                  </label>
                  <input
                    type="date"
                    value={formData.expectedCompletionDate}
                    onChange={(e) => setFormData({...formData, expectedCompletionDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    disabled={loading || isTransitioning}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Any additional details or actions being taken..."
                  className="w-full h-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  disabled={loading || isTransitioning}
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  onClick={delayInfo ? handleUpdateDelay : handleMarkAsDelayed}
                  disabled={!formData.reason.trim() || !formData.expectedCompletionDate || loading || isTransitioning}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : delayInfo ? (
                    <Edit2 className="h-4 w-4" />
                  ) : (
                    <AlertTriangle className="h-4 w-4" />
                  )}
                  {delayInfo ? 'Update Delay' : 'Mark as Delayed'}
                </button>
                
                <button
                  onClick={() => {
                    setEditing(false);
                    resetForm();
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delay Details */}
        {isDelayed && delayInfo && !editing && (
          <div className="space-y-6">
            {/* Delay Timeline */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h4 className="font-medium text-gray-900 mb-6">Delay Timeline</h4>
              
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-300"></div>
                
                <div className="space-y-8 relative">
                  {/* Detected */}
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                        <AlertCircle className="h-8 w-8 text-red-600" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h5 className="font-medium text-gray-900 mb-1">Delay Detected</h5>
                      <p className="text-gray-600 mb-2">{delayInfo.reason}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(delayInfo.detectedAt)}</span>
                        <ChevronRight className="h-3 w-3" />
                        <span className="font-medium text-gray-700">
                          Expected: {formatDate(delayInfo.expectedCompletionDate)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Resolution (if resolved) */}
                  {delayInfo.resolvedAt && (
                    <div className="flex items-start gap-4">
                      <div className="relative">
                        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                          <CheckCircle className="h-8 w-8 text-green-600" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h5 className="font-medium text-gray-900 mb-1">Delay Resolved</h5>
                        <p className="text-gray-600 mb-2">
                          Delay resolved and work order back on track
                        </p>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(delayInfo.resolvedAt)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Delay Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Clock className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Current Delay</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {delayDuration.days > 0 ? `${delayDuration.days} days` : '< 1 day'}
                    </div>
                  </div>
                </div>
                <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getDelaySeverityColor(delayDuration.days)}`}>
                  {getDelaySeverity(delayDuration.days).toUpperCase()}
                </div>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Calendar className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">New ETA</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {delayInfo.expectedCompletionDate 
                        ? format(parseISO(delayInfo.expectedCompletionDate), 'MMM dd')
                        : '—'}
                    </div>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  Original: {formatDate(workOrder.estimatedCompletionDate)}
                </div>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <History className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Delay Category</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {getDelayCategoryLabel(delayInfo.category)}
                    </div>
                  </div>
                </div>
                <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getDelayCategoryColor(delayInfo.category)}`}>
                  {delayInfo.category || 'Uncategorized'}
                </div>
              </div>
            </div>

            {/* Additional Notes */}
            {delayInfo.notes && (
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h4 className="font-medium text-gray-900 mb-4">Additional Notes</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {delayInfo.notes}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* No Delay Info */}
        {!isDelayed && !editing && (
          <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl">
            <CheckCircle className="h-16 w-16 mx-auto text-green-400" />
            <h4 className="mt-4 text-lg font-semibold text-gray-900">No Delays Reported</h4>
            <p className="mt-2 text-gray-600 max-w-md mx-auto">
              This work order is progressing as scheduled. Use the button above to report any delays.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}