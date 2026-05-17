import React, { useEffect, useMemo } from 'react';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  History, 
  PieChart, 
  ArrowUpRight, 
  ArrowDownRight,
  Activity,
  Trash2,
  RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';

const VaultTab: React.FC = () => {
  const { vaultData, vaultLoading, vaultError, fetchVault, livePrices, deleteHolding, resetVault } = useAppStore();

  useEffect(() => {
    fetchVault();
    const interval = setInterval(fetchVault, 30000); // Background sync every 30s
    return () => clearInterval(interval);
  }, [fetchVault]);

  // Real-time P&L Synthesis
  const liveVault = useMemo(() => {
    if (!vaultData) return null;

    const INITIAL_CAPITAL = 100000;
    let totalHoldingsValue = 0;
    let totalHoldingsCost = 0;

    const enrichedHoldings = vaultData.holdings.map((h: any) => {
      const currentPrice = livePrices[h.ticker] || h.current_price;
      const currentValue = h.lots * currentPrice;
      const costValue = h.lots * h.entry_price;
      const pnlTl = currentValue - costValue;
      const pnlPercent = costValue > 0 ? (pnlTl / costValue) * 100 : 0;
      
      totalHoldingsValue += currentValue;
      totalHoldingsCost += costValue;

      return {
        ...h,
        current_price: currentPrice,
        current_value: currentValue,
        cost_value: costValue,
        pnl_tl: pnlTl,
        pnl_percent: pnlPercent.toFixed(2)
      };
    });

    const totalEquity = (vaultData.balance || 0) + totalHoldingsValue;
    const overallPnl = totalEquity - INITIAL_CAPITAL;
    const overallPnlPercent = (overallPnl / INITIAL_CAPITAL) * 100;

    return {
      ...vaultData,
      initial_capital: INITIAL_CAPITAL,
      holdings_value: totalHoldingsValue,
      total_equity: totalEquity,
      holdings: enrichedHoldings,
      active_pnl: totalHoldingsValue - totalHoldingsCost,
      overall_pnl: overallPnl,
      overall_pnl_percent: overallPnlPercent.toFixed(2)
    };
  }, [vaultData, livePrices]);

  if (vaultLoading && !vaultData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <p className="text-slate-500 font-black font-headline uppercase tracking-widest text-xs">Varlıklar Yükleniyor</p>
      </div>
    );
  }

  if (vaultError) {
     return (
        <div className="glass-card p-12 rounded-[2rem] border-rose-500/20 text-center space-y-4">
            <h3 className="text-white font-black font-headline uppercase tracking-widest">Hata Oluştu</h3>
            <p className="text-slate-400">{vaultError}</p>
            <button onClick={fetchVault} className="px-6 py-2 bg-primary/10 border border-primary/20 text-primary uppercase text-xs font-black rounded-lg">Tekrar Dene</button>
        </div>
     );
  }

  const isPositive = (liveVault?.overall_pnl || 0) >= 0;

  return (
    <div className="space-y-12 pb-24 animate-in fade-in duration-700">
      {/* Vault Header */}
      <section className="flex flex-col lg:flex-row justify-between items-end gap-8 border-b border-white/5 pb-10">
        <div className="max-w-2xl space-y-6">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-emerald-400" />
                </div>
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.4em]">Sanal Portföy</span>
            </div>
            <h2 className="text-5xl font-black font-headline text-white tracking-tighter uppercase leading-none">Varlık <span className="text-slate-500">Kasası</span></h2>
            <p className="text-lg text-slate-400 font-body italic leading-relaxed">
                Gerçek zamanlı bakiye ve kâr/zarar takibi. Yapay zeka stratejilerinizin performansını bu güvenli simülasyon alanında izleyin.
            </p>
        </div>

        <div className="flex gap-4">
          <button 
            onClick={resetVault}
            className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-all active:scale-95 group"
            title="Tüm verileri sil ve 100 bin TL ile baştan başla"
          >
            <RotateCcw className="w-5 h-5 group-hover:rotate-[-45deg] transition-transform" />
            <span className="text-xs font-black font-headline uppercase tracking-widest">Kasayı Sıfırla</span>
          </button>

          <button 
            onClick={fetchVault}
            className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all active:scale-95 group"
          >
            <Activity className="w-6 h-6 text-slate-400 group-hover:text-primary transition-colors" />
          </button>
        </div>
      </section>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-8 rounded-[2.5rem] bg-white/5 border border-white/5 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
             <PieChart className="w-16 h-16 text-primary" />
          </div>
          <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-4 block">Toplam Portföy Değeri</span>
          <div className="text-4xl font-black font-headline text-white tracking-tighter">
            ₺{(liveVault?.total_equity || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-8 rounded-[2.5rem] bg-white/5 border border-white/5 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
             <Wallet className="w-16 h-16 text-emerald-400" />
          </div>
          <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-4 block">Cüzdan Bakiyesi (Nakit)</span>
          <div className="text-4xl font-black font-headline text-white tracking-tighter">
            ₺{(liveVault?.balance || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`p-8 rounded-[2.5rem] border relative overflow-hidden group ${
              isPositive ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-rose-500/5 border-rose-500/20'
          }`}
        >
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
             {isPositive ? <TrendingUp className="w-16 h-16 text-emerald-400" /> : <TrendingDown className="w-16 h-16 text-rose-400" />}
          </div>
          <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-4 block">Toplam Kazanç / Kayıp</span>
          <div className={`text-4xl font-black font-headline tracking-tighter ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isPositive ? '+' : ''}{(liveVault?.overall_pnl || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL
            <div className={`text-xs mt-1 font-bold ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                %{liveVault?.overall_pnl_percent} Hesap Büyümesi
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Holdings Table */}
        <div className="lg:col-span-2 p-8 rounded-[2.5rem] bg-white/5 border border-white/5 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-black font-headline text-white uppercase tracking-widest flex items-center gap-3">
                <Activity className="w-5 h-5 text-primary" />
                Elimdeki Hisseler
            </h2>
            <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[8px] font-bold text-slate-500 uppercase tracking-widest">
                {liveVault?.holdings.length || 0} ADET POZİSYON
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-white/5">
                  <th className="pb-4 pr-4">Hisse Senedi</th>
                  <th className="pb-4 px-4 text-right">Maliyet</th>
                  <th className="pb-4 px-4 text-right">Anlık Fiyat</th>
                  <th className="pb-4 px-4 text-right">Adet</th>
                  <th className="pb-4 px-4 text-right">Kâr / Zarar</th>
                  <th className="pb-4 pl-4 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {liveVault?.holdings.map((h: any) => (
                  <tr key={h.ticker} className="group hover:bg-white/5 transition-all">
                    <td className="py-6 pr-4">
                      <div className="font-black font-headline text-white tracking-widest">{h.ticker.replace('.IS', '')}</div>
                      <div className="text-[9px] text-slate-500 font-bold uppercase mt-1">BIST Alt Pazarı</div>
                    </td>
                    <td className="py-6 px-4 text-right text-slate-300 font-headline text-sm font-black">
                      ₺{h.entry_price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-6 px-4 text-right font-headline text-sm font-black text-white">
                      <motion.span
                        key={h.current_price}
                        initial={{ opacity: 0.5 }}
                        animate={{ opacity: 1 }}
                        className="tabular-nums"
                      >
                        ₺{h.current_price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                      </motion.span>
                    </td>
                    <td className="py-6 px-4 text-right text-slate-400 font-headline text-sm font-black tabular-nums">
                      {Math.floor(h.lots).toLocaleString('tr-TR')}
                    </td>
                    <td className={`py-6 px-4 text-right font-black ${h.pnl_tl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      <div className="flex flex-col items-end gap-1">
                        <span className="font-headline text-sm">{h.pnl_tl > 0 ? '+' : ''}{h.pnl_tl.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</span>
                        <div className={`px-2 py-0.5 rounded text-[9px] font-black ${
                            h.pnl_tl >= 0 ? 'bg-emerald-500/10' : 'bg-rose-500/10'
                        }`}>%{h.pnl_percent}</div>
                      </div>
                    </td>
                    <td className="py-6 pl-4 text-right">
                        <button 
                            onClick={() => deleteHolding(h.ticker)}
                            className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-slate-500 hover:bg-rose-500/10 hover:border-rose-500/20 hover:text-rose-400 transition-all"
                            title="Hisseyi Sil (Maliyeti İade Et)"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </td>
                  </tr>
                ))}
                {(liveVault?.holdings.length === 0) && (
                  <tr>
                    <td colSpan={5} className="py-20 text-center text-slate-500 italic font-body text-sm">
                      Kasanız şu an boş. Analiz sekmelerinden simülasyon işlemi başlatabilirsiniz.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* History List */}
        <div className="p-8 rounded-[2.5rem] bg-white/5 border border-white/5 backdrop-blur-xl">
          <h2 className="text-xl font-black font-headline text-white uppercase tracking-widest mb-8 flex items-center gap-3">
            <History className="w-5 h-5 text-primary" />
            Geçmiş
          </h2>
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {liveVault?.history.map((t: any, idx: number) => (
              <div key={idx} className="p-5 rounded-3xl bg-white/5 border border-white/5 flex items-center justify-between group hover:border-white/20 transition-all">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl ${t.side === 'AL' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                    {t.side === 'AL' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="font-black font-headline text-white text-sm tracking-widest">{t.ticker.replace('.IS', '')}</div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase mt-1">{new Date(t.timestamp).toLocaleTimeString('tr-TR')}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-black font-headline ${t.side === 'AL' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {t.side === 'AL' ? '+' : '-'}{t.total_tl.toLocaleString()} TL
                  </div>
                  <div className="text-[9px] text-slate-500 font-bold uppercase mt-1">{Math.floor(t.lots)} Adet</div>
                </div>
              </div>
            ))}
            {(liveVault?.history.length === 0) && (
              <div className="py-12 text-center text-slate-500 text-xs font-bold uppercase tracking-widest">Kayıt bulunamadı</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VaultTab;
