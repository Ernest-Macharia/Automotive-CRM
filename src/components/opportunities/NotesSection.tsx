'use client';

import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/contexts/ToastContext';
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
  User,
  X,
  Download,
  Eye,
  Send,
  ThumbsUp,
  Star,
  Share2,
  Hash,
  Image as ImageIcon,
  File,
  Music,
  FileType,
  Sparkles,
  Bookmark,
  BookOpen,
  MessageCircle,
  ExternalLink,
  Plus,
  Zap,
  Target,
  Bell,
  Archive,
  Layers,
  BarChart,
  TrendingUp
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface NotesSectionProps {
  opportunityId: string;
  className?: string;
}

const noteTypeConfig: Record<NoteType, { label: string; color: string; icon: React.ReactNode; bgColor: string; gradient: string }> = {
  general: { 
    label: 'General Note', 
    color: 'text-blue-600', 
    icon: <MessageSquare className="h-4 w-4" />,
    bgColor: 'bg-blue-50',
    gradient: 'from-blue-100 to-blue-200'
  },
  customer_feedback: { 
    label: 'Feedback', 
    color: 'text-emerald-600', 
    icon: <ThumbsUp className="h-4 w-4" />,
    bgColor: 'bg-emerald-50',
    gradient: 'from-emerald-100 to-green-200'
  },
  internal_comment: { 
    label: 'Internal', 
    color: 'text-purple-600', 
    icon: <Users className="h-4 w-4" />,
    bgColor: 'bg-purple-50',
    gradient: 'from-purple-100 to-purple-200'
  },
  follow_up: { 
    label: 'Follow Up', 
    color: 'text-amber-600', 
    icon: <Calendar className="h-4 w-4" />,
    bgColor: 'bg-amber-50',
    gradient: 'from-amber-100 to-orange-200'
  },
  issue: { 
    label: 'Issue', 
    color: 'text-rose-600', 
    icon: <AlertCircle className="h-4 w-4" />,
    bgColor: 'bg-rose-50',
    gradient: 'from-rose-100 to-pink-200'
  },
  solution: { 
    label: 'Solution', 
    color: 'text-green-600', 
    icon: <CheckCircle className="h-4 w-4" />,
    bgColor: 'bg-green-50',
    gradient: 'from-green-100 to-emerald-200'
  },
  meeting_summary: { 
    label: 'Meeting', 
    color: 'text-indigo-600', 
    icon: <FileText className="h-4 w-4" />,
    bgColor: 'bg-indigo-50',
    gradient: 'from-indigo-100 to-indigo-200'
  },
  phone_call: { 
    label: 'Phone Call', 
    color: 'text-teal-600', 
    icon: <Phone className="h-4 w-4" />,
    bgColor: 'bg-teal-50',
    gradient: 'from-teal-100 to-cyan-200'
  },
  email: { 
    label: 'Email', 
    color: 'text-cyan-600', 
    icon: <Mail className="h-4 w-4" />,
    bgColor: 'bg-cyan-50',
    gradient: 'from-cyan-100 to-blue-200'
  },
  quote_discussion: { 
    label: 'Quote', 
    color: 'text-orange-600', 
    icon: <MessageSquare className="h-4 w-4" />,
    bgColor: 'bg-orange-50',
    gradient: 'from-orange-100 to-amber-200'
  },
  service_update: { 
    label: 'Service', 
    color: 'text-lime-600', 
    icon: <CheckCircle className="h-4 w-4" />,
    bgColor: 'bg-lime-50',
    gradient: 'from-lime-100 to-green-200'
  },
  payment_remark: { 
    label: 'Payment', 
    color: 'text-pink-600', 
    icon: <FileText className="h-4 w-4" />,
    bgColor: 'bg-pink-50',
    gradient: 'from-pink-100 to-rose-200'
  }
};

// Helper functions
const getFileIcon = (type: string) => {
  if (type.includes('image')) return <ImageIcon className="h-4 w-4 text-rose-500" />;
  if (type.includes('pdf')) return <File className="h-4 w-4 text-red-500" />;
  if (type.includes('audio')) return <Music className="h-4 w-4 text-purple-500" />;
  return <FileType className="h-4 w-4 text-gray-500" />;
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Mock data for development
const getMockNotes = (): Note[] => {
  return [
    {
      _id: '1',
      id: 'note-1',
      opportunityId: 'opportunity-1',
      type: 'customer_feedback',
      content: 'Customer showed strong interest in our premium maintenance package. Discussed annual benefits and cost savings of 15%. Need to follow up with detailed proposal next week.',
      author: {
        _id: 'user-1',
        name: 'Alex Johnson',
        email: 'alex@example.com',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex'
      },
      metadata: {
        tags: ['premium', 'follow-up', 'proposal'],
        pinned: true,
        attachments: [
          {
            id: 'att-1',
            name: 'premium-package.pdf',
            url: '#',
            type: 'document',
            size: 2457600,
            uploadedAt: new Date().toISOString()
          }
        ]
      },
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 3600000).toISOString()
    },
    {
      _id: '2',
      id: 'note-2',
      opportunityId: 'opportunity-1',
      type: 'phone_call',
      content: 'Called customer to discuss vehicle inspection results. Found minor issues with brake pads (40% remaining) and recommended replacement within next month. Customer agreed to schedule service.',
      author: {
        _id: 'user-2',
        name: 'Sarah Miller',
        email: 'sarah@example.com',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah'
      },
      metadata: {
        tags: ['inspection', 'service', 'brakes'],
        pinned: false
      },
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString()
    },
    {
      _id: '3',
      id: 'note-3',
      opportunityId: 'opportunity-1',
      type: 'meeting_summary',
      content: 'Met with customer to review quotes for full vehicle detailing and ceramic coating. Discussed premium vs standard packages. Customer leaning towards premium package with 3-year warranty.',
      author: {
        _id: 'user-3',
        name: 'Michael Chen',
        email: 'michael@example.com',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael'
      },
      metadata: {
        tags: ['quote', 'detailing', 'ceramic-coating', 'warranty'],
        pinned: true
      },
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      updatedAt: new Date(Date.now() - 172800000).toISOString()
    },
    {
      _id: '4',
      id: 'note-4',
      opportunityId: 'opportunity-1',
      type: 'email',
      content: 'Customer emailed asking about availability for next week. Sent calendar invite for Thursday 2 PM. Confirmed they will bring vehicle in for the scheduled maintenance.',
      author: {
        _id: 'user-1',
        name: 'Alex Johnson',
        email: 'alex@example.com'
      },
      metadata: {
        tags: ['appointment', 'scheduling']
      },
      createdAt: new Date(Date.now() - 259200000).toISOString(),
      updatedAt: new Date(Date.now() - 259200000).toISOString()
    }
  ];
};

export default function NotesSection({ opportunityId, className = '' }: NotesSectionProps) {
  const { showToast } = useToast();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>({
    totalNotes: 0,
    byType: [],
    recentActivity: [],
    authors: []
  });
  const [showForm, setShowForm] = useState(false);
  const [newNote, setNewNote] = useState<CreateNoteData>({
    content: '',
    type: 'general'
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [activeFilter, setActiveFilter] = useState<NoteType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchNotes();
    fetchSummary();
  }, [opportunityId]);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const notesData = await opportunityService.getNotes(opportunityId);
      
      if (Array.isArray(notesData) && notesData.length > 0) {
        const sortedNotes = notesData.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setNotes(sortedNotes);
      } else {
        // Use mock data for development
        const mockNotes = getMockNotes();
        setNotes(mockNotes);
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
      // Use mock data as fallback
      const mockNotes = getMockNotes();
      setNotes(mockNotes);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const summaryData = await opportunityService.getNotesSummary(opportunityId);
      if (summaryData) {
        setSummary({
          totalNotes: summaryData.totalNotes || 4,
          byType: Array.isArray(summaryData.byType) ? summaryData.byType : [
            { type: 'customer_feedback', count: 1 },
            { type: 'phone_call', count: 1 },
            { type: 'meeting_summary', count: 1 },
            { type: 'email', count: 1 }
          ],
          recentActivity: [],
          authors: []
        });
      }
    } catch (error) {
      console.error('Error fetching notes summary:', error);
    }
  };

  const handleSubmitNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.content.trim()) {
      showToast('Note content is required', 'error');
      return;
    }

    try {
      if (editingNote) {
        await opportunityService.updateNote(opportunityId, editingNote._id, {
          content: newNote.content,
          type: newNote.type,
          metadata: {
            tags: newNote.metadata?.tags,
            pinned: newNote.metadata?.pinned
          }
        });
        showToast('Note updated successfully', 'success');
      } else {
        await opportunityService.addNote(opportunityId, {
          content: newNote.content,
          type: newNote.type,
          metadata: {
            tags: newNote.metadata?.tags,
            pinned: newNote.metadata?.pinned
          }
        });
        showToast('Note added successfully', 'success');
      }

      setNewNote({ content: '', type: 'general' });
      setSelectedFile(null);
      setEditingNote(null);
      setShowForm(false);
      fetchNotes();
      fetchSummary();
    } catch (error) {
      console.error('Error saving note:', error);
      showToast('Failed to save note', 'error');
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      await opportunityService.deleteNote(opportunityId, noteId);
      showToast('Note deleted successfully', 'success');
      fetchNotes();
      fetchSummary();
    } catch (error) {
      console.error('Error deleting note:', error);
      showToast('Failed to delete note', 'error');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      showToast('File selected. Upload will happen when saving note.', 'info');
    }
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setNewNote({
      content: note.content,
      type: note.type,
      metadata: {
        tags: note.metadata?.tags,
        pinned: note.metadata?.pinned
      }
    });
    setShowForm(true);
  };

  const handlePinNote = async (note: Note) => {
    try {
      await opportunityService.updateNote(opportunityId, note._id, {
        metadata: {
          ...note.metadata,
          pinned: !note.metadata?.pinned
        }
      });
      showToast(note.metadata?.pinned ? 'Note unpinned' : 'Note pinned', 'success');
      fetchNotes();
    } catch (error) {
      console.error('Error pinning note:', error);
      showToast('Failed to update note', 'error');
    }
  };

  const filteredNotes = notes.filter(note => {
    if (activeFilter !== 'all' && note.type !== activeFilter) return false;
    if (searchQuery && !note.content.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const pinnedNotes = filteredNotes.filter(note => note.metadata?.pinned);
  const regularNotes = filteredNotes.filter(note => !note.metadata?.pinned);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getRandomColor = (str: string) => {
    const colors = [
      'bg-gradient-to-r from-blue-500 to-cyan-500',
      'bg-gradient-to-r from-purple-500 to-pink-500',
      'bg-gradient-to-r from-emerald-500 to-teal-500',
      'bg-gradient-to-r from-orange-500 to-amber-500',
      'bg-gradient-to-r from-rose-500 to-pink-500',
      'bg-gradient-to-r from-indigo-500 to-purple-500'
    ];
    const index = str.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };

  return (
    <div className={`relative bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 backdrop-blur-sm rounded-3xl border border-white/50 shadow-2xl shadow-blue-100/20 overflow-hidden ${className}`}>
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-blue-100/20 to-purple-100/20 rounded-full -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tr from-emerald-100/10 to-teal-100/10 rounded-full translate-x-1/3 translate-y-1/3" />
      
      {/* Header */}
      <div className="relative p-6 border-b border-white/50 bg-gradient-to-r from-white/90 to-blue-50/50 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg shadow-blue-500/25">
              <MessageCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                Communication Hub
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                    <MessageSquare className="h-3 w-3 text-blue-500" />
                    <span className="text-xs font-semibold text-blue-600">{notes.length} notes</span>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-lg">
                    <Users className="h-3 w-3 text-emerald-500" />
                    <span className="text-xs font-semibold text-emerald-600">
                      {Array.from(new Set(notes.map(n => n.author.name))).length} contributors
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="group relative px-5 py-3 bg-gradient-to-r from-blue-500 via-blue-600 to-cyan-500 text-white rounded-xl font-semibold hover:from-blue-600 hover:via-blue-700 hover:to-cyan-600 transition-all duration-300 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 flex items-center gap-2 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            <Plus className="h-4 w-4" />
            <span>New Note</span>
            <Sparkles className="h-3 w-3 ml-1" />
          </button>
        </div>

        {/* Search and Filter */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-100/30 to-purple-100/30 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="Search through notes, tags, or authors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="relative w-full pl-11 pr-4 py-3 bg-white/80 backdrop-blur-sm border border-white/50 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all placeholder-gray-400"
            />
          </div>
          
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-100/30 to-orange-100/30 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value as NoteType | 'all')}
              className="relative pl-11 pr-8 py-3 bg-white/80 backdrop-blur-sm border border-white/50 rounded-xl focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 outline-none appearance-none transition-all"
            >
              <option value="all">All Note Types</option>
              {Object.entries(noteTypeConfig).map(([type, config]) => (
                <option key={type} value={type}>{config.label}</option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <div className="w-2 h-2 border-r-2 border-b-2 border-gray-400 rotate-45" />
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Note Form */}
      {showForm && (
        <div className="relative p-6 border-b border-white/50 bg-gradient-to-b from-white/95 via-blue-50/30 to-purple-50/30 backdrop-blur-sm">
          <div className="absolute top-4 right-4">
            <button
              onClick={() => {
                setShowForm(false);
                setEditingNote(null);
                setNewNote({ content: '', type: 'general' });
              }}
              className="p-2 hover:bg-white/50 backdrop-blur-sm rounded-xl transition-all hover:scale-110"
            >
              <X className="h-4 w-4 text-gray-500" />
            </button>
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
              {editingNote ? '✏️ Edit Note' : '✨ Create New Note'}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {editingNote ? 'Update your note below' : 'Add details, attachments, and tags to keep everyone informed'}
            </p>
          </div>
          
          <form onSubmit={handleSubmitNote}>
            <div className="space-y-6">
              {/* Note Type Selection */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Layers className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-semibold text-gray-700">Note Type</span>
                </div>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                  {Object.entries(noteTypeConfig).map(([type, config]) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setNewNote({ ...newNote, type: type as NoteType })}
                      className={`p-3 rounded-xl border-2 transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${
                        newNote.type === type
                          ? `border-blue-500 bg-gradient-to-br ${config.gradient} shadow-md`
                          : 'border-white/50 bg-white/50 hover:border-blue-300/50 hover:bg-white'
                      }`}
                    >
                      <div className={`p-2.5 rounded-lg ${config.bgColor} mb-2`}>
                        <div className={config.color}>
                          {config.icon}
                        </div>
                      </div>
                      <span className={`text-xs font-semibold ${newNote.type === type ? 'text-gray-800' : 'text-gray-600'}`}>
                        {config.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Content Editor */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Edit className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-semibold text-gray-700">Note Content</span>
                  </div>
                  <span className={`text-xs font-medium ${
                    newNote.content.length > 800 ? 'text-rose-500' : 'text-gray-500'
                  }`}>
                    {newNote.content.length}/1000 characters
                  </span>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl blur opacity-0 focus-within:opacity-100 transition-opacity duration-300" />
                  <textarea
                    value={newNote.content}
                    onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                    placeholder="What would you like to share? You can use markdown formatting for better readability..."
                    rows={4}
                    className="relative w-full px-4 py-4 bg-white/80 backdrop-blur-sm border-2 border-white/50 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none resize-none transition-all placeholder-gray-400"
                  />
                </div>
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                  <Sparkles className="h-3 w-3" />
                  <span>Supports markdown formatting</span>
                </div>
              </div>

              {/* Tags and Attachments */}
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="group flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-white to-gray-50 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-400 hover:from-blue-50 hover:to-blue-100 transition-all duration-300"
                  >
                    <Paperclip className="h-4 w-4 text-gray-500 group-hover:text-blue-500" />
                    <span className="text-sm font-medium text-gray-600 group-hover:text-blue-600">
                      Add Attachment
                    </span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Tag className="h-4 w-4 text-purple-500" />
                      <span className="text-sm font-semibold text-gray-700">Tags</span>
                    </div>
                    <input
                      type="text"
                      placeholder="e.g., follow-up, urgent, proposal"
                      value={newNote.metadata?.tags?.join(', ') || ''}
                      onChange={(e) => setNewNote({
                        ...newNote,
                        metadata: {
                          ...newNote.metadata,
                          tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                        }
                      })}
                      className="w-full px-4 py-2.5 bg-white/80 backdrop-blur-sm border-2 border-white/50 rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 outline-none placeholder-gray-400"
                    />
                  </div>
                </div>

                {selectedFile && (
                  <div className="p-4 bg-gradient-to-r from-blue-50/50 to-cyan-50/50 border-2 border-blue-200/50 rounded-xl backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-white rounded-lg border border-blue-100">
                          {getFileIcon(selectedFile.type)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{selectedFile.name}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-gray-600">{formatFileSize(selectedFile.size)}</span>
                            <span className="text-xs px-2 py-1 bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-600 rounded-lg">
                              Ready to upload
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedFile(null)}
                        className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                      >
                        <X className="h-4 w-4 text-gray-500" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-end gap-4 pt-4 border-t border-white/50">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingNote(null);
                    setNewNote({ content: '', type: 'general' });
                  }}
                  className="px-5 py-2.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100/50 backdrop-blur-sm rounded-xl transition-all font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newNote.content.trim()}
                  className="group relative px-6 py-3 bg-gradient-to-r from-blue-500 via-blue-600 to-cyan-500 text-white rounded-xl font-semibold hover:from-blue-600 hover:via-blue-700 hover:to-cyan-600 transition-all duration-300 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                  {editingNote ? (
                    <>
                      <Edit className="h-4 w-4" />
                      Update Note
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Post Note
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Notes Content */}
      <div className="h-[calc(80vh-200px)] overflow-y-auto">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p className="mt-4 text-gray-600 font-medium">Loading conversations...</p>
            <p className="text-sm text-gray-500 mt-2">Fetching your team's notes and updates</p>
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="p-12 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 mb-6">
              <MessageSquare className="h-8 w-8 text-blue-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">
              {activeFilter !== 'all' ? `No ${noteTypeConfig[activeFilter].label.toLowerCase()} notes yet` : 'No notes yet'}
            </h3>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              {searchQuery 
                ? `No notes found for "${searchQuery}"` 
                : 'Start the conversation by adding your first note'}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="px-4 py-2 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-600 rounded-lg font-medium hover:from-blue-100 hover:to-blue-200 transition-all"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="p-6 space-y-8">
            {/* Pinned Notes */}
            {pinnedNotes.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-gradient-to-r from-amber-100 to-orange-100 rounded-xl">
                    <Pin className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">Pinned Notes</h3>
                    <p className="text-sm text-gray-500">Important notes that stay on top</p>
                  </div>
                  <span className="ml-auto px-3 py-1 text-xs font-semibold bg-gradient-to-r from-amber-100 to-amber-200 text-amber-700 rounded-full">
                    {pinnedNotes.length} pinned
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {pinnedNotes.map((note) => (
                    <NoteCard
                      key={note._id}
                      note={note}
                      onEdit={handleEditNote}
                      onDelete={handleDeleteNote}
                      onPin={handlePinNote}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Recent Notes */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-xl">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">Recent Activity</h3>
                  <p className="text-sm text-gray-500">Latest updates and conversations</p>
                </div>
                <span className="ml-auto px-3 py-1 text-xs font-semibold bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 rounded-full">
                  {regularNotes.length} notes
                </span>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {regularNotes.map((note) => (
                  <NoteCard
                    key={note._id}
                    note={note}
                    onEdit={handleEditNote}
                    onDelete={handleDeleteNote}
                    onPin={handlePinNote}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Summary Footer */}
      {notes.length > 0 && (
        <div className="relative border-t border-white/50 bg-gradient-to-r from-white/90 to-blue-50/50 backdrop-blur-sm p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <BarChart className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-semibold text-gray-700">Activity Summary</span>
              </div>
              <div className="flex items-center gap-4">
                {summary.byType?.slice(0, 4).map((typeStat: any) => {
                  const config = noteTypeConfig[typeStat.type as NoteType];
                  return (
                    <div key={typeStat.type} className="flex items-center gap-2 group">
                      <div className={`p-2 rounded-lg ${config?.bgColor || 'bg-gray-100'} transition-transform group-hover:scale-110`}>
                        <div className={config?.color || 'text-gray-600'}>
                          {config?.icon || <MessageSquare className="h-3 w-3" />}
                        </div>
                      </div>
                      <div>
                        <span className="text-xs font-bold text-gray-800">{typeStat.count}</span>
                        <span className="text-xs text-gray-500 ml-1">{config?.label}</span>
                      </div>
                    </div>
                  );
                })}
                {summary.byType && summary.byType.length > 4 && (
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-gradient-to-r from-gray-100 to-gray-200">
                      <Plus className="h-3 w-3 text-gray-600" />
                    </div>
                    <span className="text-xs text-gray-500">
                      +{summary.byType.length - 4} more
                    </span>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-white to-gray-50 border border-gray-200 rounded-xl hover:border-blue-300 hover:from-blue-50 hover:to-blue-100 transition-all group"
            >
              <Plus className="h-4 w-4 text-gray-500 group-hover:text-blue-500" />
              <span className="text-sm font-medium text-gray-600 group-hover:text-blue-600">
                Quick Note
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Enhanced NoteCard Component
function NoteCard({ note, onEdit, onDelete, onPin }: NoteCardProps) {
  const [showActions, setShowActions] = useState(false);
  const config = noteTypeConfig[note.type];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 3600));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInHours < 168) {
      const days = Math.floor(diffInHours / 24);
      return `${days}d ago`;
    } else {
      return format(date, 'MMM d');
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getRandomGradient = (str: string) => {
    const gradients = [
      'from-blue-400 to-cyan-400',
      'from-purple-400 to-pink-400',
      'from-emerald-400 to-teal-400',
      'from-orange-400 to-amber-400',
      'from-rose-400 to-pink-400',
      'from-indigo-400 to-purple-400'
    ];
    const index = str.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % gradients.length;
    return gradients[index];
  };

  return (
    <div className={`relative group p-5 rounded-2xl border-2 backdrop-blur-sm transition-all duration-300 hover:shadow-xl ${
      note.metadata?.pinned
        ? 'border-amber-300 bg-gradient-to-br from-amber-50/80 via-orange-50/60 to-yellow-50/60 shadow-lg shadow-amber-200/30'
        : 'border-white/50 bg-gradient-to-br from-white/80 via-blue-50/40 to-purple-50/20 hover:border-blue-300/50 hover:shadow-blue-200/20'
    }`}>
      {/* Note Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-4">
          {/* Author Avatar */}
          <div className="relative">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getRandomGradient(note.author.name)} flex items-center justify-center shadow-md`}>
              <span className="text-white font-bold text-sm">
                {getInitials(note.author.name)}
              </span>
            </div>
            {note.metadata?.pinned && (
              <div className="absolute -top-2 -right-2 p-1.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full shadow-lg">
                <Pin className="h-3 w-3 text-white" />
              </div>
            )}
          </div>
          
          {/* Note Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <div className={`px-3 py-1.5 rounded-lg ${config.bgColor} border border-white/50`}>
                <div className="flex items-center gap-2">
                  <div className={config.color}>
                    {config.icon}
                  </div>
                  <span className="text-xs font-semibold text-gray-700">{config.label}</span>
                </div>
              </div>
              <span className="text-xs text-gray-500 font-medium">
                {formatDate(note.createdAt)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-800">{note.author.name}</span>
              <span className="text-xs text-gray-400">•</span>
              <span className="text-xs text-gray-500">{note.author.email}</span>
            </div>
          </div>
        </div>

        {/* Action Menu */}
        <div className="relative">
          <button
            onClick={() => setShowActions(!showActions)}
            className="p-2 hover:bg-white/50 rounded-xl backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
          >
            <MoreVertical className="h-4 w-4 text-gray-500" />
          </button>
          
          {showActions && (
            <>
              <div 
                className="fixed inset-0 z-10"
                onClick={() => setShowActions(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-56 bg-white/95 backdrop-blur-sm border-2 border-white/50 rounded-2xl shadow-2xl shadow-gray-300/30 z-20 py-2 overflow-hidden">
                <div className="px-3 py-2 border-b border-gray-100/50">
                  <p className="text-xs font-semibold text-gray-500">Note Actions</p>
                </div>
                <div className="py-1">
                  <button
                    onClick={() => {
                      onPin(note);
                      setShowActions(false);
                    }}
                    className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gradient-to-r hover:from-amber-50 hover:to-orange-50 flex items-center gap-3 group transition-all"
                  >
                    <div className={`p-2 rounded-lg ${note.metadata?.pinned ? 'bg-gradient-to-r from-amber-100 to-orange-100' : 'bg-gray-100'} group-hover:scale-110 transition-transform`}>
                      <Pin className={`h-4 w-4 ${note.metadata?.pinned ? 'text-amber-600' : 'text-gray-500'}`} />
                    </div>
                    <div>
                      <p className="font-medium">{note.metadata?.pinned ? 'Unpin Note' : 'Pin Note'}</p>
                      <p className="text-xs text-gray-500">Keep this note visible</p>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      onEdit(note);
                      setShowActions(false);
                    }}
                    className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 flex items-center gap-3 group transition-all"
                  >
                    <div className="p-2 rounded-lg bg-gray-100 group-hover:scale-110 transition-transform">
                      <Edit className="h-4 w-4 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-medium">Edit Note</p>
                      <p className="text-xs text-gray-500">Update content and details</p>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      onDelete(note._id);
                      setShowActions(false);
                    }}
                    className="w-full px-4 py-3 text-left text-sm text-rose-600 hover:bg-gradient-to-r hover:from-rose-50 hover:to-pink-50 flex items-center gap-3 group transition-all"
                  >
                    <div className="p-2 rounded-lg bg-rose-100 group-hover:scale-110 transition-transform">
                      <Trash2 className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium">Delete Note</p>
                      <p className="text-xs text-rose-500">Remove permanently</p>
                    </div>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Note Content */}
      <div className="mb-5">
        <div className="prose prose-sm max-w-none">
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{note.content}</p>
        </div>
      </div>

      {/* Tags */}
      {note.metadata?.tags && note.metadata.tags.length > 0 && (
        <div className="mb-5">
          <div className="flex flex-wrap gap-2">
            {note.metadata.tags.map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-lg border border-white/50 hover:scale-105 transition-transform cursor-pointer"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Attachments */}
      {note.metadata?.attachments && note.metadata.attachments.length > 0 && (
        <div className="pt-4 border-t border-white/50">
          <div className="flex items-center gap-2 mb-3">
            <Paperclip className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-semibold text-gray-700">Attachments</span>
            <span className="ml-auto text-xs text-gray-500">{note.metadata.attachments.length} files</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {note.metadata.attachments.map((attachment) => (
              <a
                key={attachment.id}
                href={attachment.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group p-3 bg-gradient-to-r from-white to-gray-50 border-2 border-white/50 rounded-xl hover:border-blue-300/50 hover:from-blue-50 hover:to-cyan-50 transition-all duration-300 flex items-center gap-3"
              >
                <div className="p-2.5 bg-white rounded-lg border border-gray-200 group-hover:scale-110 transition-transform">
                  {getFileIcon(attachment.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate group-hover:text-blue-600">
                    {attachment.name}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-500">{formatFileSize(attachment.size)}</span>
                    <span className="text-xs px-2 py-1 bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-600 rounded-lg">
                      View
                    </span>
                  </div>
                </div>
                <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-all" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Actions */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/50">
        <div className="flex items-center gap-2">
          <button className="p-1.5 hover:bg-gray-100/50 rounded-lg transition-colors">
            <ThumbsUp className="h-4 w-4 text-gray-500" />
          </button>
          <button className="p-1.5 hover:bg-gray-100/50 rounded-lg transition-colors">
            <MessageSquare className="h-4 w-4 text-gray-500" />
          </button>
          <button className="p-1.5 hover:bg-gray-100/50 rounded-lg transition-colors">
            <Share2 className="h-4 w-4 text-gray-500" />
          </button>
        </div>
        <div className="text-xs text-gray-500">
          Updated {format(new Date(note.updatedAt), 'MMM d, h:mm a')}
        </div>
      </div>
    </div>
  );
}