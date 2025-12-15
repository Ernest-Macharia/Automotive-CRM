// components/leads/LeadStats.tsx
import { Users, Target, Phone, CheckCircle } from 'lucide-react';

interface LeadStatsProps {
  stats: {
    total?: number;
    byStatus?: Record<string, number>;
    bySource?: Record<string, number>;
    hotLeads?: number;
    warmLeads?: number;
    coldLeads?: number;
  } | null;
}

export default function LeadStats({ stats }: LeadStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-blue-600 font-medium">Total Leads</p>
            <p className="text-2xl font-bold text-blue-800 mt-1">
              {stats?.total || 0}
            </p>
          </div>
          <Users className="h-8 w-8 text-blue-400" />
        </div>
      </div>
      
      <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-xl p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-green-600 font-medium">New Leads</p>
            <p className="text-2xl font-bold text-green-800 mt-1">
              {stats?.byStatus?.new || 0}
            </p>
          </div>
          <Target className="h-8 w-8 text-green-400" />
        </div>
      </div>
      
      <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200 rounded-xl p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-yellow-600 font-medium">Contacted</p>
            <p className="text-2xl font-bold text-yellow-800 mt-1">
              {stats?.byStatus?.contacted || 0}
            </p>
          </div>
          <Phone className="h-8 w-8 text-yellow-400" />
        </div>
      </div>
      
      <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-purple-600 font-medium">Qualified</p>
            <p className="text-2xl font-bold text-purple-800 mt-1">
              {stats?.byStatus?.qualified || 0}
            </p>
          </div>
          <CheckCircle className="h-8 w-8 text-purple-400" />
        </div>
      </div>
    </div>
  );
}