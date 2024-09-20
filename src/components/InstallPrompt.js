import React, { useState, useEffect } from 'react';

function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        } else {
          console.log('User dismissed the install prompt');
        }
        setDeferredPrompt(null);
      });
    }
  };

  if (!deferredPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-20 right-4 bg-blue-500 text-white p-4 rounded-lg shadow-lg">
      <p className="mb-2">Install Xora Music for offline use!</p>
      <button 
        onClick={handleInstallClick}
        className="bg-white text-blue-500 px-4 py-2 rounded hover:bg-blue-100"
      >
        Install
      </button>
    </div>
  );
}

export default InstallPrompt;