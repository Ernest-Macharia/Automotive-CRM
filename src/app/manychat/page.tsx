'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import ConnectionStatus from '@/components/manychat/ConnectionStatus';
import MessageComposer from '@/components/manychat/MessageComposer';
import TagManager from '@/components/manychat/TagManager';
import StatsDashboard from '@/components/manychat/StatsDashboard';
import {
  type LucideIcon,
  MessageSquare, BarChart3, Tag, Send, Download,
  Settings, AlertTriangle, KeyRound, Loader2, ClipboardCheck
} from 'lucide-react';
import {
  manychatService,
  ManyChatContact,
  ManyChatConnectionStatus,
  ManyChatStats
} from '@/services/manychatService';
import { useToast } from '@/contexts/ToastContext';

type ManyChatTab = 'messages' | 'tags' | 'stats' | 'settings';

export default function ManyChatPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<ManyChatTab>('messages');
  const [selectedContact, setSelectedContact] = useState<ManyChatContact | null>(null);
  const [showMessageComposer, setShowMessageComposer] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [stats, setStats] = useState<ManyChatStats | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ManyChatConnectionStatus | null>(null);
  const [connectionRefreshKey, setConnectionRefreshKey] = useState(0);
  const [settingsToken, setSettingsToken] = useState('');
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);

  const tabs: Array<{ id: ManyChatTab; label: string; icon: LucideIcon }> = [
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'tags', label: 'Tags', icon: Tag },
    { id: 'stats', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  useEffect(() => {
    if (!connectionStatus?.connected) {
      setStats(null);
      return;
    }

    manychatService.getStats().then(setStats).catch(() => setStats(null));
  }, [connectionStatus?.connected, connectionRefreshKey]);

  const openSettingsModal = () => {
    setSettingsToken(manychatService.getStoredToken() || '');
    setSettingsError(null);
    setShowSettingsModal(true);
  };

  const refreshConnection = () => {
    setConnectionRefreshKey((prev) => prev + 1);
  };

  const handleSaveSettings = async () => {
    const trimmedToken = settingsToken.trim();

    if (!trimmedToken) {
      setSettingsError('Enter a valid ManyChat API token before saving.');
      return;
    }

    try {
      setSavingSettings(true);
      setSettingsError(null);

      const result = await manychatService.testConnection(trimmedToken);
      setConnectionStatus(result);
      refreshConnection();

      if (!result.connected) {
        const message = result.error || 'Unable to connect to ManyChat with that token.';
        setSettingsError(message);
        showToast(message, 'error');
        return;
      }

      setShowSettingsModal(false);
      showToast('ManyChat connected successfully', 'success');
    } catch (error) {
      console.error('Error saving ManyChat settings:', error);
      const message = error instanceof Error
        ? error.message
        : 'Failed to save ManyChat settings';
      setSettingsError(message);
      showToast(message, 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleDisconnect = () => {
    manychatService.disconnect();
    setStats(null);
    setShowMessageComposer(false);
    setSettingsToken('');
    setSettingsError(null);
    setConnectionStatus({
      connected: false,
      configured: false,
      error: 'ManyChat is disconnected. Add a valid API token to reconnect.',
    });
    setShowSettingsModal(false);
    refreshConnection();
    showToast('ManyChat token cleared', 'success');
  };

  const handleSendMessage = (contact?: ManyChatContact) => {
    if (!connectionStatus?.connected) {
      openSettingsModal();
      showToast('Connect ManyChat before sending messages', 'info');
      return;
    }

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

  const handleCreateChecklist = () => {
    const query = new URLSearchParams({
      source: 'manychat',
    });
    const suggestedClient =
      selectedContact?.fullName ||
      `${selectedContact?.firstName || ''} ${selectedContact?.lastName || ''}`.trim();
    if (suggestedClient) {
      query.set('clientSearch', suggestedClient);
    }
    router.push(`/pre-checklist/create?${query.toString()}`);
  };

  const renderConnectionRequired = () => (
    <div className="bg-white rounded-xl border border-gray-200 p-8">
      <div className="max-w-xl">
        <div className="inline-flex p-3 rounded-2xl bg-amber-50 text-amber-600 mb-4">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Connect ManyChat to continue</h3>
        <p className="text-gray-600 mb-5">
          The portal is ready, but your ManyChat API token is not connected yet. Once you save a valid token,
          messaging, tags, and analytics will load normally.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={openSettingsModal}
            className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center justify-center gap-2"
          >
            <KeyRound className="h-4 w-4" />
            Connect ManyChat
          </button>
          <button
            onClick={refreshConnection}
            className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Refresh Status
          </button>
        </div>
        {connectionStatus?.error && (
          <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {connectionStatus.error}
          </div>
        )}
      </div>
    </div>
  );

  const renderConnectionLoading = () => (
    <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
      <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-3" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Checking ManyChat connection</h3>
      <p className="text-gray-600">Verifying your current ManyChat configuration.</p>
    </div>
  );

  const isConnected = connectionStatus?.connected ?? false;
  const isCheckingConnection = connectionStatus === null;
  const isConfigured = connectionStatus?.configured ?? manychatService.hasStoredToken();

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
              onReconnect={openSettingsModal}
              onConfigure={openSettingsModal}
              onStatusChange={setConnectionStatus}
              refreshKey={connectionRefreshKey}
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
                    onClick={handleCreateChecklist}
                    className="w-full px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 flex items-center justify-center gap-2 font-semibold mb-3"
                  >
                    <ClipboardCheck className="h-4 w-4" />
                    Create Checklist
                  </button>
                  <button
                    onClick={() => handleSendMessage()}
                    className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 flex items-center justify-center gap-2 font-semibold mb-3"
                  >
                    <Send className="h-4 w-4" />
                    Send Message
                  </button>
                  <button
                    onClick={openSettingsModal}
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
                        onClick={() => setActiveTab(tab.id)}
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
                      <span className="text-sm text-gray-600">Connected</span>
                    </div>
                    <span className="font-semibold">
                      {isCheckingConnection ? 'Checking...' : isConfigured ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-3">
              {isCheckingConnection && renderConnectionLoading()}
              {!isCheckingConnection && !isConnected && renderConnectionRequired()}

              {isConnected && activeTab === 'messages' && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <MessageComposer onSent={() => setShowMessageComposer(false)} />
                </div>
              )}

              {isConnected && activeTab === 'tags' && <TagManager />}
              {isConnected && activeTab === 'stats' && <StatsDashboard />}
              {isConnected && activeTab === 'settings' && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">ManyChat Settings</h3>
                  <p className="text-gray-600 mb-4">
                    Configure your ManyChat integration settings, webhooks, and preferences.
                  </p>
                  <button
                    onClick={openSettingsModal}
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
        {showMessageComposer && isConnected && (
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
              <div className="space-y-4">
                <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                  Paste your ManyChat API token below, then save to test the connection immediately.
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ManyChat API Token
                  </label>
                  <input
                    type="password"
                    value={settingsToken}
                    onChange={(e) => setSettingsToken(e.target.value)}
                    placeholder="mc_..."
                    autoComplete="off"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    The token is stored in this browser session and used for ManyChat requests from this portal.
                  </p>
                </div>

                {settingsError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {settingsError}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={handleDisconnect}
                  className="px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50"
                >
                  Clear Token
                </button>
                <button
                  onClick={() => setShowSettingsModal(false)}
                  disabled={savingSettings}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSettings}
                  disabled={savingSettings}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 inline-flex items-center gap-2"
                >
                  {savingSettings ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                  Save and Connect
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
