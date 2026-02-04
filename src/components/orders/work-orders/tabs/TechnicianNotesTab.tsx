import { useState, useEffect } from 'react';
import { 
  MessageSquare, Eye, EyeOff, FileText, 
  AlertTriangle, Info, Plus, Edit2, 
  Trash2, Loader2, User, Calendar,
  MessageCircle, CheckCircle, Clock
} from 'lucide-react';
import { WorkOrder, TechnicianNote } from '@/services/workOrderService';
import { workOrderService } from '@/services/workOrderService';
import { format } from 'date-fns';

interface TechnicianNotesTabProps {
  workOrder: WorkOrder;
  isTransitioning: boolean;
  onAction: (action: () => Promise<void>) => Promise<void>;
}

interface NoteFormData {
  content: string;
  category: 'customer_communication' | 'observation' | 'issue' | 'other';
  isInternal: boolean;
}

export default function TechnicianNotesTab({ 
  workOrder, 
  isTransitioning, 
  onAction 
}: TechnicianNotesTabProps) {
  const [notes, setNotes] = useState<TechnicianNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingNote, setAddingNote] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [showInternalNotes, setShowInternalNotes] = useState(false);
  
  const [formData, setFormData] = useState<NoteFormData>({
    content: '',
    category: 'observation',
    isInternal: false
  });

  // Fetch notes
  useEffect(() => {
    fetchNotes();
  }, [workOrder._id]);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const fetchedNotes = await workOrderService.getTechnicianNotes(workOrder._id, true);
      setNotes(fetchedNotes);
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!formData.content.trim()) return;
    
    setAddingNote(true);
    try {
      await onAction(async () => {
        await workOrderService.addTechnicianNote(workOrder._id, formData);
        await fetchNotes();
        resetForm();
      });
    } finally {
      setAddingNote(false);
    }
  };

  const handleUpdateNote = async (noteId: string) => {
    if (!formData.content.trim()) return;
    
    setAddingNote(true);
    try {
      await onAction(async () => {
        // Find the note index
        const noteIndex = notes.findIndex(note => note._id === noteId);
        if (noteIndex !== -1) {
          await workOrderService.updateTechnicianNote(workOrder._id, noteIndex, {
            content: formData.content,
            category: formData.category,
            isInternal: formData.isInternal
          });
          await fetchNotes();
          setEditingNoteId(null);
          resetForm();
        }
      });
    } finally {
      setAddingNote(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    const noteIndex = notes.findIndex(note => note._id === noteId);
    if (noteIndex === -1) return;
    
    if (!confirm('Are you sure you want to delete this note?')) return;
    
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

  const startEditingNote = (note: TechnicianNote) => {
    setEditingNoteId(note._id);
    setFormData({
      content: note.content,
      category: note.category,
      isInternal: note.isInternal
    });
  };

  const resetForm = () => {
    setFormData({
      content: '',
      category: 'observation',
      isInternal: false
    });
    setEditingNoteId(null);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'customer_communication':
        return <MessageCircle className="h-4 w-4" />;
      case 'observation':
        return <Eye className="h-4 w-4" />;
      case 'issue':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'customer_communication':
        return 'bg-blue-100 text-blue-800';
      case 'observation':
        return 'bg-green-100 text-green-800';
      case 'issue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryLabel = (category: string) => {
    return workOrderService.getNoteCategoryLabel(category);
  };

  const filteredNotes = showInternalNotes 
    ? notes 
    : notes.filter(note => !note.isInternal);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Technician Notes</h3>
            <p className="text-sm text-gray-600">
              Document observations, issues, and communications
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowInternalNotes(!showInternalNotes)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
            >
              {showInternalNotes ? (
                <>
                  <EyeOff className="h-4 w-4" />
                  Hide Internal
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4" />
                  Show Internal
                </>
              )}
            </button>
          </div>
        </div>

        {/* Add/Edit Note Form */}
        <div className="mb-8 bg-gray-50 rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="h-5 w-5 text-gray-600" />
            <h4 className="font-medium text-gray-900">
              {editingNoteId ? 'Edit Note' : 'Add New Note'}
            </h4>
          </div>
          
          <div className="space-y-4">
            <div>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({...formData, content: e.target.value})}
                placeholder="Enter note details..."
                className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isTransitioning || addingNote}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isTransitioning || addingNote}
                >
                  <option value="customer_communication">Customer Communication</option>
                  <option value="observation">Observation</option>
                  <option value="issue">Issue</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.isInternal}
                    onChange={(e) => setFormData({...formData, isInternal: e.target.checked})}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    disabled={isTransitioning || addingNote}
                  />
                  <span className="text-sm text-gray-700">Internal Note (Not visible to customer)</span>
                </label>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={editingNoteId ? () => handleUpdateNote(editingNoteId) : handleAddNote}
                disabled={!formData.content.trim() || isTransitioning || addingNote}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
              >
                {addingNote ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                {editingNoteId ? 'Update Note' : 'Add Note'}
              </button>
              
              {editingNoteId && (
                <button
                  onClick={resetForm}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Notes List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-900">
              All Notes ({filteredNotes.length})
            </h4>
            <div className="text-sm text-gray-600">
              Showing {filteredNotes.length} of {notes.length} notes
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
              <p className="mt-2 text-gray-600">Loading notes...</p>
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl">
              <MessageSquare className="h-12 w-12 mx-auto text-gray-400" />
              <p className="mt-2 text-gray-600">No notes yet</p>
              <p className="text-sm text-gray-500">Add your first note above</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredNotes.map((note) => (
                <div 
                  key={note._id}
                  className={`border rounded-xl p-5 ${note.isInternal ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-gray-200'}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(note.category)}`}>
                        {getCategoryIcon(note.category)}
                        {getCategoryLabel(note.category)}
                      </div>
                      
                      {note.isInternal && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                          <EyeOff className="h-3 w-3" />
                          Internal
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startEditingNote(note)}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="Edit note"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteNote(note._id)}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        title="Delete note"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-gray-800 mb-4 whitespace-pre-wrap">
                    {note.content}
                  </p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500 border-t border-gray-100 pt-3">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>
                          {note.createdBy.firstName} {note.createdBy.lastName}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(note.createdAt)}</span>
                      </div>
                    </div>
                    
                    {/* {note.createdAt !== note.updatedAt && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>Edited</span>
                      </div>
                    )} */}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h4 className="font-medium text-gray-900 mb-4">Notes Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <div className="text-sm text-blue-700 mb-1">Total Notes</div>
              <div className="text-2xl font-bold text-blue-800">{notes.length}</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
              <div className="text-sm text-green-700 mb-1">Observations</div>
              <div className="text-2xl font-bold text-green-800">
                {notes.filter(n => n.category === 'observation').length}
              </div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg border border-red-100">
              <div className="text-sm text-red-700 mb-1">Issues</div>
              <div className="text-2xl font-bold text-red-800">
                {notes.filter(n => n.category === 'issue').length}
              </div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
              <div className="text-sm text-yellow-700 mb-1">Internal</div>
              <div className="text-2xl font-bold text-yellow-800">
                {notes.filter(n => n.isInternal).length}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}