'use client';

import { motion } from 'framer-motion';
import { Wallet, Loader2, AlertTriangle, Bot, TrendingUp, TrendingDown, Info, Save, Activity, Zap, Layers, Target, ShieldCheck } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { api } from '@/services/api';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

const COLORS = ['#00f2ff', '#ff007a', '#7000ff', '#00ff95', '#ffb800', '#ff4d00'];

export default function PortfolioTab() {
  const {
    balance, setBalance,
    risk, setRisk,
    loading, setLoading,
    data, setData,
    error, setError
  } = useAppStore();

  const handlePortfolioSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const responseData = await api.analyzePortfolio(Number(balance), risk);
      if (responseData.task_id) {
        const poll = setInterval(async () => {
          try {
            const statusRes = await api.checkAnalysisStatus(responseData.task_id);
            if (statusRes.status === 'completed') {
              clearInterval(poll);
              setData(statusRes.data);
              setLoading(false);
            } else if (statusRes.status === 'error') {
              clearInterval(poll);
              setError(statusRes.message || 'Görev başarısız.');
              setLoading(false);
            }
          } catch (pollErr: any) {
            clearInterval(poll);
            setError(pollErr.message || 'Durum kontrolü sırasında hata.');
            setLoading(false);
          }
        }, 3000);
      } else {
        setData(responseData);
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.message || 'Bir hata oluştu');
      setLoading(false);
    }
  };

  const handleSavePortfolio = async () => {
    if (!data) return;
    try {
      await api.savePortfolio(data);
      toast.success("Portföy başarıyla kaydedildi!");
    } catch (err: any) {
      toast.error("Hata: " + err.message);
    }
  };

  const chartData = data ? [
    { name: 'Reserve', value: data.reserve_cash },
    ...data.allocations.map((a: any) => ({ name: a.ticker, value: a.amount_tl }))
  ] : [];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="space-y-12 pb-24">
      {/* Configuration Section */}
      <section className="max-w-4xl mx-auto pt-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-[2.5rem] p-10 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent"></div>
            
            <div className="flex flex-col md:flex-row items-center gap-12">
                <div className="flex-1 space-y-6 w-full">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Wallet className="w-5 h-5 text-primary" />
                        </div>
                        <h2 className="text-2xl font-black font-headline text-white tracking-tighter uppercase">Portföy Atölyesi</h2>
                    </div>
                    
                    <form onSubmit={handlePortfolioSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-2">Mevcut Sermaye (₺)</label>
                            <div className="relative">
                                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-primary font-bold">₺</span>
                                <input
                                    type="number"
                                    required
                                    value={balance}
                                    onChange={(e) => setBalance(e.target.value)}
                                    className="w-full bg-[#121315] border border-white/5 rounded-2xl py-4 pl-10 pr-4 text-white font-headline focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                                    placeholder="100,000"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-2">Risk Seviyesi</label>
                            <select
                                value={risk}
                                onChange={(e) => setRisk(e.target.value)}
                                className="w-full bg-[#121315] border border-white/5 rounded-2xl py-4 px-4 text-white font-headline focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all appearance-none cursor-pointer"
                            >
                                <option value="dusuk">DEFENSIVE (LOW)</option>
                                <option value="dengeli">BALANCED (MED)</option>
                                <option value="agresif">AGGRESSIVE (HIGH)</option>
                            </select>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !balance}
                            className="md:col-span-2 group relative overflow-hidden bg-white text-black font-black font-headline py-5 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-primary via-white to-secondary opacity-0 group-hover:opacity-20 transition-opacity"></div>
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Activity className="w-5 h-5" />}
                            {loading ? 'AJANLAR ÇALIŞTIRILIYOR...' : 'ANALİZİ BAŞLAT'}
                        </button>
                    </form>
                </div>

                <div className="hidden md:flex flex-col items-center gap-4 py-8 px-10 bg-white/5 rounded-[2rem] border border-white/5">
                    <Bot className="w-12 h-12 text-primary animate-pulse" />
                    <div className="text-center">
                        <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Durum</span>
                        <span className="text-emerald-400 font-black font-headline text-sm tracking-widest">SİSTEM HAZIR</span>
                    </div>
                </div>
            </div>
        </motion.div>
      </section>

      {/* Results Section */}
      <div className="mt-12">
        {loading && (
          <div className="flex flex-col items-center justify-center min-h-[500px] space-y-12">
             <div className="grid grid-cols-3 gap-8">
                {[1, 2, 3].map(i => (
                    <motion.div 
                        key={i}
                        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 1, 0.3] }}
                        transition={{ repeat: Infinity, duration: 2, delay: i * 0.3 }}
                        className="w-4 h-4 rounded-full bg-primary shadow-[0_0_20px_rgba(0,242,255,0.8)]"
                    />
                ))}
             </div>
             <div className="text-center space-y-2">
                <h3 className="text-3xl font-black font-headline text-white tracking-tighter uppercase animate-pulse">Yapay Zekalar Sentezleniyor</h3>
                <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.2em]">13 Farklı Analiz Motoru Karşılaştırılıyor...</p>
             </div>
          </div>
        )}

        {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-3xl p-12 flex flex-col items-center border-secondary/20 max-w-2xl mx-auto">
                <AlertTriangle className="w-12 h-12 text-secondary mb-4" />
                <h3 className="text-2xl font-black font-headline text-secondary-light mb-2">İşlem Durduruldu</h3>
                <p className="text-slate-400 text-center font-medium leading-relaxed">{error}</p>
            </motion.div>
        )}

        {data && !loading && (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* Allocation Chart Bento */}
            <motion.div variants={itemVariants} className="lg:col-span-4 glass-card rounded-[2rem] p-8 flex flex-col items-center justify-center min-h-[400px]">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] mb-8">Yapısal Dağılım</span>
                <div className="relative w-full aspect-square">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie 
                                data={chartData} 
                                cx="50%" cy="50%" 
                                innerRadius="65%" outerRadius="85%" 
                                paddingAngle={8} 
                                dataKey="value" stroke="none"
                            >
                                {chartData.map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#121315', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' }}
                                itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Toplam Değer</span>
                        <span className="text-2xl font-black font-headline text-white">₺{Number(balance).toLocaleString()}</span>
                    </div>
                </div>
            </motion.div>

            {/* Strategic Briefing Bento */}
            <motion.div variants={itemVariants} className="lg:col-span-8 glass-card rounded-[2rem] p-10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 text-primary opacity-5 group-hover:opacity-10 transition-opacity">
                    <Bot className="w-48 h-48" />
                </div>
                
                <div className="relative z-10 space-y-8">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center ring-1 ring-primary/20">
                            <Zap className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black font-headline text-white tracking-tighter uppercase">Ana Beyin Brifingi</h3>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Fon Seviyesinde İstihbarat</p>
                        </div>
                    </div>

                    <div className="bg-[#121315]/80 rounded-[2rem] p-8 border border-white/5 relative selection:bg-primary/20">
                        <div className="absolute left-0 top-8 bottom-8 w-1 bg-primary/40 rounded-r-full"></div>
                        <p className="text-lg text-slate-200 leading-relaxed font-body italic">
                            "{data.overall_rationale}"
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Piyasa Duygusu</span>
                            <span className="block text-xl font-black font-headline text-white uppercase tracking-tighter">{data.market_sentiment}</span>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Rezerv Likidite</span>
                            <span className="block text-xl font-black font-headline text-emerald-400">₺{data.reserve_cash?.toLocaleString()}</span>
                        </div>
                        <div className="flex items-end justify-end">
                            <button 
                                onClick={handleSavePortfolio}
                                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all text-xs font-black font-headline tracking-widest uppercase"
                            >
                                <Save className="w-4 h-4 text-primary" />
                                Stratejiyi Kaydet
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Assets List */}
            <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.allocations?.map((alloc: any, idx: number) => (
                    <motion.div 
                        variants={itemVariants}
                        key={idx}
                        className="glass-card rounded-[2rem] p-8 flex flex-col justify-between hover:bg-[#1f2022] transition-colors border-t-2"
                        style={{ borderTopColor: COLORS[idx % COLORS.length] }}
                    >
                        <div className="space-y-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="text-4xl font-black font-headline text-white tracking-tighter">{alloc.ticker}</h4>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{alloc.lots} LOT ATANDI</span>
                                </div>
                                <div className="px-3 py-1 rounded-lg bg-white/5 border border-white/5">
                                    <span className="text-[10px] font-black text-primary uppercase">VARLIK</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Sermaye</span>
                                    <span className="block text-xl font-black font-headline text-white">₺{alloc.amount_tl.toLocaleString()}</span>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Portföy %</span>
                                    <span className="block text-xl font-black font-headline text-primary">
                                        {((alloc.amount_tl / Number(balance)) * 100).toFixed(1)}%
                                    </span>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-white/5">
                                <p className="text-xs text-slate-400 leading-relaxed font-body line-clamp-4 italic">
                                    "{alloc.reason}"
                                </p>
                            </div>
                        </div>

                        <div className="mt-8 flex items-center justify-between gap-4">
                            <div className="flex-1 p-3 rounded-xl bg-secondary/5 border border-secondary/10">
                                <span className="block text-[8px] font-bold text-secondary uppercase tracking-widest mb-1">Zarar Durdur</span>
                                <span className="text-sm font-black font-headline text-secondary-light">₺{alloc.stop_loss.toLocaleString()}</span>
                            </div>
                            <div className="flex-1 p-3 rounded-xl bg-primary/5 border border-primary/10">
                                <span className="block text-[8px] font-bold text-primary uppercase tracking-widest mb-1">Hedef</span>
                                <span className="text-sm font-black font-headline text-primary-light">₺{alloc.target.toLocaleString()}</span>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Knowledge Recall Footer */}
            {data.lessons_learned && (
                <motion.div variants={itemVariants} className="lg:col-span-12 glass-card rounded-[2rem] p-8 bg-gradient-to-r from-[#121315] to-[#0a0b0d] flex items-start gap-6">
                    <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center shrink-0">
                        <Layers className="w-6 h-6 text-secondary" />
                    </div>
                    <div>
                        <h4 className="text-xs font-black font-headline text-white uppercase tracking-widest mb-2">Kurumsal Hafıza Geri Çağırma</h4>
                        <p className="text-sm text-slate-400 leading-relaxed italic font-body">
                            {data.lessons_learned}
                        </p>
                    </div>
                </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
