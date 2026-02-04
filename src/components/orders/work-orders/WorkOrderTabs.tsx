import { 
  BarChart3, ClipboardCheck, Wrench, 
  ClipboardList, ReceiptIcon, MessageSquare, 
  LayoutDashboard,
  CheckSquare,
  Receipt,
  AlertTriangle
} from 'lucide-react';
import { WorkOrder } from '@/services/workOrderService';

interface WorkOrderTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  workOrder: WorkOrder;
}

export default function WorkOrderTabs({ activeTab, onTabChange, workOrder }: WorkOrderTabsProps) {
  
  const tabs = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="h-4 w-4" /> },
    { id: 'pre-checklist', label: 'Pre-Checklist', icon: <ClipboardCheck className="h-4 w-4" /> },
    { id: 'job-cards', label: 'Job Cards', icon: <ClipboardList className="h-4 w-4" /> },
    { id: 'post-checklist', label: 'Post-Checklist', icon: <CheckSquare className="h-4 w-4" /> },
    { id: 'invoice', label: 'Invoice', icon: <Receipt className="h-4 w-4" /> },
    { id: 'delays', label: 'Delays', icon: <AlertTriangle className="h-4 w-4" /> },
    { id: 'technician-notes', label: 'Technician Notes', icon: <MessageSquare className="h-4 w-4" /> },
  ];

  const getTabBadge = (tabId: string) => {
    switch (tabId) {
      case 'pre-checklist':
        return workOrder.preChecklistId ? '✓' : null;
      case 'job-cards':
        return workOrder.jobCards && Array.isArray(workOrder.jobCards) && workOrder.jobCards.length > 0 
          ? workOrder.jobCards.length.toString() 
          : null;
      case 'post-checklist':
        return workOrder.postChecklistId ? '✓' : null;
      case 'invoice':
        return workOrder.invoiceId ? '✓' : null;
      default:
        return null;
    }
  };

  return (
    <div className="border-b border-gray-200 bg-white rounded-xl mb-6">
      <nav className="flex space-x-8 overflow-x-auto px-6">
        {tabs.map((tab) => {
          const badge = getTabBadge(tab.id);
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 py-3 px-1 border-b-2 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.icon}
              {tab.label}
              {badge && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-green-100 text-green-800 rounded-full">
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}