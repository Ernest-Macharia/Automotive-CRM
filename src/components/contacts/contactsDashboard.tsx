'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  Plus,
  Phone,
  MessageSquare,
  Mail,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  TrendingUp,
  CheckCircle,
  Clock,
  Download,
  RefreshCw,
  Loader2,
  UserPlus,
  PhoneCall,
  Smartphone,
  Building,
  Calendar,
  ChevronRight
} from 'lucide-react';
import { contactService, Contact, ContactStats } from '@/services/contactService';
import { useToast } from '@/contexts/ToastContext';
import Link from 'next/link';

// Skeleton Components
const SkeletonStats = () => (
  <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
    {[1, 2, 3, 4, 5].map((i) => (
      <div key={i} className={`rounded-2xl p-6 shadow-lg border ${i === 5 ? 'bg-gradient-to-r from-blue-500 to-purple-600' : 'bg-white border-gray-200'} animate-pulse`}>
        <div className="flex items-center justify-between">
          <div>
            <div className={`h-4 w-24 ${i === 5 ? 'bg-blue-100' : 'bg-gray-200'} rounded mb-2`}></div>
            <div className={`h-8 w-16 ${i === 5 ? 'bg-white/50' : 'bg-gray-300'} rounded`}></div>
          </div>
          <div className={`p-3 rounded-xl ${i === 5 ? 'bg-white/20' : 'bg-gray-100'}`}>
            <div className="h-6 w-6 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

const SkeletonRow = () => (
  <tr className="border-b border-gray-100 hover:bg-gray-50">
    <td className="px-6 py-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse"></div>
        <div>
          <div className="h-4 w-24 bg-gray-300 rounded animate-pulse mb-1"></div>
          <div className="h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    </td>
    <td className="px-6 py-4">
      <div className="space-y-1">
        <div className="h-5 w-20 bg-gray-300 rounded animate-pulse"></div>
        <div className="h-3 w-16 bg-gray-200 rounded animate-pulse"></div>
      </div>
    </td>
    <td className="px-6 py-4">
      <div className="space-y-1">
        <div className="h-4 w-24 bg-gray-300 rounded animate-pulse"></div>
        <div className="h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
      </div>
    </td>
    <td className="px-6 py-4">
      <div className="h-8 w-24 bg-gray-300 rounded-full animate-pulse"></div>
    </td>
    <td className="px-6 py-4">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 bg-gray-200 rounded-lg animate-pulse"></div>
        <div className="h-8 w-8 bg-gray-200 rounded-lg animate-pulse"></div>
        <div className="h-8 w-8 bg-gray-200 rounded-lg animate-pulse"></div>
        <div className="h-8 w-8 bg-gray-200 rounded-lg animate-pulse"></div>
      </div>
    </td>
  </tr>
);

export default function ContactsDashboard() {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterWhatsApp, setFilterWhatsApp] = useState('all');
  const [stats, setStats] = useState<ContactStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const typeOptions = [
    { value: 'all', label: 'All Types', color: 'text-gray-600' },
    { value: 'customer', label: 'Customer', color: 'text-blue-600' },
    { value: 'lead', label: 'Lead', color: 'text-yellow-600' },
    { value: 'partner', label: 'Partner', color: 'text-green-600' },
    { value: 'vendor', label: 'Vendor', color: 'text-purple-600' },
  ];

  const whatsappOptions = [
    { value: 'all', label: 'All WhatsApp', color: 'text-gray-600' },
    { value: 'enabled', label: 'WhatsApp Enabled', color: 'text-green-600' },
    { value: 'disabled', label: 'WhatsApp Disabled', color: 'text-gray-500' },
    { value: 'active', label: 'WhatsApp Active', color: 'text-blue-600' },
  ];

  const loadContacts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Loading contacts...');
      const contactsData = await contactService.getAllContactsWithFallback();
      console.log('Contacts loaded:', contactsData.length, 'contacts');
      if (contactsData.length > 0) {
        console.log('Sample contact:', contactsData[0]);
      }
      setContacts(contactsData);
    } catch (error) {
      console.error('Error loading contacts:', error);
      setError('Failed to load contacts. Please try again.');
      showToast('Failed to load contacts', 'error');
      setContacts([]);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const loadStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const statsData = await contactService.getContactsStatsWithFallback();
      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
      setStats(contactService.getDefaultStats());
    } finally {
      setStatsLoading(false);
    }
  }, [])

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      setError(null);
      await Promise.all([loadContacts(), loadStats()]);
      showToast('Contacts refreshed', 'success');
    } catch (error) {
      console.error('Error refreshing:', error);
      showToast('Failed to refresh', 'error');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadContacts();
    loadStats();
  }, [loadContacts, loadStats]);

  const handleDelete = async (contactId: string) => {
    if (!confirm('Are you sure you want to delete this contact?')) return;
    
    try {
      await contactService.deleteContact(contactId);
      showToast('Contact deleted successfully', 'success');
      setContacts(prev => prev.filter(c => c._id !== contactId));
      loadStats();
    } catch (error) {
      console.error('Error deleting contact:', error);
      showToast('Failed to delete contact', 'error');
    }
  };

  const handleMakeCall = async (contactId: string, phone: string) => {
    try {
      const result = await contactService.makeCall(contactId, { toNumber: phone });
      showToast(`Call initiated: ${result.message}`, 'success');
    } catch (error) {
      console.error('Error making call:', error);
      showToast('Failed to initiate call', 'error');
    }
  };

  const handleSendWhatsApp = async (contactId: string) => {
    const message = prompt('Enter WhatsApp message:');
    if (!message) return;
    
    try {
      const result = await contactService.sendQuickWhatsApp(contactId, message);
      showToast('WhatsApp message sent successfully', 'success');
    } catch (error) {
      console.error('Error sending WhatsApp:', error);
      showToast('Failed to send WhatsApp', 'error');
    }
  };

  const handleExportContacts = async () => {
    try {
      const csvContent = await contactService.exportContacts('csv');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contacts-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showToast('Contacts exported successfully', 'success');
    } catch (error) {
      console.error('Error exporting contacts:', error);
      showToast('Failed to export contacts', 'error');
    }
  };

  // Debug logging for filtered contacts
  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = 
      contact.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.phone?.includes(searchTerm) ||
      contact.companyName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || contact.type === filterType;
    const matchesWhatsApp = 
      filterWhatsApp === 'all' ? true :
      filterWhatsApp === 'enabled' ? contact.whatsappEnabled :
      filterWhatsApp === 'active' ? contact.whatsappStatus === 'active' :
      !contact.whatsappEnabled;
    
    return matchesSearch && matchesType && matchesWhatsApp;
  });

  console.log('Filtered contacts:', filteredContacts.length, 'out of', contacts.length);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'customer': return 'bg-gradient-to-r from-blue-500 to-blue-600';
      case 'lead': return 'bg-gradient-to-r from-yellow-500 to-amber-500';
      case 'partner': return 'bg-gradient-to-r from-green-500 to-emerald-500';
      case 'vendor': return 'bg-gradient-to-r from-purple-500 to-purple-600';
      default: return 'bg-gradient-to-r from-gray-400 to-gray-500';
    }
  };

  const getEngagementScore = (contact: Contact) => {
    let score = 0;
    if (contact.email) score += 10;
    if (contact.phone) score += 10;
    if (contact.companyName) score += 5;
    if (contact.totalCalls > 0) score += 20;
    if (contact.totalWhatsAppSent > 0) score += 15;
    if (contact.totalWhatsAppReceived > 0) score += 25;
    return Math.min(score, 100);
  };

  // Add a test contact button for debugging
  const handleTestAddContact = async () => {
    try {
      const testContact = {
        name: `Test Contact ${Date.now()}`,
        email: `test${Date.now()}@example.com`,
        phone: `+1${Math.floor(Math.random() * 1000000000)}`,
        companyName: 'Test Company',
        type: 'customer',
        whatsappEnabled: true,
        whatsappStatus: 'active'
      };
      
      const newContact = await contactService.createContact(testContact);
      showToast('Test contact added', 'success');
      setContacts(prev => [newContact, ...prev]);
      loadStats();
    } catch (error) {
      console.error('Error adding test contact:', error);
      showToast('Failed to add test contact', 'error');
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header - Fixed */}
      <div className="h-16 bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg flex items-center px-6 flex-shrink-0">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Contacts</h1>
              <p className="text-blue-100 text-sm">Manage and communicate with your contacts</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Debug button - remove in production */}
            {process.env.NODE_ENV === 'development' && (
              <button
                onClick={handleTestAddContact}
                className="px-3 py-1 bg-yellow-500 text-white text-sm rounded-lg hover:bg-yellow-600"
                title="Add test contact (dev only)"
              >
                Test Add
              </button>
            )}
            
            <button
              onClick={handleExportContacts}
              className="p-2 text-white hover:bg-white/20 rounded-xl transition-colors"
              title="Export Contacts"
            >
              <Download className="h-5 w-5" />
            </button>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors disabled:opacity-50"
              title="Refresh"
            >
              {refreshing ? (
                <Loader2 className="h-5 w-5 text-white animate-spin" />
              ) : (
                <RefreshCw className="h-5 w-5 text-white" />
              )}
            </button>
            <Link
              href="/contacts/create"
              className="px-4 py-2 bg-white text-blue-600 font-semibold rounded-xl hover:bg-white/90 flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              <span className="hidden sm:inline">New Contact</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Users className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-red-800">Error Loading Contacts</h3>
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                </div>
                <button
                  onClick={handleRefresh}
                  className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {/* Stats Cards */}
          {statsLoading ? (
            <SkeletonStats />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Contacts</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.totalContacts || 0}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-gradient-to-r from-blue-100 to-blue-200">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="text-xs text-gray-500">
                    Showing: {filteredContacts.length} contacts
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Phone Coverage</p>
                    <p className="text-3xl font-bold text-green-600 mt-2">
                      {stats?.phoneCoverage || '0%'}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-gradient-to-r from-green-100 to-green-200">
                    <Phone className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="text-xs text-gray-500">
                    {contacts.filter(c => c.phone).length} with phone
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">WhatsApp Enabled</p>
                    <p className="text-3xl font-bold text-blue-600 mt-2">
                      {stats?.whatsappStats?.whatsappEnabled || contacts.filter(c => c.whatsappEnabled).length}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-gradient-to-r from-blue-100 to-blue-200">
                    <Smartphone className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="text-xs text-gray-500">
                    {contacts.filter(c => c.whatsappStatus === 'active').length} active
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active Contacts</p>
                    <p className="text-3xl font-bold text-purple-600 mt-2">
                      {contacts.filter(c => c.active).length}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-gradient-to-r from-purple-100 to-purple-200">
                    <CheckCircle className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="text-xs text-gray-500">
                    {contacts.filter(c => !c.active).length} inactive
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-100">Engagement Rate</p>
                    <p className="text-3xl font-bold text-white mt-2">
                      {contacts.length > 0 
                        ? Math.round(contacts.reduce((sum, c) => sum + getEngagementScore(c), 0) / contacts.length)
                        : 0}%
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-white/20">
                  <div className="text-xs text-blue-100">
                    Based on {contacts.length} contacts
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Table Container */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Filters */}
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50/50 to-purple-50/50 flex-shrink-0">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search contacts by name, email, phone, or company..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all focus:outline-none"
                      disabled={loading}
                    />
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="pl-10 pr-8 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none appearance-none"
                      disabled={loading}
                    >
                      {typeOptions.map(option => (
                        <option key={option.value} value={option.value} className={option.color}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="relative">
                    <Smartphone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <select
                      value={filterWhatsApp}
                      onChange={(e) => setFilterWhatsApp(e.target.value)}
                      className="pl-10 pr-8 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none appearance-none"
                      disabled={loading}
                    >
                      {whatsappOptions.map(option => (
                        <option key={option.value} value={option.value} className={option.color}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setFilterType('all');
                      setFilterWhatsApp('all');
                    }}
                    className="px-4 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
                    disabled={loading}
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>

            {/* Contacts Table */}
            <div className="p-6 flex-1 overflow-y-auto">
              {loading ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-blue-50 to-purple-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Contact Details
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Contact Information
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Company & Type
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <SkeletonRow key={i} />
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : filteredContacts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 mb-4">
                    <Users className="h-8 w-8 text-gray-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    {contacts.length === 0 ? 'No contacts found' : 'No matching contacts'}
                  </h3>
                  <p className="text-gray-500 mb-6">
                    {contacts.length === 0 
                      ? 'Create your first contact to get started' 
                      : 'Try changing your search or filters'}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link
                      href="/contacts/create"
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 font-medium inline-flex items-center gap-2"
                    >
                      <UserPlus className="h-5 w-5" />
                      Create New Contact
                    </Link>
                    {(searchTerm || filterType !== 'all' || filterWhatsApp !== 'all') && (
                      <button
                        onClick={() => {
                          setSearchTerm('');
                          setFilterType('all');
                          setFilterWhatsApp('all');
                        }}
                        className="px-6 py-3 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium inline-flex items-center gap-2"
                      >
                        Clear Filters
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-blue-50 to-purple-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Contact Details
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Contact Information
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Company & Type
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {filteredContacts.map((contact) => (
                        <tr 
                          key={contact._id} 
                          className="hover:bg-gray-50/50 transition-all duration-200 group"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                                {contact.name?.charAt(0).toUpperCase() || '?'}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <Link
                                    href={`/contacts/${contact._id}`}
                                    className="font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                                  >
                                    {contact.name || 'Unnamed Contact'}
                                  </Link>
                                </div>
                                {contact.notes && (
                                  <div className="text-xs text-gray-500 mt-1 truncate max-w-xs">
                                    {contact.notes}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-1">
                              {contact.email && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Mail className="h-3 w-3 text-gray-400" />
                                  <span className="text-gray-700">{contact.email}</span>
                                </div>
                              )}
                              {contact.phone && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Phone className="h-3 w-3 text-gray-400" />
                                  <span className="text-gray-700">{contact.phone}</span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-2">
                              {contact.companyName && (
                                <div className="flex items-center gap-2">
                                  <Building className="h-3 w-3 text-gray-400" />
                                  <span className="text-sm text-gray-700">{contact.companyName}</span>
                                </div>
                              )}
                              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${getTypeColor(contact.type)} text-white`}>
                                {contact.type?.charAt(0).toUpperCase() + contact.type?.slice(1) || 'Unknown'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                {contact.active ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                    <CheckCircle className="h-3 w-3" />
                                    Active
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
                                    <Clock className="h-3 w-3" />
                                    Inactive
                                  </span>
                                )}
                                {contact.whatsappEnabled && (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                                    <Smartphone className="h-3 w-3" />
                                    WhatsApp
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500">
                                Created: {new Date(contact.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1">
                              <Link
                                href={`/contacts/${contact._id}`}
                                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                title="View Details"
                              >
                                <Eye className="h-4 w-4" />
                              </Link>
                              
                              <button
                                onClick={() => contact.phone && handleMakeCall(contact._id, contact.phone)}
                                className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-all"
                                title="Make Call"
                                disabled={!contact.phone}
                              >
                                <PhoneCall className="h-4 w-4" />
                              </button>
                              
                              <button
                                onClick={() => handleSendWhatsApp(contact._id)}
                                className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all"
                                title="Send WhatsApp"
                                disabled={!contact.whatsappEnabled}
                              >
                                <MessageSquare className="h-4 w-4" />
                              </button>
                              
                              <Link
                                href={`/contacts/${contact._id}/edit`}
                                className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all"
                                title="Edit Contact"
                              >
                                <Edit className="h-4 w-4" />
                              </Link>
                              
                              <button
                                onClick={() => handleDelete(contact._id)}
                                className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
                                title="Delete Contact"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          {!statsLoading && stats && contacts.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl p-6">
                <h3 className="font-semibold text-gray-800 mb-4">Contact Types</h3>
                <div className="space-y-3">
                  {['customer', 'lead', 'partner', 'vendor'].map((type) => {
                    const count = contacts.filter(c => c.type === type).length;
                    if (count === 0) return null;
                    return (
                      <div key={type} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full ${
                            type === 'customer' ? 'bg-blue-400' :
                            type === 'lead' ? 'bg-yellow-400' :
                            type === 'partner' ? 'bg-green-400' :
                            'bg-purple-400'
                          }`} />
                          <span className="text-sm text-gray-700 capitalize">{type}</span>
                        </div>
                        <span className="font-semibold text-gray-900">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-2xl p-6">
                <h3 className="font-semibold text-gray-800 mb-4">Communication Stats</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Total Calls</span>
                    <span className="font-semibold text-gray-900">
                      {contacts.reduce((sum, c) => sum + (c.totalCalls || 0), 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Total Call Duration</span>
                    <span className="font-semibold text-gray-900">
                      {Math.round(contacts.reduce((sum, c) => sum + (c.totalCallDuration || 0), 0) / 60)} min
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">WhatsApp Messages</span>
                    <span className="font-semibold text-gray-900">
                      {contacts.reduce((sum, c) => sum + (c.totalWhatsAppSent || 0) + (c.totalWhatsAppReceived || 0), 0)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-2xl p-6">
                <h3 className="font-semibold text-gray-800 mb-4">Status Overview</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Active Contacts</span>
                    <span className="font-semibold text-gray-900">
                      {contacts.filter(c => c.active).length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">WhatsApp Enabled</span>
                    <span className="font-semibold text-gray-900">
                      {contacts.filter(c => c.whatsappEnabled).length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Has Email</span>
                    <span className="font-semibold text-gray-900">
                      {contacts.filter(c => c.email).length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}