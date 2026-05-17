'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, AlertTriangle, Hexagon, TrendingUp, TrendingDown, Bot, Globe, Zap, Cpu, Activity, ShieldCheck } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

export default function CommoditiesTab() {
  const { commoditiesLoading, commoditiesData, commoditiesError } = useAppStore();

  return (
    <div className="space-y-12 pb-24">
      {/* Global Header */}
      <section className="flex flex-col lg:flex-row justify-between items-end gap-8 border-b border-white/5 pb-10">
        <div className="max-w-2xl space-y-6">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                    <Globe className="w-5 h-5 text-amber-500" />
                </div>
                <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.4em]">Global Resource Flux</span>
            </div>
            <h2 className="text-5xl font-black font-headline text-white tracking-tighter uppercase leading-none">Commodity <span className="text-slate-500">Radar</span></h2>
            <p className="text-lg text-slate-400 font-body italic leading-relaxed">
                Real-time scanning of precious metals and energy sectors. Neural projections synthesized via Llama 3.1 & PyTorch LSTM agents.
            </p>
        </div>

        <div className="flex items-center gap-4 bg-surface/40 p-4 rounded-[1.5rem] border border-white/5 backdrop-blur-md">
            <div className="flex flex-col items-end">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Network Status</span>
                <span className="text-xs font-black text-primary uppercase">Synchronized</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Activity className="w-5 h-5 text-primary animate-pulse" />
            </div>
        </div>
      </section>

      {/* Main Content Area */}
      <AnimatePresence mode="wait">
        {commoditiesLoading ? (
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="min-h-[500px] flex flex-col items-center justify-center gap-8"
            >
                <div className="relative w-20 h-20">
                    <div className="absolute inset-0 border-2 border-amber-500/20 rounded-full animate-ping"></div>
                    <div className="absolute inset-0 border-t-2 border-amber-500 rounded-full animate-spin"></div>
                    <Globe className="absolute inset-0 m-auto w-6 h-6 text-amber-500 animate-pulse" />
                </div>
                <div className="text-center">
                    <h3 className="text-xl font-black font-headline text-white tracking-widest uppercase">Aggregating Flux</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-2">Connecting to COMEX & NYMEX nodes...</p>
                </div>
            </motion.div>
        ) : commoditiesError ? (
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="max-w-2xl mx-auto glass-card p-12 rounded-[2.5rem] border-secondary/20 flex flex-col items-center text-center gap-6"
            >
                <AlertTriangle className="w-12 h-12 text-secondary" />
                <div className="space-y-2">
                    <h3 className="text-xl font-black font-headline text-white uppercase">Radar Failure</h3>
                    <p className="text-slate-400 font-body text-sm">{commoditiesError}</p>
                </div>
            </motion.div>
        ) : (
            <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
                {["GC=F", "SI=F", "CL=F"].map((ticker, idx) => {
                    const data = commoditiesData[ticker];
                    if (!data) return null;

                    const isUp = data.direction === "Yükseliş";
                    const names: { [key: string]: string } = {
                        "GC=F": "GOLD",
                        "SI=F": "SILVER",
                        "CL=F": "CRUDE OIL"
                    };
                    const icons: { [key: string]: any } = {
                        "GC=F": Hexagon,
                        "SI=F": ShieldCheck,
                        "CL=F": Cpu
                    };
                    const Icon = icons[ticker] || Zap;
                    
                    return (
                        <motion.div 
                            key={ticker}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="glass-card rounded-[2.5rem] p-10 bg-[#0a0b0d]/50 border-white/5 hover:border-amber-500/20 transition-all group relative overflow-hidden flex flex-col h-full"
                        >
                            {/* Decorative Glow */}
                            <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl -mr-24 -mt-24 pointer-events-none group-hover:bg-amber-500/10 transition-colors"></div>
                            
                            <div className="relative z-10 flex flex-col h-full">
                                <div className="flex justify-between items-start mb-10">
                                    <div className="space-y-4">
                                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full">
                                            <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></div>
                                            <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest">{ticker}</span>
                                        </div>
                                        <h3 className="text-4xl font-black font-headline text-white tracking-tighter uppercase">{names[ticker]}</h3>
                                    </div>
                                    <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center shadow-2xl group-hover:border-amber-500/30 transition-all">
                                        <Icon className="w-8 h-8 text-amber-400 group-hover:scale-110 transition-transform" />
                                    </div>
                                </div>

                                <div className="space-y-2 mb-10">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Real-Time Quote</span>
                                    <p className="text-5xl font-black font-headline text-white tracking-tighter uppercase whitespace-nowrap">
                                        ${data.current_price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-10">
                                    <div className="glass-card bg-[#121315]/50 p-4 rounded-2xl border-white/5 border-l-2 border-l-amber-500/50">
                                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-2">Neural Target</span>
                                        <div className={`flex items-center gap-2 font-black font-headline text-lg ${isUp ? 'text-primary' : 'text-secondary'}`}>
                                            {isUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                            ${data.predicted_price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </div>
                                    </div>
                                    <div className="glass-card bg-[#121315]/50 p-4 rounded-2xl border-white/5">
                                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-2">Technical Force</span>
                                        <div className="flex items-center justify-between">
                                            <span className="text-white font-black font-headline text-lg italic">RSI {data.rsi.toFixed(1)}</span>
                                            <div className="w-2 h-2 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.2)]" style={{ 
                                                backgroundColor: data.rsi > 70 ? '#ff007a' : data.rsi < 30 ? '#00f2ff' : '#475569' 
                                            }}></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-auto glass-card bg-[#121315] p-6 rounded-[1.5rem] border-white/5 relative group-hover:border-amber-500/10 transition-colors">
                                    <div className="absolute -top-3 left-6 px-3 py-1 bg-[#121315] border border-white/5 rounded-full flex items-center gap-2 shadow-xl">
                                        <Bot className="w-3 h-3 text-amber-500" />
                                        <span className="text-[8px] font-black text-white uppercase tracking-widest">Neural Logic</span>
                                    </div>
                                    <p className="text-xs text-slate-400 leading-relaxed font-body italic">
                                        "{data.reasoning}"
                                    </p>
                                    <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                                        <span className="text-[8px] font-black text-slate-600 uppercase tracking-[0.2em]">Confidence Matrix Verified</span>
                                        <div className="flex gap-1">
                                            {[1,2,3].map(i => <div key={i} className="w-1 h-1 bg-amber-500/30 rounded-full"></div>)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
