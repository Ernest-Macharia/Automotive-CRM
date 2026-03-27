'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import ConnectionStatus from '@/components/manychat/ConnectionStatus';
import MessageComposer from '@/components/manychat/MessageComposer';
import TagManager from '@/components/manychat/TagManager';
import StatsDashboard from '@/components/manychat/StatsDashboard';
import {
  MessageSquare, BarChart3, Tag, Send, Download,
  Settings
} from 'lucide-react';
import { manychatService, ManyChatContact, ManyChatStats } from '@/services/manychatService';
import { useToast } from '@/contexts/ToastContext';

export default function ManyChatPage() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'messages' | 'tags' | 'stats' | 'settings'>('messages');
  const [selectedContact, setSelectedContact] = useState<ManyChatContact | null>(null);
  const [showMessageComposer, setShowMessageComposer] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [stats, setStats] = useState<ManyChatStats | null>(null);

  const tabs = [
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'tags', label: 'Tags', icon: Tag },
    { id: 'stats', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  useEffect(() => {
    manychatService.getStats().then(setStats).catch(() => setStats(null));
  }, []);

  const handleSendMessage = (contact?: ManyChatContact) => {
    if (contact) {
      setSelectedContact(contact);
    }
    setShowMessageComposer(true);
  };

  const handleExportContacts = async () => {
    try {
      showToast('ManyChat export is not available in this portal yet', 'info');
    } catch (error) {
      console.error('Error exporting contacts:', error);
      showToast('Failed to prepare export', 'error');
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 p-6 shadow-xl">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                  <MessageSquare className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">ManyChat Integration</h1>
                  <p className="text-blue-100 text-sm">Manage your Facebook Messenger chatbot</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportContacts}
                  className="px-4 py-2 bg-white text-blue-600 rounded-xl hover:bg-white/90 flex items-center gap-2 font-semibold"
                >
                  <Download className="h-4 w-4" />
                  Export
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-4">
          {/* Connection Status */}
          <div className="mb-6">
            <ConnectionStatus 
              onReconnect={() => setShowSettingsModal(true)}
              onConfigure={() => setShowSettingsModal(true)}
            />
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Sidebar - Tabs */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {/* Quick Actions */}
                <div className="p-4 border-b border-gray-100">
                  <button
                    onClick={() => handleSendMessage()}
                    className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 flex items-center justify-center gap-2 font-semibold mb-3"
                  >
                    <Send className="h-4 w-4" />
                    Send Message
                  </button>
                  <button
                    onClick={() => setShowSettingsModal(true)}
                    className="w-full px-4 py-3 border border-blue-200 text-blue-600 rounded-xl hover:bg-blue-50 flex items-center justify-center gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    Open Settings
                  </button>
                </div>

                {/* Tabs */}
                <div className="p-2">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-1 transition-colors ${
                          activeTab === tab.id
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="font-medium">{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="mt-6 bg-white rounded-xl border border-gray-200 p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Quick Stats</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-blue-100 rounded">
                        <MessageSquare className="h-4 w-4 text-blue-600" />
                      </div>
                      <span className="text-sm text-gray-600">Tags</span>
                    </div>
                    <span className="font-semibold">{stats?.tagsCount ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-green-100 rounded">
                        <MessageSquare className="h-4 w-4 text-green-600" />
                      </div>
                      <span className="text-sm text-gray-600">Messages Sent</span>
                    </div>
                    <span className="font-semibold">{stats?.messagesSent ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-purple-100 rounded">
                        <Tag className="h-4 w-4 text-purple-600" />
                      </div>
                      <span className="text-sm text-gray-600">Configured</span>
                    </div>
                    <span className="font-semibold">{stats ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-3">
              {activeTab === 'messages' && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <MessageComposer onSent={() => setShowMessageComposer(false)} />
                </div>
              )}

              {activeTab === 'tags' && <TagManager />}
              {activeTab === 'stats' && <StatsDashboard />}
              {activeTab === 'settings' && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">ManyChat Settings</h3>
                  <p className="text-gray-600 mb-4">
                    Configure your ManyChat integration settings, webhooks, and preferences.
                  </p>
                  <button
                    onClick={() => setShowSettingsModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Open Settings
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modals */}
        {showMessageComposer && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="w-full max-w-2xl">
              <MessageComposer
                contactId={selectedContact?.id}
                phone={selectedContact?.phone}
                email={selectedContact?.email}
                onSent={() => setShowMessageComposer(false)}
                onCancel={() => setShowMessageComposer(false)}
              />
            </div>
          </div>
        )}

        {showSettingsModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="w-full max-w-2xl bg-white rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">ManyChat Configuration</h3>
              {/* Settings form would go here */}
              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
