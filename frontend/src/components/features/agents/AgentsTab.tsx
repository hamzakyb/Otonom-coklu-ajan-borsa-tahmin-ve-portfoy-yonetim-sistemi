'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, Search, Wallet, Network, Activity, Map, Hexagon, RefreshCw, Bookmark, AlertTriangle, Cpu, LineChart as LineChartIcon, Zap, ChevronLeft, Terminal, ShieldCheck, Microscope } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { api } from '@/services/api';

const AGENTS_DATA = [
  { id: 'master', name: 'Ana Beyin (Master Agent)', role: 'CEO & Stratejist', desc: 'Tüm departmanlardan gelen verileri sentezleyip nihai portföy dağılımını ve Al/Sat kararını veren yönetici.', icon: Hexagon, color: 'text-primary', bg: 'bg-primary/10', level: 98 },
  { id: 'risk', name: 'Risk Yöneticisi', role: 'Sermaye Koruma', desc: 'Max varlık ağırlığını, stop-loss seviyelerini ve drawdown riskini belirleyip portföy güvenliğini sağlar.', icon: ShieldCheck, color: 'text-secondary', bg: 'bg-secondary/10', level: 95 },
  { id: 'quant', name: 'Quant Analist', role: 'Algoritmik Matematikçi', desc: 'Fiyat hareketlerinden matematiksel olasılıkları hesaplar ve istatistiksel standart sapmaları kurgular.', icon: Cpu, color: 'text-blue-400', bg: 'bg-blue-500/10', level: 92 },
  { id: 'fundamental', name: 'Temel Analist', role: 'Şirket Değerleme', desc: 'F/K, PD/DD, ROE, borçluluk gibi finansal göstergelere bakarak hisselerin gerçek değerini çıkarır.', icon: Wallet, color: 'text-emerald-400', bg: 'bg-emerald-500/10', level: 88 },
  { id: 'tech', name: 'Teknik Analist', role: 'Grafik Okuyucu', desc: 'Hareketli ortalamalar, RSI, MACD ve destek/direnç noktaları üzerinden kısa vadeli trendleri inceler.', icon: LineChartIcon, color: 'text-sky-400', bg: 'bg-sky-500/10', level: 90 },
  { id: 'volume', name: 'Hacim ve Momentum', role: 'Para Akışı İzleyici', desc: 'Sıradışı kurumsal para girişlerini ve işlem hacmindeki şok dalgaları tespit eder.', icon: Zap, color: 'text-yellow-400', bg: 'bg-yellow-500/10', level: 85 },
  { id: 'sentiment', name: 'Duygu Analisti', role: 'Piyasa Psikoloğu', desc: 'Günlük haberleri ve Twitter nabzını NLP modelleriyle ölçerek yatırımcı coşkusunu veya paniğini skorlar.', icon: Search, color: 'text-pink-400', bg: 'bg-pink-500/10', level: 82 },
  { id: 'macro', name: 'Makro Ekonomist', role: 'Küresel Perspektif', desc: 'Faiz oranları, enflasyon ve global risk iştahının bizim borsamıza nasıl yansıyacağını öngörür.', icon: Network, color: 'text-orange-400', bg: 'bg-orange-500/10', level: 80 },
  { id: 'pair', name: 'Korelasyon Analisti', role: 'Arbitraj Avcısı', desc: 'Hisseler, endeksler ve döviz kurları arasındaki anormal ayrışmaları bularak piyasa-nötr fırsatlar sunar.', icon: RefreshCw, color: 'text-teal-400', bg: 'bg-teal-500/10', level: 87 },
  { id: 'insider', name: 'KAP & Şirket Habercisi', role: 'Özel İstihbarat', desc: 'Bilanço açıklamaları, temettü kararları gibi spesifik KAP bildirimlerini anında tepkiye çevirir.', icon: Bookmark, color: 'text-fuchsia-400', bg: 'bg-fuchsia-500/10', level: 94 },
  { id: 'sector', name: 'Sektör Uzmanı', role: 'Endüstri Analisti', desc: 'Havacılık, Bankacılık, Gıda gibi spesifik sektörlerin regülasyon ve talep dinamiklerini tartar.', icon: Map, color: 'text-cyan-400', bg: 'bg-cyan-500/10', level: 84 },
  { id: 'critic', name: 'Karşıt Görüş (Critic)', role: 'Şeytanın Avukatı', desc: 'Diğer tüm ajanların ürettiği senaryolardaki boşlukları bularak anti-tez sunar.', icon: Microscope, color: 'text-violet-400', bg: 'bg-violet-500/10', level: 96 },
  { id: 'data', name: 'Veri Toplayıcı', role: 'Sensör Ağı', desc: 'Dünya çapındaki tüm API, websocket ve scraping verilerini saniyeler içinde ulaştıran işlem merkezi.', icon: Activity, color: 'text-lime-400', bg: 'bg-lime-500/10', level: 99 }
];

export default function AgentsTab() {
  const { 
    selectedAgent, setSelectedAgent, 
    agentChatMessages, setAgentChatMessages, 
    agentCurrentMessage, setAgentCurrentMessage, 
    isAgentTyping, setIsAgentTyping 
  } = useAppStore();

  const handleAgentSelect = (agentId: string) => {
    setSelectedAgent(agentId);
    setAgentCurrentMessage('');
    setIsAgentTyping(false);
    const agent = AGENTS_DATA.find(a => a.id === agentId);
    if (agent) {
      setAgentChatMessages([{ 
        role: 'ai', 
        content: `Neural connection established. I am ${agent.name}, specializing in ${agent.role}. How can I assist with your market strategy today?` 
      }]);
    }
  };

  const handleAgentChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentCurrentMessage.trim() || isAgentTyping || !selectedAgent) return;

    const userMsg = agentCurrentMessage;
    setAgentChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setAgentCurrentMessage('');
    setIsAgentTyping(true);

    try {
      const data = await api.chatAgent(selectedAgent, userMsg);
      setAgentChatMessages(prev => [...prev, { role: 'ai', content: data.response }]);
    } catch (err: any) {
      setAgentChatMessages(prev => [...prev, { role: 'ai', content: `CRITICAL ERROR: Connection interrupted. ${err.message}` }]);
    } finally {
      setIsAgentTyping(false);
    }
  };

  return (
    <div className="space-y-12 pb-24">
      <AnimatePresence mode="wait">
        {!selectedAgent ? (
          <motion.div 
            key="grid"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-12"
          >
            <div className="max-w-3xl">
                <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-4 block">OmniQuant Neural Network</span>
                <h2 className="text-5xl font-black font-headline text-white tracking-tighter uppercase mb-6 leading-none">Intelligence <span className="text-slate-500">Hierarchy</span></h2>
                <p className="text-lg text-slate-400 font-body italic leading-relaxed">
                    A decentralized swarm of 13 specific-purpose AI engines, cross-referencing global data streams to synthesize institutional-grade market vectors.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {AGENTS_DATA.map((agent, i) => (
                <motion.div
                  key={agent.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => handleAgentSelect(agent.id)}
                  className="group glass-card rounded-[2rem] p-8 hover:bg-[#121315] transition-all cursor-pointer border-t-2 overflow-hidden relative"
                  style={{ borderTopColor: agent.color.includes('primary') ? '#00f2ff' : agent.color.includes('secondary') ? '#ff007a' : agent.color }}
                >
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <agent.icon className="w-24 h-24" />
                  </div>

                  <div className="relative z-10 space-y-6">
                    <div className="flex justify-between items-start">
                        <div className={`w-12 h-12 rounded-2xl ${agent.bg} flex items-center justify-center border border-white/5`}>
                            <agent.icon className={`w-6 h-6 ${agent.color}`} />
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Efficiency</span>
                            <span className="text-xs font-black font-headline text-white">{(agent.level / 10).toFixed(1)}/10</span>
                        </div>
                    </div>

                    <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">{agent.role}</span>
                        <h3 className="text-xl font-black font-headline text-white tracking-tight uppercase leading-none">{agent.name.split(' (')[0]}</h3>
                    </div>

                    <div className="pt-4 border-t border-white/5 space-y-3">
                        <p className="text-xs text-slate-500 font-medium line-clamp-2 leading-relaxed">
                            {agent.desc}
                        </p>
                        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${agent.level}%` }}
                                className={`h-full bg-gradient-to-r from-transparent to-current ${agent.color}`}
                            />
                        </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="chat"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="max-w-6xl mx-auto h-[800px] flex flex-col glass-card rounded-[2.5rem] overflow-hidden"
          >
            {/* Chat Header */}
            <div className="p-6 bg-surface/40 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => setSelectedAgent(null)}
                        className="p-3 bg-white/5 rounded-xl text-slate-500 hover:text-white transition-all"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    {(() => {
                        const agent = AGENTS_DATA.find(a => a.id === selectedAgent)!;
                        return (
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl ${agent.bg} flex items-center justify-center border border-white/5`}>
                                    <agent.icon className={`w-6 h-6 ${agent.color}`} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black font-headline text-white tracking-tighter uppercase leading-none">{agent.name}</h3>
                                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Active Link • {agent.role}</span>
                                </div>
                            </div>
                        );
                    })()}
                </div>
                <div className="flex items-center gap-6 pr-4">
                    <div className="text-right">
                        <span className="block text-[8px] font-bold text-slate-500 uppercase tracking-widest">Latent Model</span>
                        <span className="text-[10px] font-black font-headline text-white uppercase">Llama-3.2B-Neural</span>
                    </div>
                    <div className="w-px h-8 bg-white/5"></div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(0,242,255,0.8)]"></div>
                        <span className="text-[10px] font-black font-headline text-white tracking-widest uppercase">Live</span>
                    </div>
                </div>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-12 space-y-8 custom-scrollbar bg-[#0a0b0d]/50">
                {agentChatMessages.map((msg, idx) => (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={idx}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div className={`max-w-[70%] p-6 rounded-[2rem] font-body text-sm leading-relaxed ${
                            msg.role === 'user' 
                            ? 'bg-primary/10 text-primary-light border border-primary/20 rounded-tr-none' 
                            : 'bg-white/5 text-slate-300 border border-white/5 rounded-tl-none selection:bg-primary/20'
                        }`}>
                            {msg.role === 'ai' && <Terminal className="w-4 h-4 text-primary mb-3 opacity-50" />}
                            {msg.content}
                        </div>
                    </motion.div>
                ))}
                {isAgentTyping && (
                    <div className="flex justify-start">
                        <div className="bg-white/5 border border-white/5 rounded-2xl rounded-tl-none p-4 flex gap-2 items-center">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></div>
                            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                        </div>
                    </div>
                )}
            </div>

            {/* Chat Input */}
            <div className="p-8 bg-surface/40 border-t border-white/5">
                <form onSubmit={handleAgentChatSubmit} className="relative">
                    <input
                        type="text"
                        value={agentCurrentMessage}
                        onChange={(e) => setAgentCurrentMessage(e.target.value)}
                        placeholder="Inquire about market vectors..."
                        disabled={isAgentTyping}
                        className="w-full bg-[#121315] border border-white/5 rounded-[2rem] py-5 px-8 text-white font-body focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-slate-600"
                    />
                    <button
                        type="submit"
                        disabled={!agentCurrentMessage.trim() || isAgentTyping}
                        className="absolute right-3 top-2 bottom-2 aspect-square bg-white text-black hover:bg-primary transition-all rounded-full flex items-center justify-center disabled:opacity-50 disabled:bg-slate-800"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
