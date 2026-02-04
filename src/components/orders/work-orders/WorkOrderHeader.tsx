import Link from 'next/link';
import { 
  Wrench, ArrowLeft, 
  Edit, Printer, Download,
  RefreshCw 
} from 'lucide-react';
import { WorkOrder } from '@/services/workOrderService';
import { workOrderService } from '@/services/workOrderService';
import { format } from 'date-fns';

interface WorkOrderHeaderProps {
  workOrder: WorkOrder;
  onRefresh: () => void;
  onBack: () => void;
}

export default function WorkOrderHeader({ workOrder, onRefresh, onBack }: WorkOrderHeaderProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  return (
    <div className="bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-700 p-4 sm:p-6 shadow-lg">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-white" />
            </button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Wrench className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-semibold text-white">{workOrder.workOrderNumber}</h1>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                    workOrderService.getStatusColor(workOrder.status)
                  }`}>
                    {workOrderService.getStatusLabel(workOrder.status)}
                  </span>
                </div>
                <p className="text-sm text-white/90">Created {formatDate(workOrder.createdAt)}</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              title="Print"
            >
              <Printer className="h-5 w-5 text-white" />
            </button>
            <Link
              href={`/orders/work-orders/${workOrder._id}/edit`}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              title="Edit"
            >
              <Edit className="h-5 w-5 text-white" />
            </Link>
            <button
              onClick={onRefresh}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}