'use client';

import dynamic from 'next/dynamic';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { userService } from '@/services/settings/userService';

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

const AdminDashboard = dynamic(() => import('@/components/dashboards/AdminDashboard'), {
  loading: LoadingFallback,
});
const SalesDashboard = dynamic(() => import('@/components/dashboards/SalesDashboard'), {
  loading: LoadingFallback,
});
const TechnicianDashboard = dynamic(() => import('@/components/dashboards/TechnicianDashboard'), {
  loading: LoadingFallback,
});
const ManagementDashboard = dynamic(() => import('@/components/dashboards/ManagementDashboard'), {
  loading: LoadingFallback,
});
const FinanceDashboard = dynamic(() => import('@/components/dashboards/FinanceDashboard'), {
  loading: LoadingFallback,
});
const CustomerServiceDashboard = dynamic(() => import('@/components/dashboards/CustomerServiceDashboard'), {
  loading: LoadingFallback,
});
const CustomerExperienceDashboard = dynamic(
  () => import('@/components/dashboards/CustomerExperienceDashboard'),
  { loading: LoadingFallback }
);
const CustomerDashboard = dynamic(() => import('@/components/dashboards/CustomerDashboard'), {
  loading: LoadingFallback,
});
const PartnerDashboard = dynamic(() => import('@/components/dashboards/PartnerDashboard'), {
  loading: LoadingFallback,
});
const DeveloperDashboard = dynamic(() => import('@/components/dashboards/DeveloperDashboard'), {
  loading: LoadingFallback,
});
const DefaultDashboard = dynamic(() => import('@/components/dashboards/DefaultDashboard'), {
  loading: LoadingFallback,
});

export default function DashboardPage() {
  const { user, isLoading } = useCurrentUser();

  if (isLoading) {
    return <LoadingFallback />;
  }

  if (!user) {
    return <DefaultDashboard />;
  }

  const normalizeRoleKey = (value: string) =>
    value.toLowerCase().trim().replace(/[\s-]+/g, '_');

  const userRole = normalizeRoleKey(userService.getUserRoleName(user));
  const userRoleDisplay = normalizeRoleKey(userService.getUserRoleDisplayName(user));
  const effectiveRole = userRole !== 'unknown' ? userRole : userRoleDisplay;
  
  switch (effectiveRole) {
    case 'admin':
    case 'organization_administrator':
    case 'enterprise_admin':
    case 'enterprise_administrator':
      return <AdminDashboard user={user} />;
    
    case 'management':
    case 'branch_manager':
    case 'fleet_manager':
    case 'compliance':
      return <ManagementDashboard user={user} />;
    
    case 'finance':
    case 'finance_director':
    case 'accountant':
    case 'controller':
    case 'cfo':
      return <FinanceDashboard user={user} />;
    
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
      return effectiveRole === 'customer_experience' 
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
