'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Play, Crosshair, Cpu, AlertTriangle, Network, ShieldAlert, Zap, Terminal, Microscope, ShieldCheck, Activity, Globe, TrendingDown, Eye } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { api } from '@/services/api';

const AGENT_META: Record<string, { name: string; color: string; icon: any; bg: string }> = {
  quant: { name: 'Kuantum Motoru', color: 'text-blue-400', bg: 'bg-blue-500/10', icon: Cpu },
  fundamental: { name: 'Temel Çekirdek', color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: Zap },
  insider: { name: 'İçeriden Bilgi', color: 'text-amber-400', bg: 'bg-amber-500/10', icon: Eye },
  bearish: { name: 'Ayı Tuzağı', color: 'text-rose-400', bg: 'bg-rose-500/10', icon: TrendingDown },
  global: { name: 'Küresel Radar', color: 'text-purple-400', bg: 'bg-purple-500/10', icon: Globe },
  macro: { name: 'Makro Düğüm', color: 'text-orange-400', bg: 'bg-orange-500/10', icon: Network },
  critic: { name: 'Mantık Denetçisi', color: 'text-secondary', bg: 'bg-secondary/10', icon: Microscope },
  master: { name: 'Sistem Protokolü', color: 'text-white', bg: 'bg-slate-500/10', icon: ShieldCheck }
};

export default function WarRoomTab() {
  const { warRoomTicker, setWarRoomTicker, warRoomDebate, setWarRoomDebate, warRoomLoading, setWarRoomLoading, warRoomError, setWarRoomError } = useAppStore();
  const [displayedMessages, setDisplayedMessages] = useState<any[]>([]);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (warRoomDebate.length === 0) {
      setDisplayedMessages([]);
      return;
    }

    setDisplayedMessages([]);
    let currentIdx = 0;
    
    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        if (currentIdx < warRoomDebate.length) {
          setDisplayedMessages(prev => [...prev, warRoomDebate[currentIdx]]);
          currentIdx++;
        } else {
          clearInterval(interval);
        }
      }, 2000); 
      return () => clearInterval(interval);
    }, 1000);

    return () => clearTimeout(timer);
  }, [warRoomDebate]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayedMessages, warRoomLoading]);

  const handleStartSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = warRoomTicker.trim().toUpperCase();
    if (!t) return;
    
    setWarRoomTicker(t);
    setWarRoomLoading(true);
    setWarRoomError(null);
    setWarRoomDebate([]);
    setDisplayedMessages([]);

    try {
      const data = await api.startWarRoomDebate(t);
      if (data && data.debate) {
        setWarRoomDebate(data.debate);
      } else {
        setWarRoomError('Sinirsel el sıkışma başarısız oldu. Ajanlar yanıt vermiyor.');
      }
    } catch (err: any) {
      setWarRoomError(err.message || 'İletim hatası.');
    } finally {
      setWarRoomLoading(false);
    }
  };

  const handleTrade = (side: 'AL' | 'SAT') => {
    useAppStore.getState().executeTrade(warRoomTicker, side, 10000);
  };

  return (
    <div className="space-y-12 pb-24">
      {/* Tactical Header */}
      <section className="text-center max-w-4xl mx-auto pt-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-[2rem] bg-secondary/10 border border-secondary/20 flex items-center justify-center shadow-[0_0_50px_rgba(255,0,122,0.1)]">
                    <Crosshair className="w-8 h-8 text-secondary" />
                </div>
                <h2 className="text-5xl font-black font-headline text-white tracking-tighter uppercase leading-none">Taktik <span className="text-secondary">Savaş Odası</span></h2>
                <p className="text-lg text-slate-400 font-body italic leading-relaxed max-w-2xl px-6">
                    Hedef hisseniz üzerinde uzman yapay zeka motorları arasında vahşi ve sınırsız bir tartışma. Çelişkilerin ortaya çıkışını ve kurumsal gerçeğin doğuşunu izleyin.
                </p>
            </div>

            <div className="max-w-xl mx-auto pt-4 w-full px-6">
                <form onSubmit={handleStartSearch} className="relative group">
                    <div className="absolute inset-0 bg-secondary/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative flex items-center bg-[#121315] border border-white/5 rounded-2xl p-2 shadow-2xl overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-secondary opacity-50"></div>
                        <Search className="w-5 h-5 text-slate-500 ml-4 shrink-0" />
                        <input
                            type="text"
                            value={warRoomTicker}
                            onChange={(e) => setWarRoomTicker(e.target.value.toUpperCase())}
                            placeholder="HEDEF SEMBOL (ÖR: THYAO)"
                            className="flex-1 bg-transparent border-none text-white text-lg font-headline font-black placeholder:text-slate-700 focus:outline-none focus:ring-0 px-4 py-3 uppercase tracking-widest"
                            disabled={warRoomLoading || (warRoomDebate.length > 0 && displayedMessages.length < warRoomDebate.length)}
                        />
                        <button
                            type="submit"
                            disabled={warRoomLoading || !warRoomTicker.trim() || (warRoomDebate.length > 0 && displayedMessages.length < warRoomDebate.length)}
                            className="bg-secondary hover:bg-secondary-light text-white px-8 py-3 rounded-xl font-black font-headline text-sm tracking-widest transition-all active:scale-[0.98] disabled:opacity-50 flex items-center gap-2 shadow-[0_0_20px_rgba(255,0,122,0.3)]"
                        >
                            {warRoomLoading ? 'SENKRONİZE EDİLİYOR...' : 'ZİRVEYİ BAŞLAT'}
                        </button>
                    </div>
                </form>
            </div>
        </motion.div>
      </section>

      {/* States */}
      {warRoomError && (
        <div className="max-w-xl mx-auto glass-card p-6 rounded-2xl border-secondary/20 flex items-center gap-4 text-secondary">
          <AlertTriangle className="w-6 h-6 shrink-0" />
          <span className="font-bold text-xs uppercase tracking-widest">{warRoomError}</span>
        </div>
      )}

      {warRoomLoading && (
        <div className="flex flex-col items-center justify-center py-20 gap-8">
            <div className="relative w-24 h-24">
                <div className="absolute inset-0 border-4 border-secondary/20 rounded-full animate-[ping_3s_linear_infinite]"></div>
                <div className="absolute inset-0 border-t-4 border-secondary rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <Activity className="w-8 h-8 text-secondary animate-pulse" />
                </div>
            </div>
            <div className="text-center space-y-1">
                <h3 className="text-xl font-black font-headline text-white tracking-widest uppercase">Savaş Alanı Hazırlanıyor</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em]">Şifreli nöral bağlantı kuruluyor...</p>
            </div>
        </div>
      )}

      {/* Discussion Interface */}
      {!warRoomLoading && warRoomDebate.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-5xl mx-auto space-y-6">
            <div className="glass-card rounded-[2.5rem] p-10 min-h-[600px] flex flex-col relative overflow-hidden bg-[#0a0b0d]/50">
                <div className="absolute inset-0 scanline-effect opacity-5 pointer-events-none"></div>
                
                <div className="relative z-10 flex-1 flex flex-col gap-8 overflow-y-auto pr-4 custom-scrollbar">
                    <AnimatePresence>
                        {displayedMessages.map((msg, idx) => {
                            if (!msg || !msg.agent || msg.agent === 'master') return null; // Hide master from normal bubbles
                            const meta = AGENT_META[msg.agent] || AGENT_META['quant'];
                            const isLeft = idx % 2 === 0;
                            
                            return (
                                <motion.div 
                                    key={idx}
                                    initial={{ opacity: 0, x: isLeft ? -10 : 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className={`flex w-full ${isLeft ? 'justify-start' : 'justify-end'}`}
                                >
                                    <div className={`flex gap-6 max-w-[85%] md:max-w-[75%] ${isLeft ? 'flex-row' : 'flex-row-reverse'}`}>
                                        <div className={`shrink-0 w-14 h-14 rounded-2xl ${meta.bg} border border-white/5 flex items-center justify-center shadow-2xl ring-1 ring-white/5`}>
                                            <meta.icon className={`w-7 h-7 ${meta.color}`} />
                                        </div>
                                        
                                        <div className={`space-y-2 ${isLeft ? 'text-left' : 'text-right'}`}>
                                            <div className="flex items-center gap-3 px-1 text-[10px] font-black font-headline tracking-[0.2em] text-slate-500 uppercase">
                                                <span className={meta.color}>{meta.name}</span>
                                                <span className="opacity-20">•</span>
                                                <span className="opacity-40">Onaylı Düğüm</span>
                                            </div>
                                            <div className={`p-6 rounded-[2rem] text-[15px] leading-relaxed relative font-body ${
                                                isLeft 
                                                    ? 'bg-[#121315] border border-white/5 text-slate-300 rounded-tl-none' 
                                                    : 'bg-secondary/10 border border-secondary/20 text-white rounded-tr-none'
                                            } shadow-lg backdrop-blur-md italic`}>
                                                {isLeft && <Terminal className="w-4 h-4 text-slate-500 mb-3 opacity-30" />}
                                                "{msg.text}"
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                    
                    {displayedMessages.length < warRoomDebate.length && (
                        <div className={`flex w-full ${displayedMessages.length % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                            <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex gap-2 items-center">
                                <div className="w-1.5 h-1.5 bg-secondary rounded-full animate-bounce"></div>
                                <div className="w-1.5 h-1.5 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                <div className="w-1.5 h-1.5 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                            </div>
                        </div>
                    )}
                    
                    <div ref={chatBottomRef}></div>
                </div>

                {/* Footer Verdict */}
                {displayedMessages.length === warRoomDebate.length && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        className="relative z-10 mt-16 pt-16 border-t border-white/5"
                    >
                        {(() => {
                            const masterMsg = warRoomDebate.find(m => m.agent === 'master')?.text || '';
                            const isAL = /\bAL\b/i.test(masterMsg);
                            const isSAT = /\bSAT\b/i.test(masterMsg);
                            const isTUT = /\bTUT\b/i.test(masterMsg);
                            
                            const statusColor = isAL ? 'text-emerald-500' : isSAT ? 'text-red-500' : 'text-blue-500';
                            const bgColor = isAL ? 'bg-emerald-500/5' : isSAT ? 'bg-red-500/5' : 'bg-blue-500/5';
                            const borderColor = isAL ? 'border-emerald-500/20' : isSAT ? 'border-red-500/20' : 'border-blue-500/20';

                            return (
                                <div className="max-w-4xl mx-auto space-y-12">
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="flex items-center gap-3 px-4 py-1.5 rounded-full border border-white/5 bg-white/5 backdrop-blur-xl">
                                            <div className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse shadow-[0_0_10px_#ff007a]"></div>
                                            <span className="text-[10px] font-black font-headline tracking-[0.3em] text-slate-400 uppercase">Protokol Analizi Tamamlandı</span>
                                        </div>
                                    </div>

                                    <div className={`relative p-12 rounded-[3rem] border ${borderColor} ${bgColor} backdrop-blur-3xl overflow-hidden group`}>
                                        {/* Background Decoration */}
                                        <div className="absolute top-0 right-0 w-96 h-96 bg-secondary/5 rounded-full blur-[100px] -mr-48 -mt-48 transition-all group-hover:bg-secondary/10"></div>
                                        
                                        <div className="relative z-10 grid grid-cols-1 md:grid-cols-[1fr_250px] gap-12 items-center">
                                            <div className="space-y-6 text-left border-l border-white/5 pl-10">
                                                <div className="space-y-1">
                                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.4em]">Sistem Kararı</span>
                                                    <h4 className="text-3xl font-black font-headline text-white uppercase italic tracking-tighter">Ni̇hai̇ Strateji̇k Verdi̇kt</h4>
                                                </div>
                                                <p className="text-xl text-slate-300 font-body leading-relaxed italic pr-4">
                                                    {masterMsg.replace(/TAKTIK KARAR: [A-Z]+/gi, '').trim()}
                                                </p>
                                                
                                                {/* Trade Actions */}
                                                <div className="flex items-center gap-4 pt-4">
                                                    <button 
                                                      onClick={() => handleTrade('AL')}
                                                      className="px-8 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black font-headline text-xs tracking-widest transition-all active:scale-95 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                                                    >
                                                      SİMÜLASYON: AL
                                                    </button>
                                                    <button 
                                                      onClick={() => handleTrade('SAT')}
                                                      className="px-8 py-3 rounded-xl bg-rose-500 hover:bg-rose-400 text-black font-black font-headline text-xs tracking-widest transition-all active:scale-95 shadow-[0_0_20px_rgba(244,63,94,0.3)]"
                                                    >
                                                      SİMÜLASYON: SAT
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-center gap-4 py-8 px-6 bg-black/40 rounded-[2rem] border border-white/5 shadow-2xl">
                                                <ShieldCheck className={`w-12 h-12 ${statusColor}`} />
                                                <div className="text-center">
                                                    <span className={`text-4xl font-headline font-black tracking-tighter ${statusColor}`}>
                                                        {isAL ? 'AL' : isSAT ? 'SAT' : 'TUT'}
                                                    </span>
                                                    <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest mt-1">Eylem Emri</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-center gap-4 pb-12">
                                        <p className="text-[10px] text-slate-600 font-bold uppercase tracking-[0.6em] italic">
                                            Terminal Session • 0x{Math.floor(Math.random()*1000000).toString(16).toUpperCase()}
                                        </p>
                                    </div>
                                </div>
                            );
                        })()}
                    </motion.div>
                )}
            </div>
        </motion.div>
      )}
    </div>
  );
}
