'use client';

import { useState } from 'react';
import { User, Calendar, Edit, Trash2, MoreVertical, Check, X } from 'lucide-react';
import { FeedbackComment } from '@/services/feedbackService';
import { useToast } from '@/contexts/ToastContext';

interface FeedbackCommentProps {
  comment: FeedbackComment;
  isInternal?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  onEdit?: (id: string, content: string) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export default function FeedbackCommentComponent({
  comment,
  isInternal = false,
  canEdit = false,
  canDelete = false,
  onEdit,
  onDelete
}: FeedbackCommentProps) {
  const { showToast } = useToast();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(comment.content);
  const [showMenu, setShowMenu] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleEdit = async () => {
    if (!editedContent.trim()) {
      showToast('Comment cannot be empty', 'error');
      return;
    }

    try {
      setLoading(true);
      if (onEdit) {
        await onEdit(comment._id!, editedContent);
      }
      setIsEditing(false);
      showToast('Comment updated', 'success');
    } catch (error) {
      console.error('Error updating comment:', error);
      showToast('Failed to update comment', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      setLoading(true);
      if (onDelete) {
        await onDelete(comment._id!);
      }
      showToast('Comment deleted', 'success');
    } catch (error) {
      console.error('Error deleting comment:', error);
      showToast('Failed to delete comment', 'error');
    } finally {
      setLoading(false);
      setShowMenu(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={`p-4 rounded-xl ${
      isInternal 
        ? 'bg-purple-50 border border-purple-100' 
        : 'bg-gray-50 border border-gray-100'
    } ${loading ? 'opacity-50' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold ${
            isInternal
              ? 'bg-gradient-to-br from-purple-500 to-purple-700'
              : 'bg-gradient-to-br from-blue-500 to-purple-600'
          }`}>
            {comment.userName?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-800">
                {comment.userName || 'Anonymous'}
              </span>
              {isInternal && (
                <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                  Internal
                </span>
              )}
              {comment.userEmail && (
                <span className="text-sm text-gray-500">{comment.userEmail}</span>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Calendar className="h-3 w-3" />
              {formatDate(comment.createdAt || '')}
              {comment.updatedAt !== comment.createdAt && (
                <span className="text-gray-400"> (edited)</span>
              )}
            </div>
          </div>
        </div>

        {(canEdit || canDelete) && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 hover:bg-white rounded"
            >
              <MoreVertical className="h-4 w-4 text-gray-500" />
            </button>
            
            {showMenu && (
              <div className="absolute right-0 mt-1 w-32 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                {canEdit && (
                  <button
                    onClick={() => {
                      setIsEditing(true);
                      setShowMenu(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <Edit className="h-3 w-3" />
                    Edit
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={handleDelete}
                    className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-3">
          <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-200 resize-none"
            disabled={loading}
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setIsEditing(false);
                setEditedContent(comment.content);
              }}
              className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
              disabled={loading}
            >
              <X className="h-4 w-4 inline mr-1" />
              Cancel
            </button>
            <button
              onClick={handleEdit}
              disabled={loading || !editedContent.trim()}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              {loading ? (
                'Saving...'
              ) : (
                <>
                  <Check className="h-4 w-4 inline mr-1" />
                  Save
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <p className="text-gray-700 whitespace-pre-line">{comment.content}</p>
      )}
    </div>
  );
}