'use client';

import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/contexts/ToastContext';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { opportunityService } from '@/services/opportunityService';
import { Note, NoteType, CreateNoteData } from '@/types/note';
import {
  MessageSquare,
  FileText,
  Phone,
  Mail,
  Calendar,
  AlertCircle,
  CheckCircle,
  Users,
  Tag,
  Paperclip,
  Pin,
  Edit,
  Trash2,
  Search,
  Filter,
  MoreVertical,
  Clock,
  X,
  Plus,
  ThumbsUp
} from 'lucide-react';
import { format } from 'date-fns';

interface NotesSectionProps {
  opportunityId: string;
  className?: string;
}

const noteTypeConfig: Record<NoteType, { label: string; icon: React.ReactNode; bgColor: string }> = {
  general: { 
    label: 'General', 
    icon: <MessageSquare className="h-4 w-4" />,
    bgColor: 'bg-blue-100'
  },
  customer_feedback: { 
    label: 'Feedback', 
    icon: <ThumbsUp className="h-4 w-4" />,
    bgColor: 'bg-emerald-100'
  },
  internal_comment: { 
    label: 'Internal', 
    icon: <Users className="h-4 w-4" />,
    bgColor: 'bg-purple-100'
  },
  follow_up: { 
    label: 'Follow Up', 
    icon: <Calendar className="h-4 w-4" />,
    bgColor: 'bg-amber-100'
  },
  issue: { 
    label: 'Issue', 
    icon: <AlertCircle className="h-4 w-4" />,
    bgColor: 'bg-rose-100'
  },
  solution: { 
    label: 'Solution', 
    icon: <CheckCircle className="h-4 w-4" />,
    bgColor: 'bg-green-100'
  },
  meeting_summary: { 
    label: 'Meeting', 
    icon: <FileText className="h-4 w-4" />,
    bgColor: 'bg-indigo-100'
  },
  phone_call: { 
    label: 'Phone Call', 
    icon: <Phone className="h-4 w-4" />,
    bgColor: 'bg-teal-100'
  },
  email: { 
    label: 'Email', 
    icon: <Mail className="h-4 w-4" />,
    bgColor: 'bg-cyan-100'
  },
  quote_discussion: { 
    label: 'Quote', 
    icon: <MessageSquare className="h-4 w-4" />,
    bgColor: 'bg-orange-100'
  },
  service_update: { 
    label: 'Service', 
    icon: <CheckCircle className="h-4 w-4" />,
    bgColor: 'bg-lime-100'
  },
  payment_remark: { 
    label: 'Payment', 
    icon: <FileText className="h-4 w-4" />,
    bgColor: 'bg-pink-100'
  }
};

export default function NotesSection({ opportunityId, className = '' }: NotesSectionProps) {
  const { showToast } = useToast();
  const { user } = useCurrentUser(); // Get current user
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newNote, setNewNote] = useState<CreateNoteData>({
    content: '',
    type: 'general'
  });
  const [activeFilter, setActiveFilter] = useState<NoteType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchNotes();
  }, [opportunityId]);

  const fetchNotes = async (retryCount = 0) => {
    try {
      setLoading(true);
      const notesData = await opportunityService.getNotes(opportunityId);
      
      if (Array.isArray(notesData)) {
        const validNotes = notesData.map(note => ({
          ...note,
          // Ensure type is a valid NoteType, default to 'general' if not
          type: isValidNoteType(note.type) ? note.type : 'general',
          // Ensure author object exists
          author: note.author || {
            _id: 'unknown',
            name: 'Unknown User',
            email: 'unknown@example.com'
          }
        }));
        
        const sortedNotes = validNotes.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setNotes(sortedNotes);
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
      
      // Retry logic
      if (retryCount < 3) {
        setTimeout(() => {
          fetchNotes(retryCount + 1);
        }, 1000 * (retryCount + 1)); // Exponential backoff
      } else {
        showToast('Failed to load notes. Please refresh the page.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  function isValidNoteType(type: string): type is NoteType {
    return ['general', 'customer_feedback', 'internal_comment', 'follow_up', 
            'issue', 'solution', 'meeting_summary', 'phone_call', 'email', 
            'quote_discussion', 'service_update', 'payment_remark'].includes(type);
  }

  const handleSubmitNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.content.trim()) {
      showToast('Note content is required', 'error');
      return;
    }

    if (!user) {
      showToast('You must be logged in to add notes', 'error');
      return;
    }

    try {
      // Prepare note data - only include metadata if it has content
      const noteData: CreateNoteData = {
        content: newNote.content,
        type: newNote.type,
      };

      // Only add metadata if it has meaningful data
      if (newNote.metadata?.tags?.length || newNote.metadata?.attachments?.length || newNote.metadata?.pinned) {
        noteData.metadata = {};
        
        if (newNote.metadata.tags?.length) {
          noteData.metadata.tags = newNote.metadata.tags;
        }
        if (newNote.metadata.attachments?.length) {
          noteData.metadata.attachments = newNote.metadata.attachments;
        }
        if (newNote.metadata.pinned !== undefined) {
          noteData.metadata.pinned = newNote.metadata.pinned;
        }
      }

      console.log('Sending note data:', noteData);

      if (editingNote) {
        await opportunityService.updateNote(opportunityId, editingNote._id, {
          content: newNote.content,
          type: newNote.type,
          metadata: newNote.metadata
        });
        showToast('Note updated', 'success');
      } else {
        await opportunityService.addNote(opportunityId, noteData);
        showToast('Note added', 'success');
      }

      setNewNote({ content: '', type: 'general' });
      setEditingNote(null);
      setShowForm(false);
      
      // Refresh notes
      await fetchNotes();
    } catch (error: any) {
      console.error('Error saving note:', error);
      showToast(error.message || 'Failed to save note', 'error');
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Delete this note?')) return;

    try {
      await opportunityService.deleteNote(opportunityId, noteId);
      showToast('Note deleted', 'success');
      fetchNotes();
    } catch (error) {
      console.error('Error deleting note:', error);
      showToast('Failed to delete note', 'error');
    }
  };

  const handlePinNote = async (note: Note) => {
    try {
      await opportunityService.updateNote(opportunityId, note._id, {
        metadata: {
          ...note.metadata,
          pinned: !note.metadata?.pinned
        }
      });
      fetchNotes();
    } catch (error) {
      console.error('Error pinning note:', error);
      showToast('Failed to update note', 'error');
    }
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setNewNote({
      content: note.content,
      type: note.type,
      metadata: note.metadata
    });
    setShowForm(true);
  };

  const filteredNotes = notes.filter(note => {
    if (activeFilter !== 'all' && note.type !== activeFilter) return false;
    if (searchQuery && !note.content.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const pinnedNotes = filteredNotes.filter(note => note.metadata?.pinned);
  const regularNotes = filteredNotes.filter(note => !note.metadata?.pinned);

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  // Get current user display info
  const getCurrentUserDisplay = () => {
    if (!user) return { name: 'Current User', initials: 'CU', email: '' };
    
    const name = user.name || user.email?.split('@')[0] || 'Current User';
    const initials = user.name 
      ? getInitials(user.name)
      : (user.email?.charAt(0).toUpperCase() || 'C') + 'U';
    
    return { name, initials, email: user.email || '' };
  };

  const currentUser = getCurrentUserDisplay();

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Notes</h2>
            <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
              {notes.length}
            </span>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Note
          </button>
        </div>

        {/* Search and Filter */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value as NoteType | 'all')}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="all">All Types</option>
            {Object.entries(noteTypeConfig).map(([type, config]) => (
              <option key={type} value={type}>{config.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <form onSubmit={handleSubmitNote}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Note Type
                </label>
                <select
                  value={newNote.type}
                  onChange={(e) => setNewNote({ ...newNote, type: e.target.value as NoteType })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  {Object.entries(noteTypeConfig).map(([type, config]) => (
                    <option key={type} value={type}>{config.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content
                </label>
                <textarea
                  value={newNote.content}
                  onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                  placeholder="Write your note..."
                />
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingNote(null);
                    setNewNote({ content: '', type: 'general' });
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newNote.content.trim()}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingNote ? 'Update' : 'Save'} Note
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Notes List */}
      <div className="max-h-[600px] overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="py-8 text-center text-gray-500">
            Loading notes...
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            {searchQuery || activeFilter !== 'all' 
              ? 'No notes match your filters'
              : 'No notes yet'}
          </div>
        ) : (
          <>
            {/* Pinned Notes */}
            {pinnedNotes.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Pin className="h-4 w-4 text-gray-500" />
                  <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pinned
                  </h3>
                </div>
                {pinnedNotes.map((note) => (
                  <NoteCard
                    key={note._id}
                    note={note}
                    currentUser={currentUser}
                    onEdit={handleEditNote}
                    onDelete={handleDeleteNote}
                    onPin={handlePinNote}
                  />
                ))}
              </div>
            )}

            {/* Regular Notes */}
            {regularNotes.length > 0 && (
              <div className="space-y-3">
                {pinnedNotes.length > 0 && (
                  <div className="flex items-center gap-2 pt-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Recent
                    </h3>
                  </div>
                )}
                {regularNotes.map((note) => (
                  <NoteCard
                    key={note._id}
                    note={note}
                    currentUser={currentUser}
                    onEdit={handleEditNote}
                    onDelete={handleDeleteNote}
                    onPin={handlePinNote}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// NoteCard Component
function NoteCard({ note, currentUser, onEdit, onDelete, onPin }: {
  note: Note;
  currentUser: { name: string; initials: string; email: string };
  onEdit: (note: Note) => void;
  onDelete: (id: string) => void;
  onPin: (note: Note) => void;
}) {
  const [showActions, setShowActions] = useState(false);
  
  // Ensure note has valid author data
  const authorName = note.author?.name || note.author?.email?.split('@')[0] || 'Unknown User';
  const authorInitials = note.author?.name 
    ? getInitials(note.author.name)
    : (note.author?.email?.charAt(0).toUpperCase() || 'U') + 'U';
  
  const config = noteTypeConfig[note.type] || {
    label: note.type || 'Unknown',
    icon: <MessageSquare className="h-4 w-4" />,
    bgColor: 'bg-gray-100'
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 3600));
    
    if (diffInHours < 24) {
      return diffInHours < 1 ? 'Just now' : `${diffInHours}h ago`;
    }
    return format(date, 'MMM d, yyyy');
  };

  // Check if current user is the author
  const isCurrentUserAuthor = note.author?.email === currentUser.email || 
                             note.author?.name === currentUser.name;

  return (
    <div className={`p-4 rounded-lg border ${note.metadata?.pinned ? 'border-amber-200 bg-amber-50/50' : 'border-gray-200 bg-white'}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-xs font-medium text-gray-600">
                {authorInitials}
              </span>
            </div>
          </div>
          
          {/* Info */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2 py-1 rounded-md text-xs font-medium ${config.bgColor} text-gray-700 flex items-center gap-1`}>
                {config.icon}
                <span>{config.label}</span>
              </span>
              <span className="text-xs text-gray-500">
                {formatDate(note.createdAt)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-900">
                {authorName}
              </span>
              {isCurrentUserAuthor && (
                <span className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                  You
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="relative">
          <button
            onClick={() => setShowActions(!showActions)}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <MoreVertical className="h-4 w-4 text-gray-500" />
          </button>
          
          {showActions && (
            <>
              <div 
                className="fixed inset-0 z-10"
                onClick={() => setShowActions(false)}
              />
              <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
                <button
                  onClick={() => {
                    onPin(note);
                    setShowActions(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Pin className="h-4 w-4" />
                  {note.metadata?.pinned ? 'Unpin' : 'Pin'}
                </button>
                {/* Only show edit/delete if current user is author */}
                {isCurrentUserAuthor && (
                  <>
                    <button
                      onClick={() => {
                        onEdit(note);
                        setShowActions(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        onDelete(note._id);
                        setShowActions(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="ml-11">
        <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
          {note.content}
        </p>
        
        {/* Tags */}
        {note.metadata?.tags && note.metadata.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {note.metadata.tags.map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-md"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function
function getInitials(name: string): string {
  if (!name) return 'U';
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}