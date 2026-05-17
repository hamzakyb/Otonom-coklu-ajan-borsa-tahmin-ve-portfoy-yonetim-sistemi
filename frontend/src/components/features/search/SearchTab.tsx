'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2, AlertTriangle, TrendingUp, TrendingDown, Bot, Info, Globe, Cpu, Target, ShieldCheck, Zap } from 'lucide-react';
import { useAppStore, TabType } from '@/store/useAppStore';
import { api } from '@/services/api';

export default function SearchTab() {
  const {
    searchQuery, setSearchQuery,
    availableStocks,
    filteredStocks, setFilteredStocks,
    predictLoading, setPredictLoading,
    predictData, setPredictData,
    predictError, setPredictError,
    livePrices
  } = useAppStore();

  useEffect(() => {
    if (searchQuery.length > 0 && Array.isArray(availableStocks)) {
      const q = searchQuery.toLowerCase();
      // Primary: starts with, Secondary: contains
      const matches = availableStocks.filter(t => t.toLowerCase().includes(q));
      const sorted = [...matches].sort((a, b) => {
          const aStarts = a.toLowerCase().startsWith(q);
          const bStarts = b.toLowerCase().startsWith(q);
          if (aStarts && !bStarts) return -1;
          if (!aStarts && bStarts) return 1;
          return a.localeCompare(b);
      });
      setFilteredStocks(sorted.slice(0, 10));
    } else {
      setFilteredStocks([]);
    }
  }, [searchQuery, availableStocks, setFilteredStocks]);

  const handlePredictStock = async (ticker: string) => {
    setSearchQuery('');
    setFilteredStocks([]);
    setPredictLoading(true);
    setPredictError(null);
    setPredictData(null);

    try {
      const data = await api.predictStock(ticker);
      setPredictData(data);
    } catch (err: any) {
      setPredictError(err.message || 'Bir hata oluştu');
    } finally {
      setPredictLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="space-y-12 pb-20">
      {/* Search Header Section */}
      <section className="relative pt-12">
        <div className="max-w-3xl mx-auto flex flex-col items-center">
            <motion.div 
               initial={{ opacity: 0, y: -10 }} 
               animate={{ opacity: 1, y: 0 }}
               className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-widest mb-6"
            >
                <Cpu className="w-3 h-3" />
                Canlı Sinirsel Piyasa Analizi
            </motion.div>
            
            <h1 className="text-4xl md:text-5xl font-black text-white font-headline tracking-tighter text-center mb-10">
                Sıradaki <span className="text-primary italic">Fırsatını</span> Keşfet
            </h1>

            <div className="w-full relative group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5 group-focus-within:text-primary transition-colors" />
                <input
                    type="text"
                    placeholder="Türk Hisselerini Ara (Örn: THYAO)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#121315] border border-white/5 rounded-2xl py-6 pl-16 pr-6 text-xl text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-primary/40 focus:bg-[#1a1b1e] transition-all shadow-[0_24px_48px_-12px_rgba(0,0,0,0.5)] font-headline"
                />

                <AnimatePresence>
                {filteredStocks.length > 0 && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 10 }} 
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-[#1a1b1e] border border-white/10 rounded-2xl overflow-hidden shadow-[0_32px_64px_rgba(0,0,0,0.8)] z-50 p-2"
                    >
                        {filteredStocks.map(stock => (
                        <button
                            key={stock}
                            onClick={() => handlePredictStock(stock)}
                            className="w-full px-6 py-4 hover:bg-white/5 rounded-xl flex items-center justify-between transition-colors group/item"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center font-headline font-bold text-xs">
                                    {stock.slice(0, 2)}
                                </div>
                                <div className="text-left">
                                    <span className="block font-black text-white tracking-widest uppercase font-headline">{stock}</span>
                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">BIST100 Listesi</span>
                                </div>
                            </div>
                            <div className="text-primary opacity-0 group-hover/item:opacity-100 translate-x-4 group-hover/item:translate-x-0 transition-all font-bold text-xs uppercase italic">Analiz Et →</div>
                        </button>
                        ))}
                    </motion.div>
                )}
                </AnimatePresence>
            </div>
        </div>
      </section>

      {/* Main Analysis Section */}
      <div className="mt-12">
        {predictLoading && (
          <div className="flex flex-col items-center justify-center min-h-[500px] space-y-6">
            <div className="relative w-24 h-24">
                <div className="absolute inset-0 border-t-2 border-primary rounded-full animate-spin"></div>
                <div className="absolute inset-2 border-r-2 border-secondary rounded-full animate-[spin_1.5s_linear_infinite_reverse]"></div>
                <div className="absolute inset-4 border-b-2 border-primary/30 rounded-full animate-[spin_2s_linear_infinite]"></div>
            </div>
            <div className="text-center">
                <h3 className="text-2xl font-black font-headline text-white mb-2 animate-pulse">Küresel Duygular Taranıyor</h3>
                <p className="text-slate-500 font-medium text-sm tracking-wide">LSTM + LLM Zekası Sentezleniyor...</p>
            </div>
          </div>
        )}

        {predictError && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-3xl p-12 flex flex-col items-center border-rose-500/20 max-w-2xl mx-auto">
            <AlertTriangle className="w-12 h-12 text-rose-500 mb-4" />
            <h3 className="text-2xl font-black font-headline text-rose-200 mb-2">Protokol Hatası</h3>
            <p className="text-rose-400/80 text-center font-medium leading-relaxed">{predictError}</p>
          </motion.div>
        )}

        {predictData && !predictLoading && (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 lg:grid-cols-4 gap-6 px-2"
          >
            {/* Header / Hero Bento Item */}
            <motion.div variants={itemVariants} className="lg:col-span-3 glass-card rounded-3xl p-10 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
                
                <div className="relative z-10 flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                        <span className="px-2 py-0.5 rounded bg-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.2em]">Alpha Yakalama</span>
                        <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold animate-pulse">
                           <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                           CANLI VERİ
                        </span>
                    </div>
                    <div className="flex items-baseline gap-4">
                        <h2 className="text-6xl md:text-8xl font-black text-white font-headline tracking-tighter leading-none">{predictData.ticker}</h2>
                        <span className="text-2xl font-headline font-bold text-slate-500 italic">VARLIK</span>
                    </div>
                </div>

                <div className="mt-8 md:mt-0 relative z-10 flex flex-col items-end gap-1">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Piyasa Değeri</span>
                    <div className="flex flex-col items-end mb-4">
                        <span className="text-5xl font-black font-headline text-white">
                            ₺{(livePrices[predictData.ticker] || predictData.current_price)?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-sm font-bold text-emerald-400 flex items-center gap-1">
                            +1.24% <TrendingUp className="w-3 h-3" />
                        </span>
                    </div>

                    <div className="flex gap-2 w-full md:w-auto">
                        <button 
                            onClick={() => useAppStore.getState().executeTrade(predictData.ticker, 'AL', 10000)}
                            className="flex-1 md:flex-none px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black font-headline text-xs tracking-widest transition-all active:scale-95 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                        >
                            SİMÜLASYON AL
                        </button>
                        <button 
                            onClick={() => useAppStore.getState().executeTrade(predictData.ticker, 'SAT', 10000)}
                            className="flex-1 md:flex-none px-6 py-3 rounded-xl bg-rose-500 hover:bg-rose-400 text-black font-black font-headline text-xs tracking-widest transition-all active:scale-95 shadow-[0_0_20px_rgba(244,63,94,0.3)]"
                        >
                            SİMÜLASYON SAT
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* Neural Forecast Bento Item */}
            <motion.div variants={itemVariants} className="lg:col-span-1 glass-card rounded-3xl p-8 relative overflow-hidden flex flex-col justify-between">
                <div className="absolute inset-0 bg-primary/5 pointer-events-none"></div>
                <div>
                   <span className="text-[10px] font-bold text-primary uppercase tracking-[0.3em] mb-4 block">Sinirsel Tahmin</span>
                   <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-4xl font-black font-headline text-white">₺{predictData.predicted_price?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                        <Zap className="w-4 h-4 text-primary fill-primary/20" />
                   </div>
                   <p className="text-[10px] text-slate-500 font-bold uppercase leading-tight italic">
                      LSTM imza analizine dayalı <br/> beklenen hedef
                   </p>
                </div>
                
                <div className="mt-8 flex items-center justify-between">
                    <div>
                        <span className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Eğilim</span>
                        <span className={`text-lg font-black font-headline ${predictData.direction === 'Yükseliş' ? 'text-primary' : 'text-secondary'}`}>
                            {predictData.direction === 'Yükseliş' ? 'BOĞA (YUKARI)' : 'AYI (AŞAĞI)'}
                        </span>
                    </div>
                    <div className={`w-12 h-12 rounded-full border flex items-center justify-center ${predictData.direction === 'Yükseliş' ? 'border-primary/30 text-primary' : 'border-secondary/30 text-secondary'}`}>
                        {predictData.direction === 'Yükseliş' ? <TrendingUp /> : <TrendingDown />}
                    </div>
                </div>
            </motion.div>

            {/* Technical Matrix Bento Item */}
            <motion.div variants={itemVariants} className="lg:col-span-2 glass-card rounded-3xl p-8">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-lg font-black font-headline text-white uppercase tracking-tight">Teknik Matris</h3>
                    <Target className="w-5 h-5 text-slate-600" />
                </div>
                
                <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">RSI Gücü</span>
                        <div className="flex items-end gap-2">
                             <span className="text-3xl font-black font-headline text-white">
                                {typeof predictData.rsi === 'number' ? predictData.rsi.toFixed(1) : '50.0'}
                             </span>
                             <div className="mb-2 h-1 flex-1 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-primary" style={{ width: `${predictData.rsi || 50}%` }}></div>
                             </div>
                        </div>
                    </div >
                    <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">MACD Momentumu</span>
                        <div className="flex items-end gap-2">
                             <span className="text-3xl font-black font-headline text-white">
                                {typeof predictData.macd === 'number' ? predictData.macd.toFixed(2) : '0.00'}
                             </span>
                             <span className={`text-[10px] font-bold mb-2 ${Number(predictData.macd) > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {Number(predictData.macd) > 0 ? 'UZUN (AL)' : 'KISA (SAT)'}
                             </span>
                        </div>
                    </div>
                </div>

                <div className="mt-10 pt-8 border-t border-white/5 grid grid-cols-3 gap-4">
                    <div className="text-center">
                        <span className="block text-[9px] text-slate-500 font-bold uppercase mb-1">Duygu</span>
                        <span className="text-xs font-bold font-headline text-primary">{Number(predictData.avg_sentiment_score) > 0 ? 'İyimser' : 'Temkinli'}</span>
                    </div>
                    <div className="text-center">
                        <span className="block text-[9px] text-slate-500 font-bold uppercase mb-1">Volatilite</span>
                        <span className="text-xs font-bold font-headline text-slate-300">ORTA</span>
                    </div>
                    <div className="text-center">
                        <span className="block text-[9px] text-slate-500 font-bold uppercase mb-1">Trend</span>
                        <span className="text-xs font-bold font-headline text-slate-300 italic">YATAY</span>
                    </div>
                </div>
            </motion.div>

            {/* AI Reasoning Bento Item */}
            <motion.div variants={itemVariants} className="lg:col-span-2 glass-card rounded-3xl p-8 relative group">
                <div className="absolute top-6 right-8 text-primary/40 text-4xl opacity-20 pointer-events-none">"</div>
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
                        <Bot className="w-4 h-4 text-secondary" />
                    </div>
                    <h3 className="text-lg font-black font-headline text-white uppercase tracking-tight">AI Analiz Mantığı</h3>
                </div>
                
                <div className="relative">
                    <p className="text-slate-200 leading-relaxed font-body italic text-sm md:text-base selection:bg-secondary/30">
                        {predictData.reasoning}
                    </p>
                </div>
                
                <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Kaynak: Llama 3.2 Prime</span>
                    <Globe className="w-4 h-4 text-slate-700" />
                </div>
            </motion.div>

            {/* Risk Control Bento Item */}
            <motion.div variants={itemVariants} className="lg:col-span-4 glass-card rounded-3xl p-10 bg-gradient-to-br from-[#121315] to-[#0a0b0d]">
                <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center ring-1 ring-emerald-500/20">
                            <ShieldCheck className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black font-headline text-white tracking-tighter">Kelly Risk Motoru</h3>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest italic">Optimal Sermaye Yönetimi</p>
                        </div>
                    </div>
                    
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-[0.3em]">Sistem Güven Skoru</span>
                        <span className="text-4xl font-black font-headline text-white tracking-widest">
                            %{typeof predictData.risk_mgmt.confidence_score === 'number' ? predictData.risk_mgmt.confidence_score.toFixed(1) : '0.0'}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                    <div className="relative group">
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Önerilen Maruziyet</span>
                            <span className="text-5xl font-black font-headline text-emerald-400">{predictData.risk_mgmt.kelly_recommendation}</span>
                            <span className="text-[10px] text-slate-600 font-bold uppercase italic mt-1">Toplam sermaye tahsisi</span>
                        </div>
                    </div>

                    <div className="p-6 rounded-2xl bg-white/5 border border-white/5 flex flex-col justify-center">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">Zarar Durdur</span>
                            <TrendingDown className="w-3 h-3 text-rose-500" />
                        </div>
                        <span className="text-2xl font-black font-headline text-rose-200">₺ {predictData.risk_mgmt.stop_loss?.toLocaleString('tr-TR')}</span>
                    </div>

                    <div className="p-6 rounded-2xl bg-white/5 border border-white/5 flex flex-col justify-center">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Kar Al</span>
                            <TrendingUp className="w-3 h-3 text-emerald-500" />
                        </div>
                        <span className="text-2xl font-black font-headline text-emerald-200">₺ {predictData.risk_mgmt.take_profit?.toLocaleString('tr-TR')}</span>
                    </div>
                </div>
                
                <div className="mt-10 flex items-center gap-4 text-slate-500">
                    <Info className="w-4 h-4" />
                    <p className="text-[10px] font-bold uppercase tracking-[0.05em] italic">
                        İflas olasılığını minimize ederken uzun vadeli alfayı maksimize etmek için Yarı-Kelly Kriteri aracılığıyla hesaplanmıştır.
                    </p>
                </div>
            </motion.div>

            {/* News Feed Bento Item */}
            <motion.div variants={itemVariants} className="lg:col-span-4 glass-card rounded-3xl p-8">
                <div className="flex items-center justify-between mb-8">
                   <h3 className="text-lg font-black font-headline text-white uppercase tracking-tight">Sinyal İstihbaratı</h3>
                   <span className="text-[10px] font-bold text-primary uppercase tracking-widest">KAP & Haber Akışı</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {predictData.latest_news?.slice(0, 6).map((news: any, idx: number) => (
                        <div key={idx} className="bg-white/5 p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors group/news flex flex-col gap-3">
                            <div className="flex justify-between items-start">
                                <div className={`w-2 h-2 rounded-full mt-1 ${news.sentiment_score > 0 ? 'bg-emerald-500' : news.sentiment_score < 0 ? 'bg-rose-500' : 'bg-slate-500'}`}></div>
                                <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${news.sentiment_score > 0 ? 'bg-emerald-500/10 text-emerald-400' : news.sentiment_score < 0 ? 'bg-rose-500/10 text-rose-400' : 'bg-slate-800 text-slate-400'}`}>
                                    {news.sentiment_label}
                                </span>
                            </div>
                            <p className="text-xs text-slate-300 font-medium line-clamp-3 leading-relaxed">
                                {news.title}
                            </p>
                        </div>
                    ))}
                    {(!predictData.latest_news || predictData.latest_news.length === 0) && (
                        <div className="col-span-full py-12 text-center text-slate-500 italic text-sm">
                            Bu hisse için yakın zamanda algılanan bir istihbarat bulunamadı.
                        </div>
                    )}
                </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
