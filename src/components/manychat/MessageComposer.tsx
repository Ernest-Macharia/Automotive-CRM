'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Send, Paperclip, Image, Smile, Bold, Italic,
  List, Code, X, Loader2, CheckCircle,
  Type, FileText, Link as LinkIcon,
  AlertCircle, Tag
} from 'lucide-react';
import { manychatService, ManyChatMessage, SendMessageData } from '@/services/manychatService';
import { useToast } from '@/contexts/ToastContext';

interface MessageComposerProps {
  contactId?: string;
  phone?: string;
  email?: string;
  onSent?: (result: any) => void;
  onCancel?: () => void;
  broadcastMode?: boolean;
}

export default function MessageComposer({
  contactId,
  phone,
  email,
  onSent,
  onCancel,
  broadcastMode = false
}: MessageComposerProps) {
  const { showToast } = useToast();
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'text' | 'image' | 'file'>('text');
  const [sending, setSending] = useState(false);
  const [quickReplies, setQuickReplies] = useState<string[]>(['']);
  const [buttons, setButtons] = useState<Array<{type: string, caption: string, value: string}>>([]);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [scheduledAt, setScheduledAt] = useState<string>('');
  const [availableTags, setAvailableTags] = useState<any[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      const tags = await manychatService.getTags();
      setAvailableTags(tags);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const handleAddQuickReply = () => {
    setQuickReplies([...quickReplies, '']);
  };

  const handleRemoveQuickReply = (index: number) => {
    setQuickReplies(quickReplies.filter((_, i) => i !== index));
  };

  const handleQuickReplyChange = (index: number, value: string) => {
    const newReplies = [...quickReplies];
    newReplies[index] = value;
    setQuickReplies(newReplies.filter(reply => reply.trim() !== ''));
  };

  const handleAddButton = () => {
    setButtons([...buttons, { type: 'url', caption: '', value: '' }]);
  };

  const handleRemoveButton = (index: number) => {
    setButtons(buttons.filter((_, i) => i !== index));
  };

  const handleButtonChange = (index: number, field: string, value: string) => {
    const newButtons = [...buttons];
    newButtons[index] = { ...newButtons[index], [field]: value };
    setButtons(newButtons.filter(btn => btn.caption.trim() !== '' && btn.value.trim() !== ''));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if (!message.trim() && attachments.length === 0) {
      showToast('Please enter a message or attach a file', 'error');
      return;
    }

    try {
      setSending(true);

      // Build message object
      let messageData: ManyChatMessage;
      
      if (messageType === 'image' && attachments.length > 0) {
        // For images, we'd typically upload first and get URL
        messageData = {
          type: 'image',
          content: message,
          metadata: {
            imageUrl: URL.createObjectURL(attachments[0]) // This would be actual upload URL
          }
        };
      } else if (messageType === 'file' && attachments.length > 0) {
        messageData = {
          type: 'file',
          content: message || attachments[0].name,
          metadata: {
            fileName: attachments[0].name,
            fileSize: attachments[0].size,
            fileUrl: URL.createObjectURL(attachments[0]) // This would be actual upload URL
          }
        };
      } else {
        messageData = {
          type: 'text',
          content: message,
        };

        // Add quick replies if any
        const validReplies = quickReplies.filter(reply => reply.trim());
        if (validReplies.length > 0) {
          messageData.quickReplies = validReplies;
        }

        // Add buttons if any
        // const validButtons = buttons.filter(btn => btn.caption.trim() && btn.value.trim());
        // if (validButtons.length > 0) {
        //   messageData.buttons = validButtons;
        // }
      }

      // Build send data
      const sendData: SendMessageData = {
        message: messageData,
        tagIds: tagIds.length > 0 ? tagIds : undefined,
      };

      if (contactId) {
        sendData.subscriberId = contactId;
      } else if (phone) {
        sendData.phone = phone;
      } else if (email) {
        sendData.email = email;
      }

      if (scheduledAt) {
        sendData.scheduledAt = scheduledAt;
      }

      if (broadcastMode) {
        // Handle broadcast differently
        const result = await manychatService.broadcastMessage({
          tagIds,
          message: messageData,
          scheduledAt: scheduledAt || undefined,
        });
        
        showToast('Broadcast scheduled successfully', 'success');
        onSent?.(result);
      } else {
        const result = await manychatService.sendMessage(sendData);
        
        if (result.success) {
          showToast('Message sent successfully', 'success');
          setMessage('');
          setQuickReplies(['']);
          setButtons([]);
          setAttachments([]);
          onSent?.(result);
        } else {
          showToast(result.error || 'Failed to send message', 'error');
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      showToast('Failed to send message', 'error');
    } finally {
      setSending(false);
    }
  };

  const getFilePreview = (file: File) => {
    if (file.type.startsWith('image/')) {
      return URL.createObjectURL(file);
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">
            {broadcastMode ? 'Broadcast Message' : 'Send Message'}
          </h3>
          {onCancel && (
            <button
              onClick={onCancel}
              className="p-1 hover:bg-white rounded-lg transition-colors"
            >
              <X className="h-4 w-4 text-gray-600" />
            </button>
          )}
        </div>
        <p className="text-sm text-gray-600 mt-1">
          {broadcastMode 
            ? 'Send a message to multiple subscribers' 
            : contactId 
              ? 'Send a direct message' 
              : phone || email 
                ? `Send to ${phone || email}` 
                : 'Compose your message'
          }
        </p>
      </div>

      {/* Message Type Selector */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setMessageType('text')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-2 ${messageType === 'text' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
          >
            <Type className="h-4 w-4" />
            Text
          </button>
          <button
            onClick={() => setMessageType('image')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-2 ${messageType === 'image' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
          >
            <Image className="h-4 w-4" />
            Image
          </button>
          <button
            onClick={() => setMessageType('file')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-2 ${messageType === 'file' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
          >
            <FileText className="h-4 w-4" />
            File
          </button>
        </div>
      </div>

      {/* Main Editor */}
      <div className="p-4">
        {/* Message Input */}
        {messageType === 'text' ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message *
              </label>
              <div className="border border-gray-300 rounded-lg overflow-hidden">
                {/* Toolbar */}
                <div className="p-2 border-b border-gray-300 bg-gray-50 flex items-center gap-1">
                  <button className="p-1.5 hover:bg-gray-200 rounded" title="Bold">
                    <Bold className="h-4 w-4" />
                  </button>
                  <button className="p-1.5 hover:bg-gray-200 rounded" title="Italic">
                    <Italic className="h-4 w-4" />
                  </button>
                  <div className="w-px h-4 bg-gray-300"></div>
                  <button className="p-1.5 hover:bg-gray-200 rounded" title="List">
                    <List className="h-4 w-4" />
                  </button>
                  <button className="p-1.5 hover:bg-gray-200 rounded" title="Code">
                    <Code className="h-4 w-4" />
                  </button>
                  <div className="w-px h-4 bg-gray-300"></div>
                  <button className="p-1.5 hover:bg-gray-200 rounded" title="Emoji">
                    <Smile className="h-4 w-4" />
                  </button>
                  <button className="p-1.5 hover:bg-gray-200 rounded" title="Link">
                    <LinkIcon className="h-4 w-4" />
                  </button>
                </div>
                
                {/* Textarea */}
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message here..."
                  rows={4}
                  className="w-full p-3 focus:outline-none resize-none"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {message.length}/1000 characters
              </p>
            </div>

            {/* Quick Replies */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">
                  Quick Replies (Optional)
                </label>
                <button
                  type="button"
                  onClick={handleAddQuickReply}
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" />
                  Add Reply
                </button>
              </div>
              <div className="space-y-2">
                {quickReplies.map((reply, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={reply}
                      onChange={(e) => handleQuickReplyChange(index, e.target.value)}
                      placeholder={`Quick reply option ${index + 1}`}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {quickReplies.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveQuickReply(index)}
                        className="p-2 hover:bg-red-50 rounded-lg text-red-500"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Buttons */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">
                  Buttons (Optional)
                </label>
                <button
                  type="button"
                  onClick={handleAddButton}
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" />
                  Add Button
                </button>
              </div>
              <div className="space-y-2">
                {buttons.map((button, index) => (
                  <div key={index} className="grid grid-cols-3 gap-2">
                    <select
                      value={button.type}
                      onChange={(e) => handleButtonChange(index, 'type', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="url">URL</option>
                      <option value="phone">Phone</option>
                      <option value="quick_reply">Quick Reply</option>
                      <option value="postback">Postback</option>
                    </select>
                    <input
                      type="text"
                      value={button.caption}
                      onChange={(e) => handleButtonChange(index, 'caption', e.target.value)}
                      placeholder="Button text"
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={button.value}
                        onChange={(e) => handleButtonChange(index, 'value', e.target.value)}
                        placeholder={button.type === 'url' ? 'https://...' : 'Value'}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveButton(index)}
                        className="p-2 hover:bg-red-50 rounded-lg text-red-500"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {messageType === 'image' ? 'Image' : 'File'} Upload
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                accept={messageType === 'image' ? 'image/*' : '*/*'}
                className="hidden"
                multiple={messageType !== 'image'}
              />
              
              {attachments.length === 0 ? (
                <div>
                  <Paperclip className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600 mb-2">
                    Drag & drop your {messageType === 'image' ? 'image' : 'file'} here, or
                  </p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Browse Files
                  </button>
                  <p className="text-xs text-gray-500 mt-2">
                    {messageType === 'image' 
                      ? 'Supports JPG, PNG, GIF up to 5MB' 
                      : 'Max file size: 10MB'
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {attachments.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        {messageType === 'image' && getFilePreview(file) ? (
                          <img
                            src={getFilePreview(file) || ''}
                            alt={file.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                        ) : (
                          <FileText className="h-8 w-8 text-gray-400" />
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900">{file.name}</p>
                          <p className="text-xs text-gray-500">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        className="p-1 hover:bg-red-50 rounded text-red-500"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    + Add more files
                  </button>
                </div>
              )}
            </div>

            {/* Caption for images */}
            {messageType === 'image' && attachments.length > 0 && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Caption (Optional)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Add a caption to your image..."
                  rows={2}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}
          </div>
        )}

        {/* Tags */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Add Tags (Optional)
          </label>
          <div className="flex flex-wrap gap-2">
            {availableTags.map(tag => (
              <button
                key={tag.id}
                type="button"
                onClick={() => setTagIds(prev => 
                  prev.includes(tag.id) 
                    ? prev.filter(id => id !== tag.id)
                    : [...prev, tag.id]
                )}
                className={`px-3 py-1 text-sm rounded-full flex items-center gap-1 ${tagIds.includes(tag.id) ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
              >
                <Tag className="h-3 w-3" />
                {tag.name}
                {tagIds.includes(tag.id) && <CheckCircle className="h-3 w-3" />}
              </button>
            ))}
          </div>
        </div>

        {/* Scheduling */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Scheduling (Optional)
          </label>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            min={new Date().toISOString().slice(0, 16)}
          />
          <p className="text-xs text-gray-500 mt-1">
            Leave empty to send immediately
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-100 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {broadcastMode && (
              <div className="flex items-center gap-1 text-amber-600">
                <AlertCircle className="h-4 w-4" />
                <span>This will be sent to multiple subscribers</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {onCancel && (
              <button
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            )}
            <button
              onClick={handleSend}
              disabled={sending || (!message.trim() && attachments.length === 0)}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {broadcastMode ? 'Schedule Broadcast' : 'Send Message'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Add missing Plus import
import { Plus } from 'lucide-react';