export interface Note {
  _id: string;
  id: string;
  opportunityId: string;
  type: NoteType;
  content: string;
  author: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  metadata?: {
    attachments?: NoteAttachment[];
    tags?: string[];
    pinned?: boolean;
    sharedWith?: string[];
  };
  createdAt: string;
  updatedAt: string;
}

export type NoteType = 
  | 'general' 
  | 'customer_feedback' 
  | 'internal_comment' 
  | 'follow_up' 
  | 'issue' 
  | 'solution' 
  | 'meeting_summary'
  | 'phone_call'
  | 'email'
  | 'quote_discussion'
  | 'service_update'
  | 'payment_remark';

export interface NoteAttachment {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'document' | 'audio' | 'other';
  size: number;
  uploadedAt: string;
}

export interface NoteSummary {
  totalNotes: number;
  byType: Array<{
    type: NoteType;
    count: number;
  }>;
  recentActivity: Array<{
    date: string;
    count: number;
    lastNote?: Note;
  }>;
  authors: Array<{
    authorId: string;
    name: string;
    count: number;
    lastActive: string;
  }>;
}

export interface CreateNoteData {
  content: string;
  type: NoteType;
  metadata?: {
    attachments?: Omit<NoteAttachment, 'id' | 'uploadedAt'>[];
    tags?: string[];
    pinned?: boolean;
  };
}

export interface UpdateNoteData {
  content?: string;
  type?: NoteType;
  metadata?: {
    attachments?: (NoteAttachment | Omit<NoteAttachment, 'id' | 'uploadedAt'>)[];
    tags?: string[];
    pinned?: boolean;
  };
}

export interface NoteSearchParams {
  query?: string;
  type?: NoteType;
  authorId?: string;
  fromDate?: string;
  toDate?: string;
  tags?: string[];
  includeAttachments?: boolean;
  pinned?: boolean;
  sort?: 'createdAt:asc' | 'createdAt:desc' | 'updatedAt:asc' | 'updatedAt:desc';
  limit?: number;
  page?: number;
}