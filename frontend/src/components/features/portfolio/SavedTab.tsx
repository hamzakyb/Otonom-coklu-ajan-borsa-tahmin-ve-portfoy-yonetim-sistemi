'use client';

import { motion } from 'framer-motion';
import { Loader2, AlertTriangle, Bookmark, RefreshCw, TrendingUp, TrendingDown, Bot, Info, LineChartIcon, Activity, Map } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { api } from '@/services/api';

export default function SavedTab() {
  const {
    savedPortfolioLoading,
    savedPortfolioData,
    savedPortfolioError,
    rebalanceLoading, setRebalanceLoading,
    rebalanceData, setRebalanceData,
    rebalanceError, setRebalanceError
  } = useAppStore();

  const handleRunRebalance = async () => {
    setRebalanceLoading(true);
    setRebalanceError(null);
    try {
      const data = await api.rebalancePortfolio();
      setRebalanceData(data);
    } catch (err: any) {
      setRebalanceError(err.message || 'Rebalance çalıştırılırken hata oluştu.');
    } finally {
      setRebalanceLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="space-y-6 max-w-5xl mx-auto">
      {savedPortfolioLoading && (
        <div className="glass rounded-3xl p-12 flex flex-col items-center justify-center min-h-[400px]">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
          <p className="text-slate-300 font-medium">Kayıtlı portföyünüz ve güncel fiyatlar yükleniyor...</p>
        </div>
      )}
      
      {savedPortfolioError && (
        <div className="glass !border-red-900/50 !bg-red-950/20 rounded-3xl p-8 flex flex-col items-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
          <p className="text-red-400">{savedPortfolioError}</p>
        </div>
      )}
      
      {savedPortfolioData && !savedPortfolioLoading && (
        <>
          <div className="glass p-8 rounded-3xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <Bookmark className="w-6 h-6 text-blue-400" />
                  Kayıtlı Portföyüm PnL
                </h2>
                <p className="text-slate-400 text-sm mt-1">
                  Oluşturulma Tarihi: {new Date(savedPortfolioData.created_at).toLocaleDateString('tr-TR')} - {new Date(savedPortfolioData.created_at).toLocaleTimeString('tr-TR')}
                </p>
              </div>
              <button 
                onClick={handleRunRebalance} 
                disabled={rebalanceLoading} 
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/25 disabled:opacity-50"
              >
                {rebalanceLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                {rebalanceLoading ? 'Yapay Zeka İnceliyor...' : 'AI Rebalance İste'}
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/50">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Toplam Maliyet</p>
                <p className="text-lg font-semibold text-white">₺ {savedPortfolioData.total_cost?.toLocaleString('tr-TR')}</p>
              </div>
              <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/50">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Güncel Değer</p>
                <p className="text-lg font-semibold text-white">₺ {savedPortfolioData.total_current_value?.toLocaleString('tr-TR')}</p>
              </div>
              <div className={`p-4 rounded-2xl border ${savedPortfolioData.total_pnl_percent >= 0 ? 'bg-emerald-950/20 border-emerald-900/50' : 'bg-red-950/20 border-red-900/50'}`}>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Kar/Zarar (₺)</p>
                <p className={`text-lg font-semibold ${savedPortfolioData.total_pnl_percent >= 0 ? 'text-emerald-400' : 'text-red-400'} flex items-center gap-2`}>
                  {savedPortfolioData.total_pnl_percent >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  ₺ {savedPortfolioData.total_pnl_tl?.toLocaleString('tr-TR')}
                </p>
              </div>
              <div className={`p-4 rounded-2xl border ${savedPortfolioData.total_pnl_percent >= 0 ? 'bg-emerald-950/20 border-emerald-900/50' : 'bg-red-950/20 border-red-900/50'}`}>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Kar/Zarar (%)</p>
                <p className={`text-lg font-semibold ${savedPortfolioData.total_pnl_percent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {savedPortfolioData.total_pnl_percent > 0 ? '+' : ''}{savedPortfolioData.total_pnl_percent}%
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {savedPortfolioData.allocations?.map((alloc: any, idx: number) => (
                <div key={idx} className="bg-slate-900/40 rounded-2xl p-4 border border-slate-800/50 flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-white">{alloc.ticker} <span className="text-sm font-normal text-slate-400 bg-slate-800 px-2 py-0.5 rounded ml-2">{alloc.lots} Lot</span></h4>
                    <p className="text-sm text-slate-400 mt-1">Maliyet: ₺{alloc.bought_price?.toFixed(2)} | Güncel: ₺{alloc.current_price?.toFixed(2)}</p>
                  </div>
                  <div className={`px-4 py-2 rounded-xl text-right ${alloc.pnl_percent >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                    <p className="font-bold">₺ {alloc.pnl_tl?.toFixed(2)}</p>
                    <p className="text-sm">{alloc.pnl_percent > 0 ? '+' : ''}{alloc.pnl_percent}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {rebalanceLoading && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8 glass rounded-3xl p-12 flex flex-col items-center justify-center min-h-[400px] relative overflow-hidden border border-indigo-500/30">
              <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                <div className="w-[300px] h-[300px] border border-blue-500 rounded-full animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
                <div className="w-[200px] h-[200px] border border-indigo-500 rounded-full absolute animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite_0.5s]"></div>
              </div>

              <div className="relative mb-6 z-10 bg-slate-900/80 p-5 rounded-full border border-indigo-500/30 shadow-[0_0_40px_rgba(99,102,241,0.2)]">
                <RefreshCw className="w-12 h-12 text-indigo-400 animate-spin" />
              </div>

              <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400 mb-2 z-10 text-center">
                AI Portföyü Yeniden Dengeliyor (Rebalance)
              </h3>
              <p className="text-slate-400 text-sm mb-6 z-10 max-w-md text-center">
                13 Ajan; güncel KAP haberlerini, sektörel rüzgarları, makro takvimi ve balina hacimlerini hisseleriniz için süzüyor...
              </p>

              <div className="flex gap-4 z-10 opacity-70">
                <LineChartIcon className="w-5 h-5 text-blue-400 animate-pulse" />
                <Activity className="w-5 h-5 text-indigo-400 animate-pulse" style={{ animationDelay: '200ms' }} />
                <Map className="w-5 h-5 text-amber-400 animate-pulse" style={{ animationDelay: '400ms' }} />
                <Info className="w-5 h-5 text-rose-400 animate-pulse" style={{ animationDelay: '600ms' }} />
              </div>
            </motion.div>
          )}

          {rebalanceError && !rebalanceLoading && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-2xl flex items-start gap-3 mt-6">
              <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <p className="text-sm">{rebalanceError}</p>
            </div>
          )}

          {rebalanceData && !rebalanceLoading && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass p-8 rounded-3xl border border-indigo-500/30 relative overflow-hidden mt-8 shadow-2xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
              <h3 className="text-2xl font-bold text-white mb-8 flex items-center gap-3 relative z-10">
                <div className="p-3 bg-indigo-500/20 rounded-xl border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                  <Bot className="w-7 h-7 text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                </div>
                Başkanlık Ofisi: Rebalance Kararları
              </h3>

              {(rebalanceData.overall_rationale || rebalanceData.overall_comment) && (
                <div className="mb-10 p-6 bg-gradient-to-r from-indigo-900/40 to-slate-900/60 border border-indigo-500/30 rounded-2xl relative z-10 flex gap-5 items-start shadow-xl">
                  <div className="bg-indigo-500/10 p-2 rounded-lg">
                    <Info className="w-6 h-6 text-indigo-400 shrink-0" />
                  </div>
                  <div>
                    <h4 className="text-indigo-300 font-bold mb-2 tracking-wide text-xs uppercase opacity-80">Genel Strateji Özeti</h4>
                    <p className="text-indigo-100/90 text-base leading-relaxed italic font-light">"{rebalanceData.overall_rationale || rebalanceData.overall_comment}"</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                {rebalanceData.rebalance_actions?.map((act: any, idx: number) => (
                  <div key={idx} className="bg-slate-900/80 rounded-3xl p-6 border border-slate-800/80 hover:border-indigo-500/50 transition-all duration-300 shadow-lg hover:shadow-[0_0_20px_rgba(99,102,241,0.15)] flex flex-col h-full relative group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-slate-700 to-transparent group-hover:via-indigo-500 transition-all duration-500" />
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400 tracking-tight">
                        {act.ticker}
                      </h4>
                      <div className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border 
                        ${act.action.toLowerCase().includes('tut') ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
                        act.action.toLowerCase().includes('sat') || act.action.toLowerCase().includes('kar') ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
                        act.action.toLowerCase().includes('ekle') || act.action.toLowerCase().includes('dusur') ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                        'bg-slate-800 text-white border-slate-700'}`}>
                        {act.action}
                      </div>
                    </div>
                    <div className="flex-1 bg-slate-950/50 p-4 rounded-2xl border border-slate-800/50">
                      <p className="text-slate-300 text-sm leading-relaxed font-light">{act.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </>
      )}
    </motion.div>
  );
}
