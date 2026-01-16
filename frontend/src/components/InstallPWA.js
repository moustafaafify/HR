import React, { useState, useEffect } from 'react';
import { X, Download, Smartphone, Share } from 'lucide-react';

const InstallPWA = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed (standalone mode)
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches 
      || window.navigator.standalone 
      || document.referrer.includes('android-app://');
    
    setIsStandalone(isInStandaloneMode);

    // Detect device
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const isIOSDevice = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
    const isAndroidDevice = /android/i.test(userAgent);
    
    setIsIOS(isIOSDevice);
    setIsAndroid(isAndroidDevice);

    // Check if user dismissed the prompt before (but show anyway after 1 day)
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    const dismissedTime = dismissed ? parseInt(dismissed) : 0;
    const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);

    // Check if this is a mobile device
    const isMobile = isIOSDevice || isAndroidDevice || /mobile/i.test(userAgent);

    // Show prompt on mobile devices if not dismissed recently and not installed
    if (!isInStandaloneMode && isMobile && daysSinceDismissed > 1) {
      // Show prompt after a short delay
      setTimeout(() => setShowPrompt(true), 1500);
    }

    // Listen for the beforeinstallprompt event (Android/Chrome)
    const handleBeforeInstallPrompt = (e) => {
      console.log('beforeinstallprompt event fired');
      e.preventDefault();
      setDeferredPrompt(e);
      // Show our custom prompt
      if (!isInStandaloneMode) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for successful installation
    window.addEventListener('appinstalled', () => {
      console.log('PWA was installed');
      setShowPrompt(false);
      setDeferredPrompt(null);
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
      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
    } else if (isAndroid) {
      // For Android without beforeinstallprompt, show manual instructions
      alert('To install:\n1. Tap the menu (⋮) in your browser\n2. Select "Add to Home screen" or "Install app"');
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  // Don't show if already installed or not on mobile
  if (isStandalone || !showPrompt) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 z-[9998]"
        onClick={handleDismiss}
        style={{ animation: 'fadeIn 0.3s ease-out' }}
      />
      
      {/* Install Modal */}
      <div 
        className="fixed bottom-0 left-0 right-0 z-[9999] p-4"
        style={{ animation: 'slideUp 0.4s ease-out' }}
      >
        <div className="bg-white rounded-3xl shadow-2xl max-w-md mx-auto overflow-hidden">
          {/* Header with gradient */}
          <div 
            className="px-6 py-5 text-white relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #2D4F38, #4F7942)' }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="flex items-center justify-between relative">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-[#2D4F38] font-black text-xl">HR</span>
                </div>
                <div>
                  <h3 className="font-bold text-xl">Install HR Portal</h3>
                  <p className="text-white/80 text-sm">Get the full app experience</p>
                </div>
              </div>
              <button 
                onClick={handleDismiss}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X size={22} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {isIOS ? (
              // iOS Instructions
              <div className="space-y-4">
                <p className="text-slate-600 text-sm text-center">
                  Install this app on your iPhone for quick access
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
                    <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Share size={20} className="text-white" />
                    </div>
                    <div>
                      <p className="text-slate-800 font-semibold text-sm">1. Tap Share button</p>
                      <p className="text-slate-500 text-xs">At the bottom of Safari</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
                    <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-lg">+</span>
                    </div>
                    <div>
                      <p className="text-slate-800 font-semibold text-sm">2. Add to Home Screen</p>
                      <p className="text-slate-500 text-xs">Scroll down to find this option</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
                    <div className="w-10 h-10 bg-[#2D4F38] rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-sm">HR</span>
                    </div>
                    <div>
                      <p className="text-slate-800 font-semibold text-sm">3. Tap "Add"</p>
                      <p className="text-slate-500 text-xs">App will appear on home screen</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleDismiss}
                  className="w-full py-4 bg-[#2D4F38] text-white rounded-2xl font-semibold hover:bg-[#1a3a24] transition-colors text-lg"
                >
                  Got it!
                </button>
              </div>
            ) : (
              // Android/Chrome Install Button
              <div className="space-y-5">
                <div className="flex flex-col items-center text-center">
                  <p className="text-slate-600 text-sm mb-4">
                    Add HR Portal to your home screen for easy access
                  </p>
                  
                  <div className="flex items-center gap-6 justify-center mb-4">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-1">
                        <span className="text-green-600 text-xl">✓</span>
                      </div>
                      <span className="text-xs text-slate-600">Works Offline</span>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-1">
                        <span className="text-blue-600 text-xl">⚡</span>
                      </div>
                      <span className="text-xs text-slate-600">Fast Access</span>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-1">
                        <span className="text-purple-600 text-xl">🔔</span>
                      </div>
                      <span className="text-xs text-slate-600">Notifications</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleDismiss}
                    className="flex-1 py-4 border-2 border-slate-200 text-slate-700 rounded-2xl font-semibold hover:bg-slate-50 transition-colors"
                  >
                    Maybe Later
                  </button>
                  <button
                    onClick={handleInstallClick}
                    className="flex-1 py-4 bg-[#2D4F38] text-white rounded-2xl font-semibold hover:bg-[#1a3a24] transition-colors flex items-center justify-center gap-2 shadow-lg shadow-[#2D4F38]/30"
                  >
                    <Download size={20} />
                    Install
                  </button>
                </div>
                
                {!deferredPrompt && (
                  <p className="text-xs text-slate-400 text-center">
                    Tip: You can also tap ⋮ menu → "Install app" or "Add to Home screen"
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </>
  );
};

export default InstallPWA;
