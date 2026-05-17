'use client';

import { useAppStore, TabType } from '@/store/useAppStore';
import { Bell, Wallet as WalletIcon, LogOut, Search, Activity, Cpu, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Header() {
  const activeTab = useAppStore((state) => state.activeTab);
  const setActiveTab = useAppStore((state) => state.setActiveTab);
  const logout = useAppStore((state) => state.logout);

  return (
    <header className="fixed top-0 right-0 left-64 z-40 flex justify-between items-center px-10 h-20 bg-[#121315]/60 backdrop-blur-3xl border-b border-white/5 shadow-2xl">
      <div className="flex items-center gap-16">
        <div className="flex flex-col">
            <h1 className="text-2xl font-black text-white font-headline tracking-tighter uppercase leading-none">OmniQuant <span className="text-[#00f2ff] font-black">BIST</span></h1>
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.4em] mt-1">Institutional Grade AI</span>
        </div>
        
        <nav className="hidden lg:flex gap-10 items-center">
          {[
            { id: 'search' as TabType, label: 'Terminal', icon: Search },
            { id: 'news' as TabType, label: 'Pulse', icon: Activity },
            { id: 'portfolio' as TabType, label: 'Forge', icon: WalletIcon },
            { id: 'agents' as TabType, label: 'Neural', icon: Cpu },
          ].map((item) => {
            const isActive = activeTab === item.id;
            return (
                <button 
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative flex items-center gap-2 text-[10px] font-black font-headline uppercase tracking-widest transition-all duration-300 ${
                    isActive ? 'text-primary' : 'text-slate-500 hover:text-slate-200'
                  }`}
                >
                  <item.icon className={`w-3.5 h-3.5 ${isActive ? 'text-primary' : 'text-slate-600'}`} />
                  {item.label}
                  {isActive && (
                    <motion.div 
                        layoutId="header-active" 
                        className="absolute -bottom-[29px] left-0 right-0 h-[2px] bg-primary shadow-[0_0_10px_#00f2ff]" 
                    />
                  )}
                </button>
            )
          })}
        </nav>
      </div>

      <div className="flex items-center gap-8">
        {/* Real-time Ticker */}
        <div className="hidden xl:flex items-center gap-4 bg-white/5 border border-white/5 px-4 py-2 rounded-xl">
            <div className="flex flex-col items-end">
                <span className="text-[8px] text-slate-500 uppercase tracking-widest font-black">BIST 100 Index</span>
                <div className="flex items-center gap-2">
                    <span className="text-white font-black font-headline text-xs tracking-tight">9,145.20</span>
                    <span className="text-[9px] font-black text-rose-500 flex items-center">
                        <motion.span animate={{ opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 2 }}>▼</motion.span> 0.42%
                    </span>
                </div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                <Activity className="w-4 h-4 text-rose-500" />
            </div>
        </div>

        <div className="flex items-center gap-5">
            <div className="relative group">
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-ping"></div>
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full shadow-[0_0_10px_#00f2ff]"></div>
                <Bell className="w-5 h-5 text-slate-500 cursor-pointer hover:text-white transition-colors" />
            </div>

            <div className="h-6 w-[1px] bg-white/10 mx-2"></div>

            <div className="flex items-center gap-3 bg-primary/10 px-4 py-2 rounded-xl border border-primary/20 hover:border-primary/40 transition-all cursor-pointer group">
                <ShieldCheck className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                <div className="flex flex-col">
                    <span className="text-[8px] font-black text-primary/60 uppercase tracking-widest leading-none mb-0.5">Balance</span>
                    <span className="text-xs font-black text-white font-headline tracking-tight">₺142,500</span>
                </div>
            </div>

            <button 
                onClick={logout}
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center hover:bg-rose-500/10 hover:border-rose-500/20 text-slate-500 hover:text-rose-500 transition-all group"
                title="Çıkış Yap"
            >
                <LogOut className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
        </div>
      </div>
    </header>
  );
}
