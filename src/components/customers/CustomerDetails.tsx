'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CustomerDetailsHeader from './CustomerDetailsHeader';
import CustomerDetailsTabs from './CustomerDetailsTabs';
import CustomerDetailsSidebar from './CustomerDetailsSidebar';
import { customerService, Customer } from '@/services/customersService';
import { UserX } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';

interface CustomerDetailsProps {
  customerId: string;
}

export default function CustomerDetails({ customerId }: CustomerDetailsProps) {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (customerId) {
      fetchCustomer();
    }
  }, [customerId]);

  const fetchCustomer = async () => {
    try {
      setLoading(true);
      const data = await customerService.getCustomerById(customerId);
      setCustomer(data);
    } catch (error) {
      console.error('Error fetching customer:', error);
      showToast('Failed to load customer details', 'error');
      router.push('/customers');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="w-full max-w-4xl">
          <div className="animate-pulse flex flex-col gap-6">
            {/* Header skeleton */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gray-200"></div>
                <div>
                  <div className="h-6 w-48 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 w-32 bg-gray-200 rounded"></div>
                </div>
              </div>
              <div className="h-10 w-24 bg-gray-200 rounded-lg"></div>
            </div>
            
            {/* Content skeleton */}
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="lg:w-2/3 space-y-6">
                <div className="h-10 bg-gray-200 rounded-lg"></div>
                <div className="h-64 bg-gray-200 rounded-xl"></div>
              </div>
              <div className="lg:w-1/3 space-y-6">
                <div className="h-48 bg-gray-200 rounded-xl"></div>
                <div className="h-48 bg-gray-200 rounded-xl"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center bg-white rounded-xl shadow-sm p-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 mb-6">
            <UserX className="h-8 w-8 text-red-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Customer Not Found</h3>
          <p className="text-gray-600 mb-6">The customer you're looking for doesn't exist in our system.</p>
          <button
            onClick={() => router.push('/customers')}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Back to Customers
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerDetailsHeader customer={customer} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-2/3">
            <CustomerDetailsTabs 
              customer={customer} 
              activeTab={activeTab} 
              onTabChange={setActiveTab} 
            />
          </div>
          
          <div className="lg:w-1/3 space-y-6">
            <CustomerDetailsSidebar customer={customer} />
          </div>
        </div>
      </div>
    </div>
  );
}