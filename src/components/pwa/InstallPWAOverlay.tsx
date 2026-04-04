'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share, PlusSquare, ArrowUp } from 'lucide-react';
import Image from 'next/image';

const InstallPWAOverlay = () => {
  const [showOverlay, setShowOverlay] = useState(false);

  useEffect(() => {
    // Check environment
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    
    // Check for standalone mode
    // @ts-ignore
    const isStandalone = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;

    // Show overlay only on iOS mobile browsers if not standalone
    // We only force this on iOS as it's a key requirement for the premium full-screen experience
    if (isIOSDevice && !isStandalone) {
      setShowOverlay(true);
    }
  }, []);

  if (!showOverlay) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[10000] flex flex-col items-center justify-center px-6 overflow-hidden"
      >
        {/* Deep Backdrop Blur with Slate Tint */}
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-3xl" />

        {/* Floating Ambient Glows */}
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none animate-pulse" />
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-emerald-600/10 blur-[120px] rounded-full pointer-events-none animate-pulse" style={{ animationDelay: '1s' }} />

        <div className="relative w-full max-w-sm flex flex-col items-center">
          {/* Brand Identity Section */}
          <motion.div
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, type: "spring", damping: 20 }}
            className="mb-12 flex flex-col items-center group"
          >
            <div className="relative w-24 h-24 mb-8 drop-shadow-[0_0_20px_rgba(16,185,129,0.4)] group-hover:scale-105 transition-transform duration-500">
              <Image
                src="/logo.png"
                alt="BarakahFlow Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <h1 className="text-4xl font-black tracking-tight text-white font-sans text-center">
              BarakahFlow
            </h1>
            <div className="flex items-center space-x-3 mt-4">
              <span className="h-[1px] w-6 bg-emerald-500/20" />
              <p className="text-emerald-400 font-black uppercase tracking-[0.4em] text-[10px] whitespace-nowrap">
                Halal Personal Finance
              </p>
              <span className="h-[1px] w-6 bg-emerald-500/20" />
            </div>
          </motion.div>

          {/* Premium Instruction Card */}
          <motion.div
            initial={{ y: 40, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, type: "spring", damping: 25 }}
            className="w-full glass-card overflow-hidden relative"
          >
            {/* Glossy Top Border */}
            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent" />
            
            <div className="p-10 flex flex-col items-center text-center">
              <div className="space-y-4 mb-10">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">
                  Premium Experience <br/>Required
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed">
                  To ensure the best interface performance, BarakahFlow must be added to your home screen.
                </p>
              </div>

              {/* Animated Steps */}
              <div className="w-full space-y-5">
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="flex items-center space-x-5 p-5 rounded-[24px] bg-slate-900/[0.03] dark:bg-white/[0.03] border border-transparent hover:border-emerald-500/20 transition-all group/item"
                >
                  <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-white dark:bg-slate-900 shadow-sm flex items-center justify-center text-emerald-500 group-hover/item:scale-110 transition-transform duration-300 ring-1 ring-slate-100 dark:ring-white/5">
                    <Share size={28} strokeWidth={2.5} />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 leading-none mb-2">Step 01</p>
                    <p className="text-base font-bold text-slate-700 dark:text-slate-200">
                      Tap the <span className="text-emerald-500 uppercase tracking-tight">Share</span> icon
                    </p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 1.0 }}
                  className="flex items-center space-x-5 p-5 rounded-[24px] bg-slate-900/[0.03] dark:bg-white/[0.03] border border-transparent hover:border-emerald-500/20 transition-all group/item"
                >
                  <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-white dark:bg-slate-900 shadow-sm flex items-center justify-center text-emerald-500 group-hover/item:scale-110 transition-transform duration-300 ring-1 ring-slate-100 dark:ring-white/5">
                    <PlusSquare size={28} strokeWidth={2.5} />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 leading-none mb-2">Step 02</p>
                    <p className="text-base font-bold text-slate-700 dark:text-slate-200">
                      Select <span className="text-emerald-500 whitespace-nowrap">Add to Home Screen</span>
                    </p>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Animated Directional Hint */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4, duration: 1 }}
            className="mt-14 flex flex-col items-center"
          >
            <motion.div 
              animate={{ y: [0, -12, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className="text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]"
            >
              <ArrowUp size={36} strokeWidth={3} />
            </motion.div>
            <p className="text-[11px] font-black uppercase tracking-[0.5em] text-emerald-500/80 mt-6 leading-none">
              Open in Safari First
            </p>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default InstallPWAOverlay;
