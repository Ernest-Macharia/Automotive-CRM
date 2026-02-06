'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  MessageSquare, Eye, EyeOff, Plus, 
  Edit2, Trash2, Loader2, User, 
  Calendar, Filter, Search, 
  MessageCircle, Eye as EyeIcon, AlertTriangle, 
  Info, Pin, Tag, Sparkles,
  ChevronDown, ChevronUp,
  RefreshCw
} from 'lucide-react';
import { WorkOrder, TechnicianNote } from '@/services/workOrderService';
import { workOrderService } from '@/services/workOrderService';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { debounce } from 'lodash';

interface TechnicianNotesTabProps {
  workOrder: WorkOrder;
  isTransitioning: boolean;
  onAction: (action: () => Promise<void>) => Promise<void>;
}

interface NoteFormData {
  content: string;
  category: 'customer_communication' | 'observation' | 'issue' | 'other';
  isInternal: boolean;
  tags: string[];
}

export default function TechnicianNotesTab({ 
  workOrder, 
  isTransitioning, 
  onAction 
}: TechnicianNotesTabProps) {
  const [notes, setNotes] = useState<TechnicianNote[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<TechnicianNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showInternal, setShowInternal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedNote, setExpandedNote] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const [formData, setFormData] = useState<NoteFormData>({
    content: '',
    category: 'observation',
    isInternal: false,
    tags: []
  });

  // Debounced search
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      filterNotes(query, selectedCategory);
    }, 300),
    [notes, selectedCategory, showInternal]
  );

  useEffect(() => {
    fetchNotes();
  }, [workOrder._id]);

  useEffect(() => {
    debouncedSearch(searchQuery);
  }, [searchQuery, debouncedSearch]);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const fetchedNotes = await workOrderService.getTechnicianNotes(workOrder._id, true);
      setNotes(fetchedNotes);
      setFilteredNotes(fetchedNotes);
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterNotes = (query: string, category: string) => {
    let filtered = notes;
    
    // Filter by internal visibility
    if (!showInternal) {
      filtered = filtered.filter(note => !note.isInternal);
    }
    
    // Filter by category
    if (category !== 'all') {
      filtered = filtered.filter(note => note.category === category);
    }
    
    // Filter by search query
    if (query) {
      const q = query.toLowerCase();
      filtered = filtered.filter(note => 
        note.content.toLowerCase().includes(q) ||
        note.createdBy.firstName.toLowerCase().includes(q) ||
        note.createdBy.lastName.toLowerCase().includes(q) ||
        note.category.toLowerCase().includes(q)
      );
    }
    
    setFilteredNotes(filtered);
  };

  const handleAddNote = async () => {
    if (!formData.content.trim()) return;
    
    setSaving(true);
    try {
      await onAction(async () => {
        await workOrderService.addTechnicianNote(workOrder._id, formData);
        await fetchNotes();
        resetForm();
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;
    
    const noteIndex = notes.findIndex(note => note._id === noteId);
    if (noteIndex === -1) return;
    
    setLoading(true);
    try {
      await onAction(async () => {
        await workOrderService.deleteTechnicianNote(workOrder._id, noteIndex);
        await fetchNotes();
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      content: '',
      category: 'observation',
      isInternal: false,
      tags: []
    });
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return format(date, 'MMM dd, yyyy');
  };

  const getCategoryConfig = (category: string) => {
    const configs = {
      customer_communication: {
        icon: <MessageCircle className="h-4 w-4" />,
        label: 'Communication',
        color: 'bg-blue-500/10 text-blue-600 border-blue-200',
        lightColor: 'bg-blue-50'
      },
      observation: {
        icon: <EyeIcon className="h-4 w-4" />,
        label: 'Observation',
        color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
        lightColor: 'bg-emerald-50'
      },
      issue: {
        icon: <AlertTriangle className="h-4 w-4" />,
        label: 'Issue',
        color: 'bg-red-500/10 text-red-600 border-red-200',
        lightColor: 'bg-red-50'
      },
      other: {
        icon: <Info className="h-4 w-4" />,
        label: 'Other',
        color: 'bg-gray-500/10 text-gray-600 border-gray-200',
        lightColor: 'bg-gray-50'
      }
    };
    return configs[category as keyof typeof configs] || configs.other;
  };

  const categories = [
    { value: 'all', label: 'All Notes', count: notes.length },
    { value: 'customer_communication', label: 'Communication', count: notes.filter(n => n.category === 'customer_communication').length },
    { value: 'observation', label: 'Observations', count: notes.filter(n => n.category === 'observation').length },
    { value: 'issue', label: 'Issues', count: notes.filter(n => n.category === 'issue').length },
  ];

  const stats = {
    total: notes.length,
    internal: notes.filter(n => n.isInternal).length,
    today: notes.filter(n => {
      const noteDate = new Date(n.createdAt);
      const today = new Date();
      return noteDate.toDateString() === today.toDateString();
    }).length,
    issues: notes.filter(n => n.category === 'issue').length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Technician Notes</h2>
          <p className="text-gray-600">Collaborative documentation and observations</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-500">
            <span className="font-medium text-gray-900">{stats.total}</span> notes
          </div>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            {isCollapsed ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                <div className="text-2xl font-bold text-blue-600 mb-1">{stats.total}</div>
                <div className="text-sm text-blue-700">Total Notes</div>
              </div>
              <div className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-4">
                <div className="text-2xl font-bold text-emerald-600 mb-1">{stats.today}</div>
                <div className="text-sm text-emerald-700">Today</div>
              </div>
              <div className="bg-gradient-to-br from-red-50 to-rose-50 border border-red-200 rounded-xl p-4">
                <div className="text-2xl font-bold text-red-600 mb-1">{stats.issues}</div>
                <div className="text-sm text-red-700">Issues</div>
              </div>
              <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-4">
                <div className="text-2xl font-bold text-amber-600 mb-1">{stats.internal}</div>
                <div className="text-sm text-amber-700">Internal</div>
              </div>
            </div>

            {/* Add Note Form */}
            <div className="bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-2xl p-6 mb-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Sparkles className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Add New Note</h3>
              </div>
              
              <div className="space-y-4">
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  placeholder="Document observations, issues, or communications..."
                  className="w-full h-32 px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400"
                  disabled={saving}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value as any})}
                      className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={saving}
                    >
                      <option value="observation">Observation</option>
                      <option value="customer_communication">Customer Communication</option>
                      <option value="issue">Issue</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center space-x-3 p-3 border-2 border-gray-300 rounded-xl hover:border-blue-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isInternal}
                        onChange={(e) => setFormData({...formData, isInternal: e.target.checked})}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        disabled={saving}
                      />
                      <div>
                        <div className="font-medium text-gray-900">Internal Note</div>
                        <div className="text-sm text-gray-500">Visible to team only</div>
                      </div>
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    </label>
                  </div>
                  
                  <div className="flex items-end">
                    <button
                      onClick={handleAddNote}
                      disabled={!formData.content.trim() || saving || isTransitioning}
                      className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {saving ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <>
                          <Plus className="h-5 w-5" />
                          Add Note
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes..."
            className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div className="flex gap-3">
          <div className="flex border-2 border-gray-300 rounded-xl overflow-hidden">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => {
                  setSelectedCategory(cat.value);
                  filterNotes(searchQuery, cat.value);
                }}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  selectedCategory === cat.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {cat.label}
                {cat.count > 0 && (
                  <span className={`ml-2 px-1.5 py-0.5 text-xs rounded-full ${
                    selectedCategory === cat.value
                      ? 'bg-blue-500/20 text-blue-100'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {cat.count}
                  </span>
                )}
              </button>
            ))}
          </div>
          
          <button
            onClick={() => setShowInternal(!showInternal)}
            className={`px-4 py-2.5 border-2 rounded-xl flex items-center gap-2 ${
              showInternal
                ? 'bg-amber-50 border-amber-300 text-amber-700'
                : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
            }`}
          >
            {showInternal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showInternal ? 'Hide Internal' : 'Show Internal'}
          </button>
        </div>
      </div>

      {/* Notes List */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading notes...</p>
          </div>
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-2xl">
          <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h4 className="text-xl font-semibold text-gray-900 mb-2">No Notes Found</h4>
          <p className="text-gray-600 mb-6">
            {searchQuery ? 'Try a different search term' : 'Add your first note above'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNotes.map((note) => {
            const config = getCategoryConfig(note.category);
            const isExpanded = expandedNote === note._id;
            
            return (
              <motion.div
                key={note._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`border-2 rounded-2xl overflow-hidden ${
                  note.isInternal 
                    ? 'border-amber-200 bg-gradient-to-br from-amber-50/50 to-yellow-50/50' 
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div 
                  className="p-5 cursor-pointer hover:bg-gray-50/50 transition-colors"
                  onClick={() => setExpandedNote(isExpanded ? null : note._id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${config.color}`}>
                        {config.icon}
                        <span className="font-medium">{config.label}</span>
                      </div>
                      
                      {note.isInternal && (
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 text-sm">
                          <EyeOff className="h-3 w-3" />
                          Internal
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNote(note._id);
                        }}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        title="Delete note"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <div className="text-gray-400">
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </div>
                  </div>
                  
                  <p className={`text-gray-800 mb-4 ${!isExpanded ? 'line-clamp-2' : ''}`}>
                    {note.content}
                  </p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3" />
                        <span>
                          {note.createdBy.firstName} {note.createdBy.lastName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        <span>{formatRelativeTime(note.createdAt)}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Pin className="h-3 w-3 text-gray-400" />
                      <span className="text-xs">{note._id.slice(-6)}</span>
                    </div>
                  </div>
                </div>
                
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="px-5 pb-5"
                    >
                      <div className="pt-4 border-t border-gray-100">
                        <div className="text-sm text-gray-600">
                          Full note content:
                        </div>
                        <p className="mt-2 text-gray-800 whitespace-pre-wrap">
                          {note.content}
                        </p>
                        <div className="mt-4 text-xs text-gray-500">
                          Note ID: {note._id}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Summary */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-gray-900">Notes Summary</h4>
            <p className="text-sm text-gray-600">
              Showing {filteredNotes.length} of {notes.length} notes
            </p>
          </div>
          <button
            onClick={fetchNotes}
            disabled={loading}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
}