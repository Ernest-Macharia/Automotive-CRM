'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { authService, type FrontendUser } from '@/services/authService';

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

function resolveUserRole(user: FrontendUser | null): string {
  const roleValue = (user as { role?: unknown } | null)?.role;

  if (typeof roleValue === 'object' && roleValue !== null && 'name' in roleValue) {
    return String((roleValue as { name?: string }).name || '');
  }

  return String(roleValue || '');
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<FrontendUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const resolveUser = async () => {
      try {
        if (!authService.isAuthenticated()) {
          router.replace('/auth/login');
          return;
        }

        const storedUser = authService.getUser();
        if (storedUser) {
          if (isMounted) {
            setUser(storedUser);
          }
          return;
        }

        const currentUser = await authService.getCurrentUser();
        if (isMounted) {
          setUser(currentUser);
        }
      } catch (error) {
        console.error('Error resolving dashboard user:', error);
        router.replace('/auth/login');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    resolveUser();

    return () => {
      isMounted = false;
    };
  }, [router]);

  if (loading) {
    return <LoadingFallback />;
  }

  if (!user) {
    return <LoadingFallback />;
  }

  const userRole = resolveUserRole(user);

  switch (userRole) {
    case 'superadmin':
      return <AdminDashboard user={user} />;

    case 'admin':
      return <ManagementDashboard user={user} />;

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
