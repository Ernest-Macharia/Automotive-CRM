import { 
  LayoutDashboard, ClipboardCheck, ClipboardList, 
  CheckSquare, Receipt, AlertTriangle, MessageSquare,
  Wrench, Clock, Bell, CheckCircle,
  BarChart3, Users, Target
} from 'lucide-react';
import { WorkOrder } from '@/services/workOrderService';
import { useState, useEffect } from 'react';

interface WorkOrderTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  workOrder: WorkOrder;
  counts?: {
    jobCards?: number;
    delays?: number;
    notes?: number;
    preChecklists?: number;
    postChecklists?: number;
    invoices?: number;
  };
}

export default function WorkOrderTabs({ 
  activeTab, 
  onTabChange, 
  workOrder,
  counts = {}
}: WorkOrderTabsProps) {
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);
  const [notifications, setNotifications] = useState({
    delays: 0,
    jobCards: 0,
    notes: 0
  });

  useEffect(() => {
    // Calculate notification counts
    const delayCount = workOrder.status === 'delayed' ? 1 : 0;
    const jobCardCount = Array.isArray(workOrder.jobCards) 
      ? workOrder.jobCards.filter((jc: any) => jc.status === 'pending' || jc.status === 'in_progress').length 
      : 0;
    const noteCount = counts.notes || 0;

    setNotifications({
      delays: delayCount,
      jobCards: jobCardCount,
      notes: noteCount
    });
  }, [workOrder, counts]);

  const tabs = [
    { 
      id: 'overview', 
      label: 'Overview', 
      icon: <LayoutDashboard className="h-4 w-4" />,
      badge: null,
      color: 'from-blue-500 to-blue-600',
      count: null,
      notification: false
    },
    { 
      id: 'pre-checklist', 
      label: 'Pre-Checklist', 
      icon: <ClipboardCheck className="h-4 w-4" />,
      badge: workOrder.preChecklistId ? '✓' : null,
      color: 'from-emerald-500 to-emerald-600',
      count: workOrder.preChecklistId ? 1 : 0,
      notification: !workOrder.preChecklistId
    },
    { 
      id: 'job-cards', 
      label: 'Job Cards', 
      icon: <Wrench className="h-4 w-4" />,
      badge: counts.jobCards?.toString() || '0',
      color: 'from-indigo-500 to-indigo-600',
      count: counts.jobCards || 0,
      notification: notifications.jobCards > 0
    },
    { 
      id: 'post-checklist', 
      label: 'Post-Checklist', 
      icon: <CheckSquare className="h-4 w-4" />,
      badge: workOrder.postChecklistId ? '✓' : null,
      color: 'from-purple-500 to-purple-600',
      count: workOrder.postChecklistId ? 1 : 0,
      notification: !workOrder.postChecklistId
    },
    { 
      id: 'invoice', 
      label: 'Invoice', 
      icon: <Receipt className="h-4 w-4" />,
      badge: workOrder.invoiceId ? '✓' : null,
      color: 'from-green-500 to-green-600',
      count: workOrder.invoiceId ? 1 : 0,
      notification: !workOrder.invoiceId
    },
    { 
      id: 'delays', 
      label: 'Delays', 
      icon: <AlertTriangle className="h-4 w-4" />,
      badge: workOrder.status === 'delayed' ? '⚠️' : null,
      color: 'from-orange-500 to-orange-600',
      count: workOrder.status === 'delayed' ? 1 : 0,
      notification: workOrder.status === 'delayed'
    },
    { 
      id: 'technician-notes', 
      label: 'Notes', 
      icon: <MessageSquare className="h-4 w-4" />,
      badge: null,
      color: 'from-cyan-500 to-cyan-600',
      count: counts.notes || 0,
      notification: notifications.notes > 0
    },
  ];

  const getBadgeStyle = (tabId: string, badge: string | null, count: number) => {
    if (tabId === 'delays' && count > 0) {
      return 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md';
    }
    if (badge === '✓') return 'bg-emerald-100 text-emerald-700';
    if (badge === '⚠️') return 'bg-orange-100 text-orange-700';
    if (count > 0) return 'bg-blue-100 text-blue-700';
    return 'bg-gray-100 text-gray-700';
  };

  const getNotificationStyle = (tabId: string, count: number) => {
    if (tabId === 'delays') return 'from-orange-500 to-red-500';
    if (tabId === 'job-cards') return 'from-indigo-500 to-purple-500';
    if (tabId === 'technician-notes') return 'from-cyan-500 to-blue-500';
    return 'from-blue-500 to-indigo-500';
  };

  return (
    <div className="relative bg-white rounded-2xl border border-gray-200 shadow-sm mb-8 overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
      
      <nav className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center space-x-1 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const hasCount = tab.count !== null && tab.count > 0;
            const hasNotification = tab.notification;
            const badgeContent = tab.badge || (hasCount ? tab.count.toString() : null);
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                onMouseEnter={() => setHoveredTab(tab.id)}
                onMouseLeave={() => setHoveredTab(null)}
                className={`relative flex items-center gap-2 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-300 whitespace-nowrap ${
                  isActive
                    ? `bg-gradient-to-br ${tab.color} text-white shadow-lg transform scale-105`
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                } ${hoveredTab === tab.id && !isActive ? 'transform scale-[1.02]' : ''}`}
              >
                <div className={`transition-transform duration-300 ${isActive ? 'scale-110' : ''}`}>
                  {tab.icon}
                </div>
                
                <span className="font-medium">{tab.label}</span>
                
                {/* Badge/Count */}
                {badgeContent && (
                  <div className="relative">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold min-w-[24px] flex items-center justify-center ${
                      getBadgeStyle(tab.id, tab.badge, tab.count || 0)
                    }`}>
                      {badgeContent}
                    </span>
                    
                    {/* Notification Dot */}
                    {hasNotification && (
                      <span className="absolute -top-1 -right-1">
                        <span className="relative flex h-3 w-3">
                          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-gradient-to-r ${getNotificationStyle(tab.id, tab.count || 0)} opacity-75`}></span>
                          <span className={`relative inline-flex rounded-full h-3 w-3 bg-gradient-to-r ${getNotificationStyle(tab.id, tab.count || 0)}`}></span>
                        </span>
                      </span>
                    )}
                  </div>
                )}
                
                {/* No content indicator */}
                {tab.count === 0 && !tab.badge && !isActive && (
                  <div className="h-5 w-5 flex items-center justify-center">
                    <div className="h-1.5 w-1.5 bg-gray-300 rounded-full"></div>
                  </div>
                )}
                
                {/* Active indicator */}
                {isActive && (
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                    <div className="w-2 h-2 bg-white rounded-full shadow-lg" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
        
        {/* Status Summary */}
        <div className="hidden lg:flex items-center gap-3 px-4">
          <div className="flex items-center gap-2">
            {workOrder.status === 'delayed' ? (
              <>
                <AlertTriangle className="h-4 w-4 text-orange-500 animate-pulse" />
                <span className="text-sm font-medium text-orange-600">Delayed</span>
              </>
            ) : workOrder.status === 'completed' ? (
              <>
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                <span className="text-sm font-medium text-emerald-600">Completed</span>
              </>
            ) : (
              <>
                <Clock className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium text-blue-600">In Progress</span>
              </>
            )}
          </div>
          
          <div className="h-6 w-px bg-gray-300"></div>
          
          <div className="text-sm text-gray-600">
            {workOrder.currentStage?.replace('_', ' ') || 'Setup'}
          </div>
        </div>
      </nav>
      
      {/* Stats Bar */}
      <div className="px-6 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4 text-indigo-600" />
              <span className="text-sm">
                <span className="font-semibold text-gray-900">{counts.jobCards || 0}</span>
                <span className="text-gray-600 ml-1">Job Cards</span>
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <span className="text-sm">
                <span className="font-semibold text-gray-900">{workOrder.status === 'delayed' ? 1 : 0}</span>
                <span className="text-gray-600 ml-1">Delays</span>
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-cyan-600" />
              <span className="text-sm">
                <span className="font-semibold text-gray-900">{counts.notes || 0}</span>
                <span className="text-gray-600 ml-1">Notes</span>
              </span>
            </div>
          </div>
          
          <div className="text-sm text-gray-500">
            Updated: {new Date(workOrder.updatedAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
    </div>
  );
}