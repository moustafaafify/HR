import React, { useState, useEffect } from 'react';
import { X, Download, Smartphone } from 'lucide-react';

const InstallPWA = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed (standalone mode)
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches 
      || window.navigator.standalone 
      || document.referrer.includes('android-app://');
    
    setIsStandalone(isInStandaloneMode);

    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(isIOSDevice);

    // Check if user dismissed the prompt before
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    const dismissedTime = dismissed ? parseInt(dismissed) : 0;
    const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);

    // Show prompt if not dismissed in the last 7 days and not already installed
    if (!isInStandaloneMode && daysSinceDismissed > 7) {
      // For iOS, show immediately since there's no beforeinstallprompt
      if (isIOSDevice) {
        setTimeout(() => setShowPrompt(true), 2000);
      }
    }

    // Listen for the beforeinstallprompt event (Android/Chrome)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!isInStandaloneMode && daysSinceDismissed > 7) {
        setTimeout(() => setShowPrompt(true), 1500);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for successful installation
    window.addEventListener('appinstalled', () => {
      setShowPrompt(false);
      setDeferredPrompt(null);
      console.log('PWA was installed');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Show the native install prompt
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to the install prompt: ${outcome}`);
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  // Don't show if already installed
  if (isStandalone || !showPrompt) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-[9998] animate-fade-in"
        onClick={handleDismiss}
      />
      
      {/* Install Modal */}
      <div className="fixed bottom-0 left-0 right-0 z-[9999] p-4 animate-slide-up">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md mx-auto overflow-hidden">
          {/* Header with gradient */}
          <div 
            className="px-6 py-5 text-white"
            style={{ background: 'linear-gradient(135deg, #2D4F38, #4F7942)' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Smartphone size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Install HR Portal</h3>
                  <p className="text-white/80 text-sm">Add to your home screen</p>
                </div>
              </div>
              <button 
                onClick={handleDismiss}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {isIOS ? (
              // iOS Instructions
              <div className="space-y-4">
                <p className="text-slate-600 text-sm">
                  Install this app on your iPhone for the best experience:
                </p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-600 font-bold text-sm">1</span>
                    </div>
                    <div>
                      <p className="text-slate-800 font-medium text-sm">Tap the Share button</p>
                      <p className="text-slate-500 text-xs">The square with an arrow pointing up</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-600 font-bold text-sm">2</span>
                    </div>
                    <div>
                      <p className="text-slate-800 font-medium text-sm">Scroll down and tap</p>
                      <p className="text-slate-500 text-xs">"Add to Home Screen"</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-600 font-bold text-sm">3</span>
                    </div>
                    <div>
                      <p className="text-slate-800 font-medium text-sm">Tap "Add"</p>
                      <p className="text-slate-500 text-xs">The app will appear on your home screen</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleDismiss}
                  className="w-full py-3 bg-[#2D4F38] text-white rounded-xl font-medium hover:bg-[#1a3a24] transition-colors"
                >
                  Got it!
                </button>
              </div>
            ) : (
              // Android/Chrome Install Button
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                  <div className="w-14 h-14 bg-[#2D4F38] rounded-xl flex items-center justify-center text-white font-bold text-xl">
                    HR
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">HR Portal</h4>
                    <p className="text-slate-500 text-sm">hrportal-51.preview.emergentagent.com</p>
                  </div>
                </div>
                
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-center gap-2">
                    <span className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 text-xs">✓</span>
                    </span>
                    Works offline
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 text-xs">✓</span>
                    </span>
                    Quick access from home screen
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 text-xs">✓</span>
                    </span>
                    Push notifications
                  </li>
                </ul>

                <div className="flex gap-3">
                  <button
                    onClick={handleDismiss}
                    className="flex-1 py-3 border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors"
                  >
                    Not now
                  </button>
                  <button
                    onClick={handleInstallClick}
                    className="flex-1 py-3 bg-[#2D4F38] text-white rounded-xl font-medium hover:bg-[#1a3a24] transition-colors flex items-center justify-center gap-2"
                  >
                    <Download size={18} />
                    Install
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-up {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        .animate-slide-up {
          animation: slide-up 0.4s ease-out;
        }
      `}</style>
    </>
  );
};

export default InstallPWA;
