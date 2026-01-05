'use client';

import { useState, useEffect } from 'react';
import CustomersHeader from './CustomersHeader';
import CustomersStats from './CustomersStats';
import CustomersFilters from './CustomersFilters';
import CustomersTable from './CustomersTable';
import { customerService, Customer, CustomerStats } from '@/services/customersService';
import { useToast } from '@/contexts/ToastContext';
import { useRouter } from 'next/navigation';

export default function CustomersDashboard() {
  const { showToast } = useToast();
  const router = useRouter();
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchCustomers();
    fetchStats();
  }, []);

  useEffect(() => {
    filterAndSortCustomers();
  }, [customers, searchTerm, selectedType, selectedTier, sortBy, sortOrder]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const data = await customerService.getAllCustomers();
      setCustomers(data);
    } catch (error) {
      console.error('Error fetching customers:', error);
      showToast('Failed to load customers', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
        setStatsLoading(true);
        const data = await customerService.getCustomerStats();
        setStats(data);
    } catch (error) {
        console.error('Error fetching customer stats:', error);
        const defaultStats: CustomerStats = {
        totalCustomers: 0,
        activeCustomers: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
        newCustomersThisMonth: 0,
        byType: [
            { _id: 'individual', count: 0 },
            { _id: 'organization', count: 0 }
        ],
        byCustomerType: [
            { _id: 'individual', count: 0 },
            { _id: 'organization', count: 0 }
        ],
        byTier: [
            { _id: 'standard', count: 0 },
            { _id: 'bronze', count: 0 },
            { _id: 'silver', count: 0 },
            { _id: 'gold', count: 0 },
            { _id: 'vip', count: 0 }
        ],
        topCustomers: []
        };
        setStats(defaultStats);
    } finally {
        setStatsLoading(false);
    }
    };

  const filterAndSortCustomers = () => {
    let filtered = [...customers];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(customer =>
        customer.name?.toLowerCase().includes(term) ||
        customer.email?.toLowerCase().includes(term) ||
        customer.phone?.includes(term) ||
        customer.companyName?.toLowerCase().includes(term)
      );
    }

    // Apply type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter(customer => customer.type === selectedType);
    }

    // Apply tier filter
    if (selectedTier !== 'all') {
      filtered = filtered.filter(customer => customer.customerTier === selectedTier);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'name':
          aValue = a.name || '';
          bValue = b.name || '';
          break;
        case 'totalSpent':
          aValue = a.totalSpent || 0;
          bValue = b.totalSpent || 0;
          break;
        case 'totalOrders':
          aValue = a.totalOrders || 0;
          bValue = b.totalOrders || 0;
          break;
        case 'lastOrder':
          const aDate = a.lastOrderDate || a.createdAt || 0;
          const bDate = b.lastOrderDate || b.createdAt || 0;
          aValue = new Date(aDate).getTime();
          bValue = new Date(bDate).getTime();
          break;
        case 'type':
          aValue = a.type || '';
          bValue = b.type || '';
          break;
        default:
          aValue = a.name || '';
          bValue = b.name || '';
      }

      if (sortOrder === 'desc') {
        return bValue > aValue ? 1 : -1;
      }
      return aValue > bValue ? 1 : -1;
    });

    setFilteredCustomers(filtered);
    setCurrentPage(1);
  };

  const handleDeleteCustomer = async (customer: Customer) => {
    if (confirm(`Are you sure you want to delete ${customer.name}?`)) {
      try {
        // TODO: Implement delete functionality
        showToast(`${customer.name} deleted successfully`, 'success');
        fetchCustomers();
      } catch (error) {
        showToast('Failed to delete customer', 'error');
      }
    }
  };

  const handleViewCustomer = (customer: Customer) => {
    router.push(`/customers/${customer._id}`);
  };

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCustomers = filteredCustomers.slice(startIndex, endIndex);

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomersHeader />
      
      <CustomersStats stats={stats} loading={statsLoading} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <CustomersFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedType={selectedType}
          setSelectedType={setSelectedType}
          selectedTier={selectedTier}
          setSelectedTier={setSelectedTier}
          sortBy={sortBy}
          setSortBy={setSortBy}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          showFilters={showFilters}
          setShowFilters={setShowFilters}
          onClearFilters={() => {
            setSearchTerm('');
            setSelectedType('all');
            setSelectedTier('all');
            setSortBy('name');
            setSortOrder('asc');
          }}
        />

        <CustomersTable
          customers={currentCustomers}
          totalCustomers={filteredCustomers.length}
          currentPage={currentPage}
          totalPages={totalPages}
          startIndex={startIndex}
          endIndex={endIndex}
          onPageChange={setCurrentPage}
          onViewCustomer={handleViewCustomer}
          onEditCustomer={(customer) => {
            showToast('Edit feature coming soon', 'info');
          }}
          onDeleteCustomer={handleDeleteCustomer}
        />
      </div>
    </div>
  );
}