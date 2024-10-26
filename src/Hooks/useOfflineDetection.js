import { useState, useEffect, useCallback } from 'react';

const NETWORK_QUALITY = {
  EXCELLENT: 'excellent',
  GOOD: 'good',
  FAIR: 'fair',
  POOR: 'poor',
  OFFLINE: 'offline'
};

function useOfflineDetection(options = {}) {
  // Default options
  const {
    pingInterval = 30000, // 30 seconds
    pingTimeout = 5000,   // 5 seconds
    pingUrl = '/ping',    // URL to ping
    enableQualityCheck = true,
    onOffline = () => {},
    onOnline = () => {},
    onQualityChange = () => {}
  } = options;

  // State
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [networkQuality, setNetworkQuality] = useState(
    navigator.onLine ? NETWORK_QUALITY.GOOD : NETWORK_QUALITY.OFFLINE
  );
  const [lastOnlineTime, setLastOnlineTime] = useState(
    navigator.onLine ? Date.now() : null
  );
  const [connectionType, setConnectionType] = useState(
    navigator?.connection?.type || 'unknown'
  );
  const [isSlowConnection, setIsSlowConnection] = useState(false);

  // Check network quality
  const checkNetworkQuality = useCallback(async () => {
    if (!navigator.onLine) {
      setNetworkQuality(NETWORK_QUALITY.OFFLINE);
      return;
    }

    try {
      const startTime = performance.now();
      const response = await Promise.race([
        fetch(pingUrl),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('timeout')), pingTimeout)
        )
      ]);

      if (!response.ok) throw new Error('ping failed');

      const endTime = performance.now();
      const latency = endTime - startTime;

      // Determine quality based on latency
      let quality;
      if (latency < 200) {
        quality = NETWORK_QUALITY.EXCELLENT;
      } else if (latency < 500) {
        quality = NETWORK_QUALITY.GOOD;
      } else if (latency < 1000) {
        quality = NETWORK_QUALITY.FAIR;
      } else {
        quality = NETWORK_QUALITY.POOR;
      }

      setNetworkQuality(quality);
      onQualityChange(quality);
      setIsSlowConnection(latency > 1000);
      
    } catch (error) {
      if (navigator.onLine) {
        setNetworkQuality(NETWORK_QUALITY.POOR);
        onQualityChange(NETWORK_QUALITY.POOR);
      } else {
        setNetworkQuality(NETWORK_QUALITY.OFFLINE);
        onQualityChange(NETWORK_QUALITY.OFFLINE);
      }
    }
  }, [pingUrl, pingTimeout, onQualityChange]);

  // Handle online status change
  const handleOnline = useCallback(() => {
    setIsOnline(true);
    setLastOnlineTime(Date.now());
    onOnline();
    checkNetworkQuality();
  }, [onOnline, checkNetworkQuality]);

  // Handle offline status change
  const handleOffline = useCallback(() => {
    setIsOnline(false);
    setNetworkQuality(NETWORK_QUALITY.OFFLINE);
    onOffline();
  }, [onOffline]);

  // Network Connection monitoring
  useEffect(() => {
    const connection = navigator.connection;

    const handleConnectionChange = () => {
      setConnectionType(connection?.type || 'unknown');
      checkNetworkQuality();
    };

    if (connection) {
      connection.addEventListener('change', handleConnectionChange);
    }

    return () => {
      if (connection) {
        connection.removeEventListener('change', handleConnectionChange);
      }
    };
  }, [checkNetworkQuality]);

  // Online/Offline event listeners
  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline]);

  // Periodic network quality check
  useEffect(() => {
    if (!enableQualityCheck) return;

    checkNetworkQuality();
    const intervalId = setInterval(checkNetworkQuality, pingInterval);

    return () => clearInterval(intervalId);
  }, [enableQualityCheck, pingInterval, checkNetworkQuality]);

  // Save last known state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('lastNetworkState', JSON.stringify({
        isOnline,
        quality: networkQuality,
        lastOnlineTime,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Error saving network state:', error);
    }
  }, [isOnline, networkQuality, lastOnlineTime]);

  // Helper function to check if we should retry a failed request
  const shouldRetryRequest = useCallback(() => {
    return isOnline && networkQuality !== NETWORK_QUALITY.POOR;
  }, [isOnline, networkQuality]);

  // Helper function to get estimated download time
  const getEstimatedDownloadTime = useCallback((fileSize) => {
    if (!isOnline) return Infinity;

    const connection = navigator.connection;
    if (!connection || !connection.downlink) return null;

    // Convert fileSize to bits and downlink to bits per second
    const fileSizeBits = fileSize * 8;
    const speedBps = connection.downlink * 1000000;
    
    return (fileSizeBits / speedBps) * 1000; // Returns milliseconds
  }, [isOnline]);

  return {
    isOnline,
    networkQuality,
    lastOnlineTime,
    connectionType,
    isSlowConnection,
    shouldRetryRequest,
    getEstimatedDownloadTime,
    checkNetworkQuality,
    NETWORK_QUALITY,
    
    // Connection info
    effectiveType: navigator.connection?.effectiveType || 'unknown',
    downlink: navigator.connection?.downlink || null,
    rtt: navigator.connection?.rtt || null,
    saveData: navigator.connection?.saveData || false,

    // Helper methods
    isGoodConnection: networkQuality === NETWORK_QUALITY.EXCELLENT || 
                     networkQuality === NETWORK_QUALITY.GOOD,
    isFairConnection: networkQuality === NETWORK_QUALITY.FAIR,
    isPoorConnection: networkQuality === NETWORK_QUALITY.POOR,
    timeSinceLastOnline: lastOnlineTime ? Date.now() - lastOnlineTime : null
  };
}

export default useOfflineDetection;