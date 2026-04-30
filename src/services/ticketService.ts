import { apiClient } from '@/lib/api/client';

export type TicketStatus = 'new' | 'open' | 'queued' | 'in_progress' | 'resolved' | 'closed' | string;
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

export interface TicketMutationOptions {
  alternateIds?: string[];
}

class TicketService {
  private basePath = '/tickets';
  private mutationBasePaths = ['/tickets', '/ticket'];

  private getMutationBasePaths(): string[] {
    const unique = new Set<string>();

    const addBasePath = (value: string) => {
      if (!value || typeof value !== 'string') return;
      const trimmed = value.trim();
      if (!trimmed) return;
      unique.add(trimmed.startsWith('/') ? trimmed : `/${trimmed}`);
    };

    addBasePath(this.basePath);
    this.mutationBasePaths.forEach(addBasePath);

    return Array.from(unique);
  }

  private getTicketIdCandidates(primaryId: string, alternateIds: string[] = []): string[] {
    const unique = new Set<string>();

    const addCandidate = (value: string) => {
      if (!value || typeof value !== 'string') return;
      const trimmed = value.trim();
      if (!trimmed) return;
      unique.add(trimmed);
    };

    addCandidate(primaryId);
    alternateIds.forEach(addCandidate);

    return Array.from(unique);
  }

  private shouldTryAnotherMutationAttempt(status: number | undefined): boolean {
    if (status === undefined) {
      return false;
    }

    if (status === 401 || status === 403) {
      return false;
    }

    return status === 400 || status === 404 || status === 405 || status === 415 || status === 422;
  }

  private getErrorStatus(error: unknown): number | undefined {
    if (!error || typeof error !== 'object') return undefined;
    const status = (error as { status?: unknown }).status;
    return typeof status === 'number' ? status : undefined;
  }

  private async tryMutationWithFallback(
    attempts: Array<() => Promise<unknown>>,
    operation: string
  ): Promise<unknown> {
    let lastError: unknown;

    for (let index = 0; index < attempts.length; index += 1) {
      const attempt = attempts[index];
      try {
        return await attempt();
      } catch (error) {
        lastError = error;
        const status = this.getErrorStatus(error);
        const isLastAttempt = index === attempts.length - 1;

        if (isLastAttempt) {
          break;
        }

        // Keep trying compatible endpoints/payload formats for common API mismatches.
        if (!this.shouldTryAnotherMutationAttempt(status)) {
          break;
        }
      }
    }

    console.error(`All fallback attempts failed for ${operation}.`, lastError);
    throw lastError;
  }

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

  async queueTicket(
    id: string,
    data: UpdateTicketQueueData = {},
    options: TicketMutationOptions = {}
  ): Promise<Ticket> {
    try {
      const ticketIdCandidates = this.getTicketIdCandidates(id, options.alternateIds || []);
      if (ticketIdCandidates.length === 0) {
        throw new Error('Ticket id is required to queue a ticket.');
      }
      const basePaths = this.getMutationBasePaths();
      const normalizedQueue = data.queue?.trim();
      const queuePayload: UpdateTicketQueueData = {
        ...(normalizedQueue ? { queue: normalizedQueue } : {}),
        ...(data.note ? { note: data.note } : {}),
      };
      const attempts: Array<() => Promise<unknown>> = [];

      for (const ticketId of ticketIdCandidates) {
        const safeId = encodeURIComponent(ticketId);
        for (const basePath of basePaths) {
          attempts.push(() =>
            apiClient.patch<UpdateTicketQueueData, unknown>(
              `${basePath}/${safeId}/queue`,
              queuePayload
            )
          );
          attempts.push(() =>
            apiClient.post<UpdateTicketQueueData, unknown>(
              `${basePath}/${safeId}/queue`,
              queuePayload
            )
          );
          attempts.push(() =>
            apiClient.patch<UpdateTicketQueueData, unknown>(
              `${basePath}/queue/${safeId}`,
              queuePayload
            )
          );
          attempts.push(() =>
            apiClient.post<UpdateTicketQueueData, unknown>(
              `${basePath}/queue/${safeId}`,
              queuePayload
            )
          );
          attempts.push(() =>
            apiClient.patch<UpdateTicketQueueData, unknown>(
              `${basePath}/${safeId}/queue-ticket`,
              queuePayload
            )
          );
          attempts.push(() =>
            apiClient.post<UpdateTicketQueueData, unknown>(
              `${basePath}/${safeId}/queue-ticket`,
              queuePayload
            )
          );
          attempts.push(() =>
            apiClient.patch<UpdateTicketStatusData, unknown>(
              `${basePath}/${safeId}/status`,
              { status: 'queued', ...(data.note ? { note: data.note } : {}) }
            )
          );
          attempts.push(() =>
            apiClient.put<UpdateTicketStatusData, unknown>(
              `${basePath}/${safeId}/status`,
              { status: 'queued', ...(data.note ? { note: data.note } : {}) }
            )
          );
          attempts.push(() =>
            apiClient.patch<Record<string, never>, unknown>(
              `${basePath}/${safeId}/status/queued`,
              {}
            )
          );
          attempts.push(() =>
            apiClient.patch<Record<string, unknown>, unknown>(
              `${basePath}/status/${safeId}`,
              { status: 'queued', ...(data.note ? { note: data.note } : {}) }
            )
          );
          attempts.push(() =>
            apiClient.patch<Record<string, unknown>, unknown>(
              `${basePath}/status/queued/${safeId}`,
              data.note ? { note: data.note } : {}
            )
          );
          attempts.push(() =>
            apiClient.patch<Record<string, unknown>, unknown>(
              `${basePath}/${safeId}`,
              {
                status: 'queued',
                ...(normalizedQueue ? { queue: normalizedQueue } : {}),
                ...(data.note ? { note: data.note } : {}),
              }
            )
          );
          attempts.push(() =>
            apiClient.put<Record<string, unknown>, unknown>(
              `${basePath}/${safeId}`,
              {
                status: 'queued',
                ...(normalizedQueue ? { queue: normalizedQueue } : {}),
                ...(data.note ? { note: data.note } : {}),
              }
            )
          );
        }
      }

      const response = await this.tryMutationWithFallback(
        attempts,
        `queueing ticket ${ticketIdCandidates.join(', ')}`
      );
      return this.normalizeTicket(this.unwrapTicketPayload(response));
    } catch (error) {
      console.error(`Error queueing ticket ${id}:`, error);
      throw error;
    }
  }

  async updateTicketStatus(
    id: string,
    data: UpdateTicketStatusData,
    options: TicketMutationOptions = {}
  ): Promise<Ticket> {
    try {
      const ticketIdCandidates = this.getTicketIdCandidates(id, options.alternateIds || []);
      if (ticketIdCandidates.length === 0) {
        throw new Error('Ticket id is required to update ticket status.');
      }
      const basePaths = this.getMutationBasePaths();
      const normalizedStatus = (data.status || '').toString().trim().toLowerCase() || 'open';
      const notePayload = data.note ? { note: data.note } : {};
      const safeStatus = encodeURIComponent(normalizedStatus);
      const attempts: Array<() => Promise<unknown>> = [];

      for (const ticketId of ticketIdCandidates) {
        const safeId = encodeURIComponent(ticketId);
        for (const basePath of basePaths) {
          attempts.push(() =>
            apiClient.patch<UpdateTicketStatusData, unknown>(
              `${basePath}/${safeId}/status`,
              { status: normalizedStatus, ...notePayload }
            )
          );
          attempts.push(() =>
            apiClient.put<UpdateTicketStatusData, unknown>(
              `${basePath}/${safeId}/status`,
              { status: normalizedStatus, ...notePayload }
            )
          );
          attempts.push(() =>
            apiClient.patch<Record<string, unknown>, unknown>(
              `${basePath}/${safeId}/status/${safeStatus}`,
              notePayload
            )
          );
          attempts.push(() =>
            apiClient.patch<Record<string, unknown>, unknown>(
              `${basePath}/status/${safeId}`,
              { status: normalizedStatus, ...notePayload }
            )
          );
          attempts.push(() =>
            apiClient.put<Record<string, unknown>, unknown>(
              `${basePath}/status/${safeId}`,
              { status: normalizedStatus, ...notePayload }
            )
          );
          attempts.push(() =>
            apiClient.patch<Record<string, unknown>, unknown>(
              `${basePath}/status/${safeStatus}/${safeId}`,
              notePayload
            )
          );
          attempts.push(() =>
            apiClient.patch<Record<string, unknown>, unknown>(
              `${basePath}/update-status/${safeId}`,
              { status: normalizedStatus, ...notePayload }
            )
          );
          attempts.push(() =>
            apiClient.put<Record<string, unknown>, unknown>(
              `${basePath}/update-status/${safeId}`,
              { status: normalizedStatus, ...notePayload }
            )
          );
          attempts.push(() =>
            apiClient.patch<Record<string, unknown>, unknown>(
              `${basePath}/${safeId}/update-status`,
              { status: normalizedStatus, ...notePayload }
            )
          );
          attempts.push(() =>
            apiClient.post<Record<string, unknown>, unknown>(
              `${basePath}/${safeId}/update-status`,
              { status: normalizedStatus, ...notePayload }
            )
          );
          attempts.push(() =>
            apiClient.patch<Record<string, unknown>, unknown>(
              `${basePath}/${safeId}`,
              { status: normalizedStatus, ...notePayload }
            )
          );
          attempts.push(() =>
            apiClient.put<Record<string, unknown>, unknown>(
              `${basePath}/${safeId}`,
              { status: normalizedStatus, ...notePayload }
            )
          );
        }
      }

      const response = await this.tryMutationWithFallback(
        attempts,
        `updating status for ticket ${ticketIdCandidates.join(', ')}`
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
