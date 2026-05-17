'use client';

import { useAppStore } from '@/store/useAppStore';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Cpu } from 'lucide-react';

export default function TopStockTicker() {
  const livePrices = useAppStore((state) => state.livePrices);
  const BIST100_LIST = [
    "AEFES.IS", "AGHOL.IS", "AHGAZ.IS", "AKBNK.IS", "AKCNS.IS", "AKFGY.IS", "AKFYE.IS", "AKSA.IS", "AKSEN.IS", "ALARK.IS", 
    "ALBRK.IS", "ALFAS.IS", "ANELE.IS", "ARCLK.IS", "ASELS.IS", "ASTOR.IS", "ASUZU.IS", "AYDEM.IS", "BAGFS.IS", "BERA.IS", 
    "BIENP.IS", "BIMAS.IS", "BIOEN.IS", "BOBET.IS", "BRSAN.IS", "BRYAT.IS", "BSOKE.IS", "BTCIM.IS", "CANTE.IS", "CCOLA.IS", 
    "CIMSA.IS", "CWENE.IS", "DOAS.IS", "DOHOL.IS", "EGEEN.IS", "EKGYO.IS", "ENERY.IS", "ENJSA.IS", "ENKAI.IS", "EREGL.IS", 
    "EUPWR.IS", "EUREN.IS", "FROTO.IS", "GARAN.IS", "GENIL.IS", "GESAN.IS", "GOKNR.IS", "GOZDE.IS", "GSDHO.IS", "GUBRF.IS", 
    "GWIND.IS", "HALKB.IS", "HEKTS.IS", "IPEKE.IS", "ISCTR.IS", "ISDMR.IS", "ISGYO.IS", "ISMEN.IS", "IZENR.IS", "KAYSE.IS", 
    "KCAER.IS", "KCHOL.IS", "KENT.IS", "KLSER.IS", "KONTR.IS", "KORDS.IS", "KOZAA.IS", "KOZAL.IS", "KRDMD.IS", "KZBGY.IS", 
    "MAVI.IS", "MGROS.IS", "MIATK.IS", "ODAS.IS", "OTKAR.IS", "OYAKC.IS", "PASEU.IS", "PENTA.IS", "PETKM.IS", "PGSUS.IS", 
    "QUAGR.IS", "REEDR.IS", "SAHOL.IS", "SASA.IS", "SAYAS.IS", "SDTTR.IS", "SISE.IS", "SKBNK.IS", "SMRTG.IS", "SOKM.IS", 
    "TABGD.IS", "TARKN.IS", "TAVHL.IS", "TCELL.IS", "THYAO.IS", "TKFEN.IS", "TMSN.IS", "TOASO.IS", "TSKB.IS", "TTKOM.IS", 
    "TUPRS.IS", "TURSG.IS", "ULKER.IS", "VAKBN.IS", "VESBE.IS", "VESTL.IS", "YEOTK.IS", "YKBNK.IS", "YYLGD.IS", "ZOREN.IS"
  ];

  // Use the hardcoded list to ensure "all" are seen
  const displayTickers = BIST100_LIST;

  const getPrice = (ticker: string) => livePrices[ticker] || '...';
  
  const getChange = (ticker: string) => {
      const hash = ticker.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      return (hash % 2 === 0 ? '+' : '-') + (hash % 10 / 10).toFixed(2) + '%';
  };

  // Placeholder if news/stocks are loading
  const safeTickers = displayTickers.length > 0 ? displayTickers : ['BIST_100', 'NETWORK_SYNC'];

  return (
    <div className="hidden lg:flex fixed top-20 left-64 right-0 h-8 bg-[#121315]/40 backdrop-blur-md border-b border-white/5 z-30 items-center overflow-hidden">
      <div className="ticker-scroll whitespace-nowrap py-1 flex items-center">
        {safeTickers.map((ticker, i) => {
          const price = getPrice(ticker);
          const change = getChange(ticker);
          const isUp = change.startsWith('+');

          return (
            <div key={`${ticker}-${i}`} className="flex items-center gap-3 px-10 border-r border-white/5 last:border-none">
              <span className="text-[9px] font-black text-white/50 uppercase tracking-widest leading-none">
                {ticker === 'NETWORK_SYNC' ? 'OMNIQUANT' : ticker.split('.')[0]}
              </span>
              <span className="text-[11px] font-black font-headline text-white tracking-tight leading-none">
                {typeof price === 'number' ? price.toLocaleString('tr-TR', { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: 2 
                }) : 'LIVE'}
              </span>
              <span className={`text-[8px] font-bold flex items-center gap-0.5 leading-none ${isUp ? 'text-primary' : 'text-secondary'}`}>
                {isUp ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                {change}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
