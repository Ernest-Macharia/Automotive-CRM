'use client';

import { useState, useEffect } from 'react';
import { 
  Wifi, WifiOff, RefreshCw, Settings, 
  CheckCircle, AlertTriangle, 
  Users, MessageSquare
} from 'lucide-react';
import { manychatService, ManyChatConnectionStatus } from '@/services/manychatService';
import { useToast } from '@/contexts/ToastContext';

interface ConnectionStatusProps {
  onReconnect?: () => void;
  onConfigure?: () => void;
}

export default function ConnectionStatus({ onReconnect, onConfigure }: ConnectionStatusProps) {
  const { showToast } = useToast();
  const [status, setStatus] = useState<ManyChatConnectionStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [pingStatus, setPingStatus] = useState<string | null>(null);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      setLoading(true);
      const result = await manychatService.checkHealth();
      setStatus(result);
      
      if (result.connected) {
        const statsData = await manychatService.getStats();
        setStats(statsData);
      }
    } catch (error) {
      console.error('Error checking connection:', error);
      showToast('Failed to check connection status', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReconnect = async () => {
    try {
      setLoading(true);
      // This would typically open a modal to enter new token
      if (onReconnect) {
        onReconnect();
      } else {
        await checkStatus();
        showToast('Connection status refreshed', 'success');
      }
    } catch (error) {
      console.error('Error reconnecting:', error);
      showToast('Failed to reconnect', 'error');
    }
  };

  const handleConfigure = () => {
    if (onConfigure) {
      onConfigure();
    }
  };

  const handlePing = async () => {
    try {
      setLoading(true);
      const result = await manychatService.ping();
      const message = result?.message || result?.status || 'ManyChat ping successful';
      setPingStatus(message);
      showToast(message, 'success');
    } catch (error) {
      console.error('Error pinging ManyChat service:', error);
      setPingStatus('Ping failed');
      showToast('Failed to ping ManyChat service', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!status) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
        <div className="h-3 bg-gray-100 rounded w-full mb-2"></div>
      </div>
    );
  }

  const isConnected = status.connected;
  const lastSynced = status.lastSynced 
    ? new Date(status.lastSynced).toLocaleString()
    : 'Never';

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className={`p-4 ${isConnected ? 'bg-gradient-to-r from-green-50 to-emerald-50' : 'bg-gradient-to-r from-red-50 to-rose-50'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isConnected ? 'bg-green-100' : 'bg-red-100'}`}>
              {isConnected ? (
                <Wifi className="h-5 w-5 text-green-600" />
              ) : (
                <WifiOff className="h-5 w-5 text-red-600" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">ManyChat Connection</h3>
              <p className="text-sm text-gray-600">
                {isConnected ? 'Connected to Facebook Page' : 'Disconnected'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={checkStatus}
              disabled={loading}
              className="p-2 hover:bg-white rounded-lg transition-colors disabled:opacity-60"
              title="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''} text-gray-600`} />
            </button>
	            <button
	              onClick={handleConfigure}
	              className="p-2 hover:bg-white rounded-lg transition-colors"
	              title="Configure"
	            >
	              <Settings className="h-4 w-4 text-gray-600" />
	            </button>
	            <button
	              onClick={handlePing}
	              disabled={loading}
	              className="px-2.5 py-1.5 text-xs font-medium border border-gray-300 hover:bg-white rounded-lg transition-colors disabled:opacity-50"
	              title="Ping API"
	            >
	              Ping
	            </button>
	          </div>
	        </div>
	      </div>

      {/* Status Details */}
      <div className="p-4">
        {isConnected ? (
          <div className="space-y-4">
            {/* Page Info */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">{status.pageName || 'Unknown Page'}</p>
                <p className="text-xs text-gray-500">Facebook Page</p>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                <CheckCircle className="h-3 w-3" />
                <span>Connected</span>
              </div>
            </div>

            {/* Stats */}
            {stats && (
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span className="text-lg font-bold text-gray-900">{stats.totalSubscribers || 0}</span>
                  </div>
                  <p className="text-xs text-gray-500">Subscribers</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <MessageSquare className="h-4 w-4 text-green-600" />
                    <span className="text-lg font-bold text-gray-900">{stats.messagesSent || 0}</span>
                  </div>
                  <p className="text-xs text-gray-500">Messages Sent</p>
                </div>
              </div>
            )}

	            {/* Last Sync */}
	            <div className="pt-3 border-t border-gray-100">
	              <p className="text-xs text-gray-500 mb-1">Last Synced</p>
	              <p className="text-sm font-medium text-gray-900">{lastSynced}</p>
	              {pingStatus && <p className="text-xs text-gray-500 mt-1">Ping: {pingStatus}</p>}
	            </div>
	          </div>
	        ) : (
          <div className="space-y-4">
            {/* Error Message */}
            <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">Connection Error</p>
                <p className="text-sm text-red-600">{status.error || 'Unable to connect to ManyChat'}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={handleReconnect}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Wifi className="h-4 w-4" />
                )}
                Reconnect
              </button>
              
              <button
                onClick={handleConfigure}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
              >
                <Settings className="h-4 w-4" />
                Configure Settings
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
