'use client';

import { motion } from 'framer-motion';
import { Activity, Bot, ChevronRight, Share2, MessageSquare, TrendingUp, TrendingDown, Layers, Zap } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

export default function NewsTab() {
  const { newsLoading, newsData, newsError } = useAppStore();

  const avgScore = newsData.length > 0 
    ? newsData.reduce((acc, item) => acc + (item.score || 0), 0) / newsData.length 
    : 0;

  return (
    <div className="space-y-12 pb-24 h-full">
      {/* Top News Ticker */}
      <div className="w-full h-12 bg-surface/40 backdrop-blur-md border-y border-white/5 flex items-center overflow-hidden">
        <div className="ticker-scroll whitespace-nowrap px-4 py-2">
            {[...newsData, ...newsData].map((item, i) => (
                <span key={i} className="mx-8 text-[10px] font-bold text-slate-400 flex items-center gap-2 uppercase tracking-widest">
                   <div className={`w-1.5 h-1.5 rounded-full ${item.score > 0 ? 'bg-primary' : item.score < 0 ? 'bg-secondary' : 'bg-slate-500'}`}></div>
                   {item.title}
                </span>
            ))}
            {newsData.length === 0 && <span className="text-[10px] text-slate-500 uppercase tracking-widest animate-pulse">Initializing Global Feed...</span>}
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: AI Sentiment Metrics */}
        <div className="lg:col-span-5 space-y-8">
            <motion.div 
               initial={{ opacity: 0, x: -20 }} 
               animate={{ opacity: 1, x: 0 }}
               className="glass-card rounded-3xl p-10 relative overflow-hidden flex flex-col items-center"
            >
                <div className="absolute top-0 right-0 p-4 opacity-10 text-primary">
                    <Activity className="w-24 h-24" />
                </div>
                
                <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-12">BIST AI SENTIMENT INDEX</span>
                
                <div className="relative w-64 h-32 flex items-center justify-center overflow-hidden">
                    <div className="absolute bottom-0 w-64 h-32 rounded-t-full bg-surface-container-high border-x border-t border-white/10"></div>
                    <div className="absolute bottom-0 w-64 h-32 rounded-t-full sentiment-gradient opacity-30 blur-md"></div>
                    
                    {/* Needle */}
                    <motion.div 
                        initial={{ rotate: -90 }}
                        animate={{ rotate: (avgScore * 90) }}
                        transition={{ type: 'spring', stiffness: 50 }}
                        className="absolute bottom-0 w-1 h-32 bg-white origin-bottom z-10"
                    >
                        <div className="w-3 h-3 bg-white rounded-full -ml-1 -mt-1 shadow-[0_0_15px_rgba(255,255,255,0.8)]"></div>
                    </motion.div>
                </div>

                <div className="mt-8 text-center flex flex-col gap-1 items-center">
                    <span className="text-5xl font-black font-headline text-white tracking-tighter uppercase">
                        {avgScore > 0 ? 'BULLISH' : avgScore < 0 ? 'BEARISH' : 'NEUTRAL'}
                    </span>
                    <span className="text-2xl font-black font-headline text-primary">
                        {(avgScore * 10).toFixed(1)} <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">Score</span>
                    </span>
                </div>

                <div className="mt-12 w-full grid grid-cols-3 gap-4 border-t border-white/5 pt-8">
                    <div className="text-center">
                        <span className="block text-[10px] text-slate-500 font-bold mb-1 uppercase tracking-widest">Confidence</span>
                        <span className="text-sm font-bold font-headline text-white">HIGH</span>
                    </div>
                    <div className="text-center">
                        <span className="block text-[10px] text-slate-500 font-bold mb-1 uppercase tracking-widest">Volume</span>
                        <span className="text-sm font-bold font-headline text-white">NORMAL</span>
                    </div>
                    <div className="text-center">
                        <span className="block text-[10px] text-slate-500 font-bold mb-1 uppercase tracking-widest">Shift</span>
                        <span className="text-sm font-bold font-headline text-primary">+0.2</span>
                    </div>
                </div>
            </motion.div>

            <motion.div 
               initial={{ opacity: 0, x: -20 }} 
               animate={{ opacity: 1, x: 0 }}
               transition={{ delay: 0.2 }}
               className="glass-card rounded-3xl p-8 bg-gradient-to-br from-primary/5 to-transparent border-primary/20"
            >
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Zap className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="text-lg font-black font-headline text-white tracking-tighter uppercase">Market Pulse Insight</h3>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed font-body italic mb-6">
                    "Modellerimiz son 24 saat içerisindeki haber akışında %72 oranında pozitif korelasyon saptadı. Özellikle sanayi endeksinde biriken likidite, kısa dönemli optimist beklentiyi destekliyor."
                </p>
                <div className="flex items-center justify-between pointer-events-none opacity-50">
                    <div className="flex -space-x-2">
                        {[1, 2, 3].map(i => <div key={i} className="w-6 h-6 rounded-full bg-slate-700 border border-white/10" />)}
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Distributed Analysis Active</span>
                </div>
            </motion.div>
        </div>

        {/* Right Column: Evidence Trail */}
        <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between mb-8 px-2">
                <div className="flex items-center gap-3">
                    <Layers className="w-5 h-5 text-white/40" />
                    <h3 className="text-xl font-black font-headline text-white tracking-tighter uppercase">Intelligence Trail</h3>
                </div>
                <div className="flex items-center gap-2">
                    <button className="p-2 bg-white/5 rounded-lg text-slate-500 hover:text-white transition-colors"><MessageSquare className="w-4 h-4" /></button>
                    <button className="p-2 bg-white/5 rounded-lg text-slate-500 hover:text-white transition-colors"><Share2 className="w-4 h-4" /></button>
                </div>
            </div>

            <div className="space-y-4 max-h-[1000px] overflow-y-auto pr-4 custom-scrollbar">
                {newsLoading && [1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="h-24 bg-surface/40 rounded-2xl animate-pulse" />
                ))}
                
                {newsData.map((item, idx) => (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        key={idx}
                        className="group glass-card rounded-2xl p-6 hover:bg-[#1f2022] transition-all cursor-pointer border-l-4"
                        style={{ borderLeftColor: item.score > 0 ? '#00f2ff' : item.score < 0 ? '#ff007a' : '#343537' }}
                    >
                        <div className="flex items-start justify-between gap-6">
                            <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{new URL(item.source).hostname.replace('www.', '')}</span>
                                    <span className="text-[10px] text-slate-600 font-bold uppercase">• 2h ago</span>
                                </div>
                                <h4 className="text-md font-bold font-headline text-white group-hover:text-primary transition-colors leading-tight">{item.title}</h4>
                                <p className="text-xs text-slate-500 font-medium line-clamp-2 leading-relaxed">{item.description}</p>
                            </div>
                            
                            <div className="flex flex-col items-end gap-3 shrink-0">
                                <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-white/5 border border-white/5">
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${item.score > 0 ? 'text-primary' : item.score < 0 ? 'text-secondary' : 'text-slate-500'}`}>
                                        {item.score > 0 ? '+ SCORE' : item.score < 0 ? '- SCORE' : 'NEUTRAL'}
                                    </span>
                                </div>
                                <ChevronRight className="w-4 h-4 text-slate-700 group-hover:text-white transform group-hover:translate-x-1 transition-all" />
                            </div>
                        </div>

                        {item.ai_comment && (
                            <div className="mt-6 pt-4 border-t border-white/5 flex items-start gap-4">
                                <Bot className="w-4 h-4 text-primary shrink-0 opacity-50 mt-1" />
                                <div className="bg-primary/5 rounded-xl p-4 border border-primary/10 w-full relative">
                                    <div className="absolute top-2 right-4 text-primary font-bold italic opacity-20 uppercase text-[10px]">AI Insight</div>
                                    <p className="text-xs text-primary/80 leading-relaxed font-body font-medium italic">
                                        "{item.ai_comment}"
                                    </p>
                                </div>
                            </div>
                        )}
                    </motion.div>
                ))}
                
                {newsError && (
                    <div className="glass-card rounded-2xl p-8 text-center text-secondary border-secondary/20">
                        {newsError}
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}
