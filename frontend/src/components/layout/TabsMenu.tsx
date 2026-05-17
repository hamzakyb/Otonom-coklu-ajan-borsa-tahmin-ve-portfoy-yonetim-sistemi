'use client';

import { useAppStore, TabType } from '@/store/useAppStore';
import { api } from '@/services/api';
import { 
    Search, Wallet, Bookmark, Network, Activity, Map, Hexagon, 
    MessageSquare, LineChart as LineChartIcon, Crosshair, HelpCircle, Settings, Shield, Zap 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TabsMenuProps {
  isSidebar?: boolean;
}

export default function TabsMenu({ isSidebar = false }: TabsMenuProps) {
  const activeTab = useAppStore((state) => state.activeTab);
  const setActiveTab = useAppStore((state) => state.setActiveTab);

  const setSavedPortfolioLoading = useAppStore((state) => state.setSavedPortfolioLoading);
  const setSavedPortfolioError = useAppStore((state) => state.setSavedPortfolioError);
  const setSavedPortfolioData = useAppStore((state) => state.setSavedPortfolioData);
  const setRebalanceData = useAppStore((state) => state.setRebalanceData);

  const setNewsLoading = useAppStore((state) => state.setNewsLoading);
  const setNewsError = useAppStore((state) => state.setNewsError);
  const setNewsData = useAppStore((state) => state.setNewsData);
  const newsData = useAppStore((state) => state.newsData);

  const setHeatmapLoading = useAppStore((state) => state.setHeatmapLoading);
  const setHeatmapError = useAppStore((state) => state.setHeatmapError);
  const setHeatmapData = useAppStore((state) => state.setHeatmapData);
  const heatmapData = useAppStore((state) => state.heatmapData);

  const setCommoditiesLoading = useAppStore((state) => state.setCommoditiesLoading);
  const setCommoditiesError = useAppStore((state) => state.setCommoditiesError);
  const setCommoditiesData = useAppStore((state) => state.setCommoditiesData);
  const commoditiesData = useAppStore((state) => state.commoditiesData);

  const handleFetchSavedPortfolio = async () => {
    setActiveTab('saved');
    setSavedPortfolioLoading(true);
    setSavedPortfolioError(null);
    setRebalanceData(null);
    try {
      const data = await api.getSavedPortfolio();
      setSavedPortfolioData(data);
    } catch (err: any) {
      setSavedPortfolioError(err.message || 'Portföy yüklenemedi.');
    } finally {
      setSavedPortfolioLoading(false);
    }
  };

  const handleFetchNews = async () => {
    setActiveTab('news');
    if (newsData.length > 0) return;
    setNewsLoading(true);
    setNewsError(null);
    try {
      const data = await api.getNews();
      setNewsData(data.news);
    } catch (err: any) {
      setNewsError(err.message || 'Haberler yüklenemedi.');
    } finally {
      setNewsLoading(false);
    }
  };

  const handleFetchHeatmap = async () => {
    setActiveTab('heatmap');
    if (heatmapData.length > 0) return;
    setHeatmapLoading(true);
    setHeatmapError(null);
    try {
      const data = await api.getHeatmap();
      setHeatmapData(data.heatmap);
    } catch (err: any) {
      setHeatmapError(err.message || 'Harita yüklenemedi.');
    } finally {
      setHeatmapLoading(false);
    }
  };

  const handleFetchCommodities = async () => {
    setActiveTab('commodities');
    if (Object.keys(commoditiesData).length > 0) return;
    setCommoditiesLoading(true);
    setCommoditiesError(null);
    try {
      const tickers = ['GC=F', 'SI=F', 'CL=F'];
      const results: { [key: string]: any } = {};
      for (const ticker of tickers) {
        try {
          results[ticker] = await api.getCommodity(ticker);
        } catch (e) {
            // keep fetching others
        }
      }
      if (Object.keys(results).length === 0) throw new Error('Emtia verileri çekilemedi.');
      setCommoditiesData(results);
    } catch (err: any) {
      setCommoditiesError(err.message || 'Veri yüklenemedi.');
    } finally {
      setCommoditiesLoading(false);
    }
  };

  const menuItems = [
    { id: 'search' as TabType, icon: Search, label: 'Terminal', group: 'Primary' },
    { id: 'news' as TabType, icon: Activity, label: 'Pulse', group: 'Primary', action: handleFetchNews },
    { id: 'portfolio' as TabType, icon: Wallet, label: 'Forge', group: 'Primary' },
    { id: 'agents' as TabType, icon: Network, label: 'Neural', group: 'Analytics' },
    { id: 'warroom' as TabType, icon: Crosshair, label: 'Tactical', group: 'Analytics' },
    { id: 'heatmap' as TabType, icon: Map, label: 'Vision', group: 'Analytics', action: handleFetchHeatmap },
    { id: 'backtest' as TabType, icon: LineChartIcon, label: 'Simulator', group: 'Analytics' },
    { id: 'commodities' as TabType, icon: Hexagon, label: 'Flux', group: 'Global', action: handleFetchCommodities },
    { id: 'chatbot' as TabType, icon: MessageSquare, label: 'Assistant', group: 'Action' },
    { id: 'saved' as TabType, icon: Bookmark, label: 'Vault', group: 'Action', action: handleFetchSavedPortfolio },
    { id: 'vault' as TabType, icon: Wallet, label: 'Kasa', group: 'Management' },
  ];

  if (isSidebar) {
    return (
      <div className="flex flex-col h-full bg-[#121315]/80 backdrop-blur-xl border-r border-white/5 relative w-64 shadow-[24px_0_48px_rgba(0,0,0,0.4)]">
        {/* Brand */}
        <div className="py-8 flex flex-col items-center">
            <div className="text-xl font-black text-[#00f2ff] tracking-tighter font-headline uppercase leading-none mb-1 text-center px-4">OmniQuant</div>
            <div className="text-[7px] font-black text-slate-500 uppercase tracking-[0.4em]">BIST AI Terminal</div>
        </div>
        
        <nav className="flex-1 overflow-y-auto px-4 space-y-8 scrollbar-hide py-4">
            {['Management', 'Analytics', 'Signals', 'Global'].map((group) => (
                <div key={group} className="space-y-3">
                    <div className="px-4 flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{group}</span>
                        <div className="h-[1px] flex-1 bg-white/5 ml-4"></div>
                    </div>
                    <div className="space-y-1.5">
                        {menuItems.filter(i => (
                            group === 'Management' ? ['search', 'portfolio', 'saved', 'vault'].includes(i.id) :
                            group === 'Analytics' ? ['heatmap', 'backtest'].includes(i.id) :
                            group === 'Signals' ? ['agents', 'warroom'].includes(i.id) :
                            group === 'Global' ? ['news', 'commodities'].includes(i.id) : false
                        )).map((item) => {
                            const Icon = item.icon;
                            const isActive = activeTab === item.id;
                            
                            return (
                                <button
                                    key={item.id}
                                    onClick={item.action || (() => setActiveTab(item.id))}
                                    className={`w-full group relative flex items-center p-4 rounded-xl transition-all duration-300 ${
                                        isActive 
                                            ? "bg-[#00f2ff]/10 text-[#00f2ff] shadow-[0_0_15px_rgba(0,242,255,0.2)] border border-[#00f2ff]/20" 
                                            : "text-slate-400 hover:text-slate-100 hover:bg-white/5 border border-transparent"
                                    }`}
                                >
                                    <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-110"}`} />
                                    <span className={`ml-4 text-[11px] font-black font-headline uppercase tracking-widest transition-opacity duration-300 ${isActive ? "opacity-100" : "opacity-70 group-hover:opacity-100"}`}>
                                        {item.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            ))}
        </nav>
        
        <div className="p-6 border-t border-white/5 space-y-3">
            <button className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-white/5 text-slate-400 hover:text-[#00f2ff] transition-all group">
                <Settings className="w-5 h-5" />
                <span className="text-[10px] font-black font-headline uppercase tracking-widest">Settings</span>
            </button>
            <button className="w-full flex items-center gap-4 p-4 rounded-xl bg-secondary/10 border border-secondary/20 group hover:border-secondary transition-all">
                <HelpCircle className="w-5 h-5 text-secondary" />
                <span className="text-[10px] font-black font-headline text-secondary uppercase tracking-widest leading-none">Help & Feedback</span>
            </button>
        </div>
      </div>
    );
  }

  // Mobile Redesign
  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-20 bg-[#121315]/90 backdrop-blur-xl border-t border-white/5 lg:hidden px-4">
        {menuItems.slice(0, 4).map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
                <button
                    key={item.id}
                    onClick={item.action || (() => setActiveTab(item.id))}
                    className={`flex flex-col items-center gap-1 transition-all duration-300 ${
                        isActive ? "text-[#00f2ff] scale-110" : "text-slate-500 hover:text-slate-300"
                    }`}
                >
                    <div className={`p-2 rounded-xl ${isActive ? "bg-[#00f2ff]/10 shadow-[0_0_15px_rgba(0,242,255,0.3)]" : ""}`}>
                        <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[8px] font-black font-headline uppercase tracking-widest">{item.label}</span>
                </button>
            );
        })}
    </nav>
  );
}
