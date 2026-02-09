'use client';

import { useState, useEffect } from 'react';
import { authService } from '@/services/authService';
import AdminDashboard from '@/components/dashboards/AdminDashboard';
import SalesDashboard from '@/components/dashboards/SalesDashboard';
import TechnicianDashboard from '@/components/dashboards/TechnicianDashboard';
import ManagementDashboard from '@/components/dashboards/ManagementDashboard';
import CustomerServiceDashboard from '@/components/dashboards/CustomerServiceDashboard';
import CustomerExperienceDashboard from '@/components/dashboards/CustomerExperienceDashboard';
import CustomerDashboard from '@/components/dashboards/CustomerDashboard';
import PartnerDashboard from '@/components/dashboards/PartnerDashboard';
import DeveloperDashboard from '@/components/dashboards/DeveloperDashboard';
import DefaultDashboard from '@/components/dashboards/DefaultDashboard';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = authService.getUser();
    setUser(currentUser);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <DefaultDashboard />;
  }

  const userRole = user.role?.name || user.role;
  
  switch (userRole) {
    case 'admin':
      return <AdminDashboard user={user} />;
    
    case 'management':
    case 'branch_manager':
    case 'fleet_manager':
    case 'finance':
    case 'compliance':
      return <ManagementDashboard user={user} />;
    
    case 'sales_director':
    case 'sales_manager':
    case 'sales_lead':
    case 'sales_representative':
    case 'account_executive':
    case 'business_development':
      return <SalesDashboard user={user} />;
    
    case 'engineer':
    case 'technician':
    case 'workshop':
      return <TechnicianDashboard user={user} />;
    
    case 'support':
    case 'customer_service':
    case 'customer_experience':
      return userRole === 'customer_experience' 
        ? <CustomerExperienceDashboard user={user} />
        : <CustomerServiceDashboard user={user} />;
    
    case 'customer':
      return <CustomerDashboard user={user} />;
    
    case 'dealer':
    case 'partner':
    case 'insurer':
      return <PartnerDashboard user={user} />;
    
    case 'developer':
      return <DeveloperDashboard user={user} />;
    
    default:
      return <DefaultDashboard user={user} />;
  }
}