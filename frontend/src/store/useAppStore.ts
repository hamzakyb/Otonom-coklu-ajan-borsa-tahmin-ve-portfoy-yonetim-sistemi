import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type TabType = 'search' | 'portfolio' | 'news' | 'heatmap' | 'chatbot' | 'backtest' | 'saved' | 'agents' | 'commodities' | 'warroom' | 'vault';

export interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
}

interface AppState {
  // Auth
  token: string | null;
  userEmail: string | null;
  setAuth: (token: string, email: string) => void;
  logout: () => void;

  // WebSockets & Live Data
  wsConnected: boolean;
  setWsConnected: (status: boolean) => void;
  livePrices: Record<string, number>;
  setLivePrices: (prices: Record<string, number>) => void;

  // Navigation
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  selectedAgent: string | null;
  setSelectedAgent: (agent: string | null) => void;

  // Global / System Status
  availableStocks: string[];
  setAvailableStocks: (stocks: string[] | undefined | null) => void;
  systemStatus: any;
  setSystemStatus: (status: any) => void;

  // Portfolio Dashboard
  balance: string;
  setBalance: (balance: string) => void;
  risk: string;
  setRisk: (risk: string) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  data: any;
  setData: (data: any) => void;
  error: string | null;
  setError: (error: string | null) => void;

  // Search / Predict
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredStocks: string[];
  setFilteredStocks: (stocks: string[]) => void;
  predictLoading: boolean;
  setPredictLoading: (loading: boolean) => void;
  predictData: any;
  setPredictData: (data: any) => void;
  predictError: string | null;
  setPredictError: (error: string | null) => void;

  // News
  newsLoading: boolean;
  setNewsLoading: (loading: boolean) => void;
  newsData: any[];
  setNewsData: (data: any[]) => void;
  newsError: string | null;
  setNewsError: (error: string | null) => void;

  // Heatmap
  heatmapLoading: boolean;
  setHeatmapLoading: (loading: boolean) => void;
  heatmapData: any[];
  setHeatmapData: (data: any[]) => void;
  heatmapError: string | null;
  setHeatmapError: (error: string | null) => void;

  // Chatbot
  chatMessages: ChatMessage[];
  setChatMessages: (messages: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => void;
  currentMessage: string;
  setCurrentMessage: (msg: string) => void;
  isTyping: boolean;
  setIsTyping: (typing: boolean) => void;

  // Agent Chat
  agentChatMessages: ChatMessage[];
  setAgentChatMessages: (messages: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => void;
  agentCurrentMessage: string;
  setAgentCurrentMessage: (msg: string) => void;
  isAgentTyping: boolean;
  setIsAgentTyping: (typing: boolean) => void;

  // Backtest
  backtestQuery: string;
  setBacktestQuery: (query: string) => void;
  backtestFilteredStocks: string[];
  setBacktestFilteredStocks: (stocks: string[]) => void;
  backtestLoading: boolean;
  setBacktestLoading: (loading: boolean) => void;
  backtestData: any;
  setBacktestData: (data: any) => void;
  backtestError: string | null;
  setBacktestError: (error: string | null) => void;

  // War Room
  warRoomTicker: string;
  setWarRoomTicker: (ticker: string) => void;
  warRoomDebate: any[];
  setWarRoomDebate: (debate: any[]) => void;
  warRoomLoading: boolean;
  setWarRoomLoading: (loading: boolean) => void;
  warRoomError: string | null;
  setWarRoomError: (error: string | null) => void;

  // Saved Portfolio
  savedPortfolioLoading: boolean;
  setSavedPortfolioLoading: (loading: boolean) => void;
  savedPortfolioData: any;
  setSavedPortfolioData: (data: any) => void;
  savedPortfolioError: string | null;
  setSavedPortfolioError: (error: string | null) => void;

  // Rebalance
  rebalanceLoading: boolean;
  setRebalanceLoading: (loading: boolean) => void;
  rebalanceData: any;
  setRebalanceData: (data: any) => void;
  rebalanceError: string | null;
  setRebalanceError: (error: string | null) => void;

  // Commodities
  commoditiesLoading: boolean;
  setCommoditiesLoading: (loading: boolean) => void;
  commoditiesData: { [key: string]: any };
  setCommoditiesData: (data: { [key: string]: any }) => void;
  commoditiesError: string | null;
  setCommoditiesError: (error: string | null) => void;

  // Vault
  vaultData: any;
  vaultLoading: boolean;
  vaultError: string | null;
  fetchVault: () => Promise<void>;
  deleteHolding: (ticker: string) => Promise<void>;
  resetVault: () => Promise<void>;

  // Actions
  executeTrade: (ticker: string, side: 'AL' | 'SAT', amount: number) => Promise<void>;
  
  // Toast
  toast: { message: string; type: 'success' | 'error'; show: boolean };
  showToast: (message: string, type: 'success' | 'error') => void;
}

export const useAppStore = create<AppState>()(persist((set) => ({
  token: 'guest-session-active',
  userEmail: 'misafir@omni.com',
  setAuth: (token, email) => set({ token, userEmail: email }),
  logout: () => set({ token: 'guest-session-active', userEmail: 'misafir@omni.com' }),

  wsConnected: false,
  setWsConnected: (status) => set({ wsConnected: status }),
  livePrices: {},
  setLivePrices: (prices) => set({ livePrices: prices }),

  activeTab: 'search',
  setActiveTab: (tab) => set({ activeTab: tab }),
  selectedAgent: null,
  setSelectedAgent: (agent) => set({ selectedAgent: agent }),

  availableStocks: [],
  setAvailableStocks: (stocks) => set({ availableStocks: Array.isArray(stocks) ? stocks : [] }),
  systemStatus: null,
  setSystemStatus: (status) => set({ systemStatus: status }),

  balance: '',
  setBalance: (balance) => set({ balance }),
  risk: 'dengeli',
  setRisk: (risk) => set({ risk }),
  loading: false,
  setLoading: (loading) => set({ loading }),
  data: null,
  setData: (data) => set({ data }),
  error: null,
  setError: (error) => set({ error }),

  searchQuery: '',
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  filteredStocks: [],
  setFilteredStocks: (filteredStocks) => set({ filteredStocks }),
  predictLoading: false,
  setPredictLoading: (predictLoading) => set({ predictLoading }),
  predictData: null,
  setPredictData: (predictData) => set({ predictData }),
  predictError: null,
  setPredictError: (predictError) => set({ predictError }),

  newsLoading: false,
  setNewsLoading: (newsLoading) => set({ newsLoading }),
  newsData: [],
  setNewsData: (newsData) => set({ newsData }),
  newsError: null,
  setNewsError: (newsError) => set({ newsError }),

  heatmapLoading: false,
  setHeatmapLoading: (heatmapLoading) => set({ heatmapLoading }),
  heatmapData: [],
  setHeatmapData: (heatmapData) => set({ heatmapData }),
  heatmapError: null,
  setHeatmapError: (heatmapError) => set({ heatmapError }),

  chatMessages: [{ role: 'ai', content: 'Merhaba! Ben OmniQuant AI. Hangi hisseleri, portföy stratejilerini veya Borsa İstanbul trendlerini konuşmak istersiniz?' }],
  setChatMessages: (updater) => set((state) => ({
    chatMessages: typeof updater === 'function' ? updater(state.chatMessages) : updater,
  })),
  currentMessage: '',
  setCurrentMessage: (currentMessage) => set({ currentMessage }),
  isTyping: false,
  setIsTyping: (isTyping) => set({ isTyping }),

  agentChatMessages: [],
  setAgentChatMessages: (updater) => set((state) => ({
    agentChatMessages: typeof updater === 'function' ? updater(state.agentChatMessages) : updater,
  })),
  agentCurrentMessage: '',
  setAgentCurrentMessage: (agentCurrentMessage) => set({ agentCurrentMessage }),
  isAgentTyping: false,
  setIsAgentTyping: (isAgentTyping) => set({ isAgentTyping }),

  backtestQuery: '',
  setBacktestQuery: (backtestQuery) => set({ backtestQuery }),
  backtestFilteredStocks: [],
  setBacktestFilteredStocks: (backtestFilteredStocks) => set({ backtestFilteredStocks }),
  backtestLoading: false,
  setBacktestLoading: (backtestLoading) => set({ backtestLoading }),
  backtestData: null,
  setBacktestData: (backtestData) => set({ backtestData }),
  backtestError: null,
  setBacktestError: (backtestError) => set({ backtestError }),

  warRoomTicker: '',
  setWarRoomTicker: (warRoomTicker) => set({ warRoomTicker }),
  warRoomDebate: [],
  setWarRoomDebate: (warRoomDebate) => set({ warRoomDebate }),
  warRoomLoading: false,
  setWarRoomLoading: (warRoomLoading) => set({ warRoomLoading }),
  warRoomError: null,
  setWarRoomError: (warRoomError) => set({ warRoomError }),

  savedPortfolioLoading: false,
  setSavedPortfolioLoading: (savedPortfolioLoading) => set({ savedPortfolioLoading }),
  savedPortfolioData: null,
  setSavedPortfolioData: (savedPortfolioData) => set({ savedPortfolioData }),
  savedPortfolioError: null,
  setSavedPortfolioError: (savedPortfolioError) => set({ savedPortfolioError }),

  rebalanceLoading: false,
  setRebalanceLoading: (rebalanceLoading) => set({ rebalanceLoading }),
  rebalanceData: null,
  setRebalanceData: (rebalanceData) => set({ rebalanceData }),
  rebalanceError: null,
  setRebalanceError: (rebalanceError) => set({ rebalanceError }),

  commoditiesLoading: false,
  setCommoditiesLoading: (commoditiesLoading) => set({ commoditiesLoading }),
  commoditiesData: {},
  setCommoditiesData: (commoditiesData) => set({ commoditiesData }),
  commoditiesError: null,
  setCommoditiesError: (commoditiesError) => set({ commoditiesError }),

  vaultData: null,
  vaultLoading: false,
  vaultError: null,
  fetchVault: async () => {
    set({ vaultLoading: true });
    try {
      const res = await fetch('http://localhost:8000/portfolio/vault');
      const data = await res.json();
      set({ vaultData: data, vaultLoading: false });
    } catch (err) {
      set({ vaultError: "Kasa verileri alınamadı.", vaultLoading: false });
    }
  },

  deleteHolding: async (ticker: string) => {
    try {
      const res = await fetch(`http://localhost:8000/portfolio/vault/holding?ticker=${ticker}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        useAppStore.getState().showToast(`${ticker} silindi ve tutar iade edildi.`, 'success');
        useAppStore.getState().fetchVault();
      }
    } catch (err) {
      useAppStore.getState().showToast("Silme işlemi başarısız.", 'error');
    }
  },

  resetVault: async () => {
    try {
      const res = await fetch('http://localhost:8000/portfolio/vault/reset', {
        method: 'POST'
      });
      if (res.ok) {
        useAppStore.getState().showToast("Kasa başarıyla sıfırlandı.", 'success');
        useAppStore.getState().fetchVault();
      }
    } catch (err) {
      useAppStore.getState().showToast("Sıfırlama işlemi başarısız.", 'error');
    }
  },

  executeTrade: async (ticker, side, amount) => {
    try {
      const res = await fetch('http://localhost:8000/portfolio/trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticker: ticker,
          side: side,
          amount_tl: amount
        })
      });
      const data = await res.json();
      if (res.ok) {
        useAppStore.getState().showToast(`${ticker} için ${side} işlemi başarıyla gerçekleşti!`, 'success');
        // Refresh vault data immediately
        useAppStore.getState().fetchVault();
      } else {
        useAppStore.getState().showToast(`Hata: ${data.detail || 'İşlem başarısız.'}`, 'error');
      }
    } catch (err) {
      useAppStore.getState().showToast("Sunucuya bağlanılamadı.", 'error');
    }
  },

  toast: { message: '', type: 'success', show: false },
  showToast: (message, type) => {
    // Clear and show new
    set({ toast: { message, type, show: true } });
    
    // Auto hide after 5s
    setTimeout(() => {
        // Only hide if the message is still the same (prevent race condition)
        if (useAppStore.getState().toast.message === message) {
            set({ toast: { ...useAppStore.getState().toast, show: false } });
        }
    }, 5000);
  },
}), { name: 'omniquant-store' }));
