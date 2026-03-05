import { apiClient } from '@/lib/api/client';

export type TicketStatus = 'open' | 'queued' | 'in_progress' | 'resolved' | 'closed' | string;
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent' | string;

export interface TicketReply {
  _id?: string;
  id?: string;
  message: string;
  authorId?: string;
  authorName?: string;
  isInternal?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Ticket {
  _id?: string;
  id?: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category?: string;
  queue?: string;
  createdBy?: string;
  assigneeId?: string;
  requesterName?: string;
  requesterEmail?: string;
  replies?: TicketReply[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePublicTicketData {
  subject: string;
  description: string;
  priority?: TicketPriority;
  category?: string;
  requesterName: string;
  requesterEmail: string;
}

export interface CreateTicketData {
  subject: string;
  description: string;
  priority?: TicketPriority;
  category?: string;
}

export interface ListTicketsParams {
  status?: string;
  priority?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface UpdateTicketQueueData {
  queue?: string;
  note?: string;
}

export interface UpdateTicketStatusData {
  status: TicketStatus;
  note?: string;
}

export interface AddTicketReplyData {
  message: string;
  isInternal?: boolean;
}

class TicketService {
  private basePath = '/tickets';

  private asRecord(value: unknown): Record<string, unknown> {
    return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  }

  private unwrapTicketPayload(payload: unknown): Record<string, unknown> {
    const root = this.asRecord(payload);
    const candidate =
      root.ticket ??
      root.data ??
      root.result ??
      root.item ??
      root;

    return this.asRecord(candidate);
  }

  private unwrapTicketArrayPayload(payload: unknown): Array<Record<string, unknown>> {
    if (Array.isArray(payload)) {
      return payload.map(item => this.asRecord(item));
    }

    const root = this.asRecord(payload);
    const candidates = [
      root.data,
      root.tickets,
      root.items,
      root.results,
    ];

    for (const candidate of candidates) {
      if (Array.isArray(candidate)) {
        return candidate.map(item => this.asRecord(item));
      }
    }

    return [];
  }

  private unwrapReplyPayload(payload: unknown): Record<string, unknown> {
    const root = this.asRecord(payload);
    const candidate =
      root.reply ??
      root.data ??
      root.result ??
      root;

    return this.asRecord(candidate);
  }

  private normalizeTicket(data: Record<string, unknown>): Ticket {
    return {
      _id: (data._id as string) || undefined,
      id: (data.id as string) || (data._id as string) || undefined,
      subject: (data.subject as string) || 'Untitled Ticket',
      description: (data.description as string) || '',
      status: ((data.status as string) || 'open') as TicketStatus,
      priority: ((data.priority as string) || 'medium') as TicketPriority,
      category: (data.category as string) || undefined,
      queue: (data.queue as string) || undefined,
      createdBy: (data.createdBy as string) || undefined,
      assigneeId: (data.assigneeId as string) || undefined,
      requesterName: (data.requesterName as string) || undefined,
      requesterEmail: (data.requesterEmail as string) || undefined,
      replies: Array.isArray(data.replies)
        ? (data.replies as Array<Record<string, unknown>>).map(reply => ({
            _id: (reply._id as string) || undefined,
            id: (reply.id as string) || (reply._id as string) || undefined,
            message: (reply.message as string) || '',
            authorId: (reply.authorId as string) || undefined,
            authorName: (reply.authorName as string) || undefined,
            isInternal: Boolean(reply.isInternal),
            createdAt: (reply.createdAt as string) || undefined,
            updatedAt: (reply.updatedAt as string) || undefined,
          }))
        : [],
      createdAt: (data.createdAt as string) || undefined,
      updatedAt: (data.updatedAt as string) || undefined,
    };
  }

  async createPublicTicket(data: CreatePublicTicketData): Promise<Ticket> {
    try {
      const response = await apiClient.post<CreatePublicTicketData, unknown>(
        `${this.basePath}/public`,
        data
      );
      return this.normalizeTicket(this.unwrapTicketPayload(response));
    } catch (error) {
      console.error('Error creating public ticket:', error);
      throw error;
    }
  }

  async createTicket(data: CreateTicketData): Promise<Ticket> {
    try {
      const response = await apiClient.post<CreateTicketData, unknown>(this.basePath, data);
      return this.normalizeTicket(this.unwrapTicketPayload(response));
    } catch (error) {
      console.error('Error creating ticket:', error);
      throw error;
    }
  }

  async listTickets(params?: ListTicketsParams): Promise<Ticket[]> {
    try {
      const query: Record<string, string> = {};
      if (params?.status) query.status = params.status;
      if (params?.priority) query.priority = params.priority;
      if (params?.search) query.search = params.search;
      if (params?.page !== undefined) query.page = String(params.page);
      if (params?.limit !== undefined) query.limit = String(params.limit);

      const response = await apiClient.get<unknown>(this.basePath, query);
      const items = this.unwrapTicketArrayPayload(response);
      return items.map(ticket => this.normalizeTicket(ticket));
    } catch (error) {
      console.error('Error listing tickets:', error);
      throw error;
    }
  }

  async getTicketById(id: string): Promise<Ticket> {
    try {
      const response = await apiClient.get<unknown>(`${this.basePath}/${id}`);
      return this.normalizeTicket(this.unwrapTicketPayload(response));
    } catch (error) {
      console.error(`Error fetching ticket ${id}:`, error);
      throw error;
    }
  }

  async queueTicket(id: string, data: UpdateTicketQueueData = {}): Promise<Ticket> {
    try {
      const response = await apiClient.patch<UpdateTicketQueueData, unknown>(
        `${this.basePath}/${id}/queue`,
        data
      );
      return this.normalizeTicket(this.unwrapTicketPayload(response));
    } catch (error) {
      console.error(`Error queueing ticket ${id}:`, error);
      throw error;
    }
  }

  async updateTicketStatus(id: string, data: UpdateTicketStatusData): Promise<Ticket> {
    try {
      const response = await apiClient.patch<UpdateTicketStatusData, unknown>(
        `${this.basePath}/${id}/status`,
        data
      );
      return this.normalizeTicket(this.unwrapTicketPayload(response));
    } catch (error) {
      console.error(`Error updating ticket ${id} status:`, error);
      throw error;
    }
  }

  async addReply(id: string, data: AddTicketReplyData): Promise<TicketReply> {
    try {
      const response = await apiClient.post<AddTicketReplyData, unknown>(
        `${this.basePath}/${id}/replies`,
        data
      );
      const reply = this.unwrapReplyPayload(response);

      return {
        _id: (reply._id as string) || undefined,
        id: (reply.id as string) || (reply._id as string) || undefined,
        message: (reply.message as string) || '',
        authorId: (reply.authorId as string) || undefined,
        authorName: (reply.authorName as string) || undefined,
        isInternal: Boolean(reply.isInternal),
        createdAt: (reply.createdAt as string) || undefined,
        updatedAt: (reply.updatedAt as string) || undefined,
      };
    } catch (error) {
      console.error(`Error adding reply to ticket ${id}:`, error);
      throw error;
    }
  }
}

export const ticketService = new TicketService();
