import React, { useState, useEffect } from 'react';
import { 
  WifiIcon, 
  ExclamationIcon, 
  CloudIcon, 
  CloudDownloadIcon,
  ChevronUpIcon,
  ChevronDownIcon
} from '@heroicons/react/solid';

const CONNECTION_STATES = {
  OFFLINE: 'offline',
  SLOW: 'slow',
  ONLINE: 'online',
  RECONNECTING: 'reconnecting'
};

const NetworkQualityIndicator = ({ quality }) => {
  const bars = [
    { height: 'h-2', opacity: quality >= 25 ? 'opacity-100' : 'opacity-30' },
    { height: 'h-3', opacity: quality >= 50 ? 'opacity-100' : 'opacity-30' },
    { height: 'h-4', opacity: quality >= 75 ? 'opacity-100' : 'opacity-30' },
    { height: 'h-5', opacity: quality >= 90 ? 'opacity-100' : 'opacity-30' }
  ];

  return (
    <div className="flex items-end space-x-1">
      {bars.map((bar, index) => (
        <div
          key={index}
          className={`w-1 bg-current ${bar.height} ${bar.opacity} rounded-t`}
        />
      ))}
    </div>
  );
};

function OfflineIndicator({ 
  isOnline, 
  connectionQuality = 100,
  showDetails = false,
  className = '',
  onRetry = () => {} 
}) {
  const [expanded, setExpanded] = useState(false);
  const [status, setStatus] = useState(CONNECTION_STATES.ONLINE);
  const [lastOnlineTime, setLastOnlineTime] = useState(null);
  const [showReconnecting, setShowReconnecting] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!isOnline) {
      setStatus(CONNECTION_STATES.OFFLINE);
      setLastOnlineTime(new Date());
    } else if (connectionQuality < 50) {
      setStatus(CONNECTION_STATES.SLOW);
    } else {
      setStatus(CONNECTION_STATES.ONLINE);
      setShowReconnecting(false);
      setRetryCount(0);
    }
  }, [isOnline, connectionQuality]);

  const handleRetry = async () => {
    setShowReconnecting(true);
    setRetryCount(prev => prev + 1);
    try {
      await onRetry();
    } catch (error) {
      console.error('Reconnection failed:', error);
    }
    setShowReconnecting(false);
  };

  const getTimeSinceOnline = () => {
    if (!lastOnlineTime) return '';
    const minutes = Math.floor((new Date() - lastOnlineTime) / 60000);
    if (minutes < 1) return 'just now';
    if (minutes === 1) return '1 minute ago';
    if (minutes < 60) return `${minutes} minutes ago`;
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return '1 hour ago';
    return `${hours} hours ago`;
  };

  const renderStatusIcon = () => {
    switch (status) {
      case CONNECTION_STATES.OFFLINE:
        return <ExclamationIcon className="h-5 w-5 text-red-500" />;
      case CONNECTION_STATES.SLOW:
        return <CloudIcon className="h-5 w-5 text-yellow-500" />;
      case CONNECTION_STATES.RECONNECTING:
        return (
          <CloudDownloadIcon className="h-5 w-5 text-blue-500 animate-bounce" />
        );
      default:
        return <WifiIcon className="h-5 w-5 text-green-500" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case CONNECTION_STATES.OFFLINE:
        return 'bg-red-50 border-red-200';
      case CONNECTION_STATES.SLOW:
        return 'bg-yellow-50 border-yellow-200';
      case CONNECTION_STATES.RECONNECTING:
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-green-50 border-green-200';
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case CONNECTION_STATES.OFFLINE:
        return {
          title: 'You\'re offline',
          message: `Last online ${getTimeSinceOnline()}. Check your connection.`,
          action: 'Try to reconnect'
        };
      case CONNECTION_STATES.SLOW:
        return {
          title: 'Slow connection',
          message: 'Your internet connection is weak.',
          action: 'Check status'
        };
      case CONNECTION_STATES.RECONNECTING:
        return {
          title: 'Reconnecting...',
          message: `Attempt ${retryCount}`,
          action: 'Cancel'
        };
      default:
        return {
          title: 'Connected',
          message: 'Your connection is stable.',
          action: 'Check status'
        };
    }
  };

  const statusInfo = getStatusMessage();

  return (
    <div 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${className}`}
    >
      <div
        className={`
          border-b ${getStatusColor()}
          transition-all duration-300
          ${expanded ? 'py-4' : 'py-2'}
        `}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            {/* Status Icon and Basic Info */}
            <div className="flex items-center space-x-3">
              {renderStatusIcon()}
              <div>
                <h3 className="font-medium text-gray-900">
                  {statusInfo.title}
                </h3>
                {expanded && (
                  <p className="text-sm text-gray-600">
                    {statusInfo.message}
                  </p>
                )}
              </div>
            </div>

            {/* Network Quality and Actions */}
            <div className="flex items-center space-x-4">
              {isOnline && (
                <div className="hidden md:block">
                  <NetworkQualityIndicator quality={connectionQuality} />
                </div>
              )}

              {status !== CONNECTION_STATES.ONLINE && (
                <button
                  onClick={handleRetry}
                  disabled={showReconnecting}
                  className={`
                    px-4 py-1 rounded-full text-sm font-medium
                    ${showReconnecting
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-500 text-white hover:bg-blue-600'}
                  `}
                >
                  {statusInfo.action}
                </button>
              )}

              {showDetails && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="p-1 rounded-full hover:bg-gray-200"
                >
                  {expanded ? (
                    <ChevronUpIcon className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Extended Information */}
          {expanded && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h4 className="font-medium text-gray-900">Connection Quality</h4>
                <div className="mt-2">
                  <NetworkQualityIndicator quality={connectionQuality} />
                  <p className="mt-1 text-sm text-gray-600">
                    {connectionQuality}% signal strength
                  </p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h4 className="font-medium text-gray-900">Network Info</h4>
                <p className="mt-1 text-sm text-gray-600">
                  {navigator.connection?.effectiveType || 'Unknown'} connection
                </p>
                {navigator.connection?.downlink && (
                  <p className="text-sm text-gray-600">
                    {navigator.connection.downlink} Mbps
                  </p>
                )}
              </div>

              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h4 className="font-medium text-gray-900">Status History</h4>
                <p className="mt-1 text-sm text-gray-600">
                  {retryCount > 0
                    ? `${retryCount} reconnection attempts`
                    : 'No recent connection issues'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default OfflineIndicator;