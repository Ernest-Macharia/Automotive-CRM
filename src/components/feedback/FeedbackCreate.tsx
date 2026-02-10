'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  MessageSquare, ArrowLeft, Save, Upload, Camera,
  X, Loader2, AlertCircle, Check, Tag, User,
  Mail, Phone, Globe, Eye, EyeOff
} from 'lucide-react';
import { feedbackService, CreateFeedbackData, CreateFeedbackWithScreenshotData } from '@/services/feedbackService';
import { useToast } from '@/contexts/ToastContext';

export default function FeedbackCreate() {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sections, setSections] = useState<any[]>([]);
  const [types, setTypes] = useState<any[]>([]);
  const [showContactInfo, setShowContactInfo] = useState(false);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    section: 'general',
    type: 'improvement',
    title: '',
    description: '',
    suggestion: '',
    priority: 'medium' as const,
    tags: [] as string[],
    currentUrl: typeof window !== 'undefined' ? window.location.href : '',
    isAnonymous: false,
    allowContact: true,
    browserInfo: '',
    deviceInfo: '',
    // Contact info
    userName: '',
    userEmail: '',
    userPhone: '',
    // Tag input
    newTag: '',
  });

  useEffect(() => {
    fetchMetadata();
    detectBrowserInfo();
  }, []);

  const fetchMetadata = async () => {
    try {
      const [sectionsData, typesData] = await Promise.all([
        feedbackService.getSections(),
        feedbackService.getTypes(),
      ]);
      
      setSections(sectionsData);
      setTypes(typesData);
    } catch (error) {
      console.error('Error loading metadata:', error);
    } finally {
      setLoading(false);
    }
  };

  const detectBrowserInfo = () => {
    if (typeof window !== 'undefined') {
      const userAgent = window.navigator.userAgent;
      const platform = window.navigator.platform;
      
      setFormData(prev => ({
        ...prev,
        browserInfo: userAgent,
        deviceInfo: platform,
      }));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue,
    }));
  };

  const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && formData.newTag.trim()) {
      e.preventDefault();
      if (!formData.tags.includes(formData.newTag.trim())) {
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, prev.newTag.trim()],
          newTag: '',
        }));
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove),
    }));
  };

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        showToast('File size must be less than 5MB', 'error');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        showToast('Please select an image file', 'error');
        return;
      }
      
      setScreenshotFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeScreenshot = () => {
    setScreenshotFile(null);
    setScreenshotPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateForm = (): boolean => {
    const errors: string[] = [];
    
    if (!formData.title.trim()) errors.push('Title is required');
    if (!formData.description.trim()) errors.push('Description is required');
    if (!formData.section) errors.push('Section is required');
    if (!formData.type) errors.push('Type is required');
    
    if (errors.length > 0) {
      showToast(errors.join(', '), 'error');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setSubmitting(true);
      
      if (screenshotFile) {
        // Submit with screenshot
        const formDataToSend = new FormData();
        formDataToSend.append('section', formData.section);
        formDataToSend.append('type', formData.type);
        formDataToSend.append('title', formData.title);
        formDataToSend.append('description', formData.description);
        if (formData.suggestion) formDataToSend.append('suggestion', formData.suggestion);
        if (formData.userName) formDataToSend.append('userName', formData.userName);
        if (formData.userEmail) formDataToSend.append('userEmail', formData.userEmail);
        if (formData.userPhone) formDataToSend.append('userPhone', formData.userPhone);
        if (formData.currentUrl) formDataToSend.append('currentUrl', formData.currentUrl);
        formDataToSend.append('screenshot', screenshotFile);
        
        await feedbackService.createFeedbackWithScreenshot(formDataToSend);
      } else {
        // Submit without screenshot
        const feedbackData: CreateFeedbackData = {
          section: formData.section,
          type: formData.type,
          title: formData.title,
          description: formData.description,
          suggestion: formData.suggestion || undefined,
          priority: formData.priority,
          tags: formData.tags.length > 0 ? formData.tags : undefined,
          currentUrl: formData.currentUrl || undefined,
          userName: formData.userName || undefined,
          userEmail: formData.userEmail || undefined,
          userPhone: formData.userPhone || undefined,
          isAnonymous: formData.isAnonymous,
          allowContact: formData.allowContact,
          browserInfo: formData.browserInfo || undefined,
          deviceInfo: formData.deviceInfo || undefined,
        };
        
        await feedbackService.createFeedback(feedbackData);
      }
      
      showToast('Feedback submitted successfully! Thank you for your input.', 'success');
      router.push('/feedback');
      
    } catch (error: any) {
      console.error('Error submitting feedback:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      showToast(`Failed to submit feedback: ${errorMessage}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-white/20 rounded-xl transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-white" />
              </button>
              <div className="p-2 bg-white/20 rounded-xl">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Submit Feedback</h1>
                <p className="text-blue-100 text-sm">Help us improve the system</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Form */}
      <div className="max-w-4xl mx-auto p-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Tell us what's on your mind</h2>
            
            {/* Type & Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What type of feedback is this? *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {types.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, type: type.value }))}
                      className={`px-3 py-3 rounded-xl flex flex-col items-center justify-center gap-2 border-2 transition-all ${
                        formData.type === type.value
                          ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-2xl">
                        {feedbackService.getTypeIcon(type.value)}
                      </div>
                      <span className="text-xs font-medium text-center">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Which section does this apply to? *
                </label>
                <select
                  name="section"
                  value={formData.section}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-colors"
                  required
                >
                  {sections.map((section) => (
                    <option key={section.value} value={section.value}>
                      {section.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Title */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Brief summary of your feedback"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                required
              />
            </div>

            {/* Description */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                placeholder="Please provide detailed information about your feedback..."
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none resize-none"
                required
              />
            </div>

            {/* Suggestion */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Suggestion (Optional)
              </label>
              <textarea
                name="suggestion"
                value={formData.suggestion}
                onChange={handleChange}
                rows={3}
                placeholder="Do you have any suggestions for improvement?"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none resize-none"
              />
            </div>

            {/* Priority */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { value: 'low', label: 'Low', color: 'bg-green-100 text-green-700 border-green-300' },
                  { value: 'medium', label: 'Medium', color: 'bg-blue-100 text-blue-700 border-blue-300' },
                  { value: 'high', label: 'High', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
                  { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-700 border-red-300' },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, priority: option.value as any }))}
                    className={`px-3 py-3 rounded-xl text-sm font-medium border-2 transition-all ${
                      formData.priority === option.value
                        ? `${option.color} border-blue-500`
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags (Optional)
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.tags.map((tag, index) => (
                  <div
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:text-blue-900"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
              <input
                type="text"
                value={formData.newTag}
                onChange={(e) => setFormData(prev => ({ ...prev, newTag: e.target.value }))}
                onKeyDown={handleTagInput}
                placeholder="Type a tag and press Enter"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
              />
            </div>

            {/* Screenshot */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Screenshot (Optional)
              </label>
              {screenshotPreview ? (
                <div className="relative">
                  <img
                    src={screenshotPreview}
                    alt="Screenshot preview"
                    className="rounded-lg border border-gray-300 max-h-64"
                  />
                  <button
                    type="button"
                    onClick={removeScreenshot}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div
                  className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 mb-1">Click to upload a screenshot</p>
                  <p className="text-gray-500 text-sm">PNG, JPG up to 5MB</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleScreenshotChange}
                    className="hidden"
                  />
                </div>
              )}
            </div>

            {/* Contact Info Toggle */}
            <div className="mb-6 p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-medium text-gray-800">Contact Information</h3>
                  <p className="text-sm text-gray-600">Optional - helps us follow up if needed</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowContactInfo(!showContactInfo)}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                >
                  {showContactInfo ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {showContactInfo ? 'Hide' : 'Show'}
                </button>
              </div>

              {showContactInfo && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Your Name
                      </label>
                      <input
                        type="text"
                        name="userName"
                        value={formData.userName}
                        onChange={handleChange}
                        placeholder="John Doe"
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        name="userEmail"
                        value={formData.userEmail}
                        onChange={handleChange}
                        placeholder="john@example.com"
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="userPhone"
                      value={formData.userPhone}
                      onChange={handleChange}
                      placeholder="+1234567890"
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Privacy Options */}
            <div className="mb-6 space-y-3">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isAnonymous"
                  name="isAnonymous"
                  checked={formData.isAnonymous}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="isAnonymous" className="text-sm text-gray-700">
                  Submit anonymously
                </label>
              </div>
              
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="allowContact"
                  name="allowContact"
                  checked={formData.allowContact}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="allowContact" className="text-sm text-gray-700">
                  Allow us to contact you about this feedback
                </label>
              </div>
            </div>

            {/* Current URL */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Page URL
              </label>
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
                <Globe className="h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  name="currentUrl"
                  value={formData.currentUrl}
                  onChange={handleChange}
                  className="flex-1 bg-transparent border-none focus:outline-none text-sm"
                  placeholder="https://..."
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => router.back()}
                  disabled={submitting}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Submit Feedback
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}