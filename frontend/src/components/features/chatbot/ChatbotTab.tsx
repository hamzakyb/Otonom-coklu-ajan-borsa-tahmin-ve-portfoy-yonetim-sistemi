'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, Activity, Sparkles, Terminal, User, ShieldAlert, Zap, Info, Loader2 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useEffect, useRef } from 'react';

export default function ChatbotTab() {
  const { chatMessages, setChatMessages, currentMessage, setCurrentMessage, isTyping, setIsTyping, userEmail, token } = useAppStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages, isTyping]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMessage.trim() || isTyping) return;

    const userMsg = currentMessage.trim();
    setCurrentMessage('');
    setChatMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setIsTyping(true);

    const clientId = userEmail ? userEmail.replace('@', '_').replace('.', '_') : `guest_${Math.floor(Math.random() * 100000)}`;
    const wsUrl = `ws://localhost:8000/ws/chat/${clientId}${token ? `?token=${token}` : ''}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      ws.send(JSON.stringify({ message: userMsg }));
      setChatMessages((prev) => [...prev, { role: 'ai', content: '' }]);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'CHAT_STREAM') {
        setIsTyping(false);
        setChatMessages((prev) => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].content += data.chunk;
          return newMessages;
        });
      } else if (data.type === 'CHAT_DONE') {
        ws.close();
      } else if (data.type === 'CHAT_ERROR') {
        setIsTyping(false);
        setChatMessages((prev) => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].content = `🚨 Hata: ${data.detail}`;
          return newMessages;
        });
        ws.close();
      }
    };
    
    ws.onerror = (error) => {
      setIsTyping(false);
      setChatMessages((prev) => [...prev, { role: 'ai', content: "🚨 Sistem Hatası: Llama 3.2 WebSocket bağlantısı kurulamadı." }]);
      ws.close();
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-200px)] min-h-[600px] flex flex-col glass-card rounded-[2.5rem] bg-[#0a0b0d]/50 border-white/5 overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.4)]">
      {/* Assistant Header */}
      <header className="p-8 pb-6 border-b border-white/5 flex items-center justify-between bg-surface/40 backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-6">
            <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-[0_0_30px_rgba(0,242,255,0.1)]">
                    <Bot className="w-8 h-8 text-primary" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-4 border-[#0a0b0d] animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.5)]"></div>
            </div>
            <div>
                <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-black font-headline text-white tracking-tighter uppercase">Neural <span className="text-primary font-black">Assistant</span></h2>
                    <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-[8px] font-black text-slate-500 uppercase tracking-widest">v3.2 Stable</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                    <Activity className="w-3 h-3 text-emerald-500" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Local Inference Mode Active</span>
                </div>
            </div>
        </div>
        <div className="hidden md:flex items-center gap-4">
            <button className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                <ShieldAlert className="w-4 h-4 text-slate-500" />
            </button>
        </div>
      </header>

      {/* Chat Space */}
      <main 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-10 space-y-8 scroll-smooth scrollbar-thin scrollbar-thumb-white/5 scrollbar-track-transparent"
      >
        <AnimatePresence>
            {chatMessages.length === 0 && (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }}
                    className="h-full flex flex-col items-center justify-center text-center space-y-10 py-12"
                >
                    <div className="relative">
                        <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full"></div>
                        <Sparkles className="w-20 h-20 text-primary animate-pulse relative z-10" />
                    </div>
                    <div className="space-y-4 max-w-sm">
                        <h3 className="text-xl font-black font-headline text-white uppercase tracking-widest">Intelligence Initialized</h3>
                        <p className="text-sm text-slate-500 font-body italic leading-relaxed">
                            "Quantum-ready terminal standing by. Inquire about volatility matrices, sentiment vectors, or tactical performance."
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                        {[
                            'Analyze BIST Volatility',
                            'THYAO Sentiment Data',
                            'Optimize Portfolio Risk',
                            'Neural Prediction Stats'
                        ].map((suggestion) => (
                            <button 
                                key={suggestion}
                                onClick={() => setCurrentMessage(suggestion)}
                                className="p-4 rounded-2xl glass-card border-white/5 hover:border-primary/30 text-[10px] font-black font-headline text-slate-400 hover:text-primary uppercase tracking-widest transition-all text-left flex items-center justify-between"
                            >
                                {suggestion}
                                <Zap className="w-3 h-3 opacity-0 group-hover:opacity-100" />
                            </button>
                        ))}
                    </div>
                </motion.div>
            )}

            {chatMessages.map((msg, idx) => (
                <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} items-start gap-5`}
                >
                    {msg.role === 'ai' && (
                        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex flex-shrink-0 items-center justify-center shadow-lg mt-1">
                            <Bot className="w-5 h-5 text-primary" />
                        </div>
                    )}
                    <div className={`max-w-[75%] space-y-2`}>
                        <div className={`flex items-center gap-3 px-1 ${msg.role === 'user' ? 'justify-end order-last' : 'justify-start'}`}>
                            <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">
                                {msg.role === 'user' ? 'Operator Node' : 'Neural Core'}
                            </span>
                            <div className={`w-1 h-1 rounded-full ${msg.role === 'user' ? 'bg-secondary' : 'bg-primary'}`}></div>
                        </div>
                        <div className={`rounded-[2rem] p-6 text-[15px] leading-relaxed shadow-2xl relative font-body ${
                            msg.role === 'user' 
                                ? 'bg-white/5 border border-white/10 text-white rounded-tr-none' 
                                : 'bg-[#121315] border border-white/5 text-slate-300 rounded-tl-none'
                        }`}>
                            {msg.role === 'ai' && <Terminal className="w-4 h-4 text-primary mb-4 opacity-50" />}
                            <div className="whitespace-pre-wrap">{msg.content}</div>
                        </div>
                    </div>
                    {msg.role === 'user' && (
                        <div className="w-10 h-10 rounded-xl bg-secondary/10 border border-secondary/20 flex flex-shrink-0 items-center justify-center shadow-lg mt-1">
                            <User className="w-5 h-5 text-secondary" />
                        </div>
                    )}
                </motion.div>
            ))}

            {isTyping && (
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex justify-start items-start gap-5">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-lg mt-1">
                        <Bot className="w-5 h-5 text-primary" />
                    </div>
                    <div className="bg-[#121315] border border-white/5 rounded-[1.5rem] rounded-tl-none p-4 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
      </main>

      {/* Input Area */}
      <footer className="p-8 bg-surface/60 backdrop-blur-2xl border-t border-white/5 shrink-0">
        <form onSubmit={handleSendMessage} className="relative group max-w-3xl mx-auto">
            <div className="absolute inset-0 bg-primary/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative flex items-center bg-[#121315] border border-white/10 rounded-2xl p-2 shadow-2xl group-focus-within:border-primary/50 transition-all">
                <input
                    type="text"
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    placeholder="ENTER QUERY FOR NEURAL PROCESSING..."
                    disabled={isTyping}
                    className="flex-1 bg-transparent border-none text-white text-sm font-headline font-black placeholder:text-slate-700 focus:outline-none focus:ring-0 px-6 py-4 uppercase tracking-widest disabled:opacity-50"
                />
                <button
                    type="submit"
                    disabled={!currentMessage.trim() || isTyping}
                    className="h-12 w-12 bg-primary rounded-xl flex items-center justify-center hover:bg-primary/80 disabled:bg-slate-800 transition-all shadow-[0_0_20px_rgba(0,242,255,0.3)] group/btn"
                >
                    <Send className={`w-5 h-5 text-black transform transition-transform ${isTyping ? 'opacity-0' : 'group-hover/btn:-rotate-12'}`} />
                    {isTyping && <Loader2 className="w-5 h-5 animate-spin text-black absolute" />}
                </button>
            </div>
        </form>
        <div className="flex items-center justify-center gap-4 mt-6 opacity-30">
            <div className="flex items-center gap-2">
                <Info className="w-3 h-3 text-slate-500" />
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Neural weights may fluctuate. Non-Financial Advise.</span>
            </div>
        </div>
      </footer>
    </div>
  );
}
