// components/role/RoleBasedDashboard.tsx - UPDATED
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
import FinanceDashboard from '@/components/dashboards/FinanceDashboard';

const RoleBasedDashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = authService.getUser();
    setUser(currentUser);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <DefaultDashboard />;
  }

  const userRole = user.role?.name || user.role;
  
  switch (userRole) {
    // System Roles
    case 'admin':
      return <AdminDashboard user={user} />;
    case 'developer':
      return <DeveloperDashboard user={user} />;
      
    // Management Roles
    case 'management':
    case 'branch_manager':
    case 'fleet_manager':
    case 'finance':
    case 'compliance':
      return <ManagementDashboard user={user} />;
      
    // Sales Roles
    case 'sales_director':
    case 'sales_manager':
    case 'sales_lead':
    case 'sales_representative':
    case 'account_executive':
    case 'business_development':
      return <SalesDashboard user={user} />;
      
    // Technical Roles
    case 'engineer':
    case 'technician':
    case 'workshop':
      return <TechnicianDashboard user={user} />;
      
    // Support Roles
    case 'support':
    case 'customer_service':
      return <CustomerServiceDashboard user={user} />;

    // Finance Roles
    case 'finance':
      case 'finance_director':
      case 'accountant':
      case 'controller':
      case 'cfo':
        return <FinanceDashboard user={user} />;
      
    // Customer Experience
    case 'customer_experience':
      return <CustomerExperienceDashboard user={user} />;
      
    // Customer
    case 'customer':
      return <CustomerDashboard user={user} />;
      
    // Partner Roles
    case 'dealer':
    case 'partner':
    case 'insurer':
      return <PartnerDashboard user={user} />;
      
    default:
      return <DefaultDashboard user={user} />;
  }
};

export default RoleBasedDashboard;