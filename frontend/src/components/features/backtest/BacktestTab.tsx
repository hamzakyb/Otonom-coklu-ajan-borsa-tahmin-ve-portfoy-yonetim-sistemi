'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, AlertTriangle, LineChart as LineChartIcon, Search, ArrowRightCircle, Bot, Zap, ShieldAlert, Cpu, Activity, TrendingUp, History, Target } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { useAppStore } from '@/store/useAppStore';
import { api } from '@/services/api';

export default function BacktestTab() {
  const {
    backtestQuery, setBacktestQuery,
    backtestFilteredStocks, setBacktestFilteredStocks,
    availableStocks,
    backtestLoading, setBacktestLoading,
    backtestData, setBacktestData,
    backtestError, setBacktestError
  } = useAppStore();

  useEffect(() => {
    if (backtestQuery.length > 0 && Array.isArray(availableStocks)) {
      setBacktestFilteredStocks(availableStocks.filter(t => t.toLowerCase().includes(backtestQuery.toLowerCase())).slice(0, 8));
    } else {
      setBacktestFilteredStocks([]);
    }
  }, [backtestQuery, availableStocks, setBacktestFilteredStocks]);

  const handleRunBacktest = async (ticker: string) => {
    setBacktestQuery('');
    setBacktestFilteredStocks([]);
    setBacktestLoading(true);
    setBacktestError(null);
    setBacktestData(null);

    try {
      const data = await api.getBacktest(ticker);
      setBacktestData(data);
    } catch (err: any) {
      setBacktestError(err.message || 'Simulation sequence interrupted.');
    } finally {
      setBacktestLoading(false);
    }
  };

  return (
    <div className="space-y-12 pb-24">
      {/* Simulation Header */}
      <section className="text-center max-w-4xl mx-auto pt-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-[2rem] bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shadow-[0_0_50px_rgba(99,102,241,0.1)]">
                    <History className="w-8 h-8 text-indigo-400" />
                </div>
                <h2 className="text-5xl font-black font-headline text-white tracking-tighter uppercase leading-none">Matris <span className="text-indigo-400">Backtest</span></h2>
                <p className="text-lg text-slate-400 font-body italic leading-relaxed max-w-2xl px-6">
                    LSTM sinirsel ağırlıklarını geçmiş fiyat keşfiyle karşılaştırarak kurumsal stratejileri doğrulayın. 30 günlük geçmişe dönük regresyon.
                </p>
            </div>

            <div className="max-w-xl mx-auto pt-4 w-full px-6 relative z-50">
                <div className="relative group">
                    <div className="absolute inset-0 bg-indigo-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative flex items-center bg-[#121315] border border-white/5 rounded-2xl p-2 shadow-2xl overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 opacity-50"></div>
                        <Search className="w-5 h-5 text-slate-500 ml-4 shrink-0" />
                        <input
                            type="text"
                            value={backtestQuery}
                            onChange={(e) => setBacktestQuery(e.target.value.toUpperCase())}
                            placeholder="SİMÜLASYON İÇİN HİSSE ARA..."
                            className="flex-1 bg-transparent border-none text-white text-lg font-headline font-black placeholder:text-slate-700 focus:outline-none focus:ring-0 px-4 py-3 uppercase tracking-widest"
                        />
                    </div>
                    
                    <AnimatePresence>
                        {backtestFilteredStocks.length > 0 && (
                            <motion.ul 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="absolute z-[100] w-full mt-4 glass-card rounded-3xl border border-white/10 shadow-[0_32px_64px_rgba(0,0,0,0.8)] overflow-hidden divide-y divide-white/5"
                            >
                                {backtestFilteredStocks.map((stock) => (
                                    <li key={stock}>
                                        <button
                                            onClick={() => handleRunBacktest(stock)}
                                            className="w-full text-left px-8 py-5 hover:bg-white/5 transition-all flex items-center justify-between group"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:border-indigo-500/50 transition-all">
                                                    <TrendingUp className="w-5 h-5 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                                                </div>
                                                <span className="text-white font-black font-headline text-xl tracking-tighter uppercase">{stock}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all">Simülasyonu Başlat</span>
                                                <ArrowRightCircle className="w-5 h-5 text-indigo-500 opacity-0 group-hover:opacity-100 transition-all" />
                                            </div>
                                        </button>
                                    </li>
                                ))}
                            </motion.ul>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
      </section>

      {/* States */}
      <AnimatePresence mode="wait">
        {backtestLoading && (
            <motion.div 
                key="loading"
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-24 gap-8"
            >
                <div className="relative w-24 h-24">
                    <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full animate-[ping_3s_linear_infinite]"></div>
                    <div className="absolute inset-0 border-t-4 border-indigo-500 rounded-full animate-spin"></div>
                    <Activity className="absolute inset-0 m-auto w-8 h-8 text-indigo-400 animate-pulse" />
                </div>
                <div className="text-center space-y-2">
                    <h3 className="text-2xl font-black font-headline text-white tracking-widest uppercase">Simülasyon Başlatıldı</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.4em]">Geçmiş veriler ve model ağırlıkları birleştiriliyor...</p>
                </div>
            </motion.div>
        )}

        {backtestError && (
            <motion.div 
                key="error"
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="max-w-xl mx-auto glass-card p-8 rounded-[2rem] border-secondary/20 flex flex-col items-center text-center gap-4"
            >
                <AlertTriangle className="w-12 h-12 text-secondary" />
                <h3 className="text-xl font-black font-headline text-white uppercase">Simülasyon İptal Edildi</h3>
                <p className="text-slate-400 font-body text-sm italic">"{backtestError}"</p>
            </motion.div>
        )}

        {backtestData && !backtestLoading && (
            <motion.div 
                key="results"
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
            >
                {/* Metrics Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { 
                            label: 'Net Getiri', 
                            value: `${backtestData.metrics.total_return_percent.toFixed(2)}%`, 
                            icon: TrendingUp, 
                            color: backtestData.metrics.total_return_percent >= 0 ? 'text-primary' : 'text-secondary', 
                            bg: backtestData.metrics.total_return_percent >= 0 ? 'bg-primary/10' : 'bg-secondary/10' 
                        },
                        { 
                            label: 'Başarı Oranı', 
                            value: `${backtestData.metrics.win_rate.toFixed(1)}%`, 
                            icon: Target, 
                            color: 'text-indigo-400', 
                            bg: 'bg-indigo-500/10' 
                        },
                        { 
                            label: 'Maks. Kayıp', 
                            value: `${backtestData.metrics.max_drawdown.toFixed(2)}%`, 
                            icon: ShieldAlert, 
                            color: 'text-orange-400', 
                            bg: 'bg-orange-500/10' 
                        },
                        { 
                            label: 'İşlem Sayısı', 
                            value: backtestData.metrics.total_trades.toString(), 
                            icon: Cpu, 
                            color: 'text-slate-400', 
                            bg: 'bg-white/5' 
                        }
                    ].map((metric) => (
                        <div key={metric.label} className="glass-card rounded-[2rem] p-8 border-white/5 hover:border-white/10 transition-all group overflow-hidden relative">
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <metric.icon className="w-20 h-20" />
                            </div>
                            <div className="relative z-10 space-y-4">
                                <div className={`w-10 h-10 rounded-xl ${metric.bg} flex items-center justify-center border border-white/5`}>
                                    <metric.icon className={`w-5 h-5 ${metric.color}`} />
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">{metric.label}</span>
                                    <p className={`text-3xl font-black font-headline tracking-tighter uppercase ${metric.color}`}>{metric.value}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Equity Curve */}
                <div className="glass-card rounded-[2.5rem] p-10 h-[500px] flex flex-col bg-[#0a0b0d]/50 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                        <TrendingUp className="w-64 h-64 text-primary" />
                    </div>
                    <div className="flex items-center justify-between mb-8 relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Activity className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black font-headline text-white tracking-tighter uppercase leading-none">Sermaye Gelişimi</h3>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1 block">Kademeli Büyüme Analizi • Başlangıç: ₺10,000</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 w-full relative z-10">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={backtestData.equity_curve}>
                                <defs>
                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#00f2ff" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#00f2ff" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                                <XAxis 
                                    dataKey="date" 
                                    stroke="rgba(255,255,255,0.2)" 
                                    tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 800 }} 
                                    tickMargin={15}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis 
                                    stroke="rgba(255,255,255,0.2)" 
                                    tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 800 }} 
                                    tickFormatter={(val) => `₺${val.toLocaleString()}`}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#121315', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '15px' }}
                                    itemStyle={{ color: '#00f2ff', fontWeight: 900, textTransform: 'uppercase', fontSize: '10px' }}
                                    labelStyle={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', marginBottom: '8px', fontWeight: 700 }}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="value" 
                                    stroke="#00f2ff" 
                                    strokeWidth={4}
                                    fillOpacity={1} 
                                    fill="url(#colorValue)" 
                                    animationDuration={2000}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Model vs Reality */}
                <div className="glass-card rounded-[2.5rem] p-10 h-[450px] flex flex-col bg-[#0a0b0d]/50">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                                <Zap className="w-5 h-5 text-indigo-400" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black font-headline text-white tracking-tighter uppercase leading-none">Sinirsel Sapma</h3>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1 block">LSTM Tahmin Ağırlıkları vs Gerçeklik • 30 Günlük Spektrum</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={backtestData.history}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                                <XAxis 
                                    dataKey="date" 
                                    stroke="rgba(255,255,255,0.2)" 
                                    tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 800 }} 
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis 
                                    domain={['auto', 'auto']} 
                                    stroke="rgba(255,255,255,0.2)" 
                                    tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 800 }} 
                                    tickFormatter={(val) => `₺${val.toFixed(1)}`}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#121315', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px' }}
                                    labelStyle={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', marginBottom: '8px', fontWeight: 700 }}
                                />
                                <Legend 
                                    verticalAlign="bottom" 
                                    height={36} 
                                    iconType="circle"
                                    formatter={(val) => <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{val}</span>}
                                />
                                <Line 
                                    name="Gerçek Veri" 
                                    type="monotone" 
                                    dataKey="actual" 
                                    stroke="#6366f1" 
                                    strokeWidth={3} 
                                    dot={false} 
                                    activeDot={{ r: 6, strokeWidth: 0 }} 
                                />
                                <Line 
                                    name="LSTM Tahmini" 
                                    type="monotone" 
                                    dataKey="predicted" 
                                    stroke="#ff007a" 
                                    strokeWidth={2} 
                                    strokeDasharray="10 5" 
                                    dot={false} 
                                    activeDot={{ r: 6, strokeWidth: 0 }} 
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
