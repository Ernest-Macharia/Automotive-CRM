'use client';

import { Users, Target, Phone, CheckCircle, Calendar, AlertCircle, TrendingUp } from 'lucide-react';

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
  const statusCounts = {
    new: stats?.byStatus?.new || 0,
    attempted_to_contact: stats?.byStatus?.attempted_to_contact || 0,
    prospecting: stats?.byStatus?.prospecting || 0,
    appointment_scheduled: stats?.byStatus?.appointment_scheduled || 0,
    non_progressive: stats?.byStatus?.non_progressive || 0,
    lost: stats?.byStatus?.lost || 0,
    won: stats?.byStatus?.won || 0,
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 md:gap-4">
      {/* Total Leads */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg md:rounded-xl p-3 md:p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs md:text-sm text-blue-600 font-medium">Total</p>
            <p className="text-lg md:text-2xl font-bold text-blue-800 mt-0.5 md:mt-1">
              {stats?.total || 0}
            </p>
          </div>
          <Users className="h-5 w-5 md:h-7 md:w-7 text-blue-400" />
        </div>
      </div>
      
      {/* New Leads */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg md:rounded-xl p-3 md:p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs md:text-sm text-blue-600 font-medium">New</p>
            <p className="text-lg md:text-2xl font-bold text-blue-800 mt-0.5 md:mt-1">
              {statusCounts.new}
            </p>
          </div>
          <Target className="h-5 w-5 md:h-7 md:w-7 text-blue-400" />
        </div>
      </div>
      
      {/* Attempted to Contact */}
      <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-lg md:rounded-xl p-3 md:p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs md:text-sm text-purple-600 font-medium">Contact</p>
            <p className="text-lg md:text-2xl font-bold text-purple-800 mt-0.5 md:mt-1">
              {statusCounts.attempted_to_contact}
            </p>
          </div>
          <Phone className="h-5 w-5 md:h-7 md:w-7 text-purple-400" />
        </div>
      </div>
      
      {/* Prospecting */}
      <div className="bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200 rounded-lg md:rounded-xl p-3 md:p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs md:text-sm text-amber-600 font-medium">Prospecting</p>
            <p className="text-lg md:text-2xl font-bold text-amber-800 mt-0.5 md:mt-1">
              {statusCounts.prospecting}
            </p>
          </div>
          <CheckCircle className="h-5 w-5 md:h-7 md:w-7 text-amber-400" />
        </div>
      </div>

      {/* Appointment Scheduled */}
      <div className="bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-lg md:rounded-xl p-3 md:p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs md:text-sm text-orange-600 font-medium">Appointments</p>
            <p className="text-lg md:text-2xl font-bold text-orange-800 mt-0.5 md:mt-1">
              {statusCounts.appointment_scheduled}
            </p>
          </div>
          <Calendar className="h-5 w-5 md:h-7 md:w-7 text-orange-400" />
        </div>
      </div>

      {/* Non Progressive */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-lg md:rounded-xl p-3 md:p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs md:text-sm text-gray-600 font-medium">Non Progressive</p>
            <p className="text-lg md:text-2xl font-bold text-gray-800 mt-0.5 md:mt-1">
              {statusCounts.non_progressive}
            </p>
          </div>
          <AlertCircle className="h-5 w-5 md:h-7 md:w-7 text-gray-400" />
        </div>
      </div>

      {/* Lost */}
      <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-lg md:rounded-xl p-3 md:p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs md:text-sm text-red-600 font-medium">Lost</p>
            <p className="text-lg md:text-2xl font-bold text-red-800 mt-0.5 md:mt-1">
              {statusCounts.lost}
            </p>
          </div>
          <TrendingUp className="h-5 w-5 md:h-7 md:w-7 text-red-400 transform rotate-180" />
        </div>
      </div>

      {/* Won */}
      <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg md:rounded-xl p-3 md:p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs md:text-sm text-green-600 font-medium">Won</p>
            <p className="text-lg md:text-2xl font-bold text-green-800 mt-0.5 md:mt-1">
              {statusCounts.won}
            </p>
          </div>
          <CheckCircle className="h-5 w-5 md:h-7 md:w-7 text-green-400" />
        </div>
      </div>
    </div>
  );
}