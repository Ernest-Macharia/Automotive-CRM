'use client';

import { useState, useEffect } from 'react';
import { 
  Clock, AlertTriangle, CheckCircle, Calendar,
  Edit2, Loader2, TrendingUp, AlertCircle,
  History, ChevronRight, XCircle, RefreshCw,
  Target, BarChart, Zap, Shield,
  Timer, Play, Pause, StopCircle,
  ChevronDown, ChevronUp, CalendarClock,
  Copy, Download, Upload, Trash2
} from 'lucide-react';
import { WorkOrder, DelayInfo } from '@/services/workOrderService';
import { workOrderService } from '@/services/workOrderService';
import { format, differenceInDays, differenceInHours, differenceInMinutes, parseISO, isAfter } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/contexts/ToastContext';

interface DelayTabProps {
  workOrder: WorkOrder;
  isTransitioning: boolean;
  onAction: (action: () => Promise<void>) => Promise<void>;
}

interface DelayFormData {
  reason: string;
  category: string;
  expectedCompletionDate: string;
  expectedCompletionTime: string;
  notes: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  estimatedResolutionHours: number;
}

interface TimeLog {
  id: string;
  action: 'started' | 'paused' | 'resumed' | 'resolved';
  timestamp: string;
  notes?: string;
  user?: string;
}

export default function DelayTab({ workOrder, isTransitioning, onAction }: DelayTabProps) {
  const { showToast } = useToast();
  const [isDelayed, setIsDelayed] = useState(workOrder.status === 'delayed');
  const [delayInfo, setDelayInfo] = useState<DelayInfo | null>(workOrder.delayInfo || null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
  const [showTimeDetails, setShowTimeDetails] = useState(false);
  const [activeTimer, setActiveTimer] = useState<{
    startedAt: string;
    pausedAt?: string;
    totalPausedTime: number; // in milliseconds
  } | null>(null);
  
  const [formData, setFormData] = useState<DelayFormData>({
    reason: '',
    category: 'technical',
    expectedCompletionDate: '',
    expectedCompletionTime: '09:00',
    notes: '',
    impact: 'medium',
    estimatedResolutionHours: 8
  });

  const [, forceUpdate] = useState({});

  useEffect(() => {
    setIsDelayed(workOrder.status === 'delayed');
    setDelayInfo(workOrder.delayInfo || null);
    if (workOrder.delayInfo) {
      initializeTimeLogs();
      initializeTimer();
    }
  }, [workOrder]);

  useEffect(() => {
    // Auto-update active timer every minute
    const timerInterval = setInterval(() => {
      if (activeTimer && !activeTimer.pausedAt) {
        // Re-render to update elapsed time display
        forceUpdate({});
      }
    }, 60000);
    
    return () => clearInterval(timerInterval);
  }, [activeTimer]);

  const initializeTimeLogs = () => {
    if (!delayInfo) return;
    
    const logs: TimeLog[] = [
      {
        id: '1',
        action: 'started',
        timestamp: delayInfo.detectedAt,
        notes: delayInfo.reason,
        user: delayInfo.createdBy || 'system'
      }
    ];
    
    if (delayInfo.notes) {
      logs.push({
        id: '2',
        action: 'paused',
        timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        notes: 'Initial assessment',
        user: 'admin'
      });
    }
    
    setTimeLogs(logs);
  };

  const initializeTimer = () => {
    if (!delayInfo) return;
    
    setActiveTimer({
      startedAt: delayInfo.detectedAt,
      totalPausedTime: 0,
      pausedAt: undefined
    });
  };

  const calculateDelayMetrics = (detectedAt: string) => {
    const detected = parseISO(detectedAt);
    const now = new Date();
    
    const totalMinutes = differenceInMinutes(now, detected);
    const days = Math.floor(totalMinutes / (24 * 60));
    const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
    const minutes = totalMinutes % 60;
    const totalHours = totalMinutes / 60;
    
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (days > 7) severity = 'critical';
    else if (days > 3) severity = 'high';
    else if (days > 1) severity = 'medium';
    
    return { 
      days, 
      hours, 
      minutes, 
      totalMinutes, 
      totalHours, 
      severity,
      detectedAt: format(detected, 'MMM dd, yyyy HH:mm'),
      elapsedTime: formatElapsedTime(totalMinutes)
    };
  };

  const calculateActiveDuration = () => {
    if (!activeTimer) return 0;
    
    const startedAt = new Date(activeTimer.startedAt).getTime();
    const now = Date.now();
    const pausedTime = activeTimer.pausedAt 
      ? (now - new Date(activeTimer.pausedAt).getTime()) + activeTimer.totalPausedTime
      : activeTimer.totalPausedTime;
    
    return Math.floor((now - startedAt - pausedTime) / 1000);
  };

  const formatElapsedTime = (minutes: number) => {
    const days = Math.floor(minutes / (24 * 60));
    const hours = Math.floor((minutes % (24 * 60)) / 60);
    const mins = minutes % 60;
    
    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (mins > 0 || parts.length === 0) parts.push(`${mins}m`);
    
    return parts.join(' ');
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const getDelayCategories = () => [
    { 
      value: 'technical', 
      label: 'Technical Issue', 
      icon: <Zap className="h-4 w-4" />,
      color: 'bg-red-500/10 text-red-600 border-red-200',
      description: 'Equipment failure, technical problems'
    },
    { 
      value: 'parts', 
      label: 'Parts Unavailable', 
      icon: <Target className="h-4 w-4" />,
      color: 'bg-orange-500/10 text-orange-600 border-orange-200',
      description: 'Missing components or supplies'
    },
    { 
      value: 'weather', 
      label: 'Weather Conditions', 
      icon: <AlertCircle className="h-4 w-4" />,
      color: 'bg-blue-500/10 text-blue-600 border-blue-200',
      description: 'Adverse weather preventing work'
    },
    { 
      value: 'customer', 
      label: 'Customer Related', 
      icon: <Shield className="h-4 w-4" />,
      color: 'bg-purple-500/10 text-purple-600 border-purple-200',
      description: 'Customer availability or requirements'
    },
    { 
      value: 'scheduling', 
      label: 'Scheduling Conflict', 
      icon: <CalendarClock className="h-4 w-4" />,
      color: 'bg-yellow-500/10 text-yellow-600 border-yellow-200',
      description: 'Resource or timeline conflicts'
    },
    { 
      value: 'permit', 
      label: 'Permit Issues', 
      icon: <Copy className="h-4 w-4" />,
      color: 'bg-cyan-500/10 text-cyan-600 border-cyan-200',
      description: 'Regulatory or permit delays'
    }
  ];

  const getImpactConfig = (impact: string) => {
    const configs = {
      low: {
        color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        icon: <CheckCircle className="h-4 w-4" />,
        label: 'Low Impact',
        description: 'Minimal schedule impact'
      },
      medium: {
        color: 'bg-amber-100 text-amber-800 border-amber-200',
        icon: <AlertCircle className="h-4 w-4" />,
        label: 'Medium Impact',
        description: 'Moderate schedule impact'
      },
      high: {
        color: 'bg-orange-100 text-orange-800 border-orange-200',
        icon: <AlertTriangle className="h-4 w-4" />,
        label: 'High Impact',
        description: 'Significant schedule impact'
      },
      critical: {
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: <StopCircle className="h-4 w-4" />,
        label: 'Critical Impact',
        description: 'Major schedule disruption'
      }
    };
    return configs[impact as keyof typeof configs] || configs.medium;
  };

  const handleMarkAsDelayed = async () => {
    if (!formData.reason.trim()) {
      showToast('Please provide a delay reason', 'error');
      return;
    }
    
    setLoading(true);
    try {
      await onAction(async () => {
        const expectedCompletion = formData.expectedCompletionDate && formData.expectedCompletionTime
          ? `${formData.expectedCompletionDate}T${formData.expectedCompletionTime}:00`
          : new Date(Date.now() + formData.estimatedResolutionHours * 3600000).toISOString();
        
        const delayData = {
          reason: formData.reason,
          expectedCompletionDate: expectedCompletion,
          notes: formData.notes,
          category: formData.category,
          impact: formData.impact,
          estimatedResolutionHours: formData.estimatedResolutionHours,
          detectedAt: new Date().toISOString()
        };
        
        await workOrderService.markAsDelayed(workOrder._id, delayData);
        
        const updated = await workOrderService.getWorkOrderById(workOrder._id);
        setIsDelayed(true);
        setDelayInfo(updated.delayInfo);
        
        // Initialize timer and logs
        setActiveTimer({
          startedAt: new Date().toISOString(),
          totalPausedTime: 0
        });
        
        setTimeLogs([{
          id: Date.now().toString(),
          action: 'started',
          timestamp: new Date().toISOString(),
          notes: formData.reason,
          user: 'system'
        }]);
        
        setEditing(false);
        resetForm();
        showToast('Delay reported successfully', 'success');
      });
    } catch (error: any) {
      showToast(error.message || 'Failed to report delay', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResolveDelay = async () => {
    setLoading(true);
    try {
      await onAction(async () => {
        await workOrderService.resolveDelay(workOrder._id);
        setIsDelayed(false);
        setDelayInfo(null);
        setActiveTimer(null);
        
        // Add resolution log
        if (timeLogs.length > 0) {
          setTimeLogs(prev => [...prev, {
            id: Date.now().toString(),
            action: 'resolved',
            timestamp: new Date().toISOString(),
            notes: 'Delay resolved and work order resumed',
            user: 'system'
          }]);
        }
        
        showToast('Delay resolved successfully', 'success');
      });
    } catch (error: any) {
      showToast(error.message || 'Failed to resolve delay', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePauseTimer = () => {
    if (!activeTimer) return;
    
    setActiveTimer({
      ...activeTimer,
      pausedAt: new Date().toISOString()
    });
    
    setTimeLogs(prev => [...prev, {
      id: Date.now().toString(),
      action: 'paused',
      timestamp: new Date().toISOString(),
      notes: 'Timer paused',
      user: 'user'
    }]);
    
    showToast('Delay timer paused', 'info');
  };

  const handleResumeTimer = () => {
    if (!activeTimer || !activeTimer.pausedAt) return;
    
    const pausedDuration = Date.now() - new Date(activeTimer.pausedAt).getTime();
    
    setActiveTimer({
      ...activeTimer,
      pausedAt: undefined,
      totalPausedTime: activeTimer.totalPausedTime + pausedDuration
    });
    
    setTimeLogs(prev => [...prev, {
      id: Date.now().toString(),
      action: 'resumed',
      timestamp: new Date().toISOString(),
      notes: 'Timer resumed',
      user: 'user'
    }]);
    
    showToast('Delay timer resumed', 'success');
  };

  const handleAddTimeLog = (action: TimeLog['action'], notes?: string) => {
    const newLog: TimeLog = {
      id: Date.now().toString(),
      action,
      timestamp: new Date().toISOString(),
      notes,
      user: 'user'
    };
    
    setTimeLogs(prev => [...prev, newLog]);
    showToast('Time log added', 'success');
  };

  const startEditing = () => {
    if (delayInfo) {
      const expectedDate = delayInfo.expectedCompletionDate 
        ? parseISO(delayInfo.expectedCompletionDate)
        : new Date();
      
      setFormData({
        reason: delayInfo.reason || '',
        category: delayInfo.category || 'technical',
        expectedCompletionDate: format(expectedDate, 'yyyy-MM-dd'),
        expectedCompletionTime: format(expectedDate, 'HH:mm'),
        notes: delayInfo.notes || '',
        impact: (delayInfo.impact as any) || 'medium',
        estimatedResolutionHours: delayInfo.estimatedResolutionHours || 8
      });
    } else {
      const defaultDate = new Date(Date.now() + 24 * 3600000); // Tomorrow
      setFormData({
        ...formData,
        expectedCompletionDate: format(defaultDate, 'yyyy-MM-dd'),
        expectedCompletionTime: '09:00'
      });
    }
    setEditing(true);
  };

  const resetForm = () => {
    setFormData({
      reason: '',
      category: 'technical',
      expectedCompletionDate: '',
      expectedCompletionTime: '09:00',
      notes: '',
      impact: 'medium',
      estimatedResolutionHours: 8
    });
  };

  const metrics = delayInfo ? calculateDelayMetrics(delayInfo.detectedAt) : null;
  const activeDuration = calculateActiveDuration();
  const isTimerPaused = activeTimer?.pausedAt;
  const categoryConfig = delayInfo 
    ? getDelayCategories().find(c => c.value === delayInfo.category)
    : null;
  const impactConfig = delayInfo ? getImpactConfig(delayInfo.impact || 'medium') : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Delay Management</h2>
          <p className="text-gray-600">Track, monitor, and resolve work order delays with precision timing</p>
        </div>
        
        {!isDelayed && !editing && (
          <button
            onClick={() => setEditing(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:from-amber-600 hover:to-orange-600 flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
          >
            <AlertTriangle className="h-5 w-5" />
            Report Delay
          </button>
        )}
      </div>

      {/* Main Status Card */}
      {isDelayed && delayInfo && metrics ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200 rounded-2xl p-6"
        >
          <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-orange-100 rounded-xl">
                  <AlertTriangle className="h-8 w-8 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-orange-900">Active Delay</h3>
                  <p className="text-orange-700">{delayInfo.reason}</p>
                </div>
              </div>
              
              {/* Time Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/70 backdrop-blur-sm border border-orange-200 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-orange-600">Total Duration</p>
                      <p className="text-2xl font-bold text-orange-800 mt-1">
                        {metrics.elapsedTime}
                      </p>
                      <p className="text-xs text-orange-500 mt-1">
                        Started: {metrics.detectedAt}
                      </p>
                    </div>
                    <Timer className="h-8 w-8 text-orange-400" />
                  </div>
                </div>
                
                <div className="bg-white/70 backdrop-blur-sm border border-orange-200 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-orange-600">Active Time</p>
                      <p className="text-2xl font-bold text-orange-800 mt-1">
                        {formatDuration(activeDuration)}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        {isTimerPaused ? (
                          <span className="text-xs text-amber-600">⏸️ Paused</span>
                        ) : (
                          <span className="text-xs text-emerald-600">▶️ Active</span>
                        )}
                      </div>
                    </div>
                    <Clock className="h-8 w-8 text-orange-400" />
                  </div>
                </div>
                
                <div className="bg-white/70 backdrop-blur-sm border border-orange-200 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-orange-600">Impact Level</p>
                      <div className="mt-1">
                        {impactConfig && (
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${impactConfig.color}`}>
                            {impactConfig.icon}
                            {impactConfig.label}
                          </span>
                        )}
                      </div>
                    </div>
                    <TrendingUp className="h-8 w-8 text-orange-400" />
                  </div>
                </div>
                
                <div className="bg-white/70 backdrop-blur-sm border border-orange-200 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-orange-600">New ETA</p>
                      <p className="text-xl font-bold text-orange-800 mt-1">
                        {delayInfo.expectedCompletionDate 
                          ? format(parseISO(delayInfo.expectedCompletionDate), 'MMM dd, HH:mm')
                          : '—'
                        }
                      </p>
                      <p className="text-xs text-orange-500 mt-1">
                        Original: {workOrder.estimatedCompletionDate 
                          ? format(parseISO(workOrder.estimatedCompletionDate), 'MMM dd')
                          : '—'
                        }
                      </p>
                    </div>
                    <Calendar className="h-8 w-8 text-orange-400" />
                  </div>
                </div>
              </div>
              
              {/* Timer Controls */}
              {activeTimer && (
                <div className="mt-6">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 bg-white/80 border border-orange-200 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-orange-700">Active Timer</p>
                          <p className="text-2xl font-mono font-bold text-orange-900">
                            {formatDuration(activeDuration)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {isTimerPaused ? (
                            <button
                              onClick={handleResumeTimer}
                              className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 flex items-center gap-2"
                            >
                              <Play className="h-4 w-4" />
                              Resume
                            </button>
                          ) : (
                            <button
                              onClick={handlePauseTimer}
                              className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 flex items-center gap-2"
                            >
                              <Pause className="h-4 w-4" />
                              Pause
                            </button>
                          )}
                          <button
                            onClick={() => handleAddTimeLog('paused', 'Manual time log')}
                            className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                          >
                            <Clock className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex flex-col gap-3">
              <button
                onClick={startEditing}
                className="px-4 py-2 bg-white text-orange-700 border border-orange-300 rounded-lg hover:bg-orange-50 flex items-center gap-2"
              >
                <Edit2 className="h-4 w-4" />
                Update
              </button>
              <button
                onClick={() => setShowTimeDetails(!showTimeDetails)}
                className="px-4 py-2 bg-white text-blue-700 border border-blue-300 rounded-lg hover:bg-blue-50 flex items-center gap-2"
              >
                {showTimeDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                Time Details
              </button>
              <button
                onClick={handleResolveDelay}
                disabled={loading}
                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-lg hover:from-emerald-600 hover:to-green-700 flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                Resolve
              </button>
            </div>
          </div>
          
          {/* Time Details Panel */}
          <AnimatePresence>
            {showTimeDetails && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-6 border-t border-orange-200 pt-6"
              >
                <h4 className="font-semibold text-orange-900 mb-4">Detailed Time Tracking</h4>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Time Logs */}
                  <div className="bg-white/80 border border-orange-200 rounded-xl p-4">
                    <h5 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <History className="h-4 w-4" />
                      Time Logs
                    </h5>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {timeLogs.map((log, index) => (
                        <div key={log.id} className="flex items-start gap-3 p-3 bg-orange-50/50 rounded-lg">
                          <div className={`p-2 rounded-lg ${
                            log.action === 'started' ? 'bg-red-100 text-red-600' :
                            log.action === 'resolved' ? 'bg-emerald-100 text-emerald-600' :
                            'bg-amber-100 text-amber-600'
                          }`}>
                            {log.action === 'started' && <AlertTriangle className="h-4 w-4" />}
                            {log.action === 'paused' && <Pause className="h-4 w-4" />}
                            {log.action === 'resumed' && <Play className="h-4 w-4" />}
                            {log.action === 'resolved' && <CheckCircle className="h-4 w-4" />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-medium capitalize">{log.action}</span>
                              <span className="text-xs text-gray-500">
                                {format(parseISO(log.timestamp), 'HH:mm:ss')}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{log.notes}</p>
                            <div className="text-xs text-gray-500 mt-1">
                              {format(parseISO(log.timestamp), 'MMM dd, yyyy')}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Time Statistics */}
                  <div className="bg-white/80 border border-orange-200 rounded-xl p-4">
                    <h5 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <BarChart className="h-4 w-4" />
                      Time Statistics
                    </h5>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>Total Delay Duration</span>
                          <span className="font-semibold">{metrics.elapsedTime}</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full" 
                               style={{ width: '100%' }} />
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>Active Work Time</span>
                          <span className="font-semibold">{formatDuration(activeDuration)}</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full" 
                               style={{ width: `${Math.min(100, (activeDuration / (metrics.totalMinutes * 60)) * 100)}%` }} />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="text-xs text-gray-600">Time Logs</div>
                          <div className="text-lg font-bold text-gray-900">{timeLogs.length}</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="text-xs text-gray-600">Pause Count</div>
                          <div className="text-lg font-bold text-gray-900">
                            {timeLogs.filter(l => l.action === 'paused').length}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ) : !editing ? (
        <div className="bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200 rounded-2xl p-8 text-center">
          <div className="p-4 bg-white rounded-2xl inline-block mb-4">
            <CheckCircle className="h-12 w-12 text-emerald-600" />
          </div>
          <h3 className="text-xl font-bold text-emerald-900 mb-2">On Schedule</h3>
          <p className="text-emerald-700 mb-4">No delays reported. Work order is progressing as planned.</p>
          <button
            onClick={() => setEditing(true)}
            className="px-6 py-2.5 bg-white text-emerald-700 border-2 border-emerald-300 rounded-xl hover:bg-emerald-50 flex items-center gap-2 mx-auto"
          >
            <AlertTriangle className="h-5 w-5" />
            Report Delay
          </button>
        </div>
      ) : null}

      {/* Delay Form */}
      {editing && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white border-2 border-orange-200 rounded-2xl p-6 shadow-lg"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                {isDelayed ? 'Update Delay Information' : 'Report New Delay'}
              </h3>
              <p className="text-gray-600">Document the delay details with precise timing</p>
            </div>
            <button
              onClick={() => {
                setEditing(false);
                resetForm();
              }}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <XCircle className="h-5 w-5 text-gray-400" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Category Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Delay Category *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {getDelayCategories().map((category) => (
                  <button
                    key={category.value}
                    onClick={() => setFormData({...formData, category: category.value})}
                    className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                      formData.category === category.value 
                        ? `${category.color} border-2` 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${
                      formData.category === category.value ? 'bg-white' : 'bg-gray-50'
                    }`}>
                      {category.icon}
                    </div>
                    <div className="text-center">
                      <span className="text-xs font-medium">{category.label}</span>
                      <p className="text-xs text-gray-500 mt-1 hidden lg:block">{category.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Impact & Duration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Impact Level *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {(['low', 'medium', 'high', 'critical'] as const).map((impact) => {
                    const config = getImpactConfig(impact);
                    return (
                      <button
                        key={impact}
                        onClick={() => setFormData({...formData, impact})}
                        className={`p-3 rounded-xl border-2 flex items-center gap-2 ${
                          formData.impact === impact 
                            ? `${config.color} border-2` 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {config.icon}
                        <span className="text-sm font-medium capitalize">{impact}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estimated Resolution Time
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    max="720"
                    value={formData.estimatedResolutionHours}
                    onChange={(e) => setFormData({...formData, estimatedResolutionHours: parseInt(e.target.value) || 8})}
                    className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    disabled={loading}
                  />
                  <span className="text-gray-600">hours</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Estimated time needed to resolve this delay
                </p>
              </div>
            </div>

            {/* Reason & Details */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Delay Reason *
              </label>
              <textarea
                value={formData.reason}
                onChange={(e) => setFormData({...formData, reason: e.target.value})}
                placeholder="Describe the reason for delay in detail..."
                className="w-full h-32 px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                disabled={loading}
              />
            </div>

            {/* Expected Completion */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expected Resolution Date & Time *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="date"
                    value={formData.expectedCompletionDate}
                    onChange={(e) => setFormData({...formData, expectedCompletionDate: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    disabled={loading}
                  />
                </div>
                
                <div className="relative">
                  <Clock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="time"
                    value={formData.expectedCompletionTime}
                    onChange={(e) => setFormData({...formData, expectedCompletionTime: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    disabled={loading}
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                When do you expect this delay to be resolved?
              </p>
            </div>

            {/* Additional Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes & Actions
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Add any additional notes, required actions, or updates..."
                className="w-full h-24 px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                disabled={loading}
              />
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setEditing(false);
                  resetForm();
                }}
                className="px-6 py-2.5 text-gray-700 border-2 border-gray-300 rounded-xl hover:bg-gray-50"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleMarkAsDelayed}
                disabled={loading || !formData.reason.trim() || !formData.expectedCompletionDate}
                className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:from-orange-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    {isDelayed ? 'Updating...' : 'Reporting...'}
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-5 w-5" />
                    {isDelayed ? 'Update Delay' : 'Report Delay'}
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Quick Stats & Tools */}
      {isDelayed && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Category Summary */}
          {categoryConfig && (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-900">Delay Category</h4>
                <div className={`p-2 rounded-lg ${categoryConfig.color.split(' ')[0]}`}>
                  {categoryConfig.icon}
                </div>
              </div>
              <h5 className="text-lg font-bold text-gray-900 mb-1">{categoryConfig.label}</h5>
              <p className="text-sm text-gray-600">{categoryConfig.description}</p>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="text-xs text-gray-500 mb-2">Common actions:</div>
                <div className="flex flex-wrap gap-2 mt-2">
                  <button 
                    onClick={() => handleAddTimeLog('paused', 'Waiting for parts delivery')}
                    className="px-3 py-1.5 text-xs bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"
                  >
                    Order Parts
                  </button>
                  <button 
                    onClick={() => handleAddTimeLog('paused', 'Requested technical support')}
                    className="px-3 py-1.5 text-xs bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100"
                  >
                    Request Support
                  </button>
                  <button 
                    onClick={() => handleAddTimeLog('resumed', 'Customer issue resolved')}
                    className="px-3 py-1.5 text-xs bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100"
                  >
                    Follow-up
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Time Analysis */}
          {metrics && (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-900">Time Analysis</h4>
                <BarChart className="h-5 w-5 text-gray-400" />
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Current Duration</span>
                    <span className="font-medium">{metrics.elapsedTime}</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        metrics.severity === 'critical' ? 'bg-gradient-to-r from-red-500 to-pink-500' :
                        metrics.severity === 'high' ? 'bg-gradient-to-r from-orange-500 to-red-500' :
                        metrics.severity === 'medium' ? 'bg-gradient-to-r from-amber-500 to-orange-500' :
                        'bg-gradient-to-r from-yellow-500 to-amber-500'
                      }`}
                      style={{ width: `${Math.min(100, (metrics.days / 14) * 100)}%` }}
                    />
                  </div>
                </div>
                
                {delayInfo?.expectedCompletionDate && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs text-gray-600">Time Remaining</div>
                        <div className="text-lg font-bold text-gray-900">
                          {(() => {
                            const now = new Date();
                            const expected = parseISO(delayInfo.expectedCompletionDate);
                            const minutesLeft = differenceInMinutes(expected, now);
                            
                            if (minutesLeft <= 0) return 'Overdue';
                            
                            const daysLeft = Math.floor(minutesLeft / (24 * 60));
                            const hoursLeft = Math.floor((minutesLeft % (24 * 60)) / 60);
                            const minsLeft = minutesLeft % 60;
                            
                            return `${daysLeft > 0 ? `${daysLeft}d ` : ''}${hoursLeft > 0 ? `${hoursLeft}h ` : ''}${minsLeft}m`;
                          })()}
                        </div>
                      </div>
                      {(() => {
                        const now = new Date();
                        const expected = parseISO(delayInfo.expectedCompletionDate);
                        const isOverdue = isAfter(now, expected);
                        
                        return isOverdue ? (
                          <AlertTriangle className="h-8 w-8 text-red-500" />
                        ) : (
                          <Clock className="h-8 w-8 text-blue-500" />
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-900">Quick Actions</h4>
              <Zap className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-3">
              <button
                onClick={() => handleAddTimeLog('paused', 'Added note via quick action')}
                className="w-full px-4 py-3 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 flex items-center justify-between"
              >
                <span>Add Time Log</span>
                <Clock className="h-4 w-4" />
              </button>
              
              <button
                onClick={() => {
                  navigator.clipboard.writeText(delayInfo?.reason || '');
                  showToast('Delay reason copied to clipboard', 'success');
                }}
                className="w-full px-4 py-3 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-100 flex items-center justify-between"
              >
                <span>Copy Details</span>
                <Copy className="h-4 w-4" />
              </button>
              
              <button
                onClick={() => {
                  // Export time logs as JSON
                  const data = {
                    workOrderId: workOrder._id,
                    delayReason: delayInfo?.reason,
                    timeLogs: timeLogs,
                    metrics: metrics,
                    exportDate: new Date().toISOString()
                  };
                  
                  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `delay-logs-${workOrder.workOrderNumber}-${Date.now()}.json`;
                  a.click();
                  
                  showToast('Time logs exported', 'success');
                }}
                className="w-full px-4 py-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 flex items-center justify-between"
              >
                <span>Export Logs</span>
                <Download className="h-4 w-4" />
              </button>
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-100">
              <div className="text-xs text-gray-500 mb-2">Timer Controls</div>
              <div className="flex items-center gap-2">
                {isTimerPaused ? (
                  <button
                    onClick={handleResumeTimer}
                    className="flex-1 px-3 py-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 flex items-center justify-center gap-2"
                  >
                    <Play className="h-4 w-4" />
                    Resume Timer
                  </button>
                ) : (
                  <button
                    onClick={handlePauseTimer}
                    className="flex-1 px-3 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 flex items-center justify-center gap-2"
                  >
                    <Pause className="h-4 w-4" />
                    Pause Timer
                  </button>
                )}
                <button
                  onClick={() => {
                    // Reset timer (for admin purposes)
                    if (window.confirm('Reset timer? This will clear all accumulated time.')) {
                      setActiveTimer({
                        startedAt: new Date().toISOString(),
                        totalPausedTime: 0
                      });
                      showToast('Timer reset', 'info');
                    }
                  }}
                  className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  title="Reset Timer"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State for no delays */}
      {!isDelayed && !editing && (
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-dashed border-gray-300 rounded-2xl p-10 text-center">
          <div className="max-w-md mx-auto">
            <div className="p-4 bg-white rounded-2xl inline-block mb-4">
              <Clock className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">No Active Delays</h3>
            <p className="text-gray-600 mb-6">
              This work order is currently on schedule. Use the report delay button above to document any unexpected delays.
            </p>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => setEditing(true)}
                className="px-5 py-2.5 bg-white text-gray-700 border-2 border-gray-300 rounded-xl hover:bg-gray-50 flex items-center gap-2"
              >
                <AlertTriangle className="h-5 w-5" />
                Report Delay
              </button>
              <button
                onClick={() => {
                  // Show historical delays if available
                  showToast('No historical delays available', 'info');
                }}
                className="px-5 py-2.5 text-gray-600 hover:text-gray-900 flex items-center gap-2"
              >
                <History className="h-5 w-5" />
                View History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer Note */}
      <div className="text-center text-sm text-gray-500 pt-4 border-t border-gray-200">
        <p className="flex items-center justify-center gap-2">
          <Shield className="h-4 w-4" />
          All delay reports are timestamped and logged for compliance and analysis.
          Contact your supervisor for urgent delays.
        </p>
      </div>
    </div>
  );
}