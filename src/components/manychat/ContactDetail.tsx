'use client';

import { useState, useEffect } from 'react';
import {
  User, Mail, Phone, Calendar, MapPin, Tag,
  MessageSquare, Send, Edit2, Trash2, Copy,
  CheckCircle, XCircle, Bell, Clock, BarChart3,
  ExternalLink, ChevronLeft, Download, RefreshCw,
  Loader2, Plus, UserPlus,
  UserMinus
} from 'lucide-react';
import { manychatService, ManyChatContact, ManyChatTag } from '@/services/manychatService';
import { useToast } from '@/contexts/ToastContext';
import { format } from 'date-fns';
import MessageComposer from './MessageComposer';

interface ContactDetailProps {
  contact: ManyChatContact;
  onClose: () => void;
  onUpdate?: (updatedContact: ManyChatContact) => void;
  onDelete?: (contactId: string) => void;
}

interface Interaction {
  id: string;
  type: 'message_sent' | 'message_received' | 'tag_added' | 'tag_removed' | 'subscribed' | 'unsubscribed';
  content: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export default function ContactDetail({ contact, onClose, onUpdate, onDelete }: ContactDetailProps) {
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [showMessageComposer, setShowMessageComposer] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'interactions' | 'tags' | 'stats'>('details');
  const [availableTags, setAvailableTags] = useState<ManyChatTag[]>([]);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [contactStats, setContactStats] = useState({
    messagesSent: 0,
    messagesReceived: 0,
    lastInteraction: '',
    averageResponseTime: 0,
    tagsCount: 0,
  });

  // Mock interactions for demonstration
  const mockInteractions: Interaction[] = [
    {
      id: '1',
      type: 'subscribed',
      content: 'Subscribed via Facebook Messenger',
      timestamp: '2024-01-15T10:00:00Z',
    },
    {
      id: '2',
      type: 'message_received',
      content: 'Hello, I need help with my order',
      timestamp: '2024-01-15T10:05:00Z',
    },
    {
      id: '3',
      type: 'message_sent',
      content: 'Hi! I can help you with that. What\'s your order number?',
      timestamp: '2024-01-15T10:06:00Z',
    },
    {
      id: '4',
      type: 'tag_added',
      content: 'Added tag: "Customer Support"',
      timestamp: '2024-01-15T10:07:00Z',
      metadata: { tagName: 'Customer Support' },
    },
    {
      id: '5',
      type: 'message_received',
      content: 'Order #12345, placed today',
      timestamp: '2024-01-15T10:08:00Z',
    },
    {
      id: '6',
      type: 'message_sent',
      content: 'I found your order. It will be shipped tomorrow. Need anything else?',
      timestamp: '2024-01-15T10:10:00Z',
    },
    {
      id: '7',
      type: 'tag_removed',
      content: 'Removed tag: "New Subscriber"',
      timestamp: '2024-01-16T09:00:00Z',
      metadata: { tagName: 'New Subscriber' },
    },
  ];

  useEffect(() => {
    fetchData();
  }, [contact.id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch tags
      const tags = await manychatService.getTags();
      setAvailableTags(tags);
      
      // Fetch interactions (mock for now)
      setInteractions(mockInteractions);
      
      // Calculate stats
      const messagesSent = mockInteractions.filter(i => i.type === 'message_sent').length;
      const messagesReceived = mockInteractions.filter(i => i.type === 'message_received').length;
      const lastInteraction = mockInteractions[0]?.timestamp || contact.lastInteraction || '';
      const tagsCount = contact.tags?.length || 0;
      
      setContactStats({
        messagesSent,
        messagesReceived,
        lastInteraction,
        averageResponseTime: 2.4, // Mock average
        tagsCount,
      });
      
    } catch (error) {
      console.error('Error fetching contact details:', error);
      showToast('Failed to load contact details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    await fetchData();
    showToast('Contact details refreshed', 'success');
  };

  const handleSendMessage = () => {
    setShowMessageComposer(true);
  };

  const handleEditContact = () => {
    setShowEditModal(true);
  };

  const handleDeleteContact = async () => {
    try {
      setUpdating(true);
      // In real implementation, delete via API
      await new Promise(resolve => setTimeout(resolve, 1000));
      showToast('Contact deleted successfully', 'success');
      onDelete?.(contact.id);
      onClose();
    } catch (error) {
      console.error('Error deleting contact:', error);
      showToast('Failed to delete contact', 'error');
    } finally {
      setUpdating(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleToggleSubscription = async () => {
    try {
      setUpdating(true);
      const newSubscribed = !contact.subscribed;
      
      // In real implementation, update via API
      await manychatService.updateContact(contact.id, {
        subscribed: newSubscribed,
      });
      
      showToast(
        newSubscribed ? 'Contact subscribed' : 'Contact unsubscribed',
        'success'
      );
      
      // Update local state
      const updatedContact = { ...contact, subscribed: newSubscribed };
      onUpdate?.(updatedContact);
      
    } catch (error) {
      console.error('Error updating subscription status:', error);
      showToast('Failed to update subscription status', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleAddTag = async (tagId: string) => {
    try {
      await manychatService.addTagToContact(contact.id, tagId);
      showToast('Tag added successfully', 'success');
      
      // Update local state
      const tag = availableTags.find(t => t.id === tagId);
      if (tag && contact.tags) {
        const updatedContact = {
          ...contact,
          tags: [...contact.tags, tag.name],
        };
        onUpdate?.(updatedContact);
      }
      
    } catch (error) {
      console.error('Error adding tag:', error);
      showToast('Failed to add tag', 'error');
    }
  };

  const handleRemoveTag = async (tagName: string) => {
    try {
      const tag = availableTags.find(t => t.name === tagName);
      if (tag) {
        await manychatService.removeTagFromContact(contact.id, tag.id);
        showToast('Tag removed successfully', 'success');
        
        // Update local state
        if (contact.tags) {
          const updatedContact = {
            ...contact,
            tags: contact.tags.filter(t => t !== tagName),
          };
          onUpdate?.(updatedContact);
        }
      }
    } catch (error) {
      console.error('Error removing tag:', error);
      showToast('Failed to remove tag', 'error');
    }
  };

  const handleCopyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`${label} copied to clipboard`, 'success');
  };

  const getInteractionIcon = (type: Interaction['type']) => {
    switch (type) {
      case 'message_sent': return <Send className="h-4 w-4 text-blue-600" />;
      case 'message_received': return <MessageSquare className="h-4 w-4 text-green-600" />;
      case 'tag_added': return <Tag className="h-4 w-4 text-purple-600" />;
      case 'tag_removed': return <Tag className="h-4 w-4 text-red-600" />;
      case 'subscribed': return <UserPlus className="h-4 w-4 text-green-600" />;
      case 'unsubscribed': return <UserMinus className="h-4 w-4 text-red-600" />;
      default: return <MessageSquare className="h-4 w-4 text-gray-600" />;
    }
  };

  const getInteractionColor = (type: Interaction['type']) => {
    switch (type) {
      case 'message_sent': return 'bg-blue-50 border-blue-100';
      case 'message_received': return 'bg-green-50 border-green-100';
      case 'tag_added': return 'bg-purple-50 border-purple-100';
      case 'tag_removed': return 'bg-red-50 border-red-100';
      case 'subscribed': return 'bg-green-50 border-green-100';
      case 'unsubscribed': return 'bg-red-50 border-red-100';
      default: return 'bg-gray-50 border-gray-100';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch {
      return 'Invalid date';
    }
  };

  const formatPhoneNumber = (phone?: string) => {
    if (!phone) return 'N/A';
    return phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
  };

  const getInitials = () => {
    if (contact.fullName) {
      return contact.fullName
        .split(' ')
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (contact.firstName && contact.lastName) {
      return `${contact.firstName.charAt(0)}${contact.lastName.charAt(0)}`.toUpperCase();
    }
    if (contact.email) {
      return contact.email.charAt(0).toUpperCase();
    }
    return '?';
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl p-8">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading contact details...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="w-full max-w-6xl max-h-[90vh] bg-white rounded-xl overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <ChevronLeft className="h-5 w-5 text-white" />
                </button>
                
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                    {getInitials()}
                  </div>
                  
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      {contact.fullName || `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || 'Unknown Contact'}
                    </h2>
                    <p className="text-blue-100">
                      {contact.email || contact.phone || 'No contact information'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRefresh}
                  disabled={updating}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-60"
                  title="Refresh"
                >
                  <RefreshCw className={`h-5 w-5 text-white ${updating ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={handleSendMessage}
                  className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-white/90 flex items-center gap-2 font-semibold"
                >
                  <Send className="h-4 w-4" />
                  Message
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 bg-white">
            <div className="flex px-6">
              {[
                { id: 'details', label: 'Details', icon: User },
                { id: 'interactions', label: 'Interactions', icon: MessageSquare },
                { id: 'tags', label: 'Tags', icon: Tag },
                { id: 'stats', label: 'Statistics', icon: BarChart3 },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-6 py-4 flex items-center gap-2 border-b-2 font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              {activeTab === 'details' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column - Contact Info */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Contact Information Card */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
                        <button
                          onClick={handleEditContact}
                          className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
                          title="Edit Contact"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                      </div>
                      
                      <div className="space-y-4">
                        {/* Name */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 rounded-lg">
                              <User className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Name</p>
                              <p className="font-medium text-gray-900">
                                {contact.fullName || `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || 'Not provided'}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleCopyToClipboard(
                              contact.fullName || `${contact.firstName || ''} ${contact.lastName || ''}`.trim(),
                              'Name'
                            )}
                            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        </div>
                        
                        {/* Email */}
                        {contact.email && (
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-green-50 rounded-lg">
                                <Mail className="h-5 w-5 text-green-600" />
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Email</p>
                                <p className="font-medium text-gray-900">{contact.email}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleCopyToClipboard(contact.email!, 'Email')}
                                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"
                              >
                                <Copy className="h-4 w-4" />
                              </button>
                              <a
                                href={`mailto:${contact.email}`}
                                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"
                                title="Send Email"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </div>
                          </div>
                        )}
                        
                        {/* Phone */}
                        {contact.phone && (
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-purple-50 rounded-lg">
                                <Phone className="h-5 w-5 text-purple-600" />
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Phone</p>
                                <p className="font-medium text-gray-900">{formatPhoneNumber(contact.phone)}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleCopyToClipboard(contact.phone!, 'Phone')}
                                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"
                              >
                                <Copy className="h-4 w-4" />
                              </button>
                              <a
                                href={`tel:${contact.phone}`}
                                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"
                                title="Call"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </div>
                          </div>
                        )}
                        
                        {/* Country */}
                        {contact.country && (
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-yellow-50 rounded-lg">
                                <MapPin className="h-5 w-5 text-yellow-600" />
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Country</p>
                                <p className="font-medium text-gray-900">{contact.country}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleCopyToClipboard(contact.country!, 'Country')}
                              className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Custom Fields */}
                    {contact.customFields && Object.keys(contact.customFields).length > 0 && (
                      <div className="bg-white border border-gray-200 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-6">Custom Fields</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {Object.entries(contact.customFields).map(([key, value]) => (
                            <div key={key} className="space-y-1">
                              <p className="text-sm text-gray-500 capitalize">{key.replace(/_/g, ' ')}</p>
                              <p className="font-medium text-gray-900">
                                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column - Status & Actions */}
                  <div className="space-y-6">
                    {/* Status Card */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Status</h3>
                      
                      <div className="space-y-4">
                        {/* Subscription Status */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${contact.subscribed ? 'bg-green-50' : 'bg-red-50'}`}>
                              {contact.subscribed ? (
                                <CheckCircle className="h-5 w-5 text-green-600" />
                              ) : (
                                <XCircle className="h-5 w-5 text-red-600" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {contact.subscribed ? 'Subscribed' : 'Unsubscribed'}
                              </p>
                              <p className="text-sm text-gray-500">
                                {contact.subscribed ? 'Receives messages' : 'Not receiving messages'}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={handleToggleSubscription}
                            disabled={updating}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                              contact.subscribed
                                ? 'bg-red-50 text-red-700 hover:bg-red-100'
                                : 'bg-green-50 text-green-700 hover:bg-green-100'
                            } disabled:opacity-60`}
                          >
                            {updating ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : contact.subscribed ? (
                              'Unsubscribe'
                            ) : (
                              'Subscribe'
                            )}
                          </button>
                        </div>
                        
                        {/* Last Interaction */}
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-50 rounded-lg">
                            <Clock className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {formatDate(contact.lastInteraction)}
                            </p>
                            <p className="text-sm text-gray-500">Last interaction</p>
                          </div>
                        </div>
                        
                        {/* Created Date */}
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-50 rounded-lg">
                            <Calendar className="h-5 w-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {formatDate(contact.createdAt)}
                            </p>
                            <p className="text-sm text-gray-500">Added to system</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                      
                      <div className="space-y-2">
                        <button
                          onClick={handleSendMessage}
                          className="w-full px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 flex items-center justify-between transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <MessageSquare className="h-5 w-5" />
                            <span>Send Message</span>
                          </div>
                          <ChevronLeft className="h-4 w-4 rotate-180" />
                        </button>
                        
                        <button
                          onClick={() => setShowEditModal(true)}
                          className="w-full px-4 py-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 flex items-center justify-between transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <Edit2 className="h-5 w-5" />
                            <span>Edit Contact</span>
                          </div>
                          <ChevronLeft className="h-4 w-4 rotate-180" />
                        </button>
                        
                        <button
                          onClick={() => setShowDeleteConfirm(true)}
                          className="w-full px-4 py-3 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 flex items-center justify-between transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <Trash2 className="h-5 w-5" />
                            <span>Delete Contact</span>
                          </div>
                          <ChevronLeft className="h-4 w-4 rotate-180" />
                        </button>
                      </div>
                    </div>

                    {/* Contact ID */}
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                      <p className="text-sm text-gray-500 mb-1">Contact ID</p>
                      <div className="flex items-center justify-between">
                        <code className="text-sm font-mono text-gray-800 bg-white px-2 py-1 rounded border">
                          {contact.id.slice(0, 8)}...
                        </code>
                        <button
                          onClick={() => handleCopyToClipboard(contact.id, 'Contact ID')}
                          className="p-1.5 hover:bg-white rounded-lg text-gray-500"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'interactions' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Interaction History</h3>
                    <button
                      onClick={() => handleCopyToClipboard(
                        JSON.stringify(interactions, null, 2),
                        'Interaction history'
                      )}
                      className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Export
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {interactions.length === 0 ? (
                      <div className="text-center py-12">
                        <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <h4 className="text-gray-700 font-medium mb-2">No interactions found</h4>
                        <p className="text-gray-500 max-w-md mx-auto">
                          This contact hasn't interacted with your chatbot yet.
                        </p>
                      </div>
                    ) : (
                      interactions.map((interaction) => (
                        <div
                          key={interaction.id}
                          className={`flex items-start gap-4 p-4 rounded-xl border ${getInteractionColor(interaction.type)}`}
                        >
                          <div className="p-2 bg-white rounded-lg">
                            {getInteractionIcon(interaction.type)}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-medium text-gray-900">
                                {interaction.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </p>
                              <p className="text-sm text-gray-500">
                                {formatDate(interaction.timestamp)}
                              </p>
                            </div>
                            <p className="text-gray-700">{interaction.content}</p>
                            {interaction.metadata && (
                              <div className="mt-2 pt-2 border-t border-gray-200">
                                <p className="text-sm text-gray-500">
                                  {JSON.stringify(interaction.metadata, null, 2)}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'tags' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Current Tags */}
                  <div className="lg:col-span-2">
                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-gray-900">Current Tags</h3>
                        <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
                          {contact.tags?.length || 0} tags
                        </span>
                      </div>
                      
                      {contact.tags && contact.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {contact.tags.map((tagName) => (
                            <div
                              key={tagName}
                              className="group px-4 py-2 bg-blue-50 text-blue-700 rounded-lg flex items-center gap-2 hover:bg-blue-100 transition-colors"
                            >
                              <Tag className="h-4 w-4" />
                              <span className="font-medium">{tagName}</span>
                              <button
                                onClick={() => handleRemoveTag(tagName)}
                                className="ml-2 p-0.5 hover:bg-blue-200 rounded text-blue-700 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <XCircle className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Tag className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                          <h4 className="text-gray-700 font-medium mb-2">No tags assigned</h4>
                          <p className="text-gray-500">
                            Add tags to categorize and segment this contact.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Available Tags */}
                  <div>
                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-6">Available Tags</h3>
                      
                      <div className="space-y-2">
                        {availableTags.length === 0 ? (
                          <p className="text-gray-500 text-sm">No tags available</p>
                        ) : (
                          availableTags.map((tag) => (
                            <button
                              key={tag.id}
                              onClick={() => handleAddTag(tag.id)}
                              disabled={contact.tags?.includes(tag.name)}
                              className="w-full px-4 py-3 rounded-lg flex items-center justify-between hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: tag.color || '#3b82f6' }}
                                />
                                <span className="font-medium text-gray-900">{tag.name}</span>
                              </div>
                              {contact.tags?.includes(tag.name) ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              ) : (
                                <Plus className="h-4 w-4 text-gray-400" />
                              )}
                            </button>
                          ))
                        )}
                      </div>
                      
                      <button
                        onClick={() => {/* Open tag manager */}}
                        className="w-full mt-4 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm flex items-center justify-center gap-2"
                      >
                        <Tag className="h-4 w-4" />
                        Manage All Tags
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'stats' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">Engagement Statistics</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      {
                        title: 'Messages Sent',
                        value: contactStats.messagesSent,
                        icon: Send,
                        color: 'bg-blue-100 text-blue-800',
                        description: 'Messages sent to this contact',
                      },
                      {
                        title: 'Messages Received',
                        value: contactStats.messagesReceived,
                        icon: MessageSquare,
                        color: 'bg-green-100 text-green-800',
                        description: 'Messages received from this contact',
                      },
                      {
                        title: 'Average Response Time',
                        value: `${contactStats.averageResponseTime.toFixed(1)} mins`,
                        icon: Clock,
                        color: 'bg-purple-100 text-purple-800',
                        description: 'Average time to respond',
                      },
                      {
                        title: 'Tags Count',
                        value: contactStats.tagsCount,
                        icon: Tag,
                        color: 'bg-pink-100 text-pink-800',
                        description: 'Number of tags assigned',
                      },
                    ].map((stat, index) => (
                      <div key={index} className="bg-white border border-gray-200 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className={`p-2 rounded-lg ${stat.color}`}>
                            <stat.icon className="h-5 w-5" />
                          </div>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                          <p className="text-sm font-medium text-gray-900 mt-1">{stat.title}</p>
                          <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Engagement Timeline */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h4 className="font-semibold text-gray-900 mb-4">Activity Timeline</h4>
                    <div className="space-y-3">
                      {interactions.slice(0, 5).map((interaction) => (
                        <div key={interaction.id} className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-900">{interaction.content}</p>
                            <p className="text-xs text-gray-500">
                              {formatDate(interaction.timestamp)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Contact ID: {contact.id.slice(0, 12)}...
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  onClick={handleSendMessage}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  Send Message
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Message Composer Modal */}
      {showMessageComposer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]">
          <div className="w-full max-w-2xl">
            <MessageComposer
              contactId={contact.id}
              phone={contact.phone}
              email={contact.email}
              onSent={() => {
                setShowMessageComposer(false);
                showToast('Message sent successfully', 'success');
              }}
              onCancel={() => setShowMessageComposer(false)}
            />
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]">
          <div className="w-full max-w-md bg-white rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Contact</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  defaultValue={contact.firstName}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  defaultValue={contact.lastName}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  defaultValue={contact.email}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  defaultValue={contact.phone}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country
                </label>
                <select
                  defaultValue={contact.country}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Country</option>
                  <option value="US">United States</option>
                  <option value="UK">United Kingdom</option>
                  <option value="CA">Canada</option>
                  <option value="AU">Australia</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Handle save logic
                  setShowEditModal(false);
                  showToast('Contact updated successfully', 'success');
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]">
          <div className="w-full max-w-md bg-white rounded-xl p-6">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Delete Contact
              </h3>
              
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this contact? This action cannot be undone.
                All interaction history and data associated with this contact will be permanently removed.
              </p>
              
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  disabled={updating}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteContact}
                  disabled={updating}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 disabled:opacity-60"
                >
                  {updating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  {updating ? 'Deleting...' : 'Delete Contact'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}