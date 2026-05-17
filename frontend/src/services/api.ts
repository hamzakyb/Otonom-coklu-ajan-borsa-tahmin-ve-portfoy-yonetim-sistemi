import { useAppStore } from '@/store/useAppStore';

const API_URL = 'http://localhost:8000';

const getHeaders = (isJson = false) => {
  const token = useAppStore.getState().token;
  const headers: Record<string, string> = {};
  if (isJson) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

export const api = {
  login: async (credentials: any) => {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    if (!response.ok) throw new Error('Giriş başarısız');
    return response.json();
  },

  register: async (credentials: any) => {
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || 'Kayıt başarısız');
    return data;
  },

  getStocks: async () => {
    const response = await fetch(`${API_URL}/stocks`);
    if (!response.ok) throw new Error('Hisseler alınamadı.');
    return response.json();
  },

  getSystemStatus: async () => {
    const response = await fetch(`${API_URL}/system/status`);
    if (!response.ok) throw new Error('Sistem durumu alınamadı.');
    return response.json();
  },

  analyzePortfolio: async (portfolio_balance: number, risk_tolerance: string) => {
    const response = await fetch(`${API_URL}/analyze`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ portfolio_balance, risk_tolerance }),
    });
    if (!response.ok) throw new Error('API isteği başarısız oldu.');
    return response.json();
  },

  checkAnalysisStatus: async (taskId: string) => {
    const response = await fetch(`${API_URL}/analyze/status/${taskId}`, {
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Durum kontrolü başarısız oldu.');
    return response.json();
  },

  savePortfolio: async (data: any) => {
    const response = await fetch(`${API_URL}/portfolio/save`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({
        reserve_cash: data.reserve_cash,
        allocations: data.allocations,
        market_sentiment: data.market_sentiment
      }),
    });
    if (!response.ok) throw new Error('Kaydedilemedi');
    return response.json();
  },

  getSavedPortfolio: async () => {
    const response = await fetch(`${API_URL}/portfolio/saved`, { headers: getHeaders() });
    const result = await response.json();
    if (!response.ok || result.status === 'error') {
      throw new Error(result.message || 'Kayıtlı portföy bulunamadı.');
    }
    return result;
  },

  rebalancePortfolio: async () => {
    const response = await fetch(`${API_URL}/portfolio/rebalance`, {
        method: 'POST',
        headers: getHeaders()
    });
    if (!response.ok) throw new Error('Rebalance başarısız oldu.');
    return response.json();
  },

  predictStock: async (ticker: string) => {
    const response = await fetch(`${API_URL}/predict/${ticker}`);
    if (!response.ok) {
      if (response.status === 404) throw new Error(`${ticker} için veri bulunamadı.`);
      throw new Error('Tahmin alınırken bir hata oluştu. Backend veya Llama3.2 bağlantısını kontrol edin.');
    }
    return response.json();
  },

  getNews: async () => {
    const response = await fetch(`${API_URL}/news`);
    if (!response.ok) throw new Error('Haberler alınırken bir sorun oluştu.');
    return response.json();
  },

  startWarRoomDebate: async (ticker: string) => {
    const response = await fetch(`${API_URL}/warroom/debate/${ticker}`, {
      method: 'POST',
      headers: getHeaders(true)
    });
    if (!response.ok) throw new Error('Ajanlar tartışmayı başlatamadı.');
    return response.json();
  },

  getHeatmap: async () => {
    const response = await fetch(`${API_URL}/heatmap`);
    if (!response.ok) throw new Error('Isı haritası alınırken bir sorun oluştu.');
    return response.json();
  },

  getCommodity: async (ticker: string) => {
    const response = await fetch(`${API_URL}/predict/commodity/${ticker}`);
    if (!response.ok) throw new Error(`${ticker} verisi alınamadı.`);
    return response.json();
  },

  chatAgent: async (agentId: string, message: string) => {
    const response = await fetch(`${API_URL}/agent/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agent_id: agentId, message })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || 'Bir hata oluştu');
    return data;
  },

  chatSystem: async (message: string) => {
    const response = await fetch(`${API_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });
    if (!response.ok) throw new Error('Yapay Zeka cevap veremedi.');
    return response.json();
  },

  getBacktest: async (ticker: string) => {
    const response = await fetch(`${API_URL}/backtest/${ticker}`);
    if (!response.ok) {
      if (response.status === 404) throw new Error(`${ticker} için yeterli veri bulunamadı.`);
      throw new Error('Backtest çalıştırılırken bir hata oluştu.');
    }
    return response.json();
  }
};
