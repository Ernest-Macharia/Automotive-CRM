'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search, Filter, RefreshCw, User, Mail, Phone,
  MessageSquare, Tag, Calendar, ChevronRight,
  CheckCircle, XCircle, Edit, Trash2, Loader2,
  Plus, ClipboardCheck
} from 'lucide-react';
import { manychatService, ManyChatContact, ManyChatFilterParams } from '@/services/manychatService';
import { useToast } from '@/contexts/ToastContext';
import Link from 'next/link';

interface ContactListProps {
  onSelectContact?: (contact: ManyChatContact) => void;
  onCreateContact?: () => void;
  onSendMessage?: (contact: ManyChatContact) => void;
  onCreateChecklist?: (contact?: ManyChatContact) => void;
}

export default function ContactList({ 
  onSelectContact, 
  onCreateContact,
  onSendMessage,
  onCreateChecklist
}: ContactListProps) {
  const { showToast } = useToast();
  const [contacts, setContacts] = useState<ManyChatContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<ManyChatFilterParams>({
    page: 1,
    limit: 20,
    subscribed: undefined,
    sort: '-lastInteraction',
  });

  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<any[]>([]);

  const fetchContacts = useCallback(async () => {
    try {
      setLoading(true);
      const params = { ...filters };
      if (searchTerm) params.search = searchTerm;
      if (selectedTags.length > 0) params.tag = selectedTags.join(',');
      
      const data = await manychatService.getContacts(params);
      setContacts(data);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      showToast('Failed to load contacts', 'error');
    } finally {
      setLoading(false);
    }
  }, [filters, searchTerm, selectedTags, showToast]);

  const fetchTags = async () => {
    try {
      const tags = await manychatService.getTags();
      setAvailableTags(tags);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  useEffect(() => {
    fetchContacts();
    fetchTags();
  }, [fetchContacts]);

  const handleRefresh = async () => {
    await fetchContacts();
    showToast('Contacts refreshed', 'success');
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleTagFilter = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleSubscribedFilter = (value?: boolean) => {
    setFilters(prev => ({ ...prev, subscribed: value }));
  };

  const formatPhoneNumber = (phone?: string) => {
    if (!phone) return 'N/A';
    return phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">ManyChat Contacts</h3>
            <p className="text-sm text-gray-600">Manage your chatbot subscribers</p>
          </div>
          
          <div className="flex items-center gap-2">
            {onCreateChecklist && (
              <button
                onClick={() => onCreateChecklist()}
                className="px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2"
              >
                <ClipboardCheck className="h-4 w-4" />
                <span className="hidden sm:inline">Create Checklist</span>
              </button>
            )}
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            
            {onCreateContact && (
              <button
                onClick={onCreateContact}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Contact</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 border-b border-gray-100 bg-gray-50">
        <div className="space-y-3">
          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearch}
              placeholder="Search contacts by name, phone, or email..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-1">
              <span className="text-sm text-gray-600">Status:</span>
              <button
                onClick={() => handleSubscribedFilter(undefined)}
                className={`px-3 py-1 text-xs rounded-full ${filters.subscribed === undefined ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
              >
                All
              </button>
              <button
                onClick={() => handleSubscribedFilter(true)}
                className={`px-3 py-1 text-xs rounded-full ${filters.subscribed === true ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
              >
                Subscribed
              </button>
              <button
                onClick={() => handleSubscribedFilter(false)}
                className={`px-3 py-1 text-xs rounded-full ${filters.subscribed === false ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
              >
                Unsubscribed
              </button>
            </div>

            {/* Tag Filters */}
            {availableTags.length > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-sm text-gray-600">Tags:</span>
                {availableTags.slice(0, 3).map(tag => (
                  <button
                    key={tag.id}
                    onClick={() => handleTagFilter(tag.id)}
                    className={`px-3 py-1 text-xs rounded-full ${selectedTags.includes(tag.id) ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
                  >
                    {tag.name}
                  </button>
                ))}
                {availableTags.length > 3 && (
                  <span className="text-xs text-gray-500">+{availableTags.length - 3} more</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contacts List */}
      <div className="divide-y divide-gray-100">
        {loading ? (
          <div className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">Loading contacts...</p>
          </div>
        ) : contacts.length === 0 ? (
          <div className="p-8 text-center">
            <User className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h4 className="text-gray-700 font-medium mb-2">No contacts found</h4>
            <p className="text-gray-500 max-w-md mx-auto mb-4">
              {searchTerm || selectedTags.length > 0 || filters.subscribed !== undefined
                ? 'Try adjusting your search or filters.'
                : 'No contacts available. Start by adding contacts or syncing with ManyChat.'}
            </p>
            {onCreateContact && (
              <button
                onClick={onCreateContact}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add First Contact
              </button>
            )}
          </div>
        ) : (
          contacts.map(contact => (
            <div
              key={contact.id}
              className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => onSelectContact?.(contact)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {contact.firstName?.charAt(0) || contact.fullName?.charAt(0) || '?'}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900">
                          {contact.fullName || `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || 'Unknown'}
                        </h4>
                        <span className={`px-1.5 py-0.5 text-xs rounded-full ${manychatService.getSubscriberStatusColor(contact.subscribed || false)}`}>
                          {contact.subscribed ? (
                            <span className="flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Subscribed
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <XCircle className="h-3 w-3" />
                              Unsubscribed
                            </span>
                          )}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap gap-3 text-sm text-gray-600 mt-1">
                        {contact.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {formatPhoneNumber(contact.phone)}
                          </span>
                        )}
                        {contact.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {contact.email}
                          </span>
                        )}
                        {contact.lastInteraction && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(contact.lastInteraction)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Tags */}
                  {contact.tags && contact.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {contact.tags.slice(0, 3).map(tagName => (
                        <span
                          key={tagName}
                          className="px-2 py-0.5 bg-gray-100 text-gray-800 text-xs rounded-full"
                        >
                          {tagName}
                        </span>
                      ))}
                      {contact.tags.length > 3 && (
                        <span className="text-xs text-gray-500">
                          +{contact.tags.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 ml-4">
                  {onSendMessage && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSendMessage(contact);
                      }}
                      className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors"
                      title="Send Message"
                    >
                      <MessageSquare className="h-4 w-4" />
                    </button>
                  )}

                  {onCreateChecklist && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onCreateChecklist(contact);
                      }}
                      className="p-1.5 hover:bg-emerald-50 rounded-lg text-emerald-600 transition-colors"
                      title="Create Checklist"
                    >
                      <ClipboardCheck className="h-4 w-4" />
                    </button>
                  )}
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectContact?.(contact);
                    }}
                    className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
                    title="View Details"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {contacts.length > 0 && (
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {contacts.length} contacts
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilters(prev => ({ ...prev, page: (prev.page || 1) - 1 }))}
                disabled={filters.page === 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setFilters(prev => ({ ...prev, page: (prev.page || 1) + 1 }))}
                className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
