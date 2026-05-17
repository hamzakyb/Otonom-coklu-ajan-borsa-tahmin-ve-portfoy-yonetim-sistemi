'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Loader2, 
  AlertTriangle, 
  Eye, 
  Activity, 
  ShieldCheck, 
  Zap, 
  Info, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  X,
  ArrowRightLeft,
  ChevronRight
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

export default function HeatmapTab() {
  const { heatmapLoading, heatmapData, heatmapError, livePrices, executeTrade } = useAppStore();
  const [selectedStock, setSelectedStock] = useState<any>(null);
  const [tradeMode, setTradeMode] = useState<'TL' | 'LOT'>('TL');
  const [tradeSide, setTradeSide] = useState<'AL' | 'SAT'>('AL');
  const [amountValue, setAmountValue] = useState<string>('10000');

  // Modal Calculation Logic
  const calculation = useMemo(() => {
    if (!selectedStock) return { tl: 0, lot: 0 };
    const price = livePrices[selectedStock.ticker] || selectedStock.price || 1;
    const val = parseFloat(amountValue) || 0;

    if (tradeMode === 'TL') {
      return { tl: val, lot: Math.floor(val / price) };
    } else {
      return { tl: val * price, lot: Math.floor(val) };
    }
  }, [selectedStock, tradeMode, amountValue, livePrices]);

  const handleTrade = async () => {
    if (!selectedStock) return;
    const finalAmountTl = calculation.tl;
    await executeTrade(selectedStock.ticker, tradeSide, finalAmountTl);
    setSelectedStock(null);
  };

  return (
    <div className="space-y-12 pb-24 relative">
      {/* Vision Header */}
      <section className="flex flex-col lg:flex-row justify-between items-end gap-8 border-b border-white/5 pb-10">
        <div className="max-w-2xl space-y-6">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Eye className="w-5 h-5 text-primary" />
                </div>
                <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Vizyon Matrisi</span>
            </div>
            <h2 className="text-5xl font-black font-headline text-white tracking-tighter uppercase leading-none">Piyasa <span className="text-slate-500">Tarayıcı</span></h2>
            <p className="text-lg text-slate-400 font-body italic leading-relaxed">
                BIST 100 bileşenlerinin otonom teknik taraması; RSI, MACD ve hacim momentumuna dayalı gerçek zamanlı sinyal sentezi. Tıklayarak işlem yapın.
            </p>
        </div>

        <div className="flex flex-wrap gap-3 bg-surface/40 p-4 rounded-[1.5rem] border border-white/5 backdrop-blur-md">
            {[
                { label: 'GÜÇLÜ AL', color: '#10b981' },
                { label: 'AL', color: '#059669', opacity: 0.6 },
                { label: 'NÖTR', color: '#475569' },
                { label: 'SAT', color: '#dc2626', opacity: 0.6 },
                { label: 'GÜÇLÜ SAT', color: '#ef4444' }
            ].map((sg) => (
                <div key={sg.label} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: sg.color, opacity: sg.opacity || 1 }}></div>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{sg.label}</span>
                </div>
            ))}
        </div>
      </section>

      {/* Main Grid Area */}
      <div className="min-h-[600px] relative">
            <AnimatePresence mode="wait">
                {heatmapLoading ? (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 flex flex-col items-center justify-center gap-6"
                    >
                        <div className="w-20 h-20 relative">
                            <div className="absolute inset-0 border-2 border-primary/20 rounded-full animate-ping"></div>
                            <div className="absolute inset-0 border-t-2 border-primary rounded-full animate-spin"></div>
                            <Activity className="absolute inset-0 m-auto w-6 h-6 text-primary animate-pulse" />
                        </div>
                        <div className="text-center">
                            <h3 className="text-xl font-black font-headline text-white tracking-widest uppercase">Matris Taranıyor</h3>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-2">Teknik Vektörler İşleniyor...</p>
                        </div>
                    </motion.div>
                ) : heatmapError ? (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }}
                        className="glass-card p-12 rounded-[2.5rem] border-secondary/20 flex flex-col items-center text-center gap-6"
                    >
                        <AlertTriangle className="w-12 h-12 text-secondary" />
                        <div className="space-y-2">
                            <h3 className="text-xl font-black font-headline text-white uppercase">Görüntü Kesildi</h3>
                            <p className="text-slate-400 font-body text-sm max-w-md">{heatmapError}</p>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }}
                        className="glass-card rounded-[2.5rem] p-8 bg-[#0a0b0d]/50"
                    >
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
                            {heatmapData.map((node, idx) => {
                                let glowColor = 'transparent';
                                let textColor = 'text-slate-500';
                                let bgClass = 'bg-white/5 border-white/5 hover:bg-white/10';

                                if (node.signal === 'GÜÇLÜ AL') {
                                    glowColor = 'rgba(16, 185, 129, 0.4)';
                                    textColor = 'text-emerald-400';
                                    bgClass = 'bg-emerald-500/10 border-emerald-500/30';
                                } else if (node.signal === 'AL') {
                                    glowColor = 'rgba(16, 185, 129, 0.2)';
                                    textColor = 'text-emerald-500/80';
                                    bgClass = 'bg-emerald-500/5 border-emerald-500/20';
                                } else if (node.signal === 'GÜÇLÜ SAT') {
                                    glowColor = 'rgba(239, 68, 68, 0.4)';
                                    textColor = 'text-red-400';
                                    bgClass = 'bg-red-500/10 border-red-500/30';
                                } else if (node.signal === 'SAT') {
                                    glowColor = 'rgba(239, 68, 68, 0.2)';
                                    textColor = 'text-red-500/80';
                                    bgClass = 'bg-red-500/5 border-red-500/20';
                                }

                                const currentPrice = livePrices[node.ticker] || node.price;
                                
                                return (
                                    <motion.div
                                        key={node.ticker}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        onClick={() => setSelectedStock(node)}
                                        whileHover={{ 
                                            scale: 1.05, 
                                            boxShadow: `0 0 30px ${glowColor}`,
                                            zIndex: 20
                                        }}
                                        transition={{ delay: (idx % 40) * 0.01 }}
                                        className={`relative group aspect-square rounded-2xl border flex flex-col items-center justify-center cursor-pointer transition-all ${bgClass}`}
                                    >
                                        <div className="absolute top-1 right-1">
                                            {node.signal.includes('GÜÇLÜ') && <Zap className={`w-2.5 h-2.5 ${textColor} fill-current animate-pulse`} />}
                                        </div>
                                        
                                        <span className={`font-black font-headline text-sm tracking-tighter uppercase ${textColor}`}>
                                            {node.ticker.split('.')[0]}
                                        </span>
                                        <span className="text-[10px] font-bold text-slate-500 tracking-widest mt-1">
                                            ₺{currentPrice?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                        </span>

                                        {/* Precision Tooltip (Signal Anatomy) */}
                                        <div className="absolute bottom-[calc(100%-8px)] left-1/2 -translate-x-1/2 mb-2 w-72 glass-card p-6 opacity-0 group-hover:opacity-100 transition-all pointer-events-none group-hover:pointer-events-auto z-50 shadow-2xl scale-95 group-hover:scale-100 bg-[#0d0e10] border border-white/10 rounded-3xl">
                                            {/* Stable Hover Bridge */}
                                            <div className="absolute top-full left-0 w-full h-8 bg-transparent" />

                                            <div className="flex items-center justify-between mb-5">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                                        <ShieldCheck className="w-4 h-4 text-primary" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-black font-headline text-white text-[10px] tracking-widest uppercase">{node.ticker}</h4>
                                                        <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Sinyal Anatomisi</p>
                                                    </div>
                                                </div>
                                                <div className={`px-2 py-1 rounded-md text-[9px] font-black uppercase ${
                                                    node.score >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                                                }`}>
                                                    {node.score > 0 ? '+' : ''}{node.score} PTS
                                                </div>
                                            </div>
                                            
                                            {/* Hybrid Score Bar */}
                                            <div className="mb-6 space-y-2">
                                                <div className="flex justify-between text-[8px] font-black text-slate-500 uppercase tracking-widest">
                                                    <span>Güven Endeksi</span>
                                                    <span>{Math.abs(node.score).toFixed(1)} / 10</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                                                    <motion.div 
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${(Math.abs(node.score) / 10) * 100}%` }}
                                                        className={`h-full ${node.score >= 4.5 ? 'bg-emerald-500' : node.score >= 1.5 ? 'bg-emerald-500/60' : node.score <= -4.5 ? 'bg-rose-500' : node.score <= -1.5 ? 'bg-rose-500/60' : 'bg-slate-500'}`}
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                {/* Component Scores */}
                                                <div className="grid grid-cols-3 gap-2">
                                                    <div className="p-2 rounded-xl bg-white/5 border border-white/5 text-center">
                                                        <div className="text-[7px] text-slate-500 font-black uppercase mb-1">TEKNİK</div>
                                                        <div className={`text-[10px] font-black ${node.tech_score >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{node.tech_score > 0 ? '+' : ''}{node.tech_score}</div>
                                                    </div>
                                                    <div className="p-2 rounded-xl bg-white/5 border border-white/5 text-center">
                                                        <div className="text-[7px] text-slate-500 font-black uppercase mb-1">AI</div>
                                                        <div className={`text-[10px] font-black ${node.ai_score >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{node.ai_score > 0 ? '+' : ''}{node.ai_score}</div>
                                                    </div>
                                                    <div className="p-2 rounded-xl bg-white/5 border border-white/5 text-center">
                                                        <div className="text-[7px] text-slate-500 font-black uppercase mb-1">DUYGU</div>
                                                        <div className={`text-[10px] font-black ${node.sent_score >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{node.sent_score > 0 ? '+' : ''}{node.sent_score}</div>
                                                    </div>
                                                </div>

                                                {/* Fibonacci Level */}
                                                {node.nearest_fib && (
                                                    <div className="flex items-center justify-between p-3 rounded-2xl bg-indigo-500/5 border border-indigo-500/10">
                                                        <div className="flex items-center gap-2">
                                                            <Activity className="w-3 h-3 text-indigo-400" />
                                                            <span className="text-[8px] font-black text-indigo-300 uppercase tracking-widest">FIB Seviyesi</span>
                                                        </div>
                                                        <span className="text-[10px] font-black text-white font-headline tracking-widest">
                                                            {node.nearest_fib} ({node.fibonacci_levels?.[node.nearest_fib]} ₺)
                                                        </span>
                                                    </div>
                                                )}

                                                <div className="pt-2 border-t border-white/5 space-y-2">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">RSI (14)</span>
                                                        <span className="text-[9px] font-black font-headline text-white">{typeof node.rsi === 'number' ? node.rsi.toFixed(2) : '0.00'}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">MACD Trend</span>
                                                        <span className={`text-[9px] font-black font-headline ${node.macd > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                            {typeof node.macd === 'number' ? node.macd.toFixed(4) : '0.0000'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-r-[10px] border-t-[10px] border-t-[#0d0e10] border-l-transparent border-r-transparent"></div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
      </div>

      {/* Trade Modal */}
      <AnimatePresence>
        {selectedStock && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setSelectedStock(null)}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />
                
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative w-full max-w-lg glass-card rounded-[2.5rem] border-white/10 bg-[#0a0b0d] p-8 overflow-hidden"
                >
                    {/* Background Gradients */}
                    <div className={`absolute top-0 left-0 w-full h-1 transition-colors duration-500 ${tradeSide === 'AL' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    <div className={`absolute -top-24 -right-24 w-64 h-64 blur-[100px] opacity-20 pointer-events-none ${tradeSide === 'AL' ? 'bg-emerald-500' : 'bg-rose-500'}`} />

                    <div className="flex justify-between items-center mb-10">
                        <div className="space-y-1">
                            <h3 className="text-3xl font-black font-headline text-white tracking-widest uppercase">
                                {selectedStock.ticker.replace('.IS', '')}
                                <span className="text-slate-500 ml-2">İşlem</span>
                            </h3>
                            <div className="flex items-center gap-2">
                                <Activity className="w-4 h-4 text-primary" />
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest italic">Anlık Fiyat: ₺{(livePrices[selectedStock.ticker] || selectedStock.price).toLocaleString('tr-TR')}</span>
                            </div>
                        </div>
                        <button 
                            onClick={() => setSelectedStock(null)}
                            className="p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 text-slate-500 hover:text-white transition-all"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="space-y-8">
                        {/* Side Selector */}
                        <div className="flex p-2 rounded-2xl bg-white/5 border border-white/5 gap-2">
                            <button 
                                onClick={() => setTradeSide('AL')}
                                className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl transition-all font-black font-headline uppercase tracking-widest text-sm ${
                                    tradeSide === 'AL' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-slate-500 hover:text-slate-300'
                                }`}
                            >
                                <TrendingUp className="w-4 h-4" />
                                ALIM
                            </button>
                            <button 
                                onClick={() => setTradeSide('SAT')}
                                className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl transition-all font-black font-headline uppercase tracking-widest text-sm ${
                                    tradeSide === 'SAT' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'text-slate-500 hover:text-slate-300'
                                }`}
                            >
                                <TrendingDown className="w-4 h-4" />
                                SATIM
                            </button>
                        </div>

                        {/* Amount Input */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                                    İşlem {tradeMode === 'TL' ? 'Tutarı' : 'Adedi'}
                                </label>
                                <button 
                                    onClick={() => setTradeMode(tradeMode === 'TL' ? 'LOT' : 'TL')}
                                    className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-widest hover:text-primary/80 transition-colors"
                                >
                                    <ArrowRightLeft className="w-3 h-3" />
                                    {tradeMode === 'TL' ? 'Lot Gir' : 'TL Gir'}
                                </button>
                            </div>
                            
                            <div className="relative group">
                                <input 
                                    type="number"
                                    value={amountValue}
                                    onChange={(e) => setAmountValue(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-6 px-8 text-3xl font-black font-headline text-white outline-none focus:border-primary/40 focus:bg-white/10 transition-all tabular-nums"
                                    placeholder="0"
                                    autoFocus
                                />
                                <div className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-500 font-black font-headline text-xl">
                                    {tradeMode}
                                </div>
                            </div>

                            {/* Conversion Info */}
                            <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tahmini Karşılık</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-black text-white font-headline tracking-widest">
                                        {tradeMode === 'TL' 
                                            ? `${calculation.lot.toLocaleString('tr-TR')} ADET` 
                                            : `₺${calculation.tl.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`
                                        }
                                    </span>
                                    <ChevronRight className="w-4 h-4 text-primary" />
                                </div>
                            </div>
                        </div>

                        {/* Execute Button */}
                        <button 
                            onClick={handleTrade}
                            className={`w-full py-6 rounded-[1.5rem] font-black font-headline uppercase tracking-widest text-lg transition-all active:scale-95 shadow-2xl flex items-center justify-center gap-4 ${
                                tradeSide === 'AL' 
                                ? 'bg-emerald-500 text-white hover:bg-emerald-400' 
                                : 'bg-rose-500 text-white hover:bg-rose-400'
                            }`}
                        >
                            {tradeSide === 'AL' ? 'HİSSEYİ KASAYA EKLE' : 'POZİSYONU KAPAT'}
                            <Zap className="w-5 h-5 fill-current" />
                        </button>
                    </div>

                    <p className="mt-8 text-center text-[10px] font-bold text-slate-600 uppercase tracking-widest flex items-center justify-center gap-2">
                        <ShieldCheck className="w-3 h-3 text-primary" />
                        Sanal Bakiye Üzerinden Simüle Edilir
                    </p>
                </motion.div>
            </div>
        )}
      </AnimatePresence>
    </div>
  );
}
