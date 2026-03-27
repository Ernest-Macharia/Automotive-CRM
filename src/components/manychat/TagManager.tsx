'use client';

import { useState, useEffect } from 'react';
import { Tag, Plus, Users, Loader2, Search } from 'lucide-react';
import { manychatService, ManyChatTag } from '@/services/manychatService';
import { useToast } from '@/contexts/ToastContext';

export default function TagManager() {
  const { showToast } = useToast();
  const [tags, setTags] = useState<ManyChatTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [tagName, setTagName] = useState('');
  const [tagDescription, setTagDescription] = useState('');

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      setLoading(true);
      const data = await manychatService.getTags();
      setTags(data);
    } catch (error) {
      console.error('Error fetching tags:', error);
      showToast('Failed to load tags', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTag = async (tagData: { name: string; description?: string; color?: string }) => {
    try {
      await manychatService.createTag(tagData);
      showToast('Tag created successfully', 'success');
      setShowCreateModal(false);
      fetchTags();
    } catch (error) {
      console.error('Error creating tag:', error);
      showToast('Failed to create tag', 'error');
    }
  };

  const filteredTags = tags.filter(tag =>
    tag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tag.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Tags</h3>
            <p className="text-sm text-gray-600">Organize contacts with tags</p>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search tags..."
                className="pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              New Tag
            </button>
          </div>
        </div>
      </div>

      {/* Tags Grid */}
      {loading ? (
        <div className="p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">Loading tags...</p>
        </div>
      ) : filteredTags.length === 0 ? (
        <div className="p-8 text-center">
          <Tag className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <h4 className="text-gray-700 font-medium mb-2">No tags found</h4>
          <p className="text-gray-500 max-w-md mx-auto mb-4">
            {searchTerm
              ? 'Try adjusting your search.'
              : 'Create your first tag to organize contacts.'}
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create First Tag
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
          {filteredTags.map(tag => (
            <div
              key={tag.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${manychatService.getTagColor(tag)}`}>
                    <Tag className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{tag.name}</h4>
                    {tag.description && (
                      <p className="text-sm text-gray-600 mt-1">{tag.description}</p>
                    )}
                  </div>
                </div>
                
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1 text-gray-600">
                  <Users className="h-4 w-4" />
                  <span>{tag.subscribersCount || 0} subscribers</span>
                </div>
                <span className="text-gray-500">
                  {manychatService.formatDate(tag.createdAt)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-white rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Tag</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tag Name *
                </label>
                <input
                  type="text"
                  value={tagName}
                  onChange={(e) => setTagName(e.target.value)}
                  placeholder="Enter tag name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={tagDescription}
                  onChange={(e) => setTagDescription(e.target.value)}
                  placeholder="Optional description"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setTagName('');
                  setTagDescription('');
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const name = tagName.trim();
                  if (!name) {
                    showToast('Tag name is required', 'error');
                    return;
                  }

                  await handleCreateTag({
                    name,
                    description: tagDescription.trim() || undefined,
                  });
                  setTagName('');
                  setTagDescription('');
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Tag
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
