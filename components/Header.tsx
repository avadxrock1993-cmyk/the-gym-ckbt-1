
import React, { useEffect, useState } from 'react';

interface HeaderProps {
  onHomeClick: () => void;
  onTrackerClick?: () => void;
  onHistoryClick?: () => void;
  onLogsClick?: () => void; // New prop for Logs
}

const Header: React.FC<HeaderProps> = ({ onHomeClick, onTrackerClick, onHistoryClick, onLogsClick }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b-4 border-red-600 shadow-md">
      <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
        <div 
          onClick={onHomeClick}
          className="cursor-pointer hover:opacity-80 transition-opacity"
        >
          <h1 className="text-2xl md:text-3xl font-black text-red-600 tracking-tighter uppercase italic drop-shadow-sm">
            THE GYM <span className="text-gray-900">CKBT</span>
          </h1>
        </div>

        <nav className="flex gap-2 sm:gap-4 items-center">
          {deferredPrompt && (
            <button 
              onClick={handleInstallClick}
              className="hidden md:block bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide hover:bg-red-200 transition-colors"
            >
              📲 Install
            </button>
          )}
          
          {/* Tracker Shortcut */}
          {onTrackerClick && (
            <button 
              onClick={onTrackerClick}
              className="text-xs sm:text-sm font-bold text-gray-600 hover:text-red-600 uppercase tracking-wide hidden sm:block"
            >
              Tracker
            </button>
          )}

          {/* New Logs Button - Highly Visible */}
          {onLogsClick && (
            <button 
              onClick={onLogsClick}
              className="text-xs sm:text-sm font-bold text-red-600 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100 hover:bg-red-100 uppercase tracking-wide transition-colors"
            >
              Logs
            </button>
          )}

          {/* Plans History */}
          {onHistoryClick && (
            <button 
              onClick={onHistoryClick}
              className="text-xs sm:text-sm font-bold text-gray-600 hover:text-red-600 uppercase tracking-wide"
            >
              Plans
            </button>
          )}
          
          <button 
            onClick={onHomeClick}
            className="text-xs sm:text-sm font-bold text-gray-600 hover:text-red-600 uppercase tracking-wide"
          >
            Home
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Header;
