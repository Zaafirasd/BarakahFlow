'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff } from 'lucide-react';

export default function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(true);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Initialise from browser state
    setIsOnline(navigator.onLine);
    if (!navigator.onLine) setShowBanner(true);

    const handleOffline = () => { setIsOnline(false); setShowBanner(true); };
    const handleOnline  = () => {
      setIsOnline(true);
      // Keep banner visible briefly so user sees "Back online"
      setTimeout(() => setShowBanner(false), 2000);
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online',  handleOnline);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online',  handleOnline);
    };
  }, []);

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0,   opacity: 1 }}
          exit={{   y: -60, opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className={`fixed left-0 right-0 top-0 z-[9999] flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold ${
            isOnline
              ? 'bg-emerald-500 text-white'
              : 'bg-slate-900 text-white dark:bg-slate-800'
          }`}
        >
          {isOnline ? (
            'Back online'
          ) : (
            <>
              <WifiOff className="h-4 w-4 shrink-0" />
              No internet connection — some features may not work
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
