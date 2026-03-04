'use client';

import { useState, useEffect, useCallback, useRef, type ChangeEvent } from 'react';
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
  ChevronRight,
  Briefcase,
  Target,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  MoreHorizontal,
  MoreVertical,
  ExternalLink,
  FileText,
  Copy,
  Upload
} from 'lucide-react';
import { contactService, Contact, ContactStats } from '@/services/contactService';
import { opportunityService, Opportunity } from '@/services/opportunityService';
import { useToast } from '@/contexts/ToastContext';
import Link from 'next/link';

// Extended Contact interface for opportunity-based contacts
interface OpportunityContact extends Contact {
  engagementScore: number;
  leadPriority: number;
  lastContact: string;
  address?: string;
  website?: string;
  jobTitle?: string;
  department?: string;
  tags: string[];
  source: string;
  assignedTo: any;
  totalValue: number;
  lifetimeValue: number;
  lastPurchaseDate: string;
  emailOptIn: boolean;
  smsOptIn: boolean;
  linkedinProfile?: string;
  facebookProfile?: string;
  companySize?: string;
  industry?: string;
  referredBy?: string;
  lastActivityDate: string;
  activityCount: number;
  attachments: any[];
  nextFollowUpDate?: string;
  followUpNotes?: string;
}

// Extended ContactStats interface with opportunity stats
interface OpportunityContactStats extends ContactStats {
  opportunityStats?: {
    totalOpportunities: number;
    byOpportunityType: Record<string, number>;
    byLeadTier: Record<string, number>;
    totalValue: number;
    averageDealSize: number;
    activeOpportunities: number;
    conversionRate: number;
  };
}

// Pagination interface
interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// Action menu dropdown component
const ActionMenu = ({
  contact,
  onMakeCall,
  onSendWhatsApp,
  onDelete,
  onViewDetails,
  onViewOpportunity,
  onClose
}: {
  contact: OpportunityContact;
  onMakeCall: (contactId: string, phone: string) => void;
  onSendWhatsApp: (contactId: string) => void;
  onDelete: (contactId: string) => void;
  onViewDetails: (contactId: string) => void;
  onViewOpportunity: (opportunityId?: string) => void;
  onClose: () => void;
}) => {
  const { showToast } = useToast();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleCopyEmail = () => {
    if (contact.email) {
      navigator.clipboard.writeText(contact.email);
      showToast('Email copied to clipboard', 'success');
      onClose();
    }
  };

  const handleCopyPhone = () => {
    if (contact.phone) {
      navigator.clipboard.writeText(contact.phone);
      showToast('Phone number copied to clipboard', 'success');
      onClose();
    }
  };

  return (
    <div
      ref={menuRef}
      className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 z-50 py-1"
    >
      <div className="px-4 py-2 border-b border-gray-100">
        <p className="text-sm font-medium text-gray-900">{contact.name}</p>
        <p className="text-xs text-gray-500 truncate">{contact.email || 'No email'}</p>
      </div>
      
      <div className="py-1">
        <button
          onClick={() => {
            onViewDetails(contact._id);
            onClose();
          }}
          className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <Eye className="h-4 w-4 text-gray-500" />
          <span>View Details</span>
        </button>
        
        {contact.opportunityId && (
          <button
            onClick={() => {
              onViewOpportunity(contact.opportunityId);
              onClose();
            }}
            className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <Briefcase className="h-4 w-4 text-gray-500" />
            <span>View Opportunity</span>
          </button>
        )}
        
        <button
          onClick={() => {
            onViewDetails(contact._id);
            onClose();
          }}
          className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <Edit className="h-4 w-4 text-gray-500" />
          <span>Edit Contact</span>
        </button>
        
        <button
          onClick={() => {
            onViewOpportunity(contact.opportunityId);
            onClose();
          }}
          className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <FileText className="h-4 w-4 text-gray-500" />
          <span>View Notes</span>
        </button>
      </div>
      
      <div className="py-1 border-t border-gray-100">
        <button
          onClick={() => contact.phone && onMakeCall(contact._id, contact.phone)}
          disabled={!contact.phone}
          className="flex items-center gap-3 w-full px-4 py-2 text-sm text-green-700 hover:bg-green-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <PhoneCall className="h-4 w-4" />
          <span>Make Call</span>
        </button>
        
        <button
          onClick={() => onSendWhatsApp(contact._id)}
          disabled={!contact.whatsappEnabled}
          className="flex items-center gap-3 w-full px-4 py-2 text-sm text-blue-700 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <MessageSquare className="h-4 w-4" />
          <span>Send WhatsApp</span>
        </button>
        
        {contact.email && (
          <button
            onClick={handleCopyEmail}
            className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <Copy className="h-4 w-4 text-gray-500" />
            <span>Copy Email</span>
          </button>
        )}
        
        {contact.phone && (
          <button
            onClick={handleCopyPhone}
            className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <Copy className="h-4 w-4 text-gray-500" />
            <span>Copy Phone</span>
          </button>
        )}
      </div>
      
      <div className="py-1 border-t border-gray-100">
        <button
          onClick={() => {
            if (confirm('Are you sure you want to delete this contact?')) {
              onDelete(contact._id);
            }
            onClose();
          }}
          className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50 transition-colors"
        >
          <Trash2 className="h-4 w-4" />
          <span>Delete Contact</span>
        </button>
      </div>
    </div>
  );
};

// Helper function to convert opportunities to contacts
const convertOpportunitiesToContacts = (opportunities: Opportunity[]): OpportunityContact[] => {
  return opportunities.map((opportunity): OpportunityContact => {
    const customer = opportunity.customer;
    const opportunityType = opportunity.opportunityType || 'SERVICE';
    
    // Determine contact type based on opportunity type
    let contactType = 'lead';
    if (opportunityType === 'SERVICE' || opportunityType === 'MAINTENANCE' || opportunityType === 'REPAIR') {
      contactType = 'customer';
    } else if (opportunityType === 'SALE') {
      contactType = 'customer';
    }
    
    // Determine if active based on opportunity status
    const isActive = opportunity.status !== 'lost' && opportunity.status !== 'non_progressive';
    
    // Get lead tier if available
    const tier = opportunity.leadScore?.tier || 'cold';
    
    // Calculate engagement score
    let engagementScore = 0;
    if (customer.email) engagementScore += 10;
    if (customer.phone || customer.companyPhone) engagementScore += 10;
    if (customer.companyName) engagementScore += 5;
    if (opportunity.status === 'won') engagementScore += 30;
    if (tier === 'hot') engagementScore += 25;
    if (tier === 'warm') engagementScore += 15;
    if (opportunity.leadScore?.totalScore && opportunity.leadScore.totalScore > 70) engagementScore += 20;
    engagementScore = Math.min(engagementScore, 100);
    
    return {
      _id: opportunity._id || `opp-${opportunity.id}`,
      id: opportunity.id,
      name: customer.name || 'Unknown Customer',
      email: customer.email || '',
      phone: customer.phone || customer.companyPhone || '',
      companyName: customer.companyName || '',
      opportunityId: opportunity._id,
      opportunity: {
        _id: opportunity._id,
        subject: opportunity.subject,
        type: opportunity.type || 'individual',
        status: opportunity.status,
        customer: customer
      },
      active: isActive,
      type: contactType,
      notes: opportunity.notes || `Opportunity: ${opportunity.subject}. Status: ${opportunity.status}`,
      whatsappEnabled: tier === 'hot' || tier === 'warm',
      whatsappStatus: 'active',
      customFields: {
        leadScore: opportunity.leadScore?.totalScore || 0,
        leadTier: tier,
        opportunitySource: opportunity.source || 'unknown',
        opportunityStatus: opportunity.status,
        opportunityType: opportunityType,
        packageType: opportunity.packageType,
        lastStageChange: opportunity.updatedAt,
        hasVehicles: opportunity.vehicles && opportunity.vehicles.length > 0,
        vehicleCount: opportunity.vehicles?.length || 0,
        totalValue: opportunity.total || 0
      },
      whatsappMessages: [],
      lastWhatsAppSent: undefined,
      lastWhatsAppReceived: undefined,
      totalWhatsAppSent: 0,
      totalWhatsAppReceived: 0,
      whatsappOptInDate: undefined,
      whatsappOptOutDate: undefined,
      callHistory: [],
      totalCallDuration: 0,
      totalCalls: 0,
      lastCallDate: undefined,
      createdAt: opportunity.createdAt,
      updatedAt: opportunity.updatedAt,
      // Computed properties
      engagementScore,
      leadPriority: opportunity.leadScore?.priority || 3,
      lastContact: new Date().toISOString(),
      // Additional fields
      address: customer.companyAddress || '',
      website: '',
      jobTitle: '',
      department: '',
      tags: [tier, opportunityType.toLowerCase()],
      source: opportunity.source || 'opportunity',
      assignedTo: opportunity.assignedTo || null,
      // Financial fields
      totalValue: opportunity.total || 0,
      lifetimeValue: opportunity.total || 0,
      lastPurchaseDate: opportunity.createdAt,
      // Communication preferences
      emailOptIn: true,
      smsOptIn: true,
      // Social fields
      linkedinProfile: '',
      facebookProfile: '',
      // Organization fields
      companySize: '',
      industry: '',
      // Relationship fields
      referredBy: '',
      // Activity fields
      lastActivityDate: opportunity.updatedAt,
      activityCount: 0,
      // File attachments
      attachments: [],
      // Follow-up fields
      nextFollowUpDate: '',
      followUpNotes: ''
    };
  });
};

// Skeleton Components (keep existing)
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
      <div className="flex justify-end">
        <div className="h-8 w-8 bg-gray-200 rounded-lg animate-pulse"></div>
      </div>
    </td>
  </tr>
);

// Pagination component
const PaginationControls = ({
  pagination,
  onPageChange,
  loading
}: {
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
  loading: boolean;
}) => {
  const { currentPage, totalPages, totalItems, itemsPerPage } = pagination;
  
  if (totalPages <= 1) return null;
  
  // Calculate page numbers to show
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Show limited pages with ellipsis
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);
      
      if (currentPage <= 3) {
        startPage = 2;
        endPage = 4;
      } else if (currentPage >= totalPages - 2) {
        startPage = totalPages - 3;
        endPage = totalPages - 1;
      }
      
      pageNumbers.push(1);
      
      if (startPage > 2) {
        pageNumbers.push('...');
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
      
      if (endPage < totalPages - 1) {
        pageNumbers.push('...');
      }
      
      pageNumbers.push(totalPages);
    }
    
    return pageNumbers;
  };
  
  const pageNumbers = getPageNumbers();
  
  // Calculate range of items being shown
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);
  
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-gray-200 bg-white">
      <div className="text-sm text-gray-600">
        Showing <span className="font-semibold">{startItem}-{endItem}</span> of{' '}
        <span className="font-semibold">{totalItems}</span> contacts
      </div>
      
      <div className="flex items-center gap-1">
        {/* First page button */}
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1 || loading}
          className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          title="First page"
        >
          <ChevronsLeft className="h-4 w-4" />
        </button>
        
        {/* Previous page button */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1 || loading}
          className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        
        {/* Page numbers */}
        <div className="flex items-center gap-1 mx-2">
          {pageNumbers.map((page, index) => (
            page === '...' ? (
              <span key={`ellipsis-${index}`} className="px-2 py-1 text-gray-400">
                <MoreHorizontal className="h-4 w-4" />
              </span>
            ) : (
              <button
                key={page}
                onClick={() => onPageChange(page as number)}
                disabled={currentPage === page || loading}
                className={`w-10 h-10 flex items-center justify-center rounded-lg font-medium transition-colors ${
                  currentPage === page
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {page}
              </button>
            )
          ))}
        </div>
        
        {/* Next page button */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || loading}
          className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Next page"
        >
          <ChevronRight className="h-4 w-4 rotate-180" />
        </button>
        
        {/* Last page button */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages || loading}
          className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Last page"
        >
          <ChevronsRight className="h-4 w-4" />
        </button>
      </div>
      
      {/* Items per page selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Show:</span>
        <select
          value={itemsPerPage}
          onChange={(e) => {
            onPageChange(1); // Reset to first page when changing items per page
            // In a real app, you would update the itemsPerPage state here
          }}
          className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={loading}
        >
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
        <span className="text-sm text-gray-600">per page</span>
      </div>
    </div>
  );
};

export default function ContactsDashboard() {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [contacts, setContacts] = useState<OpportunityContact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<OpportunityContact[]>([]);
  const [paginatedContacts, setPaginatedContacts] = useState<OpportunityContact[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterWhatsApp, setFilterWhatsApp] = useState('all');
  const [filterOpportunityType, setFilterOpportunityType] = useState('all');
  const [filterLeadTier, setFilterLeadTier] = useState('all');
  const [stats, setStats] = useState<OpportunityContactStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
    hasNextPage: false,
    hasPreviousPage: false
  });

  // Action menu state
  const [activeActionMenu, setActiveActionMenu] = useState<string | null>(null);
  const [importingCsv, setImportingCsv] = useState(false);
  const csvInputRef = useRef<HTMLInputElement>(null);

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

  const opportunityTypeOptions = [
    { value: 'all', label: 'All Opportunity Types', color: 'text-gray-600' },
    { value: 'SERVICE', label: 'Service', color: 'text-blue-600' },
    { value: 'SALE', label: 'Sale', color: 'text-green-600' },
    { value: 'REPAIR', label: 'Repair', color: 'text-orange-600' },
    { value: 'MAINTENANCE', label: 'Maintenance', color: 'text-purple-600' },
    { value: 'INSPECTION', label: 'Inspection', color: 'text-yellow-600' },
  ];

  const leadTierOptions = [
    { value: 'all', label: 'All Lead Tiers', color: 'text-gray-600' },
    { value: 'hot', label: 'Hot', color: 'text-red-600' },
    { value: 'warm', label: 'Warm', color: 'text-orange-600' },
    { value: 'cold', label: 'Cold', color: 'text-blue-600' },
  ];

  const loadOpportunities = useCallback(async (page?: number, limit?: number) => {
    try {
      setLoading(true);
      setError(null);
      
      // Load opportunities with their customers
      const response = await opportunityService.getAllOpportunities({
        limit: limit || 1000, // Load more for filtering
        sort: 'createdAt:desc'
      });
      
      const opportunitiesData = response.data || [];
      
      setOpportunities(opportunitiesData);
      
      // Convert opportunities to contacts
      const contactsData = convertOpportunitiesToContacts(opportunitiesData);
      setContacts(contactsData);
      
      // Initialize filtered contacts
      setFilteredContacts(contactsData);
      
      return contactsData;
      
    } catch (error) {
      console.error('Error loading opportunities:', error);
      setError('Failed to load contacts from opportunities. Please try again.');
      showToast('Failed to load contacts', 'error');
      setContacts([]);
      setFilteredContacts([]);
      setOpportunities([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Apply filters and update pagination
  const applyFilters = useCallback(() => {
    const filtered = contacts.filter(contact => {
      const matchesSearch = 
        contact.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.phone?.includes(searchTerm) ||
        contact.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.opportunity?.subject?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = filterType === 'all' || contact.type === filterType;
      
      const matchesWhatsApp = 
        filterWhatsApp === 'all' ? true :
        filterWhatsApp === 'enabled' ? contact.whatsappEnabled :
        filterWhatsApp === 'active' ? contact.whatsappStatus === 'active' :
        !contact.whatsappEnabled;
      
      const matchesOpportunityType = 
        filterOpportunityType === 'all' ? true :
        contact.customFields?.opportunityType === filterOpportunityType;
      
      const matchesLeadTier = 
        filterLeadTier === 'all' ? true :
        contact.customFields?.leadTier === filterLeadTier;
      
      return matchesSearch && matchesType && matchesWhatsApp && matchesOpportunityType && matchesLeadTier;
    });
    
    setFilteredContacts(filtered);
    
    // Update pagination
    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / pagination.itemsPerPage);
    
    setPagination(prev => ({
      ...prev,
      totalItems,
      totalPages,
      hasNextPage: prev.currentPage < totalPages,
      hasPreviousPage: prev.currentPage > 1
    }));
    
    // Update paginated contacts
    const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
    const endIndex = startIndex + pagination.itemsPerPage;
    setPaginatedContacts(filtered.slice(startIndex, endIndex));
  }, [contacts, searchTerm, filterType, filterWhatsApp, filterOpportunityType, filterLeadTier, pagination.currentPage, pagination.itemsPerPage]);

  // Handle page change
  const handlePageChange = (page: number) => {
    if (page < 1 || page > pagination.totalPages) return;
    
    setPagination(prev => ({
      ...prev,
      currentPage: page,
      hasNextPage: page < prev.totalPages,
      hasPreviousPage: page > 1
    }));
  };

  // Update paginated contacts when pagination changes
  useEffect(() => {
    const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
    const endIndex = startIndex + pagination.itemsPerPage;
    setPaginatedContacts(filteredContacts.slice(startIndex, endIndex));
  }, [pagination.currentPage, pagination.itemsPerPage, filteredContacts]);

  // Apply filters when dependencies change
  useEffect(() => {
    if (contacts.length > 0) {
      applyFilters();
    }
  }, [contacts, searchTerm, filterType, filterWhatsApp, filterOpportunityType, filterLeadTier, applyFilters]);

  const loadStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      // Calculate stats from contacts
      const contactsData = contacts.length > 0 ? contacts : [];
      
      const contactsWithEmail = contactsData.filter(c => c.email).length;
      const contactsWithPhone = contactsData.filter(c => c.phone).length;
      
      // Calculate contacts by type
      const typeCounts: Record<string, number> = {};
      contactsData.forEach(contact => {
        const type = contact.type || 'unknown';
        typeCounts[type] = (typeCounts[type] || 0) + 1;
      });
      
      const contactsByType = Object.entries(typeCounts).map(([_id, count]) => ({
        _id,
        count
      }));

      // Calculate opportunity type distribution
      const opportunityTypeCounts: Record<string, number> = {};
      opportunities.forEach(opp => {
        const type = opp.opportunityType || 'SERVICE';
        opportunityTypeCounts[type] = (opportunityTypeCounts[type] || 0) + 1;
      });

      // Calculate lead tier distribution
      const leadTierCounts: Record<string, number> = {};
      opportunities.forEach(opp => {
        const tier = opp.leadScore?.tier || 'cold';
        leadTierCounts[tier] = (leadTierCounts[tier] || 0) + 1;
      });

      // Calculate total opportunity value
      const totalOpportunityValue = opportunities.reduce((sum, opp) => sum + (opp.total || 0), 0);
      const activeOpportunities = opportunities.filter(opp => 
        opp.status !== 'lost' && opp.status !== 'non_progressive'
      ).length;
      const wonOpportunities = opportunities.filter(opp => opp.status === 'won').length;

      const statsData: OpportunityContactStats = {
        totalContacts: contactsData.length,
        contactsWithEmail,
        contactsWithPhone,
        contactsByType,
        emailCoverage: contactsData.length > 0 ? `${Math.round((contactsWithEmail / contactsData.length) * 100)}%` : '0%',
        phoneCoverage: contactsData.length > 0 ? `${Math.round((contactsWithPhone / contactsData.length) * 100)}%` : '0%',
        callStats: {
          totalCalls: 0,
          totalDuration: 0,
          avgDuration: 0,
          contactsWithCalls: 0
        },
        whatsappStats: {
          totalContacts: contactsData.length,
          whatsappEnabled: contactsData.filter(c => c.whatsappEnabled).length,
          whatsappActive: contactsData.filter(c => c.whatsappStatus === 'active').length,
          totalMessagesSent: 0,
          totalMessagesReceived: 0,
          messagesByStatus: {}
        },
        // Add opportunity-specific stats
        opportunityStats: {
          totalOpportunities: opportunities.length,
          byOpportunityType: opportunityTypeCounts,
          byLeadTier: leadTierCounts,
          totalValue: totalOpportunityValue,
          averageDealSize: opportunities.length > 0 ? totalOpportunityValue / opportunities.length : 0,
          activeOpportunities: activeOpportunities,
          conversionRate: opportunities.length > 0 ? 
            (wonOpportunities / opportunities.length) * 100 : 0
        }
      };
      
      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
      // Provide default stats
      setStats({
        totalContacts: 0,
        contactsWithEmail: 0,
        contactsWithPhone: 0,
        contactsByType: [],
        emailCoverage: '0%',
        phoneCoverage: '0%',
        callStats: {
          totalCalls: 0,
          totalDuration: 0,
          avgDuration: 0,
          contactsWithCalls: 0
        },
        whatsappStats: {
          totalContacts: 0,
          whatsappEnabled: 0,
          whatsappActive: 0,
          totalMessagesSent: 0,
          totalMessagesReceived: 0,
          messagesByStatus: {}
        },
        opportunityStats: {
          totalOpportunities: 0,
          byOpportunityType: {},
          byLeadTier: {},
          totalValue: 0,
          averageDealSize: 0,
          activeOpportunities: 0,
          conversionRate: 0
        }
      });
    } finally {
      setStatsLoading(false);
    }
  }, [contacts, opportunities]);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      setError(null);
      await Promise.all([loadOpportunities(), loadStats()]);
      showToast('Contacts refreshed', 'success');
    } catch (error) {
      console.error('Error refreshing:', error);
      showToast('Failed to refresh', 'error');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOpportunities();
  }, [loadOpportunities]);

  useEffect(() => {
    if (contacts.length > 0 || opportunities.length > 0) {
      loadStats();
    }
  }, [contacts.length, opportunities.length, loadStats]);

  const handleDelete = async (contactId: string) => {
    try {
      // Since contacts come from opportunities, we need to handle this differently
      // For now, just remove from local state
      showToast('Contact removed from view', 'success');
      setContacts(prev => prev.filter(c => c._id !== contactId));
      loadStats();
    } catch (error) {
      console.error('Error removing contact:', error);
      showToast('Failed to remove contact', 'error');
    }
  };

  const handleMakeCall = async (contactId: string, phone: string) => {
    try {
      const result = await contactService.makeCall(contactId, { toNumber: phone });
      showToast(`Call initiated: ${result.message}`, 'success');
      setActiveActionMenu(null);
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
      setActiveActionMenu(null);
    } catch (error) {
      console.error('Error sending WhatsApp:', error);
      showToast('Failed to send WhatsApp', 'error');
    }
  };

  const handleExportContacts = async () => {
    try {
      const csvRows = [];
      
      // Add headers
      const headers = [
        'Name', 'Email', 'Phone', 'Company', 'Contact Type', 
        'Opportunity Subject', 'Opportunity Status', 'Lead Tier',
        'Opportunity Type', 'Total Value', 'Created Date'
      ];
      csvRows.push(headers.join(','));
      
      // Add data rows
      filteredContacts.forEach(contact => {
        const row = [
          `"${contact.name}"`,
          `"${contact.email || ''}"`,
          `"${contact.phone || ''}"`,
          `"${contact.companyName || ''}"`,
          `"${contact.type}"`,
          `"${contact.opportunity?.subject || ''}"`,
          `"${contact.opportunity?.status || ''}"`,
          `"${contact.customFields?.leadTier || ''}"`,
          `"${contact.customFields?.opportunityType || ''}"`,
          `"${contact.customFields?.totalValue || 0}"`,
          `"${new Date(contact.createdAt).toLocaleDateString()}"`
        ];
        csvRows.push(row.join(','));
      });
      
      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `opportunity-contacts-export-${new Date().toISOString().split('T')[0]}.csv`;
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

  const handleImportCsv = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setImportingCsv(true);
      const preview = await contactService.previewCsvImport(file);
      const rowCount = preview?.totalRows ?? preview?.rows?.length ?? 0;
      const proceed = window.confirm(`Preview complete (${rowCount} rows). Continue import?`);
      if (!proceed) return;

      const result = await contactService.executeCsvImport(file);
      const imported = result?.importedCount ?? result?.created ?? result?.successCount ?? 0;
      showToast(`Contacts CSV imported${imported ? `: ${imported} rows` : ''}`, 'success');
      await handleRefresh();
    } catch (error) {
      console.error('Error importing contacts CSV:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to import contacts CSV';
      showToast(errorMessage, 'error');
    } finally {
      setImportingCsv(false);
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'customer': return 'bg-gradient-to-r from-blue-500 to-blue-600';
      case 'lead': return 'bg-gradient-to-r from-yellow-500 to-amber-500';
      case 'partner': return 'bg-gradient-to-r from-green-500 to-emerald-500';
      case 'vendor': return 'bg-gradient-to-r from-purple-500 to-purple-600';
      default: return 'bg-gradient-to-r from-gray-400 to-gray-500';
    }
  };

  const getOpportunityTypeColor = (type: string) => {
    switch (type) {
      case 'SERVICE': return 'bg-blue-100 text-blue-800';
      case 'SALE': return 'bg-green-100 text-green-800';
      case 'REPAIR': return 'bg-orange-100 text-orange-800';
      case 'MAINTENANCE': return 'bg-purple-100 text-purple-800';
      case 'INSPECTION': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLeadTierColor = (tier: string) => {
    switch (tier) {
      case 'hot': return 'bg-red-100 text-red-800';
      case 'warm': return 'bg-orange-100 text-orange-800';
      case 'cold': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEngagementScore = (contact: OpportunityContact) => {
    return contact.engagementScore;
  };

  const handleRowClick = (contactId: string) => {
    router.push(`/contacts/${contactId}`);
  };

  const handleViewDetails = (contactId: string) => {
    router.push(`/contacts/${contactId}`);
  };

  const handleViewOpportunity = (opportunityId?: string) => {
    if (opportunityId) {
      router.push(`/opportunities/${opportunityId}`);
    }
  };

  const toggleActionMenu = (contactId: string) => {
    setActiveActionMenu(activeActionMenu === contactId ? null : contactId);
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
              <h1 className="text-xl font-bold text-white">Contacts from Opportunities</h1>
              <p className="text-blue-100 text-sm">Manage contacts derived from your opportunities</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <input
              ref={csvInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleImportCsv}
            />
            <button
              onClick={() => csvInputRef.current?.click()}
              disabled={importingCsv}
              className="p-2 text-white hover:bg-white/20 rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50"
              title="Import Contacts CSV"
            >
              {importingCsv ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Upload className="h-5 w-5" />
              )}
              <span className="hidden sm:inline">Import</span>
            </button>
            <button
              onClick={handleExportContacts}
              className="p-2 text-white hover:bg-white/20 rounded-xl transition-colors flex items-center gap-2"
              title="Export Contacts"
            >
              <Download className="h-5 w-5" />
              <span className="hidden sm:inline">Export</span>
            </button>
            {/* <button
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
              href="/opportunities/create"
              className="px-4 py-2 bg-white text-blue-600 font-semibold rounded-xl hover:bg-white/90 flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              <span className="hidden sm:inline">New Opportunity</span>
            </Link> */}
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
                    From {stats?.opportunityStats?.totalOpportunities || 0} opportunities
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Opportunity Value</p>
                    <p className="text-3xl font-bold text-green-600 mt-2">
                      ${(stats?.opportunityStats?.totalValue || 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-gradient-to-r from-green-100 to-green-200">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="text-xs text-gray-500">
                    Avg: ${(stats?.opportunityStats?.averageDealSize || 0).toFixed(0)}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Hot Leads</p>
                    <p className="text-3xl font-bold text-red-600 mt-2">
                      {stats?.opportunityStats?.byLeadTier?.hot || 0}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-gradient-to-r from-red-100 to-red-200">
                    <Target className="h-6 w-6 text-red-600" />
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="text-xs text-gray-500">
                    {stats?.opportunityStats?.byLeadTier?.warm || 0} warm, {stats?.opportunityStats?.byLeadTier?.cold || 0} cold
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active Opportunities</p>
                    <p className="text-3xl font-bold text-purple-600 mt-2">
                      {stats?.opportunityStats?.activeOpportunities || 0}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-gradient-to-r from-purple-100 to-purple-200">
                    <Briefcase className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="text-xs text-gray-500">
                    {((stats?.opportunityStats?.conversionRate || 0)).toFixed(1)}% conversion
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
                      placeholder="Search contacts by name, email, phone, company, or opportunity..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all focus:outline-none"
                      disabled={loading}
                    />
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative">
                    <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="pl-10 pr-8 py-2 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none appearance-none text-sm"
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
                    <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <select
                      value={filterOpportunityType}
                      onChange={(e) => setFilterOpportunityType(e.target.value)}
                      className="pl-10 pr-8 py-2 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none appearance-none text-sm"
                      disabled={loading}
                    >
                      {opportunityTypeOptions.map(option => (
                        <option key={option.value} value={option.value} className={option.color}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="relative">
                    <Target className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <select
                      value={filterLeadTier}
                      onChange={(e) => setFilterLeadTier(e.target.value)}
                      className="pl-10 pr-8 py-2 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none appearance-none text-sm"
                      disabled={loading}
                    >
                      {leadTierOptions.map(option => (
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
                      setFilterOpportunityType('all');
                      setFilterLeadTier('all');
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors text-sm"
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
                          Opportunity Info
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
              ) : paginatedContacts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 mb-4">
                    <Users className="h-8 w-8 text-gray-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    {contacts.length === 0 ? 'No contacts found' : 'No matching contacts'}
                  </h3>
                  <p className="text-gray-500 mb-6">
                    {contacts.length === 0 
                      ? 'Create opportunities to generate contacts' 
                      : 'Try changing your search or filters'}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link
                      href="/opportunities/create"
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 font-medium inline-flex items-center gap-2"
                    >
                      <Plus className="h-5 w-5" />
                      Create New Opportunity
                    </Link>
                    {(searchTerm || filterType !== 'all' || filterOpportunityType !== 'all' || filterLeadTier !== 'all') && (
                      <button
                        onClick={() => {
                          setSearchTerm('');
                          setFilterType('all');
                          setFilterWhatsApp('all');
                          setFilterOpportunityType('all');
                          setFilterLeadTier('all');
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
                          Opportunity Info
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {paginatedContacts.map((contact) => (
                        <tr 
                          key={contact._id} 
                          className="group hover:bg-gray-50/50 transition-all duration-200 cursor-pointer"
                          onClick={(e) => {
                            // Don't trigger row click if clicking on action button
                            if (!(e.target as HTMLElement).closest('.action-menu-trigger')) {
                              handleRowClick(contact._id);
                            }
                          }}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                                {contact.name?.charAt(0).toUpperCase() || '?'}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                    {contact.name || 'Unnamed Contact'}
                                  </span>
                                  {contact.customFields?.leadTier && (
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getLeadTierColor(contact.customFields.leadTier as string)}`}>
                                      {contact.customFields.leadTier as string}
                                    </span>
                                  )}
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
                              {contact.customFields?.leadScore && (
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  <Target className="h-3 w-3" />
                                  <span>Score: {contact.customFields.leadScore as number}</span>
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
                              <div className="flex gap-2 flex-wrap">
                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${getTypeColor(contact.type)} text-white`}>
                                  {contact.type?.charAt(0).toUpperCase() + contact.type?.slice(1) || 'Unknown'}
                                </span>
                                {contact.customFields?.opportunityType && (
                                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getOpportunityTypeColor(contact.customFields.opportunityType as string)}`}>
                                    {contact.customFields.opportunityType as string}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <Briefcase className="h-3 w-3 text-gray-400" />
                                  <span className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                                    {contact.opportunity?.subject || 'Opportunity'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={`text-xs px-2 py-1 rounded ${
                                    contact.opportunity?.status === 'won' 
                                      ? 'bg-green-100 text-green-800' 
                                      : contact.opportunity?.status === 'lost'
                                        ? 'bg-red-100 text-red-800'
                                        : 'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {contact.opportunity?.status?.replace(/_/g, ' ')}
                                  </span>
                                  {contact.customFields?.totalValue && (
                                    <span className="text-xs text-gray-600">
                                      ${(contact.customFields.totalValue as number).toLocaleString()}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="text-xs text-gray-500">
                                Created: {new Date(contact.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="relative">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleActionMenu(contact._id);
                                }}
                                className="action-menu-trigger p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Actions"
                              >
                                <MoreVertical className="h-5 w-5" />
                              </button>
                              
                              {activeActionMenu === contact._id && (
                                <ActionMenu
                                  contact={contact}
                                  onMakeCall={handleMakeCall}
                                  onSendWhatsApp={handleSendWhatsApp}
                                  onDelete={handleDelete}
                                  onViewDetails={handleViewDetails}
                                  onViewOpportunity={handleViewOpportunity}
                                  onClose={() => setActiveActionMenu(null)}
                                />
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Pagination Controls */}
            {!loading && paginatedContacts.length > 0 && (
              <PaginationControls
                pagination={pagination}
                onPageChange={handlePageChange}
                loading={loading}
              />
            )}
          </div>

          {/* Quick Stats */}
          {/* {!statsLoading && stats && contacts.length > 0 && (
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
                <h3 className="font-semibold text-gray-800 mb-4">Opportunity Types</h3>
                <div className="space-y-3">
                  {Object.entries(stats.opportunityStats?.byOpportunityType || {}).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${
                          type === 'SERVICE' ? 'bg-blue-400' :
                          type === 'SALE' ? 'bg-green-400' :
                          type === 'REPAIR' ? 'bg-orange-400' :
                          type === 'MAINTENANCE' ? 'bg-purple-400' :
                          'bg-yellow-400'
                        }`} />
                        <span className="text-sm text-gray-700">{type}</span>
                      </div>
                      <span className="font-semibold text-gray-900">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-2xl p-6">
                <h3 className="font-semibold text-gray-800 mb-4">Lead Tiers</h3>
                <div className="space-y-3">
                  {Object.entries(stats.opportunityStats?.byLeadTier || {}).map(([tier, count]) => (
                    <div key={tier} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${
                          tier === 'hot' ? 'bg-red-400' :
                          tier === 'warm' ? 'bg-orange-400' :
                          'bg-blue-400'
                        }`} />
                        <span className="text-sm text-gray-700 capitalize">{tier}</span>
                      </div>
                      <span className="font-semibold text-gray-900">{count}</span>
                    </div>
                  ))}
                  <div className="pt-3 mt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Conversion Rate</span>
                      <span className="font-semibold text-gray-900">
                        {stats.opportunityStats?.conversionRate?.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )} */}
        </div>
      </div>
    </div>
  );
}
