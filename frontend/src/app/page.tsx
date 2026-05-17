'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { api } from '@/services/api';

import Header from '@/components/layout/Header';
import TabsMenu from '@/components/layout/TabsMenu';
import SearchTab from '@/components/features/search/SearchTab';
import PortfolioTab from '@/components/features/portfolio/PortfolioTab';
import SavedTab from '@/components/features/portfolio/SavedTab';
import NewsTab from '@/components/features/news/NewsTab';
import HeatmapTab from '@/components/features/heatmap/HeatmapTab';
import ChatbotTab from '@/components/features/chatbot/ChatbotTab';
import CommoditiesTab from '@/components/features/commodities/CommoditiesTab';
import AgentsTab from '@/components/features/agents/AgentsTab';
import WarRoomTab from '@/components/features/agents/WarRoomTab';
import BacktestTab from '@/components/features/backtest/BacktestTab';
import VaultTab from '@/components/features/vault/VaultTab';
import AuthScreen from '@/components/auth/AuthScreen';
import WebSocketProvider from '@/components/providers/WebSocketProvider';
import LiveTicker from '@/components/layout/LiveTicker';
import TopStockTicker from '@/components/layout/TopStockTicker';

export default function Home() {
  const activeTab = useAppStore((state) => state.activeTab);
  const token = useAppStore((state) => state.token);
  const setAvailableStocks = useAppStore((state) => state.setAvailableStocks);
  const setSystemStatus = useAppStore((state) => state.setSystemStatus);

  useEffect(() => {
    if (!token) return;

    api.getStocks()
      .then(data => setAvailableStocks(data?.stocks || []))
      .catch(console.error);

    api.getSystemStatus()
      .then(data => setSystemStatus(data))
      .catch(console.error);
  }, [setAvailableStocks, setSystemStatus, token]);

  // Auth bypass: always show dashboard
  /*
  if (!token) {
    return <AuthScreen />;
  }
  */

  const renderTabContent = () => {
    switch (activeTab) {
      case 'search': return <SearchTab />;
      case 'portfolio': return <PortfolioTab />;
      case 'news': return <NewsTab />;
      case 'heatmap': return <HeatmapTab />;
      case 'chatbot': return <ChatbotTab />;
      case 'saved': return <SavedTab />;
      case 'commodities': return <CommoditiesTab />;
      case 'agents': return <AgentsTab />;
      case 'warroom': return <WarRoomTab />;
      case 'backtest': return <BacktestTab />;
      case 'vault': return <VaultTab />;
      default: return <SearchTab />;
    }
  };

  return (
    <WebSocketProvider>
      <div className="min-h-screen bg-background relative selection:bg-primary/30 font-body antialiased overflow-hidden text-foreground">
        <div className="fixed inset-0 grain-texture z-[100] pointer-events-none"></div>
        
        <div className="flex min-h-screen relative z-10">
          {/* Side Nav Sidebar (Core w-64) */}
          <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-64 flex-col z-50">
            <TabsMenu isSidebar={true} />
          </aside>

          {/* Main Content */}
          <main className="flex-1 pl-64 min-h-screen p-0 overflow-y-auto selection:bg-primary/30">
            <div className="pt-28 px-8 pb-12">
              <Header />
              <TopStockTicker />
              
              {/* Mobile Tab Menu (Bottom bar style for mobile) */}
              <div className="lg:hidden fixed bottom-0 left-0 w-full z-[60]">
                <TabsMenu isSidebar={false} />
              </div>

              <div className="max-w-[1600px] mx-auto mt-8">
                {renderTabContent()}
              </div>

              {/* Live Asset Ticker (Fixed Bottom) */}
              <LiveTicker />
            </div>
          </main>
        </div>
      </div>
    </WebSocketProvider>
  );
}
