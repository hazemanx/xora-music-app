import React, { useState, useEffect } from 'react';
import {
  DeviceMobileIcon,
  XIcon,
  WifiIcon,
  CloudDownloadIcon,
  SparklesIcon
} from '@heroicons/react/solid';

function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [installStatus, setInstallStatus] = useState('pending'); // pending, installing, installed
  const [hasUserDismissed, setHasUserDismissed] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowPrompt(false);
      setInstallStatus('installed');
      return;
    }

    // Check local storage for previous dismissal
    const dismissedTime = localStorage.getItem('installPromptDismissed');
    if (dismissedTime) {
      const dismissedDate = new Date(parseInt(dismissedTime));
      const now = new Date();
      const daysSinceDismissed = (now - dismissedDate) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        setHasUserDismissed(true);
        return;
      }
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleAppInstalled = () => {
    setInstallStatus('installed');
    setShowPrompt(false);
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    setInstallStatus('installing');

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;

      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
        setInstallStatus('installed');
        // Track installation success
        if ('gtag' in window) {
          window.gtag('event', 'pwa_install', {
            'event_category': 'PWA',
            'event_label': 'Install Accepted'
          });
        }
      } else {
        console.log('User dismissed the install prompt');
        handleDismiss();
      }
    } catch (error) {
      console.error('Install prompt error:', error);
      setInstallStatus('pending');
    }

    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setHasUserDismissed(true);
    setShowPrompt(false);
    // Store dismissal time
    localStorage.setItem('installPromptDismissed', Date.now().toString());
    // Track dismissal
    if ('gtag' in window) {
      window.gtag('event', 'pwa_dismiss', {
        'event_category': 'PWA',
        'event_label': 'Install Dismissed'
      });
    }
  };

  if (!showPrompt || hasUserDismissed || installStatus === 'installed') {
    return null;
  }

  return (
    <div className="fixed bottom-20 right-4 max-w-sm bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-xl shadow-2xl transform transition-all duration-300 ease-in-out">
      <div className="absolute top-3 right-3">
        <button
          onClick={handleDismiss}
          className="text-white/80 hover:text-white transition-colors"
          aria-label="Dismiss install prompt"
        >
          <XIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <DeviceMobileIcon className="h-12 w-12 text-blue-200" />
        </div>

        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-2">
            Install Xora Music
          </h3>

          <div className="space-y-2 mb-4">
            <div className="flex items-center text-sm text-blue-100">
              <WifiIcon className="h-4 w-4 mr-2" />
              Listen offline
            </div>
            <div className="flex items-center text-sm text-blue-100">
              <CloudDownloadIcon className="h-4 w-4 mr-2" />
              Save storage space
            </div>
            <div className="flex items-center text-sm text-blue-100">
              <SparklesIcon className="h-4 w-4 mr-2" />
              Enhanced features
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleInstallClick}
              disabled={installStatus === 'installing'}
              className={`
                flex-1 bg-white text-blue-600 px-4 py-2 rounded-lg
                font-medium transition-all duration-200
                ${installStatus === 'installing'
                  ? 'opacity-75 cursor-not-allowed'
                  : 'hover:bg-blue-50 active:scale-95'
                }
              `}
            >
              {installStatus === 'installing' ? 'Installing...' : 'Install Now'}
            </button>
            <button
              onClick={handleDismiss}
              className="text-blue-200 hover:text-white px-3 py-2 rounded-lg transition-colors"
            >
              Later
            </button>
          </div>

          <p className="mt-3 text-xs text-blue-200">
            No app store required. Installs directly from browser.
          </p>
        </div>
      </div>

      {/* Progress Bar for Installation */}
      {installStatus === 'installing' && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-800 rounded-b-xl">
          <div className="h-full w-1/2 bg-blue-300 rounded-full animate-pulse" />
        </div>
      )}
    </div>
  );
}

export default InstallPrompt;