'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

export default function GlobalToast() {
  const { toast } = useAppStore();

  return (
    <AnimatePresence>
      {toast.show && (
        <motion.div
          initial={{ opacity: 0, y: -50, x: 20 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          className="fixed top-6 right-6 z-[9999] w-full max-w-sm"
        >
          <div className={`
            relative overflow-hidden group
            backdrop-blur-2xl border bg-black/40 
            ${toast.type === 'success' ? 'border-emerald-500/30' : 'border-rose-500/30'}
            rounded-[2rem] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)]
          `}>
            {/* Glossy Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>
            
            <div className="relative z-10 flex items-start gap-4">
              <div className={`
                shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center
                ${toast.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}
              `}>
                {toast.type === 'success' ? <CheckCircle2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
              </div>
              
              <div className="flex-1 pt-1">
                <h4 className={`text-xs font-black font-headline uppercase tracking-widest mb-1 ${
                    toast.type === 'success' ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {toast.type === 'success' ? 'İşlem Başarılı' : 'Sistem Hatası'}
                </h4>
                <p className="text-sm font-medium text-slate-200 leading-relaxed font-body">
                  {toast.message}
                </p>
              </div>
              
              <button 
                onClick={() => useAppStore.setState({ toast: { ...toast, show: false } })}
                className="text-slate-500 hover:text-white transition-colors p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Progress Bar */}
            <motion.div 
               initial={{ width: '100%' }}
               animate={{ width: '0%' }}
               transition={{ duration: 5, ease: 'linear' }}
               className={`absolute bottom-0 left-0 h-1 ${
                   toast.type === 'success' ? 'bg-emerald-500/50' : 'bg-rose-500/50'
               }`}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
