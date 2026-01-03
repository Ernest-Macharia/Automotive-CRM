// services/contactService.ts
import { apiClient } from '@/lib/api/client';

export interface CallLog {
  callSid: string;
  phoneNumber: string;
  callDate: Date | string;
  duration: number;
  direction: string;
  status: string;
}

export interface WhatsAppMessageLog {
  messageId: string;
  content: string;
  sentAt: Date | string;
  status: string;
  deliveredAt?: Date | string;
  readAt?: Date | string;
  replyContent?: string;
  repliedAt?: Date | string;
  templateName?: string;
  templateParams?: Record<string, any>;
  retryCount: number;
  errorMessage?: string;
}

export interface Contact {
  _id: string;
  id: string;
  name: string;
  email?: string;
  phone: string;
  companyName?: string;
  opportunityId?: string;
  opportunity?: {
    _id: string;
    subject: string;
    type: string;
    status: string;
    customer?: any;
  };
  active: boolean;
  type: string;
  notes?: string;
  whatsappEnabled: boolean;
  whatsappStatus: string;
  customFields: Record<string, any>;
  whatsappMessages: WhatsAppMessageLog[];
  lastWhatsAppSent?: Date | string;
  lastWhatsAppReceived?: Date | string;
  totalWhatsAppSent: number;
  totalWhatsAppReceived: number;
  whatsappOptInDate?: Date | string;
  whatsappOptOutDate?: Date | string;
  callHistory: CallLog[];
  totalCallDuration: number;
  totalCalls: number;
  lastCallDate?: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CreateContactDto {
  name: string;
  email?: string;
  phone?: string;
  companyName?: string;
  opportunityId?: string;
  type?: string;
  notes?: string;
  whatsappEnabled?: boolean;
  whatsappStatus?: string;
  customFields?: Record<string, any>;
  active?: boolean;
}

export interface UpdateContactDto {
  name?: string;
  email?: string;
  phone?: string;
  companyName?: string;
  opportunityId?: string;
  type?: string;
  notes?: string;
  whatsappEnabled?: boolean;
  whatsappStatus?: string;
  customFields?: Record<string, any>;
  active?: boolean;
}

export interface ContactStats {
  totalContacts: number;
  contactsWithEmail: number;
  contactsWithPhone: number;
  contactsByType: Array<{ _id: string; count: number }>;
  emailCoverage: string;
  phoneCoverage: string;
  callStats: {
    totalCalls: number;
    totalDuration: number;
    avgDuration: number;
    contactsWithCalls: number;
  };
  whatsappStats: {
    totalContacts: number;
    whatsappEnabled: number;
    whatsappActive: number;
    totalMessagesSent: number;
    totalMessagesReceived: number;
    messagesByStatus: Record<string, number>;
  };
}

export interface CallStats {
  totalCalls: number;
  totalDuration: number;
  totalMinutes: number;
  averageDuration: number;
  lastCallDate?: Date | string;
}

export interface SendWhatsAppDto {
  content: string;
  templateName?: string;
  templateParams?: Record<string, any>;
}

export interface BroadcastWhatsAppDto {
  contactIds: string[];
  content: string;
  templateName?: string;
  templateParams?: Record<string, any>;
}

export interface FilteredWhatsAppDto {
  filters: Record<string, any>;
  content: string;
  templateName?: string;
  templateParams?: Record<string, any>;
  limit?: number;
}

export interface UpdateAndNotifyDto {
  updates: Record<string, any>;
  sendNotification?: boolean;
  notificationTemplate?: string;
  notificationParams?: Record<string, any>;
}

export interface BulkUpdateDto {
  contactIds: string[];
  updates: Record<string, any>;
  sendNotification?: boolean;
  notificationTemplate?: string;
  notificationParams?: Record<string, any>;
}

export interface MakeCallDto {
  toNumber: string;
}

export interface WhatsAppResult {
  success: boolean;
  messageId?: string;
  contactId: string;
  name: string;
  phone: string;
  content: string;
  sentAt: Date | string;
  status: string;
  provider: string;
  error?: string;
}

export interface BroadcastResult {
  total: number;
  sent: number;
  failed: number;
  results: WhatsAppResult[];
  provider: string;
}

export interface FilteredSendResult {
  totalContacts: number;
  sent: number;
  failed: number;
  results: Array<{
    contactId: string;
    name: string;
    phone: string;
    success: boolean;
    messageId?: string;
    error?: string;
  }>;
}

export interface UpdateNotifyResult {
  contact: Contact;
  notification?: WhatsAppResult;
}

export interface BulkUpdateResult {
  contactId: string;
  success: boolean;
  contact?: Contact;
  notification?: WhatsAppResult;
  error?: string;
}

export interface WhatsAppStats {
  totalContacts: number;
  whatsappEnabled: number;
  whatsappActive: number;
  totalMessagesSent: number;
  totalMessagesReceived: number;
  messagesByStatus: Record<string, number>;
}

export interface ContactsWhatsAppView {
  contacts: Contact[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface TestWhatsAppResult {
  success: boolean;
  message: string;
  provider: string;
  timestamp: Date | string;
}

export interface CallInitiationResult {
  callId: string;
  status: string;
  message: string;
}

class ContactService {
  // 1. Create a new contact
  async createContact(data: CreateContactDto): Promise<Contact> {
    try {
      return await apiClient.post<CreateContactDto, Contact>('/contacts', data);
    } catch (error) {
      console.error('Error creating contact:', error);
      throw error;
    }
  }

  // 2. Get all contacts
  async getAllContacts(): Promise<Contact[]> {
    try {
      return await apiClient.get<Contact[]>('/contacts');
    } catch (error) {
      console.error('Error getting all contacts:', error);
      throw error;
    }
  }

  // 3. Get contacts statistics
  async getContactsStats(): Promise<ContactStats> {
    try {
      return await apiClient.get<ContactStats>('/contacts/stats');
    } catch (error) {
      console.error('Error getting contacts stats:', error);
      throw error;
    }
  }

  // 4. Find contacts by email
  async findContactsByEmail(email: string): Promise<Contact[]> {
    try {
      return await apiClient.get<Contact[]>(`/contacts/email/${encodeURIComponent(email)}`);
    } catch (error) {
      console.error(`Error finding contacts by email ${email}:`, error);
      throw error;
    }
  }

  // 5. Find contacts by phone
  async findContactsByPhone(phone: string): Promise<Contact[]> {
    try {
      return await apiClient.get<Contact[]>(`/contacts/phone/${encodeURIComponent(phone)}`);
    } catch (error) {
      console.error(`Error finding contacts by phone ${phone}:`, error);
      throw error;
    }
  }

  // 6. Find contacts by opportunity
  async findContactsByOpportunity(opportunityId: string): Promise<Contact[]> {
    try {
      return await apiClient.get<Contact[]>(`/contacts/opportunity/${opportunityId}`);
    } catch (error) {
      console.error(`Error finding contacts by opportunity ${opportunityId}:`, error);
      throw error;
    }
  }

  // 7. Get contact by ID
  async getContactById(id: string): Promise<Contact> {
    try {
      return await apiClient.get<Contact>(`/contacts/${id}`);
    } catch (error) {
      console.error(`Error getting contact ${id}:`, error);
      throw error;
    }
  }

  // 8. Update contact
  async updateContact(id: string, data: UpdateContactDto): Promise<Contact> {
    try {
      return await apiClient.put<UpdateContactDto, Contact>(`/contacts/${id}`, data);
    } catch (error) {
      console.error(`Error updating contact ${id}:`, error);
      throw error;
    }
  }

  // 9. Delete contact
  async deleteContact(id: string): Promise<{ message: string }> {
    try {
      return await apiClient.delete<{ message: string }>(`/contacts/${id}`);
    } catch (error) {
      console.error(`Error deleting contact ${id}:`, error);
      throw error;
    }
  }

  // 10. Get contact call history
  async getContactCallHistory(id: string): Promise<CallLog[]> {
    try {
      return await apiClient.get<CallLog[]>(`/contacts/${id}/call-history`);
    } catch (error) {
      console.error(`Error getting call history for contact ${id}:`, error);
      throw error;
    }
  }

  // 11. Get contact call statistics
  async getContactCallStats(id: string): Promise<CallStats> {
    try {
      return await apiClient.get<CallStats>(`/contacts/${id}/call-stats`);
    } catch (error) {
      console.error(`Error getting call stats for contact ${id}:`, error);
      throw error;
    }
  }

  // 12. Get contacts with recent calls
  async getContactsWithRecentCalls(days: number): Promise<Contact[]> {
    try {
      const params = { days: days.toString() };
      return await apiClient.get<Contact[]>('/contacts/analytics/recent-calls', params);
    } catch (error) {
      console.error(`Error getting contacts with recent calls (${days} days):`, error);
      throw error;
    }
  }

  // 13. Get top contacts by call duration
  async getTopContactsByCallDuration(limit: number): Promise<Contact[]> {
    try {
      const params = { limit: limit.toString() };
      return await apiClient.get<Contact[]>('/contacts/analytics/top-callers', params);
    } catch (error) {
      console.error(`Error getting top contacts by call duration (limit: ${limit}):`, error);
      throw error;
    }
  }

  // 14. Initiate a call to contact
  async makeCall(id: string, data: MakeCallDto): Promise<CallInitiationResult> {
    try {
      return await apiClient.post<MakeCallDto, CallInitiationResult>(`/contacts/${id}/make-call`, data);
    } catch (error) {
      console.error(`Error making call to contact ${id}:`, error);
      throw error;
    }
  }

  // 15. Send WhatsApp message to contact
  async sendWhatsApp(id: string, data: SendWhatsAppDto): Promise<WhatsAppResult> {
    try {
      return await apiClient.post<SendWhatsAppDto, WhatsAppResult>(`/contacts/${id}/whatsapp/send`, data);
    } catch (error) {
      console.error(`Error sending WhatsApp to contact ${id}:`, error);
      throw error;
    }
  }

  // 16. Send WhatsApp broadcast to multiple contacts
  async sendWhatsAppBroadcast(data: BroadcastWhatsAppDto): Promise<BroadcastResult> {
    try {
      return await apiClient.post<BroadcastWhatsAppDto, BroadcastResult>('/contacts/whatsapp/broadcast', data);
    } catch (error) {
      console.error('Error sending WhatsApp broadcast:', error);
      throw error;
    }
  }

  // 17. Send WhatsApp to filtered contacts
  async sendWhatsAppToFiltered(data: FilteredWhatsAppDto): Promise<FilteredSendResult> {
    try {
      return await apiClient.post<FilteredWhatsAppDto, FilteredSendResult>('/contacts/whatsapp/filtered-send', data);
    } catch (error) {
      console.error('Error sending WhatsApp to filtered contacts:', error);
      throw error;
    }
  }

  // 18. Update contact field and send notification
  async updateContactAndNotify(id: string, data: UpdateAndNotifyDto): Promise<UpdateNotifyResult> {
    try {
      return await apiClient.put<UpdateAndNotifyDto, UpdateNotifyResult>(`/contacts/${id}/update-notify`, data);
    } catch (error) {
      console.error(`Error updating and notifying contact ${id}:`, error);
      throw error;
    }
  }

  // 19. Bulk update contacts with notifications
  async bulkUpdateContacts(data: BulkUpdateDto): Promise<BulkUpdateResult[]> {
    try {
      return await apiClient.put<BulkUpdateDto, BulkUpdateResult[]>('/contacts/whatsapp/bulk-update-notify', data);
    } catch (error) {
      console.error('Error bulk updating contacts:', error);
      throw error;
    }
  }

  // 20. Get WhatsApp message history for contact
  async getWhatsAppHistory(id: string, limit: number = 50): Promise<WhatsAppMessageLog[]> {
    try {
      const params = limit ? { limit: limit.toString() } : undefined;
      return await apiClient.get<WhatsAppMessageLog[]>(`/contacts/${id}/whatsapp/history`, params);
    } catch (error) {
      console.error(`Error getting WhatsApp history for contact ${id}:`, error);
      throw error;
    }
  }

  // 21. Get WhatsApp messaging statistics
  async getWhatsAppStats(): Promise<WhatsAppStats> {
    try {
      return await apiClient.get<WhatsAppStats>('/contacts/whatsapp/stats');
    } catch (error) {
      console.error('Error getting WhatsApp stats:', error);
      throw error;
    }
  }

  // 22. Get contacts view for WhatsApp automation
  async getContactsWhatsAppView(filters?: Record<string, any>, page: number = 1, limit: number = 50): Promise<ContactsWhatsAppView> {
    try {
      const params: Record<string, string> = {
        page: page.toString(),
        limit: limit.toString(),
      };

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params[`filter[${key}]`] = value.toString();
          }
        });
      }

      return await apiClient.get<ContactsWhatsAppView>('/contacts/whatsapp/view', params);
    } catch (error) {
      console.error('Error getting contacts WhatsApp view:', error);
      throw error;
    }
  }

  // 23. Test TextMeBot connection
  async testWhatsAppConnection(): Promise<TestWhatsAppResult> {
    try {
      return await apiClient.post<any, TestWhatsAppResult>('/contacts/whatsapp/test', {});
    } catch (error) {
      console.error('Error testing WhatsApp connection:', error);
      throw error;
    }
  }

  // Utility methods (optimized for better performance)
  async getActiveContacts(): Promise<Contact[]> {
    try {
      const allContacts = await this.getAllContacts();
      return allContacts.filter(contact => contact.active);
    } catch (error) {
      console.error('Error getting active contacts:', error);
      throw error;
    }
  }

  async getContactsWithWhatsApp(): Promise<Contact[]> {
    try {
      const allContacts = await this.getAllContacts();
      return allContacts.filter(contact => contact.whatsappEnabled);
    } catch (error) {
      console.error('Error getting contacts with WhatsApp:', error);
      throw error;
    }
  }

  async searchContacts(searchTerm: string): Promise<Contact[]> {
    try {
      const allContacts = await this.getAllContacts();
      const searchLower = searchTerm.toLowerCase();
      
      return allContacts.filter(contact =>
        contact.name?.toLowerCase().includes(searchLower) ||
        contact.email?.toLowerCase().includes(searchLower) ||
        contact.phone?.includes(searchTerm) ||
        contact.companyName?.toLowerCase().includes(searchLower)
      );
    } catch (error) {
      console.error(`Error searching contacts for "${searchTerm}":`, error);
      throw error;
    }
  }

  async getContactsByType(type: string): Promise<Contact[]> {
    try {
      const allContacts = await this.getAllContacts();
      return allContacts.filter(contact => contact.type === type);
    } catch (error) {
      console.error(`Error getting contacts by type ${type}:`, error);
      throw error;
    }
  }

  async getRecentContacts(limit: number = 10): Promise<Contact[]> {
    try {
      const allContacts = await this.getAllContacts();
      return allContacts
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting recent contacts:', error);
      throw error;
    }
  }

  async getContactsWithCustomField(field: string, value: any): Promise<Contact[]> {
    try {
      const allContacts = await this.getAllContacts();
      return allContacts.filter(contact => 
        contact.customFields && contact.customFields[field] === value
      );
    } catch (error) {
      console.error(`Error getting contacts with custom field ${field}=${value}:`, error);
      throw error;
    }
  }

  async updateContactStatus(id: string, active: boolean): Promise<Contact> {
    try {
      return await this.updateContact(id, { active });
    } catch (error) {
      console.error(`Error updating contact ${id} status to ${active}:`, error);
      throw error;
    }
  }

  async toggleWhatsAppStatus(id: string, enabled: boolean): Promise<Contact> {
    try {
      return await this.updateContact(id, { 
        whatsappEnabled: enabled,
        whatsappStatus: enabled ? 'active' : 'inactive'
      });
    } catch (error) {
      console.error(`Error toggling WhatsApp status for contact ${id}:`, error);
      throw error;
    }
  }

  async addCustomField(id: string, field: string, value: any): Promise<Contact> {
    try {
      const contact = await this.getContactById(id);
      const customFields = { ...contact.customFields, [field]: value };
      return await this.updateContact(id, { customFields });
    } catch (error) {
      console.error(`Error adding custom field to contact ${id}:`, error);
      throw error;
    }
  }

  async removeCustomField(id: string, field: string): Promise<Contact> {
    try {
      const contact = await this.getContactById(id);
      const customFields = { ...contact.customFields };
      delete customFields[field];
      return await this.updateContact(id, { customFields });
    } catch (error) {
      console.error(`Error removing custom field from contact ${id}:`, error);
      throw error;
    }
  }

  async getContactCallSummary(id: string): Promise<{
    totalCalls: number;
    totalDuration: number;
    averageDuration: number;
    lastCall: CallLog | null;
    callFrequency: number;
  }> {
    try {
      const callHistory = await this.getContactCallHistory(id);
      const callStats = await this.getContactCallStats(id);
      
      const totalCalls = callStats.totalCalls;
      const totalDuration = callStats.totalDuration;
      const averageDuration = callStats.averageDuration;
      
      const lastCall = callHistory.length > 0 ? callHistory[0] : null;
      
      // Calculate call frequency (calls per month)
      let callFrequency = 0;
      if (callHistory.length > 1) {
        const firstCall = new Date(callHistory[callHistory.length - 1].callDate);
        const lastCallDate = new Date(callHistory[0].callDate);
        const monthsDiff = (lastCallDate.getTime() - firstCall.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
        callFrequency = monthsDiff > 0 ? callHistory.length / monthsDiff : callHistory.length;
      }
      
      return {
        totalCalls,
        totalDuration,
        averageDuration,
        lastCall,
        callFrequency: parseFloat(callFrequency.toFixed(2))
      };
    } catch (error) {
      console.error(`Error getting call summary for contact ${id}:`, error);
      throw error;
    }
  }

  async sendQuickWhatsApp(id: string, message: string): Promise<WhatsAppResult> {
    try {
      return await this.sendWhatsApp(id, {
        content: message,
        templateName: undefined,
        templateParams: undefined
      });
    } catch (error) {
      console.error(`Error sending quick WhatsApp to contact ${id}:`, error);
      throw error;
    }
  }

  async createContactFromOpportunity(opportunityId: string, customerData: any): Promise<Contact> {
    try {
      const contactData: CreateContactDto = {
        name: customerData.name,
        email: customerData.email,
        phone: customerData.phone,
        companyName: customerData.companyName,
        opportunityId: opportunityId,
        type: 'customer',
        whatsappEnabled: true,
        whatsappStatus: 'active'
      };
      
      return await this.createContact(contactData);
    } catch (error) {
      console.error(`Error creating contact from opportunity ${opportunityId}:`, error);
      throw error;
    }
  }

  async getContactEngagementScore(id: string): Promise<number> {
    try {
      const contact = await this.getContactById(id);
      let score = 0;
      
      // Base score
      if (contact.email) score += 10;
      if (contact.phone) score += 10;
      if (contact.companyName) score += 5;
      
      // Call engagement
      if (contact.totalCalls > 0) score += 20;
      if (contact.totalCalls > 5) score += 10;
      
      // WhatsApp engagement
      if (contact.totalWhatsAppSent > 0) score += 15;
      if (contact.totalWhatsAppReceived > 0) score += 25;
      
      // Recency bonus
      const lastCallDate = contact.lastCallDate ? new Date(contact.lastCallDate) : null;
      const lastWhatsAppDate = contact.lastWhatsAppSent ? new Date(contact.lastWhatsAppSent) : null;
      const now = new Date();
      
      if (lastCallDate && (now.getTime() - lastCallDate.getTime()) < 7 * 24 * 60 * 60 * 1000) {
        score += 10;
      }
      
      if (lastWhatsAppDate && (now.getTime() - lastWhatsAppDate.getTime()) < 7 * 24 * 60 * 60 * 1000) {
        score += 10;
      }
      
      return Math.min(score, 100);
    } catch (error) {
      console.error(`Error calculating engagement score for contact ${id}:`, error);
      throw error;
    }
  }

  async getContactsByEngagement(minScore: number = 50): Promise<Array<{ contact: Contact; score: number }>> {
    try {
      const allContacts = await this.getActiveContacts();
      const results: Array<{ contact: Contact; score: number }> = [];
      
      for (const contact of allContacts) {
        try {
          const score = await this.getContactEngagementScore(contact._id);
          if (score >= minScore) {
            results.push({ contact, score });
          }
        } catch (error) {
          console.warn(`Could not calculate score for contact ${contact._id}:`, error);
        }
      }
      
      return results.sort((a, b) => b.score - a.score);
    } catch (error) {
      console.error(`Error getting contacts by engagement (minScore: ${minScore}):`, error);
      throw error;
    }
  }

  async exportContacts(format: 'csv' | 'json' = 'json'): Promise<string> {
    try {
      const contacts = await this.getAllContacts();
      
      if (format === 'csv') {
        // Simple CSV export
        const headers = ['Name', 'Email', 'Phone', 'Company', 'Type', 'WhatsApp Enabled', 'Last Contact'];
        const rows = contacts.map(contact => [
          contact.name,
          contact.email || '',
          contact.phone,
          contact.companyName || '',
          contact.type,
          contact.whatsappEnabled ? 'Yes' : 'No',
          contact.lastCallDate || contact.lastWhatsAppSent || ''
        ]);
        
        const csvContent = [
          headers.join(','),
          ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');
        
        return csvContent;
      } else {
        // JSON export
        return JSON.stringify(contacts, null, 2);
      }
    } catch (error) {
      console.error(`Error exporting contacts in ${format} format:`, error);
      throw error;
    }
  }

  // New utility method for better error handling
  async getAllContactsWithFallback(): Promise<Contact[]> {
    try {
      const contacts = await this.getAllContacts();
      return Array.isArray(contacts) ? contacts : [];
    } catch (error) {
      console.error('Error in getAllContactsWithFallback:', error);
      // Return empty array instead of throwing
      return [];
    }
  }

  // New method to calculate stats locally if API fails
  async getContactsStatsWithFallback(): Promise<ContactStats> {
    try {
      try {
        return await this.getContactsStats();
      } catch (apiError) {
        console.log('Contacts stats API failed, calculating locally...');
        const contacts = await this.getAllContactsWithFallback();
        return this.calculateLocalStats(contacts);
      }
    } catch (error) {
      console.error('Error in getContactsStatsWithFallback:', error);
      return this.getDefaultStats();
    }
  }

  public calculateLocalStats(contacts: Contact[]): ContactStats {
    const contactsWithEmail = contacts.filter(c => c.email).length;
    const contactsWithPhone = contacts.filter(c => c.phone).length;
    
    // Calculate contacts by type
    const typeCounts: Record<string, number> = {};
    contacts.forEach(contact => {
      const type = contact.type || 'unknown';
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });
    
    const contactsByType = Object.entries(typeCounts).map(([_id, count]) => ({
      _id,
      count
    }));

    // Calculate call stats
    const totalCalls = contacts.reduce((sum, c) => sum + (c.totalCalls || 0), 0);
    const totalDuration = contacts.reduce((sum, c) => sum + (c.totalCallDuration || 0), 0);
    const contactsWithCalls = contacts.filter(c => (c.totalCalls || 0) > 0).length;
    const avgDuration = totalCalls > 0 ? totalDuration / totalCalls : 0;

    // Calculate WhatsApp stats
    const whatsappEnabled = contacts.filter(c => c.whatsappEnabled).length;
    const whatsappActive = contacts.filter(c => c.whatsappStatus === 'active').length;
    const totalMessagesSent = contacts.reduce((sum, c) => sum + (c.totalWhatsAppSent || 0), 0);
    const totalMessagesReceived = contacts.reduce((sum, c) => sum + (c.totalWhatsAppReceived || 0), 0);

    return {
      totalContacts: contacts.length,
      contactsWithEmail,
      contactsWithPhone,
      contactsByType,
      emailCoverage: contacts.length > 0 ? `${Math.round((contactsWithEmail / contacts.length) * 100)}%` : '0%',
      phoneCoverage: contacts.length > 0 ? `${Math.round((contactsWithPhone / contacts.length) * 100)}%` : '0%',
      callStats: {
        totalCalls,
        totalDuration,
        avgDuration,
        contactsWithCalls
      },
      whatsappStats: {
        totalContacts: contacts.length,
        whatsappEnabled,
        whatsappActive,
        totalMessagesSent,
        totalMessagesReceived,
        messagesByStatus: {} // Not available locally
      }
    };
  }

  public getDefaultStats(): ContactStats {
    return {
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
      }
    };
  }
}

export const contactService = new ContactService();