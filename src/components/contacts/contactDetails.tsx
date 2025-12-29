// components/contacts/ContactDetails.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  Phone,
  Mail,
  Building,
  Calendar,
  Clock,
  MessageSquare,
  PhoneCall,
  Edit,
  Trash2,
  ArrowLeft,
  Smartphone,
  CheckCircle,
  XCircle,
  Download,
  RefreshCw,
  Loader2,
  TrendingUp,
  BarChart3,
  FileText,
  History
} from 'lucide-react';
import { contactService, Contact, CallLog, WhatsAppMessageLog } from '@/services/contactService';
import { useToast } from '@/contexts/ToastContext';
import Link from 'next/link';

interface ContactDetailsProps {
  contactId: string;
}

export default function ContactDetails({ contactId }: ContactDetailsProps) {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [callHistory, setCallHistory] = useState<CallLog[]>([]);
  const [whatsappHistory, setWhatsappHistory] = useState<WhatsAppMessageLog[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'calls' | 'whatsapp' | 'notes'>('overview');
  const [callStats, setCallStats] = useState({
    totalCalls: 0,
    totalDuration: 0,
    averageDuration: 0,
    callFrequency: 0
  });
  const [engagementScore, setEngagementScore] = useState(0);

  const loadContactData = async () => {
    try {
      setLoading(true);
      const [contactData, historyData, statsData] = await Promise.all([
        contactService.getContactById(contactId),
        contactService.getWhatsAppHistory(contactId, 10),
        contactService.getContactCallSummary(contactId)
      ]);
      
      setContact(contactData);
      setWhatsappHistory(historyData);
      
      // Calculate engagement score
      let score = 0;
      if (contactData.email) score += 10;
      if (contactData.phone) score += 10;
      if (contactData.companyName) score += 5;
      if (contactData.totalCalls > 0) score += 20;
      if (contactData.totalWhatsAppSent > 0) score += 15;
      if (contactData.totalWhatsAppReceived > 0) score += 25;
      setEngagementScore(Math.min(score, 100));
      
      setCallStats(statsData);
      
      // Load call history
      const calls = await contactService.getContactCallHistory(contactId);
      setCallHistory(calls);
      
    } catch (error) {
      console.error('Error loading contact data:', error);
      showToast('Failed to load contact details', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (contactId) {
      loadContactData();
    }
  }, [contactId]);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this contact?')) return;
    
    try {
      await contactService.deleteContact(contactId);
      showToast('Contact deleted successfully', 'success');
      router.push('/contacts');
    } catch (error) {
      console.error('Error deleting contact:', error);
      showToast('Failed to delete contact', 'error');
    }
  };

  const handleMakeCall = async () => {
    if (!contact?.phone) {
      showToast('No phone number available for this contact', 'error');
      return;
    }
    
    try {
      const result = await contactService.makeCall(contactId, { toNumber: contact.phone });
      showToast(`Call initiated: ${result.message}`, 'success');
    } catch (error) {
      console.error('Error making call:', error);
      showToast('Failed to initiate call', 'error');
    }
  };

  const handleSendWhatsApp = async () => {
    const message = prompt('Enter WhatsApp message:');
    if (!message) return;
    
    try {
      const result = await contactService.sendQuickWhatsApp(contactId, message);
      showToast('WhatsApp message sent successfully', 'success');
      loadContactData(); // Refresh data
    } catch (error) {
      console.error('Error sending WhatsApp:', error);
      showToast('Failed to send WhatsApp', 'error');
    }
  };

  const handleToggleWhatsApp = async () => {
    if (!contact) return;
    
    const newStatus = !contact.whatsappEnabled;
    try {
      await contactService.toggleWhatsAppStatus(contactId, newStatus);
      showToast(`WhatsApp ${newStatus ? 'enabled' : 'disabled'} successfully`, 'success');
      loadContactData(); // Refresh data
    } catch (error) {
      console.error('Error toggling WhatsApp:', error);
      showToast('Failed to update WhatsApp status', 'error');
    }
  };

  const handleUpdateStatus = async (active: boolean) => {
    try {
      await contactService.updateContactStatus(contactId, active);
      showToast(`Contact ${active ? 'activated' : 'deactivated'} successfully`, 'success');
      loadContactData(); // Refresh data
    } catch (error) {
      console.error('Error updating status:', error);
      showToast('Failed to update status', 'error');
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getEngagementColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <Users className="h-16 w-16 text-gray-300 mb-4" />
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Contact not found</h3>
        <p className="text-gray-500 mb-6">The contact you're looking for doesn't exist.</p>
        <Link
          href="/contacts"
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 font-medium inline-flex items-center gap-2"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Contacts
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="h-16 bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg flex items-center px-6 flex-shrink-0">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <Link
              href="/contacts"
              className="p-2 text-white hover:bg-white/20 rounded-xl transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-blue-600 font-bold text-lg">
                {contact.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">{contact.name}</h1>
                <p className="text-blue-100 text-sm">
                  {contact.companyName || 'No company'} • {contact.type.charAt(0).toUpperCase() + contact.type.slice(1)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => loadContactData()}
              className="p-2 text-white hover:bg-white/20 rounded-xl transition-colors"
              title="Refresh"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
            <button
              onClick={handleMakeCall}
              disabled={!contact.phone}
              className="p-2 text-white hover:bg-white/20 rounded-xl transition-colors disabled:opacity-50"
              title="Make Call"
            >
              <PhoneCall className="h-5 w-5" />
            </button>
            <button
              onClick={handleSendWhatsApp}
              disabled={!contact.whatsappEnabled}
              className="p-2 text-white hover:bg-white/20 rounded-xl transition-colors disabled:opacity-50"
              title="Send WhatsApp"
            >
              <MessageSquare className="h-5 w-5" />
            </button>
            <Link
              href={`/contacts/${contactId}/edit`}
              className="p-2 text-white hover:bg-white/20 rounded-xl transition-colors"
              title="Edit Contact"
            >
              <Edit className="h-5 w-5" />
            </Link>
            <button
              onClick={handleDelete}
              className="p-2 text-white hover:bg-white/20 rounded-xl transition-colors"
              title="Delete Contact"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Contact Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tabs */}
            <div className="bg-white rounded-2xl shadow-lg">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-4 px-6" aria-label="Tabs">
                  {[
                    { id: 'overview', label: 'Overview', icon: Users },
                    { id: 'calls', label: 'Call History', icon: PhoneCall },
                    { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
                    { id: 'notes', label: 'Notes', icon: FileText },
                  ].map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`
                          flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-t-lg border-b-2 transition-colors
                          ${isActive 
                            ? 'border-blue-500 text-blue-600' 
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }
                        `}
                      >
                        <Icon className="h-4 w-4" />
                        {tab.label}
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Contact Info Card */}
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
                      <h3 className="font-semibold text-gray-800 mb-4">Contact Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white rounded-lg shadow-sm">
                            <Mail className="h-5 w-5 text-gray-500" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Email</p>
                            <p className="font-medium text-gray-900">
                              {contact.email || 'Not provided'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white rounded-lg shadow-sm">
                            <Phone className="h-5 w-5 text-gray-500" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Phone</p>
                            <p className="font-medium text-gray-900">
                              {contact.phone || 'Not provided'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white rounded-lg shadow-sm">
                            <Building className="h-5 w-5 text-gray-500" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Company</p>
                            <p className="font-medium text-gray-900">
                              {contact.companyName || 'Not provided'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white rounded-lg shadow-sm">
                            <Calendar className="h-5 w-5 text-gray-500" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Created</p>
                            <p className="font-medium text-gray-900">
                              {new Date(contact.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Status Card */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                      <h3 className="font-semibold text-gray-800 mb-4">Status & Preferences</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-700">Active Status</span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleUpdateStatus(true)}
                                className={`px-3 py-1 rounded-full text-xs font-medium ${contact.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800 hover:bg-green-50'}`}
                              >
                                Active
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(false)}
                                className={`px-3 py-1 rounded-full text-xs font-medium ${!contact.active ? 'bg-gray-100 text-gray-800' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
                              >
                                Inactive
                              </button>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-gray-700">WhatsApp</span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={handleToggleWhatsApp}
                                className={`px-3 py-1 rounded-full text-xs font-medium ${contact.whatsappEnabled ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800 hover:bg-blue-50'}`}
                              >
                                {contact.whatsappEnabled ? 'Enabled' : 'Disabled'}
                              </button>
                              {contact.whatsappEnabled && (
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  contact.whatsappStatus === 'active' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {contact.whatsappStatus}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-700">Engagement Score</span>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getEngagementColor(engagementScore)}`}>
                              {engagementScore}/100
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${engagementScore}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Notes Card */}
                    {contact.notes && (
                      <div className="bg-white border border-gray-200 rounded-xl p-6">
                        <h3 className="font-semibold text-gray-800 mb-4">Notes</h3>
                        <p className="text-gray-700 whitespace-pre-wrap">{contact.notes}</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'calls' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4">
                        <p className="text-sm text-gray-600">Total Calls</p>
                        <p className="text-2xl font-bold text-gray-900">{callStats.totalCalls}</p>
                      </div>
                      <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4">
                        <p className="text-sm text-gray-600">Total Duration</p>
                        <p className="text-2xl font-bold text-gray-900">{formatDuration(callStats.totalDuration)}</p>
                      </div>
                      <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-4">
                        <p className="text-sm text-gray-600">Avg Duration</p>
                        <p className="text-2xl font-bold text-gray-900">{formatDuration(callStats.averageDuration)}</p>
                      </div>
                      <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-xl p-4">
                        <p className="text-sm text-gray-600">Calls/Month</p>
                        <p className="text-2xl font-bold text-gray-900">{callStats.callFrequency.toFixed(1)}</p>
                      </div>
                    </div>
                    
                    {callHistory.length > 0 ? (
                      <div className="space-y-3">
                        {callHistory.map((call) => (
                          <div key={call.callSid} className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${
                                call.direction === 'outbound' 
                                  ? 'bg-blue-100 text-blue-600' 
                                  : 'bg-green-100 text-green-600'
                              }`}>
                                <PhoneCall className="h-5 w-5" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {call.direction === 'outbound' ? 'Outgoing Call' : 'Incoming Call'}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {new Date(call.callDate).toLocaleString()} • Duration: {formatDuration(call.duration)}
                                </p>
                              </div>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              call.status === 'completed' 
                                ? 'bg-green-100 text-green-800' 
                                : call.status === 'no-answer' 
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                            }`}>
                              {call.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <PhoneCall className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No call history available</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'whatsapp' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4">
                        <p className="text-sm text-gray-600">Total Sent</p>
                        <p className="text-2xl font-bold text-gray-900">{contact.totalWhatsAppSent}</p>
                      </div>
                      <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4">
                        <p className="text-sm text-gray-600">Total Received</p>
                        <p className="text-2xl font-bold text-gray-900">{contact.totalWhatsAppReceived}</p>
                      </div>
                      <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-4">
                        <p className="text-sm text-gray-600">Last Sent</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {contact.lastWhatsAppSent 
                            ? new Date(contact.lastWhatsAppSent).toLocaleDateString()
                            : 'Never'}
                        </p>
                      </div>
                      <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-xl p-4">
                        <p className="text-sm text-gray-600">Last Received</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {contact.lastWhatsAppReceived 
                            ? new Date(contact.lastWhatsAppReceived).toLocaleDateString()
                            : 'Never'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-3 mb-6">
                      <button
                        onClick={handleSendWhatsApp}
                        disabled={!contact.whatsappEnabled}
                        className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <MessageSquare className="h-4 w-4" />
                        Send WhatsApp
                      </button>
                      <button
                        onClick={handleToggleWhatsApp}
                        className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                          contact.whatsappEnabled
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                        }`}
                      >
                        <Smartphone className="h-4 w-4" />
                        {contact.whatsappEnabled ? 'Disable WhatsApp' : 'Enable WhatsApp'}
                      </button>
                    </div>
                    
                    {whatsappHistory.length > 0 ? (
                      <div className="space-y-3">
                        {whatsappHistory.map((message) => (
                          <div key={message.messageId} className={`rounded-lg p-4 ${
                            message.content === message.replyContent 
                              ? 'bg-blue-50 border-l-4 border-blue-500'
                              : 'bg-gray-50 border-l-4 border-gray-400'
                          }`}>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <MessageSquare className="h-4 w-4 text-gray-500" />
                                <span className="text-sm font-medium text-gray-700">
                                  {message.content === message.replyContent ? 'Received' : 'Sent'}
                                </span>
                                {message.templateName && (
                                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                                    Template: {message.templateName}
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-gray-500">
                                {new Date(message.sentAt).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-gray-800 mb-2">{message.content}</p>
                            {message.replyContent && message.content !== message.replyContent && (
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <div className="flex items-center gap-2 mb-1">
                                  <ArrowLeft className="h-3 w-3 text-gray-500 rotate-180" />
                                  <span className="text-sm font-medium text-gray-700">Reply</span>
                                </div>
                                <p className="text-gray-800">{message.replyContent}</p>
                                {message.repliedAt && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    Replied: {new Date(message.repliedAt).toLocaleString()}
                                  </p>
                                )}
                              </div>
                            )}
                            <div className="flex items-center justify-between mt-3">
                              <span className={`text-xs px-2 py-1 rounded ${
                                message.status === 'delivered' 
                                  ? 'bg-green-100 text-green-800' 
                                  : message.status === 'sent'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {message.status}
                              </span>
                              {message.errorMessage && (
                                <span className="text-xs text-red-600">{message.errorMessage}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No WhatsApp messages yet</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'notes' && (
                  <div className="space-y-4">
                    <textarea
                      className="w-full h-48 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Add notes about this contact..."
                      value={contact.notes || ''}
                      onChange={async (e) => {
                        try {
                          await contactService.updateContact(contactId, { notes: e.target.value });
                          setContact({ ...contact, notes: e.target.value });
                          showToast('Notes updated', 'success');
                        } catch (error) {
                          console.error('Error updating notes:', error);
                          showToast('Failed to update notes', 'error');
                        }
                      }}
                    />
                    <div className="text-sm text-gray-500">
                      Notes are saved automatically when you stop typing.
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Stats & Actions */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Quick Stats</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PhoneCall className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-700">Total Calls</span>
                  </div>
                  <span className="font-semibold text-gray-900">{contact.totalCalls}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-700">Call Duration</span>
                  </div>
                  <span className="font-semibold text-gray-900">
                    {Math.round(contact.totalCallDuration / 60)} min
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-700">WhatsApp Messages</span>
                  </div>
                  <span className="font-semibold text-gray-900">
                    {contact.totalWhatsAppSent + contact.totalWhatsAppReceived}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-700">Last Contact</span>
                  </div>
                  <span className="font-semibold text-gray-900">
                    {contact.lastCallDate 
                      ? new Date(contact.lastCallDate).toLocaleDateString()
                      : contact.lastWhatsAppSent
                        ? new Date(contact.lastWhatsAppSent).toLocaleDateString()
                        : 'Never'}
                  </span>
                </div>
              </div>
            </div>

            {/* Opportunity Info */}
            {contact.opportunityId && contact.opportunity && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6">
                <h3 className="font-semibold text-gray-800 mb-4">Linked Opportunity</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Subject</p>
                    <p className="font-medium text-gray-900">{contact.opportunity.subject}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Type</p>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        {contact.opportunity.type}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <span className={`px-2 py-1 text-xs rounded ${
                        contact.opportunity.status === 'won' 
                          ? 'bg-green-100 text-green-800' 
                          : contact.opportunity.status === 'lost'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {contact.opportunity.status}
                      </span>
                    </div>
                  </div>
                  <Link
                    href={`/opportunities/${contact.opportunityId}`}
                    className="block text-center mt-4 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 font-medium"
                  >
                    View Opportunity
                  </Link>
                </div>
              </div>
            )}

            {/* Custom Fields */}
            {contact.customFields && Object.keys(contact.customFields).length > 0 && (
              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <h3 className="font-semibold text-gray-800 mb-4">Custom Fields</h3>
                <div className="space-y-3">
                  {Object.entries(contact.customFields).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-sm text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                      <span className="font-medium text-gray-900">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}