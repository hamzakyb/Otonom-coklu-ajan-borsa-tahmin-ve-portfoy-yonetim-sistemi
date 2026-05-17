'use client';

import { useAppStore } from '@/store/useAppStore';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign, Hexagon, Zap, Activity } from 'lucide-react';

export default function LiveTicker() {
  const livePrices = useAppStore((state) => state.livePrices);
  const availableStocks = useAppStore((state) => state.availableStocks);

  // Core assets to always show first
  const coreAssets = [
    { ticker: 'USDTRY=X', label: 'USD/TRY', icon: DollarSign, color: 'text-emerald-400' },
    { ticker: 'GC=F', label: 'GOLD', icon: Hexagon, color: 'text-amber-400' },
    { ticker: 'CL=F', label: 'CRUDE OIL', icon: Zap, color: 'text-orange-400' },
  ];

  // Combine core assets with a subset of stocks
  const displayTickers = [...coreAssets.map(a => a.ticker), ...availableStocks.slice(0, 15)];

  const getPrice = (ticker: string) => livePrices[ticker] || '...';
  
  // Simulated change for visual effect in ticker
  const getChange = (ticker: string) => {
      const hash = ticker.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      return (hash % 2 === 0 ? '+' : '-') + (hash % 10 / 10).toFixed(2) + '%';
  };

  return (
    <div className="hidden lg:flex fixed bottom-0 left-64 right-0 h-10 bg-[#121315]/95 backdrop-blur-3xl border-t border-white/5 z-40 items-center overflow-hidden shadow-2xl">
      <div className="ticker-scroll whitespace-nowrap py-2 flex items-center pl-16">
        {displayTickers.map((ticker, i) => {
          const core = coreAssets.find(a => a.ticker === ticker);
          const price = getPrice(ticker);
          const change = getChange(ticker);
          const isUp = change.startsWith('+');

          return (
            <div key={`${ticker}-${i}`} className="flex items-center gap-4 px-12 border-r border-white/5 last:border-none">
              <span className={`text-[10px] font-black uppercase tracking-widest ${core ? core.color : 'text-slate-500'}`}>
                {core ? core.label : ticker.split('.')[0]}
              </span>
              <span className="text-xs font-black font-headline text-white tracking-tight">
                {typeof price === 'number' ? price.toLocaleString('tr-TR', { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: 2 
                }) : price}
              </span>
              <span className={`text-[9px] font-bold flex items-center gap-1 ${isUp ? 'text-primary' : 'text-secondary'}`}>
                {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {change}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
