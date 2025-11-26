import React, { useEffect, useState } from 'react';

interface HeaderProps {
  onHomeClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onHomeClick }) => {
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
      <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
        <h1 
          onClick={onHomeClick}
          className="text-2xl md:text-3xl font-extrabold text-red-600 tracking-tighter cursor-pointer hover:opacity-80 transition-opacity"
        >
          THE GYM CKBT
        </h1>
        <nav className="flex gap-4 items-center">
          {deferredPrompt && (
            <button 
              onClick={handleInstallClick}
              className="hidden md:block bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide hover:bg-red-200 transition-colors"
            >
              📲 Install App
            </button>
          )}
          <button 
            onClick={onHomeClick}
            className="text-sm font-semibold text-gray-600 hover:text-red-600 uppercase tracking-wide"
          >
            Home
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Header;